import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {AutoCompoundApe, P2PPairStaking} from "../types";
import {TestEnv} from "./helpers/make-suite";
import {testEnvFixture} from "./helpers/setup-env";
import {mintAndValidate, supplyAndValidate} from "./helpers/validated-steps";
import {
  getAutoCompoundApe,
  getDelegationRegistry,
  getP2PPairStaking,
} from "../helpers/contracts-getters";
import {MAX_UINT_AMOUNT} from "../helpers/constants";
import {advanceTimeAndBlock, waitForTx} from "../helpers/misc-utils";
import {getSignedListingOrder} from "./helpers/p2ppairstaking-helper";
import {parseEther} from "ethers/lib/utils";
import {almostEqual} from "./helpers/uniswapv3-helper";

describe("P2P Pair Staking Test", () => {
  let testEnv: TestEnv;
  let p2pPairStaking: P2PPairStaking;
  let cApe: AutoCompoundApe;
  let MINIMUM_LIQUIDITY;

  const fixture = async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {ape, users, apeCoinStaking, poolAdmin, nBAYC, nMAYC, nBAKC} =
      testEnv;

    const user1 = users[0];
    const user2 = users[1];
    const user4 = users[5];

    p2pPairStaking = await getP2PPairStaking();

    cApe = await getAutoCompoundApe();
    MINIMUM_LIQUIDITY = await cApe.MINIMUM_LIQUIDITY();

    // send extra tokens to the apestaking contract for rewards
    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](
          apeCoinStaking.address,
          parseEther("100000000000")
        )
    );

    // user4 deposit MINIMUM_LIQUIDITY to make test case easy
    await mintAndValidate(ape, "1", user4);
    await waitForTx(
      await ape.connect(user4.signer).approve(cApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await cApe.connect(user4.signer).deposit(user4.address, MINIMUM_LIQUIDITY)
    );

    await waitForTx(
      await ape.connect(user2.signer).approve(cApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .approve(p2pPairStaking.address, MAX_UINT_AMOUNT)
    );

    await waitForTx(
      await nBAYC
        .connect(poolAdmin.signer)
        .setP2PPairStaking(p2pPairStaking.address)
    );
    await waitForTx(
      await nMAYC
        .connect(poolAdmin.signer)
        .setP2PPairStaking(p2pPairStaking.address)
    );
    await waitForTx(
      await nBAKC
        .connect(poolAdmin.signer)
        .setP2PPairStaking(p2pPairStaking.address)
    );

    return testEnv;
  };

  it("test BAYC pair with ApeCoin Staking", async () => {
    const {
      users: [user1, user2],
      ape,
      bayc,
      nBAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await mintAndValidate(ape, "1000000", user2);

    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(0);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user1
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      cApe,
      0,
      8000,
      user2
    );

    const txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    );
    const logLength = txReceipt.logs.length;
    const orderHash = txReceipt.logs[logLength - 1].data;

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .claimForMatchedOrderAndCompound([orderHash])
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user1.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2880")
    );

    //test delegation
    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .delegateForToken(bayc.address, [0], user1.address, true)
    );
    const delegationRegistry = await getDelegationRegistry();
    let delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation[0].to).to.be.eq(user1.address);
    expect(delegation[0].tokenId).to.be.eq(0);
    expect(delegation[0].contract_).to.be.eq(bayc.address);

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).claimCApeReward(user1.address)
    );
    await waitForTx(
      await p2pPairStaking.connect(user2.signer).claimCApeReward(user2.address)
    );

    almostEqual(await cApe.balanceOf(user1.address), parseEther("720"));
    almostEqual(await cApe.balanceOf(user2.address), parseEther("2880"));
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .transfer(user1.address, await cApe.balanceOf(user2.address))
    );

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).breakUpMatchedOrder(orderHash)
    );

    expect(await bayc.balanceOf(nBAYC.address)).to.be.equal(1);
    almostEqual(await cApe.balanceOf(user2.address), apeAmount);
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user1.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2880")
    );

    delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation.length).to.be.eq(0);
  });

  it("test MAYC pair with ApeCoin Staking", async () => {
    const {
      users: [user1, user2],
      ape,
      mayc,
      nMAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await mayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );

    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(1);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      1,
      mayc,
      0,
      2000,
      user1
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      1,
      cApe,
      0,
      8000,
      user2
    );

    const txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    );
    const logLength = txReceipt.logs.length;
    const orderHash = txReceipt.logs[logLength - 1].data;

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .claimForMatchedOrderAndCompound([orderHash])
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user1.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2880")
    );

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .delegateForToken(mayc.address, [0], user1.address, true)
    );
    const delegationRegistry = await getDelegationRegistry();
    let delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation[0].to).to.be.eq(user1.address);
    expect(delegation[0].tokenId).to.be.eq(0);
    expect(delegation[0].contract_).to.be.eq(mayc.address);

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).claimCApeReward(user1.address)
    );
    await waitForTx(
      await p2pPairStaking.connect(user2.signer).claimCApeReward(user2.address)
    );

    almostEqual(await cApe.balanceOf(user1.address), parseEther("720"));
    almostEqual(await cApe.balanceOf(user2.address), parseEther("2880"));
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .transfer(user1.address, await cApe.balanceOf(user2.address))
    );

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).breakUpMatchedOrder(orderHash)
    );

    expect(await mayc.balanceOf(nMAYC.address)).to.be.equal(1);
    almostEqual(await cApe.balanceOf(user2.address), apeAmount);
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user1.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2880")
    );

    delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation.length).to.be.eq(0);
  });

  it("test BAYC pair with BAKC and ApeCoin Staking", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      bayc,
      bakc,
      nBAYC,
      nBAKC,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await supplyAndValidate(bakc, "1", user3, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await bakc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );

    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(2);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bayc,
      0,
      2000,
      user1
    );
    const user3SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bakc,
      0,
      2000,
      user3
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      cApe,
      0,
      6000,
      user2
    );

    const txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchBAKCPairStakingList(
          user1SignedOrder,
          user3SignedOrder,
          user2SignedOrder
        )
    );

    const logLength = txReceipt.logs.length;
    const orderHash = txReceipt.logs[logLength - 1].data;

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .delegateForToken(bayc.address, [0], user1.address, true)
    );
    await waitForTx(
      await p2pPairStaking
        .connect(user3.signer)
        .delegateForToken(bakc.address, [0], user3.address, true)
    );
    const delegationRegistry = await getDelegationRegistry();
    let delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation[0].to).to.be.eq(user1.address);
    expect(delegation[0].tokenId).to.be.eq(0);
    expect(delegation[0].contract_).to.be.eq(bayc.address);
    expect(delegation[1].to).to.be.eq(user3.address);
    expect(delegation[1].tokenId).to.be.eq(0);
    expect(delegation[1].contract_).to.be.eq(bakc.address);

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .claimForMatchedOrderAndCompound([orderHash])
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user1.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user3.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2160")
    );

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).claimCApeReward(user1.address)
    );
    await waitForTx(
      await p2pPairStaking.connect(user2.signer).claimCApeReward(user2.address)
    );
    await waitForTx(
      await p2pPairStaking.connect(user3.signer).claimCApeReward(user3.address)
    );

    almostEqual(await cApe.balanceOf(user1.address), parseEther("720"));
    almostEqual(await cApe.balanceOf(user3.address), parseEther("720"));
    almostEqual(await cApe.balanceOf(user2.address), parseEther("2160"));
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .transfer(user1.address, await cApe.balanceOf(user2.address))
    );

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).breakUpMatchedOrder(orderHash)
    );

    expect(await bayc.balanceOf(nBAYC.address)).to.be.equal(1);
    expect(await bakc.balanceOf(nBAKC.address)).to.be.equal(1);
    almostEqual(await cApe.balanceOf(user2.address), apeAmount);

    almostEqual(
      await p2pPairStaking.pendingCApeReward(user1.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user3.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2160")
    );

    delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation.length).to.be.eq(0);
  });

  it("test MAYC pair with BAKC and ApeCoin Staking", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      mayc,
      bakc,
      nMAYC,
      nBAKC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await supplyAndValidate(bakc, "1", user3, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await mayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await bakc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(2);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      mayc,
      0,
      2000,
      user1
    );
    const user3SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bakc,
      0,
      2000,
      user3
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      cApe,
      0,
      6000,
      user2
    );

    const txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchBAKCPairStakingList(
          user1SignedOrder,
          user3SignedOrder,
          user2SignedOrder
        )
    );

    const logLength = txReceipt.logs.length;
    const orderHash = txReceipt.logs[logLength - 1].data;

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .delegateForToken(mayc.address, [0], user1.address, true)
    );
    await waitForTx(
      await p2pPairStaking
        .connect(user3.signer)
        .delegateForToken(bakc.address, [0], user3.address, true)
    );
    const delegationRegistry = await getDelegationRegistry();
    let delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation[0].to).to.be.eq(user1.address);
    expect(delegation[0].tokenId).to.be.eq(0);
    expect(delegation[0].contract_).to.be.eq(mayc.address);
    expect(delegation[1].to).to.be.eq(user3.address);
    expect(delegation[1].tokenId).to.be.eq(0);
    expect(delegation[1].contract_).to.be.eq(bakc.address);

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .claimForMatchedOrderAndCompound([orderHash])
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user1.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user3.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2160")
    );

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).claimCApeReward(user1.address)
    );
    await waitForTx(
      await p2pPairStaking.connect(user2.signer).claimCApeReward(user2.address)
    );
    await waitForTx(
      await p2pPairStaking.connect(user3.signer).claimCApeReward(user3.address)
    );

    almostEqual(await cApe.balanceOf(user1.address), parseEther("720"));
    almostEqual(await cApe.balanceOf(user3.address), parseEther("720"));
    almostEqual(await cApe.balanceOf(user2.address), parseEther("2160"));
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .transfer(user1.address, await cApe.balanceOf(user2.address))
    );

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).breakUpMatchedOrder(orderHash)
    );

    expect(await mayc.balanceOf(nMAYC.address)).to.be.equal(1);
    expect(await bakc.balanceOf(nBAKC.address)).to.be.equal(1);
    almostEqual(await cApe.balanceOf(user2.address), apeAmount);
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user1.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user3.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2160")
    );

    delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation.length).to.be.eq(0);
  });

  it("test clear delegation after ntoken transfer", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      bayc,
      bakc,
      nBAYC,
      nBAKC,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await supplyAndValidate(bakc, "1", user3, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await bakc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );

    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(2);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bayc,
      0,
      2000,
      user1
    );
    const user3SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bakc,
      0,
      2000,
      user3
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      cApe,
      0,
      6000,
      user2
    );

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchBAKCPairStakingList(
          user1SignedOrder,
          user3SignedOrder,
          user2SignedOrder
        )
    );

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .delegateForToken(bayc.address, [0], user1.address, true)
    );
    await waitForTx(
      await p2pPairStaking
        .connect(user3.signer)
        .delegateForToken(bakc.address, [0], user3.address, true)
    );
    const delegationRegistry = await getDelegationRegistry();
    let delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation[0].to).to.be.eq(user1.address);
    expect(delegation[0].tokenId).to.be.eq(0);
    expect(delegation[0].contract_).to.be.eq(bayc.address);
    expect(delegation[1].to).to.be.eq(user3.address);
    expect(delegation[1].tokenId).to.be.eq(0);
    expect(delegation[1].contract_).to.be.eq(bakc.address);

    await waitForTx(
      await nBAYC
        .connect(user1.signer)
        .transferFrom(user1.address, user2.address, 0)
    );
    delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation.length).to.be.eq(1);

    await waitForTx(
      await nBAKC
        .connect(user3.signer)
        .transferFrom(user3.address, user2.address, 0)
    );

    delegation = await delegationRegistry.getOutgoingDelegations(
      p2pPairStaking.address
    );
    expect(delegation.length).to.be.eq(0);
  });

  it("claimForMatchedOrderAndCompound for multi user work as expected", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      bayc,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "10", user1, true);
    await supplyAndValidate(bakc, "10", user3, true);
    await mintAndValidate(ape, "10000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await bakc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .deposit(user2.address, parseEther("1000000"))
    );

    const txArray: string[] = [];
    for (let i = 0; i < 10; i++) {
      const user1SignedOrder = await getSignedListingOrder(
        p2pPairStaking,
        2,
        bayc,
        i,
        2000,
        user1
      );
      const user3SignedOrder = await getSignedListingOrder(
        p2pPairStaking,
        2,
        bakc,
        i,
        2000,
        user3
      );
      const user2SignedOrder = await getSignedListingOrder(
        p2pPairStaking,
        2,
        cApe,
        0,
        6000,
        user2
      );

      const txReceipt = await waitForTx(
        await p2pPairStaking
          .connect(user1.signer)
          .matchBAKCPairStakingList(
            user1SignedOrder,
            user3SignedOrder,
            user2SignedOrder
          )
      );
      const logLength = txReceipt.logs.length;
      const orderHash = txReceipt.logs[logLength - 1].data;

      txArray.push(orderHash);
    }

    for (let i = 0; i < 2; i++) {
      await advanceTimeAndBlock(parseInt("3600"));

      await waitForTx(
        await p2pPairStaking
          .connect(user1.signer)
          .claimForMatchedOrderAndCompound(txArray)
      );
    }
  });

  it("match failed when order was canceled 0", async () => {
    const {
      users: [user1, user2],
      ape,
      bayc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await ape
        .connect(user2.signer)
        .approve(p2pPairStaking.address, MAX_UINT_AMOUNT)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user1
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      ape,
      0,
      8000,
      user2
    );

    await waitForTx(
      await p2pPairStaking.connect(user2.signer).cancelListing(user2SignedOrder)
    );

    await expect(
      p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    ).to.be.revertedWith("order already cancelled");
  });

  it("match failed when order was canceled 1", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      bayc,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await supplyAndValidate(bakc, "1", user2, true);
    await mintAndValidate(ape, "1000000", user3);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await bakc
        .connect(user2.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await ape
        .connect(user3.signer)
        .approve(p2pPairStaking.address, MAX_UINT_AMOUNT)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bayc,
      0,
      2000,
      user1
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bakc,
      0,
      2000,
      user2
    );
    const user3SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      ape,
      0,
      6000,
      user3
    );

    await waitForTx(
      await p2pPairStaking.connect(user3.signer).cancelListing(user3SignedOrder)
    );

    await expect(
      p2pPairStaking
        .connect(user1.signer)
        .matchBAKCPairStakingList(
          user1SignedOrder,
          user2SignedOrder,
          user3SignedOrder
        )
    ).to.be.revertedWith("order already cancelled");
  });

  it("match failed when orders type match failed 0", async () => {
    const {
      users: [user1, user2],
      ape,
      bayc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(0);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user1
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      1,
      cApe,
      0,
      8000,
      user2
    );

    await expect(
      p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    ).to.be.revertedWith("orders type match failed");
  });

  it("match failed when orders type match failed 1", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      bayc,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await supplyAndValidate(bakc, "1", user3, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await bakc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );

    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(2);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bayc,
      0,
      2000,
      user1
    );
    const user3SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      1,
      bakc,
      0,
      2000,
      user3
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      cApe,
      0,
      6000,
      user2
    );

    await expect(
      p2pPairStaking
        .connect(user1.signer)
        .matchBAKCPairStakingList(
          user1SignedOrder,
          user3SignedOrder,
          user2SignedOrder
        )
    ).to.be.revertedWith("orders type match failed");
  });

  it("match failed when share match failed 0", async () => {
    const {
      users: [user1, user2],
      ape,
      bayc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(0);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user1
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      cApe,
      0,
      7000,
      user2
    );

    await expect(
      p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    ).to.be.revertedWith("share match failed");
  });

  it("match failed when share match failed 1", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      bayc,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await supplyAndValidate(bakc, "1", user3, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await bakc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );

    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(2);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bayc,
      0,
      2000,
      user1
    );
    const user3SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bakc,
      0,
      2000,
      user3
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      cApe,
      0,
      7000,
      user2
    );

    await expect(
      p2pPairStaking
        .connect(user1.signer)
        .matchBAKCPairStakingList(
          user1SignedOrder,
          user3SignedOrder,
          user2SignedOrder
        )
    ).to.be.revertedWith("share match failed");
  });

  it("listing order can only be canceled by offerer", async () => {
    const {
      users: [user1, user2],
      bayc,
    } = await loadFixture(fixture);

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user1
    );

    await expect(
      p2pPairStaking.connect(user2.signer).cancelListing(user1SignedOrder)
    ).to.be.revertedWith("not order offerer");

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).cancelListing(user1SignedOrder)
    );
  });

  it("matching operator work as expected", async () => {
    const {
      users: [user1, user2, user3, , user5],
      gatewayAdmin,
      bayc,
      nBAYC,
      ape,
    } = await loadFixture(fixture);

    await expect(
      p2pPairStaking.connect(user2.signer).setMatchingOperator(user5.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await waitForTx(
      await p2pPairStaking
        .connect(gatewayAdmin.signer)
        .setMatchingOperator(user5.address)
    );

    await supplyAndValidate(bayc, "1", user3, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(0);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user3
    );
    user1SignedOrder.v = 0;
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      cApe,
      0,
      8000,
      user2
    );
    user2SignedOrder.v = 0;

    await expect(
      p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    ).to.be.reverted;

    const txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user5.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    );
    const logLength = txReceipt.logs.length;
    const orderHash = txReceipt.logs[logLength - 1].data;

    await expect(
      p2pPairStaking.connect(user1.signer).breakUpMatchedOrder(orderHash)
    ).to.be.revertedWith("no permission to break up");

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking.connect(user5.signer).breakUpMatchedOrder(orderHash)
    );

    expect(await bayc.balanceOf(nBAYC.address)).to.be.equal(1);
    almostEqual(await cApe.balanceOf(user2.address), apeAmount);
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user3.address),
      parseEther("720")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2880")
    );
  });

  it("compound fee work as expected", async () => {
    const {
      users: [user1, user2, user3],
      gatewayAdmin,
      bayc,
      ape,
    } = await loadFixture(fixture);

    await waitForTx(
      await p2pPairStaking.connect(gatewayAdmin.signer).setCompoundFee(50)
    );

    await supplyAndValidate(bayc, "1", user3, true);
    await mintAndValidate(ape, "1000000", user2);

    //deposit cApe for user3 to let exchangeRate > 1
    await waitForTx(
      await ape.connect(user2.signer).approve(cApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .deposit(user2.address, parseEther("1000"))
    );

    await waitForTx(
      await bayc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    const apeAmount = await p2pPairStaking.getApeCoinStakingCap(0);
    await waitForTx(
      await cApe.connect(user2.signer).deposit(user2.address, apeAmount)
    );

    const user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user3
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      cApe,
      0,
      8000,
      user2
    );

    const txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    );
    const logLength = txReceipt.logs.length;
    const orderHash = txReceipt.logs[logLength - 1].data;

    await advanceTimeAndBlock(parseInt("3600"));

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .claimForMatchedOrderAndCompound([orderHash])
    );

    almostEqual(
      await p2pPairStaking.pendingCApeReward(p2pPairStaking.address),
      parseEther("18")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user3.address),
      parseEther("716.4")
    );
    almostEqual(
      await p2pPairStaking.pendingCApeReward(user2.address),
      parseEther("2865.6")
    );

    await waitForTx(
      await p2pPairStaking
        .connect(gatewayAdmin.signer)
        .claimCompoundFee(gatewayAdmin.address)
    );

    almostEqual(await cApe.balanceOf(gatewayAdmin.address), parseEther("18"));
  });

  it("check ape token can be matched twice", async () => {
    const {
      users: [user1, user2, user3],
      bayc,
      ape,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await supplyAndValidate(bakc, "1", user3, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await bakc
        .connect(user3.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .deposit(user2.address, parseEther("500000"))
    );

    //match bayc + ApeCoin
    let user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user1
    );
    let user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      cApe,
      0,
      8000,
      user2
    );

    let txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder, user2SignedOrder)
    );
    let logLength = txReceipt.logs.length;
    const orderHash0 = txReceipt.logs[logLength - 1].data;

    //match bayc + bakc + ApeCoin
    user1SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bayc,
      0,
      2000,
      user1
    );
    const user3SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      bakc,
      0,
      2000,
      user3
    );
    user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      2,
      cApe,
      0,
      6000,
      user2
    );

    txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchBAKCPairStakingList(
          user1SignedOrder,
          user3SignedOrder,
          user2SignedOrder
        )
    );
    logLength = txReceipt.logs.length;
    const orderHash1 = txReceipt.logs[logLength - 1].data;

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).breakUpMatchedOrder(orderHash0)
    );

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).breakUpMatchedOrder(orderHash1)
    );
  });

  it("check ape coin listing order can not be matched twice", async () => {
    const {
      users: [user1, user2],
      bayc,
      ape,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "2", user1, true);
    await mintAndValidate(ape, "1000000", user2);

    await waitForTx(
      await bayc
        .connect(user1.signer)
        .setApprovalForAll(p2pPairStaking.address, true)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .deposit(user2.address, parseEther("500000"))
    );

    const user1SignedOrder0 = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      0,
      2000,
      user1
    );
    const user1SignedOrder1 = await getSignedListingOrder(
      p2pPairStaking,
      0,
      bayc,
      1,
      2000,
      user1
    );
    const user2SignedOrder = await getSignedListingOrder(
      p2pPairStaking,
      0,
      cApe,
      0,
      8000,
      user2
    );

    const txReceipt = await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder0, user2SignedOrder)
    );
    const logLength = txReceipt.logs.length;
    const orderHash0 = txReceipt.logs[logLength - 1].data;

    await expect(
      p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder1, user2SignedOrder)
    ).to.be.revertedWith("ape coin order already matched");

    await waitForTx(
      await p2pPairStaking.connect(user1.signer).breakUpMatchedOrder(orderHash0)
    );

    await waitForTx(
      await p2pPairStaking
        .connect(user1.signer)
        .matchPairStakingList(user1SignedOrder1, user2SignedOrder)
    );
  });
});
