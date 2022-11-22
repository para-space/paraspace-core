import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {MAX_UINT_AMOUNT, ONE_ADDRESS} from "../deploy/helpers/constants";
import {
  getMintableERC721,
  getPToken,
  getPTokenSApe,
  getVariableDebtToken,
} from "../deploy/helpers/contracts-getters";
import {convertToCurrencyDecimals} from "../deploy/helpers/contracts-helpers";
import {
  advanceTimeAndBlock,
  DRE,
  getDb,
  waitForTx,
} from "../deploy/helpers/misc-utils";
import {MintableERC721, VariableDebtToken, PTokenSApe, PToken} from "../types";
import {TestEnv} from "./helpers/make-suite";
import {testEnvFixture} from "./helpers/setup-env";

import {
  changePriceAndValidate,
  changeSApePriceAndValidate,
  mintAndValidate,
  supplyAndValidate,
} from "./helpers/validated-steps";
import {almostEqual} from "./helpers/uniswapv3-helper";
import {ProtocolErrors} from "../deploy/helpers/types";

describe("APE Coin Unstaking", () => {
  let testEnv: TestEnv;
  let bakc: MintableERC721;
  let variableDebtApeCoin: VariableDebtToken;
  let pApeCoin: PToken;
  let pSApeCoin: PTokenSApe;
  const sApeAddress = ONE_ADDRESS;

  const fixture = async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {
      ape,
      mayc,
      bayc,
      users: [user1, depositor],
      protocolDataProvider,
      pool,
    } = testEnv;
    const {
      xTokenAddress: pApeCoinAddress,
      variableDebtTokenAddress: variableDebtApeCoinAddress,
    } = await protocolDataProvider.getReserveTokensAddresses(ape.address);
    const {xTokenAddress: pSApeCoinAddress} =
      await protocolDataProvider.getReserveTokensAddresses(sApeAddress);

    variableDebtApeCoin = await getVariableDebtToken(
      variableDebtApeCoinAddress
    );
    pApeCoin = await getPToken(pApeCoinAddress);
    pSApeCoin = await getPTokenSApe(pSApeCoinAddress);

    await supplyAndValidate(ape, "20000", depositor, true);
    await changePriceAndValidate(ape, "0.001");
    await changeSApePriceAndValidate(sApeAddress, "0.001");

    await changePriceAndValidate(mayc, "50");
    await changePriceAndValidate(bayc, "50");

    const db = getDb();
    const address = db.get(`BAKC.${DRE.network.name}`).value()?.address;
    bakc = await getMintableERC721(address);
    await waitForTx(await bakc["mint(uint256,address)"]("2", user1.address));

    await waitForTx(
      await ape.connect(user1.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await bakc.connect(user1.signer).setApprovalForAll(pool.address, true)
    );

    return testEnv;
  };

  it("TC-pool-ape-staking-01 test borrowApeAndStake: use 100% cash", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      weth,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "15000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    expect(apeDebt).equal(0);

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(2);

    const userAccount = await pool.getUserAccountData(user1.address);
    //50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "65")
    );
    expect(userAccount.totalDebtBase).equal(0);
    //50 * 0.325 + 15 * 0.7 = 26.75
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "26.75")
    );
  });

  it("TC-pool-ape-staking-02 test borrowApeAndStake: part cash, part debt", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      weth,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    expect(apeDebt).equal(amount2);

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(2);

    const userAccount = await pool.getUserAccountData(user1.address);
    //50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "65")
    );
    //8000*0.001 = 8
    expect(userAccount.totalDebtBase).equal(
      await convertToCurrencyDecimals(weth.address, "8")
    );
    //50 * 0.325 + 15 * 0.7 - 8= 18.75
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "18.75")
    );
  });

  it("TC-pool-ape-staking-03 test borrowApeAndStake: use 100% debt", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      weth,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    expect(apeDebt).equal(amount);

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(2);

    const userAccount = await pool.getUserAccountData(user1.address);
    //50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "65")
    );
    //15000*0.001 = 15
    expect(userAccount.totalDebtBase).equal(
      await convertToCurrencyDecimals(weth.address, "15")
    );
    //50 * 0.325 + 15 * 0.7 - 15= 11.75
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "11.75")
    );
  });

  it("TC-pool-ape-staking-04 test withdrawBAKC fails when hf < 1 (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      weth,
      nMAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "40");
    await changePriceAndValidate(ape, "0.002");
    await changeSApePriceAndValidate(sApeAddress, "0.002");
    const userAccount = await pool.getUserAccountData(user1.address);
    //40 + 15000*0.002 = 70
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "70")
    );
    //15000*0.002 = 30
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "30")
    );
    //40 * 0.325 + 30 * 0.7 - 30= 4
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "4")
    );

    let withdrawAmount = await convertToCurrencyDecimals(ape.address, "3000");
    expect(
      await pool
        .connect(user1.signer)
        .withdrawApeCoin(mayc.address, [{tokenId: 0, amount: withdrawAmount}])
    );
    withdrawAmount = await convertToCurrencyDecimals(ape.address, "4000");
    expect(
      await pool
        .connect(user1.signer)
        .withdrawApeCoin(mayc.address, [{tokenId: 0, amount: withdrawAmount}])
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount2);

    await expect(
      pool
        .connect(user1.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: amount2},
        ])
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("TC-pool-ape-staking-05 test withdrawApeCoin fails when hf < 1 (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      weth,
      nMAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "40");
    await changePriceAndValidate(ape, "0.002");
    await changeSApePriceAndValidate(sApeAddress, "0.002");
    const userAccount = await pool.getUserAccountData(user1.address);
    //40 + 15000*0.002 = 70
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "70")
    );
    //15000*0.002 = 30
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "30")
    );
    //40 * 0.325 + 30 * 0.7 - 30= 4
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "4")
    );

    const withdrawAmount = await convertToCurrencyDecimals(ape.address, "4000");
    expect(
      await pool
        .connect(user1.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: withdrawAmount},
        ])
    );
    expect(
      await pool
        .connect(user1.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: withdrawAmount},
        ])
    );

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(2);

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount1);

    await expect(
      pool
        .connect(user1.signer)
        .withdrawApeCoin(mayc.address, [{tokenId: 0, amount: amount1}])
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("TC-pool-ape-staking-06 test claimBAKC success when hf > 1", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      weth,
      nMAYC,
      apeCoinStaking,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "40");
    await changePriceAndValidate(ape, "0.002");
    await changeSApePriceAndValidate(sApeAddress, "0.002");
    const userAccount = await pool.getUserAccountData(user1.address);
    //40 + 15000*0.002 = 70
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "70")
    );
    //15000*0.002 = 30
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "30")
    );
    //40 * 0.325 + 30 * 0.7 - 30= 4
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "4")
    );

    // advance in time
    await advanceTimeAndBlock(parseInt("86400"));

    const pendingRewardsPool2 = await apeCoinStaking.pendingRewards(
      2,
      nMAYC.address,
      "0"
    );

    const pendingRewardsPool3 = await apeCoinStaking.pendingRewards(
      3,
      nMAYC.address,
      "0"
    );

    const userBalance = await ape.balanceOf(user1.address);
    // send extra tokens to the apestaking contract for rewards
    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](
          apeCoinStaking.address,
          pendingRewardsPool3.mul(2)
        )
    );

    expect(
      await pool
        .connect(user1.signer)
        .claimBAKC(mayc.address, [{mainTokenId: 0, bakcTokenId: 0}])
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount.add(pendingRewardsPool2));

    expect(await ape.balanceOf(user1.address)).to.be.eq(
      userBalance.add(pendingRewardsPool3)
    );
  });

  it("TC-pool-ape-staking-07 test claimBAKC fails when hf < 1 (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      weth,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "40");
    await changePriceAndValidate(ape, "0.002");
    await changeSApePriceAndValidate(sApeAddress, "0.002");
    const userAccount = await pool.getUserAccountData(user1.address);
    //40 + 15000*0.002 = 70
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "70")
    );
    //15000*0.002 = 30
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "30")
    );
    //40 * 0.325 + 30 * 0.7 - 30= 4
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "4")
    );

    // drop HF to liquidation levels
    await changePriceAndValidate(mayc, "3");

    await expect(
      pool
        .connect(user1.signer)
        .claimBAKC(mayc.address, [{mainTokenId: 0, bakcTokenId: 0}])
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("TC-pool-ape-staking-08 test claimApeCoin succeeds when hf > 1", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      weth,
      nMAYC,
      apeCoinStaking,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "40");
    await changePriceAndValidate(ape, "0.002");
    await changeSApePriceAndValidate(sApeAddress, "0.002");
    const userAccount = await pool.getUserAccountData(user1.address);
    //40 + 15000*0.002 = 70
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "70")
    );
    //15000*0.002 = 30
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "30")
    );
    //40 * 0.325 + 30 * 0.7 - 30= 4
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "4")
    );

    // advance in time
    await advanceTimeAndBlock(parseInt("86400"));

    const pendingRewardsPool2 = await apeCoinStaking.pendingRewards(
      2,
      nMAYC.address,
      "0"
    );

    const pendingRewardsPool3 = await apeCoinStaking.pendingRewards(
      3,
      nMAYC.address,
      "0"
    );

    const userBalance = await ape.balanceOf(user1.address);
    // send extra tokens to the apestaking contract for rewards
    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](
          apeCoinStaking.address,
          pendingRewardsPool2.mul(2)
        )
    );

    expect(await pool.connect(user1.signer).claimApeCoin(mayc.address, [0]));

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount.add(pendingRewardsPool3));

    expect(await ape.balanceOf(user1.address)).to.be.eq(
      userBalance.add(pendingRewardsPool2)
    );
  });

  it("TC-pool-ape-staking-09 test claimApeCoin fails when hf < 1 (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      weth,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "40");
    await changePriceAndValidate(ape, "0.002");
    await changeSApePriceAndValidate(sApeAddress, "0.002");
    const userAccount = await pool.getUserAccountData(user1.address);
    //40 + 15000*0.002 = 70
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "70")
    );
    //15000*0.002 = 30
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "30")
    );
    //40 * 0.325 + 30 * 0.7 - 30= 4
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "4")
    );

    // drop HF to liquidation levels
    await changePriceAndValidate(mayc, "3");

    await expect(
      pool.connect(user1.signer).claimApeCoin(mayc.address, [0])
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("TC-pool-ape-staking-10 test unstakeApePositionAndRepay repays debt - no excess", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    expect(
      await pool
        .connect(user1.signer)
        .unstakeApePositionAndRepay(mayc.address, 0)
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(0);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(0);

    const pApeBalance = await pApeCoin.balanceOf(user1.address);
    expect(pApeBalance).equal(0);

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    const limit = await convertToCurrencyDecimals(ape.address, "0.1");
    expect(apeDebt.lt(limit)).equal(true);
  });

  it("TC-pool-ape-staking-11 test unstakeApePositionAndRepay repays debt and supplies excess", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    expect(
      await pool
        .connect(user1.signer)
        .unstakeApePositionAndRepay(mayc.address, 0)
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(0);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(0);

    const pApeBalance = await pApeCoin.balanceOf(user1.address);
    almostEqual(pApeBalance, amount1);

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    expect(apeDebt).equal("0");
  });

  it("TC-pool-ape-staking-12 test unstakeApePositionAndRepay by others fails when hf > 1", async () => {
    const {
      users: [user1, unstaker],
      ape,
      mayc,
      pool,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await expect(
      pool.connect(unstaker.signer).unstakeApePositionAndRepay(mayc.address, 0)
    ).to.be.revertedWith(ProtocolErrors.HEALTH_FACTOR_NOT_BELOW_THRESHOLD);
  });

  it("TC-pool-ape-staking-13 test unstakeApePositionAndRepay by others succeeds when hf < 1 (revert expected)", async () => {
    const {
      users: [user1, unstaker],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "40");
    await changePriceAndValidate(ape, "0.08");

    expect(
      await pool
        .connect(unstaker.signer)
        .unstakeApePositionAndRepay(mayc.address, 0)
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(0);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(0);

    const pApeBalance = await pApeCoin.balanceOf(user1.address);
    expect(pApeBalance).equal(0);

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    const target = await convertToCurrencyDecimals(ape.address, "45");
    almostEqual(apeDebt, target);
  });

  it("TC-pool-ape-staking-14 test can stake multiple times and partially unstake afterwards", async () => {
    const {
      users: [user1, unstaker],
      ape,
      mayc,
      bayc,
      pool,
      nMAYC,
      nBAYC,
      weth,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "2", user1, true);
    await supplyAndValidate(bayc, "2", user1, true);

    const amount = await convertToCurrencyDecimals(ape.address, "3000");
    const halfAmount = await convertToCurrencyDecimals(ape.address, "9000");
    const totalAmount = await convertToCurrencyDecimals(ape.address, "18000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: halfAmount,
          cashAmount: 0,
        },
        [
          {tokenId: 0, amount: amount},
          {tokenId: 1, amount: amount},
        ],
        [{mainTokenId: 1, bakcTokenId: 0, amount: amount}]
      )
    );

    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAmount: halfAmount,
          cashAmount: 0,
        },
        [
          {tokenId: 0, amount: amount},
          {tokenId: 1, amount: amount},
        ],
        [{mainTokenId: 1, bakcTokenId: 1, amount: amount}]
      )
    );

    let maycStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(maycStake).equal(halfAmount);

    let baycStake = await nBAYC.getUserApeStakingAmount(user1.address);
    expect(baycStake).equal(halfAmount);

    let pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(totalAmount);

    let apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    almostEqual(apeDebt, totalAmount);

    let bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(2);

    let userAccount = await pool.getUserAccountData(user1.address);
    //50 * 4 + 18000*0.001 = 218
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "218")
    );
    //18000*0.001 = 18
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "18")
    );
    //50 * 2 * 0.4 + 50 * 2 * 0.325 + 18 * 0.7 - 18 = 67.1
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "67.1")
    );

    await changePriceAndValidate(mayc, "10");
    await changePriceAndValidate(bayc, "10");
    await changePriceAndValidate(ape, "0.01");
    await changeSApePriceAndValidate(sApeAddress, "0.01");

    expect(
      await pool
        .connect(unstaker.signer)
        .unstakeApePositionAndRepay(mayc.address, 1)
    );

    maycStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(maycStake).equal(amount);

    baycStake = await nBAYC.getUserApeStakingAmount(user1.address);
    expect(baycStake).equal(halfAmount);

    pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount.add(halfAmount));

    apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    //12000 + 6000*3/1000
    almostEqual(
      apeDebt,
      amount
        .add(halfAmount)
        .add(await convertToCurrencyDecimals(weth.address, "18"))
    );

    bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(2);

    userAccount = await pool.getUserAccountData(user1.address);
    //10 * 4 + 12000*0.01 = 160
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "160")
    );
    //12018*0.01 = 120.18
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "120.18")
    );
    //10 * 2 * 0.4 + 10 * 2 * 0.325 + 18 * 0.7 - 18 = 67.1
    // almostEqual(userAccount.availableBorrowsBase, await convertToCurrencyDecimals(weth.address, "67.1"));
  });

  it("TC-pool-ape-staking-15 test can liquidate NFT with existing staking positions", async () => {
    const {
      users: [user1, liquidator],
      ape,
      mayc,
      pool,
      weth,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");

    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await supplyAndValidate(weth, "91", liquidator, true, "200000");

    // drop HF and ERC-721_HF below 1
    await changePriceAndValidate(mayc, "3");

    // start auction
    await waitForTx(
      await pool
        .connect(liquidator.signer)
        .startAuction(user1.address, mayc.address, 0)
    );

    const apeDebtBefore = await variableDebtApeCoin.balanceOf(user1.address);

    // try to liquidate the NFT
    expect(
      await pool
        .connect(liquidator.signer)
        .liquidateERC721(
          mayc.address,
          user1.address,
          0,
          await convertToCurrencyDecimals(weth.address, "13"),
          false,
          {gasLimit: 5000000}
        )
    );

    expect(await ape.balanceOf(user1.address)).to.be.eq(0);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).to.be.eq(0); // whole position unstaked

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    expect(apeDebt).to.be.lt(apeDebtBefore); // some debt repaid

    expect(await bakc.ownerOf("0")).to.be.eq(user1.address);
    expect(await mayc.ownerOf("0")).to.be.eq(liquidator.address);
  });
});
