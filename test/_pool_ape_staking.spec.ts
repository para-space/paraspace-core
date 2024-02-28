import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {expect} from "chai";
import {MAX_UINT_AMOUNT, ZERO_ADDRESS, ONE_ADDRESS} from "../helpers/constants";
import {
  getAutoCompoundApe,
  getPToken,
  getPTokenSApe,
  getVariableDebtToken,
} from "../helpers/contracts-getters";
import {
  convertToCurrencyDecimals,
  isUsingAsCollateral,
} from "../helpers/contracts-helpers";
import {advanceTimeAndBlock, waitForTx} from "../helpers/misc-utils";
import {VariableDebtToken, PTokenSApe, PToken, AutoCompoundApe} from "../types";
import {TestEnv} from "./helpers/make-suite";
import {testEnvFixture} from "./helpers/setup-env";

import {
  borrowAndValidate,
  changePriceAndValidate,
  changeSApePriceAndValidate,
  mintAndValidate,
  supplyAndValidate,
} from "./helpers/validated-steps";
import {almostEqual} from "./helpers/uniswapv3-helper";
import {ProtocolErrors} from "../helpers/types";
import {parseEther} from "ethers/lib/utils";
import {
  executeAcceptBidWithCredit,
  executeSeaportBuyWithCredit,
} from "./helpers/marketplace-helper";
import {BigNumber} from "ethers";

describe("APE Coin Staking Test", () => {
  let testEnv: TestEnv;
  let variableDebtApeCoin: VariableDebtToken;
  let variableDebtCApeCoin: VariableDebtToken;
  let pApeCoin: PToken;
  let cApe: AutoCompoundApe;
  let pcApeCoin: PToken;
  let pSApeCoin: PTokenSApe;
  const sApeAddress = ONE_ADDRESS;
  const InitialNTokenApeBalance = parseEther("100");

  const fixture = async () => {
    testEnv = await loadFixture(testEnvFixture);
    const {
      ape,
      mayc,
      bayc,
      users,
      bakc,
      protocolDataProvider,
      pool,
      apeCoinStaking,
      nMAYC,
      nBAYC,
    } = testEnv;
    const user1 = users[0];
    const depositor = users[1];
    const user4 = users[5];

    const {
      xTokenAddress: pApeCoinAddress,
      variableDebtTokenAddress: variableDebtApeCoinAddress,
    } = await protocolDataProvider.getReserveTokensAddresses(ape.address);
    const {xTokenAddress: pSApeCoinAddress} =
      await protocolDataProvider.getReserveTokensAddresses(sApeAddress);

    cApe = await getAutoCompoundApe();
    const {
      xTokenAddress: pcApeCoinAddress,
      variableDebtTokenAddress: variableDebtCApeCoinAddress,
    } = await protocolDataProvider.getReserveTokensAddresses(cApe.address);

    variableDebtApeCoin = await getVariableDebtToken(
      variableDebtApeCoinAddress
    );
    variableDebtCApeCoin = await getVariableDebtToken(
      variableDebtCApeCoinAddress
    );
    pApeCoin = await getPToken(pApeCoinAddress);
    pSApeCoin = await getPTokenSApe(pSApeCoinAddress);
    pcApeCoin = await getPToken(pcApeCoinAddress);

    await supplyAndValidate(ape, "20000", depositor, true);
    await changePriceAndValidate(ape, "0.001");
    await changePriceAndValidate(cApe, "0.001");
    await changeSApePriceAndValidate(sApeAddress, "0.001");

    await changePriceAndValidate(mayc, "50");
    await changePriceAndValidate(bayc, "50");

    await waitForTx(await bakc["mint(uint256,address)"]("2", user1.address));

    await waitForTx(
      await ape.connect(user1.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await bakc.connect(user1.signer).setApprovalForAll(pool.address, true)
    );

    // send extra tokens to the apestaking contract for rewards
    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](
          apeCoinStaking.address,
          parseEther("100000000000")
        )
    );

    // send extra tokens to the nToken contract for testing ape balance check
    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](nMAYC.address, InitialNTokenApeBalance)
    );
    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](nBAYC.address, InitialNTokenApeBalance)
    );

    await mintAndValidate(ape, "1", user4);
    await waitForTx(
      await ape.connect(user4.signer).approve(cApe.address, MAX_UINT_AMOUNT)
    );
    // user4 deposit MINIMUM_LIQUIDITY to make test case easy
    const MINIMUM_LIQUIDITY = await cApe.MINIMUM_LIQUIDITY();
    await waitForTx(
      await cApe.connect(user4.signer).deposit(user4.address, MINIMUM_LIQUIDITY)
    );

    return testEnv;
  };

  it("TC-pool-ape-staking-01 test borrowApeAndStake: failed when borrow + cash < staking amount (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "16000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "16000");
    await expect(
      pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    ).to.be.revertedWith(ProtocolErrors.TOTAL_STAKING_AMOUNT_WRONG);
  });

  it("TC-pool-ape-staking-02 test borrowApeAndStake: failed when borrow + cash > staking amount (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "16000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "16000");
    await expect(
      pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    ).to.be.revertedWith(ProtocolErrors.TOTAL_STAKING_AMOUNT_WRONG);
  });

  it("TC-pool-ape-staking-03 test borrowApeAndStake: use 100% cash", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      weth,
      bakc,
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
          borrowAsset: ape.address,
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
    // //50 * 0.325 + 15 * 0.2 = 19.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(weth.address, "19.25")
    // );
  });

  it("TC-pool-ape-staking-04 test borrowApeAndStake: part cash, part debt", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      weth,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    // 50 * 0.3250 + 7000 * 0.001 * 0.2 = 17.65
    // 17.65 / 0.001 = 17650
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
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
    //50 * 0.325 + 15 * 0.2 - 8=11.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(weth.address, "11.25")
    // );
  });

  it("TC-pool-ape-staking-05 test borrowApeAndStake: use 100% debt", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      weth,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
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
    //50 * 0.325 + 15 * 0.2 - 15=4.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(weth.address, "4.25")
    // );
  });

  it("TC-pool-ape-staking-06 test withdrawBAKC fails when hf < 1 (revert expected)", async () => {
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
          borrowAsset: ape.address,
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
    //40 * 0.325 + 30 * 0.2 - 30=-11
    almostEqual(userAccount.availableBorrowsBase, 0);

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
          {mainTokenId: 0, bakcTokenId: 0, amount: amount2, isUncommit: true},
        ])
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("TC-pool-ape-staking-07 test withdrawApeCoin fails when hf < 1 (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      weth,
      nMAYC,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
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
    //40 * 0.325 + 30 * 0.2 - 30=-11
    almostEqual(userAccount.availableBorrowsBase, 0);

    const withdrawAmount = await convertToCurrencyDecimals(ape.address, "4000");
    expect(
      await pool.connect(user1.signer).withdrawBAKC(mayc.address, [
        {
          mainTokenId: 0,
          bakcTokenId: 0,
          amount: withdrawAmount,
          isUncommit: false,
        },
      ])
    );
    expect(
      await pool.connect(user1.signer).withdrawBAKC(mayc.address, [
        {
          mainTokenId: 0,
          bakcTokenId: 0,
          amount: withdrawAmount,
          isUncommit: true,
        },
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

    const apeBalanceForNToken = await ape.balanceOf(nMAYC.address);
    expect(apeBalanceForNToken).equal(InitialNTokenApeBalance);
  });

  it("TC-pool-ape-staking-08 test withdrawBAKC fails when hf < 1 (revert expected)", async () => {
    const {
      users: [user1, user2],
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
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await expect(
      pool
        .connect(user2.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: amount2, isUncommit: true},
        ])
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_OWNER);
  });

  it("TC-pool-ape-staking-09 test withdrawApeCoin fails when user is not the owner (revert expected)", async () => {
    const {
      users: [user1, user2],
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
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await expect(
      pool
        .connect(user2.signer)
        .withdrawApeCoin(mayc.address, [{tokenId: 0, amount: amount1}])
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_OWNER);
  });

  it("TC-pool-ape-staking-10 test claimBAKC success when hf > 1", async () => {
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
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 1, amount: amount2}]
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
    //40 * 0.325 + 30 * 0.2 - 30=-11
    almostEqual(userAccount.availableBorrowsBase, 0);

    // advance in time
    await advanceTimeAndBlock(parseInt("86400"));

    const pendingRewardsPool2 = await apeCoinStaking.pendingRewards(
      2,
      nMAYC.address,
      "0"
    );
    expect(pendingRewardsPool2).to.be.gt(0);

    const pendingRewardsPool3 = await apeCoinStaking.pendingRewards(
      3,
      nMAYC.address,
      "1"
    );
    expect(pendingRewardsPool3).to.be.gt(0);

    const userBalance = await ape.balanceOf(user1.address);

    expect(
      await pool
        .connect(user1.signer)
        .claimBAKC(mayc.address, [{mainTokenId: 0, bakcTokenId: 1}])
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount.add(pendingRewardsPool2));

    expect(await ape.balanceOf(user1.address)).to.be.eq(
      userBalance.add(pendingRewardsPool3)
    );

    const apeBalanceForNToken = await ape.balanceOf(nMAYC.address);
    expect(apeBalanceForNToken).equal(InitialNTokenApeBalance);
  });

  it("TC-pool-ape-staking-11 test claimBAKC success when hf < 1 (ape reward for bakc pool is not used as collateral)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      weth,
      apeCoinStaking,
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
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 1, amount: amount2}]
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
    //40 * 0.325 + 30 * 0.2 - 30=-11
    almostEqual(userAccount.availableBorrowsBase, 0);
    // advance in time
    await advanceTimeAndBlock(parseInt("86400"));

    const pendingRewardsPool2 = await apeCoinStaking.pendingRewards(
      2,
      nMAYC.address,
      "0"
    );
    expect(pendingRewardsPool2).to.be.gt(0);

    const pendingRewardsPool3 = await apeCoinStaking.pendingRewards(
      3,
      nMAYC.address,
      "1"
    );
    expect(pendingRewardsPool3).to.be.gt(0);

    const userBalance = await ape.balanceOf(user1.address);

    // drop HF to liquidation levels
    await changePriceAndValidate(mayc, "3");

    expect(
      await pool
        .connect(user1.signer)
        .claimBAKC(mayc.address, [{mainTokenId: 0, bakcTokenId: 1}])
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount.add(pendingRewardsPool2));

    expect(await ape.balanceOf(user1.address)).to.be.eq(
      userBalance.add(pendingRewardsPool3)
    );
  });

  it("TC-pool-ape-staking-12 test claimApeCoin succeeds when hf > 1", async () => {
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
          borrowAsset: ape.address,
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
    //40 * 0.325 + 30 * 0.2 - 30=-11
    almostEqual(userAccount.availableBorrowsBase, 0);

    // advance in time
    await advanceTimeAndBlock(parseInt("86400"));

    const pendingRewardsPool2 = await apeCoinStaking.pendingRewards(
      2,
      nMAYC.address,
      "0"
    );

    const userBalance = await ape.balanceOf(user1.address);

    expect(await pool.connect(user1.signer).claimApeCoin(mayc.address, [0]));

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);

    expect(await ape.balanceOf(user1.address)).to.be.eq(
      userBalance.add(pendingRewardsPool2)
    );
  });

  it("TC-pool-ape-staking-13 test claimApeCoin fails when hf < 1 (revert expected)", async () => {
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
          borrowAsset: ape.address,
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
    //40 * 0.325 + 30 * 0.2 - 30=-11
    almostEqual(userAccount.availableBorrowsBase, 0);

    // drop HF to liquidation levels
    await changePriceAndValidate(mayc, "3");

    await expect(
      pool.connect(user1.signer).claimApeCoin(mayc.address, [0])
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("TC-pool-ape-staking-14 test unstakeApePositionAndRepay repays cape debt - no excess", async () => {
    const {
      users: [user1, user2],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    await mintAndValidate(ape, "20000", user2);
    await waitForTx(
      await ape.connect(user2.signer).approve(cApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .deposit(user2.address, parseEther("20000"))
    );
    await waitForTx(
      await cApe.connect(user2.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await pool
        .connect(user2.signer)
        .supply(cApe.address, parseEther("20000"), user2.address, 0)
    );

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: cApe.address,
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

    const cApeDebt = await variableDebtCApeCoin.balanceOf(user1.address);
    const limit = await convertToCurrencyDecimals(cApe.address, "0.1");
    expect(cApeDebt.lt(limit)).equal(true);
  });

  it("TC-pool-ape-staking-15 test unstakeApePositionAndRepay repays cape debt", async () => {
    const {
      users: [user1, user2],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "10000", user2);
    await waitForTx(
      await ape.connect(user2.signer).approve(cApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .deposit(user2.address, parseEther("10000"))
    );
    await waitForTx(
      await cApe.connect(user2.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await pool
        .connect(user2.signer)
        .supply(cApe.address, parseEther("10000"), user2.address, 0)
    );

    const amount1 = parseEther("7000");
    const amount2 = parseEther("8000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount1,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        []
      )
    );
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: cApe.address,
          borrowAmount: amount2,
          cashAmount: 0,
        },
        [],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    almostEqual(apeDebt, amount1);

    let capeDebt = await variableDebtCApeCoin.balanceOf(user1.address);
    almostEqual(capeDebt, amount2);

    expect(
      await pool
        .connect(user1.signer)
        .unstakeApePositionAndRepay(mayc.address, 0)
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(0);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(0);

    const pCApeBalance = await pcApeCoin.balanceOf(user1.address);
    almostEqual(pCApeBalance, amount1);

    capeDebt = await variableDebtCApeCoin.balanceOf(user1.address);
    expect(capeDebt).equal(0);
  });

  it("TC-pool-ape-staking-16 test unstakeApePositionAndRepay bakc reward should transfer to user wallet", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      apeCoinStaking,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    // advance in time
    await advanceTimeAndBlock(parseInt("86400"));

    const pendingRewardsMaycPool = await apeCoinStaking.pendingRewards(
      2,
      ZERO_ADDRESS,
      "0"
    );
    expect(pendingRewardsMaycPool).to.be.gt(0);
    const pendingRewardsBakcPool = await apeCoinStaking.pendingRewards(
      3,
      ZERO_ADDRESS,
      "0"
    );
    expect(pendingRewardsBakcPool).to.be.gt(0);

    expect(
      await pool
        .connect(user1.signer)
        .unstakeApePositionAndRepay(mayc.address, 0)
    );

    const userBalance = await ape.balanceOf(user1.address);

    expect(userBalance).to.be.eq(pendingRewardsBakcPool);
  });

  it("TC-pool-ape-staking-17 test unstakeApePositionAndRepay by others fails when hf > 1(revert expected)", async () => {
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
          borrowAsset: ape.address,
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

  it("TC-pool-ape-staking-18 test unstakeApePositionAndRepay by others succeeds when hf < 1", async () => {
    const {
      users: [user1, unstaker, , , user2],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    await mintAndValidate(ape, "20000", user2);
    await waitForTx(
      await ape.connect(user2.signer).approve(cApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .deposit(user2.address, parseEther("20000"))
    );
    await waitForTx(
      await cApe.connect(user2.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await pool
        .connect(user2.signer)
        .supply(cApe.address, parseEther("20000"), user2.address, 0)
    );

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: cApe.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "40");
    await changePriceAndValidate(cApe, "0.08");

    expect(
      await pool
        .connect(unstaker.signer)
        .unstakeApePositionAndRepay(mayc.address, 0)
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(0);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(0);

    const pcApeBalance = await pcApeCoin.balanceOf(user1.address);
    expect(pcApeBalance).equal(0);

    const cApeDebt = await variableDebtCApeCoin.balanceOf(user1.address);
    const target = await convertToCurrencyDecimals(cApe.address, "45");
    almostEqual(cApeDebt, target);
  });

  it("TC-pool-ape-staking-19 test can stake multiple times and partially unstake afterwards", async () => {
    const {
      users: [user1, unstaker, , , user2],
      ape,
      mayc,
      bayc,
      pool,
      nMAYC,
      nBAYC,
      weth,
      bakc,
    } = await loadFixture(fixture);

    await mintAndValidate(ape, "30000", user2);
    await waitForTx(
      await ape.connect(user2.signer).approve(cApe.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await cApe
        .connect(user2.signer)
        .deposit(user2.address, parseEther("30000"))
    );
    await waitForTx(
      await cApe.connect(user2.signer).approve(pool.address, MAX_UINT_AMOUNT)
    );
    await waitForTx(
      await pool
        .connect(user2.signer)
        .supply(cApe.address, parseEther("30000"), user2.address, 0)
    );

    await supplyAndValidate(mayc, "2", user1, true);
    await supplyAndValidate(bayc, "2", user1, true);

    const amount = await convertToCurrencyDecimals(cApe.address, "3000");
    const halfAmount = await convertToCurrencyDecimals(cApe.address, "9000");
    const totalAmount = await convertToCurrencyDecimals(cApe.address, "18000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: cApe.address,
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
          borrowAsset: cApe.address,
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

    let cApeDebt = await variableDebtCApeCoin.balanceOf(user1.address);
    almostEqual(cApeDebt, totalAmount);

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
    //50 * 2 * 0.4 + 50 * 2 * 0.325 + 18 * 0.2 - 18 = 58.1
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(weth.address, "58.1")
    // );

    await changePriceAndValidate(mayc, "10");
    await changePriceAndValidate(bayc, "10");
    await changePriceAndValidate(cApe, "0.01");
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

    cApeDebt = await variableDebtCApeCoin.balanceOf(user1.address);
    //12000 + 6000*3/1000
    almostEqual(
      cApeDebt,
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

    let apeBalanceForNToken = await ape.balanceOf(nMAYC.address);
    expect(apeBalanceForNToken).equal(InitialNTokenApeBalance);
    apeBalanceForNToken = await ape.balanceOf(nBAYC.address);
    expect(apeBalanceForNToken).equal(InitialNTokenApeBalance);
  });

  it("TC-pool-ape-staking-20 test can liquidate NFT with existing staking positions", async () => {
    const {
      users: [user1, liquidator],
      ape,
      mayc,
      pool,
      weth,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8");
    const amount = await convertToCurrencyDecimals(ape.address, "7008");

    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const borrowAmount = await convertToCurrencyDecimals(ape.address, "8000");
    expect(
      await pool
        .connect(user1.signer)
        .borrow(ape.address, borrowAmount, 0, user1.address)
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

    expect(await ape.balanceOf(user1.address)).to.be.eq(borrowAmount);

    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).to.be.eq(0); // whole position unstaked

    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    almostEqual(apeDebt, apeDebtBefore); // no debt repaid

    expect(await bakc.ownerOf("0")).to.be.eq(user1.address);
    expect(await mayc.ownerOf("0")).to.be.eq(liquidator.address);
  });

  it("TC-pool-ape-staking-21 test cannot borrow and stake an amount over user's available to borrow (revert expected)", async () => {
    const {
      users: [user1, depositor],
      ape,
      mayc,
      pool,
      weth,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await supplyAndValidate(weth, "5", depositor, true);
    await changePriceAndValidate(mayc, "10");
    await borrowAndValidate(weth, "3", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");

    await expect(
      pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    ).to.be.revertedWith(ProtocolErrors.COLLATERAL_CANNOT_COVER_NEW_BORROW);
  });

  it("TC-pool-ape-staking-22 test can transfer NFT with existing staking positions", async () => {
    const {
      users: [user1, user2],
      ape,
      mayc,
      pool,
      nMAYC,
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
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    expect(await nMAYC.balanceOf(user1.address)).to.be.equal(1);
    expect(await nMAYC.balanceOf(user2.address)).to.be.equal(0);
    expect(await pSApeCoin.balanceOf(user1.address)).equal(amount);
    expect(await pSApeCoin.balanceOf(user2.address)).equal(0);

    expect(
      await nMAYC
        .connect(user1.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user2.address,
          0,
          {gasLimit: 5000000}
        )
    );

    expect(await nMAYC.balanceOf(user1.address)).to.be.equal(0);
    expect(await nMAYC.balanceOf(user2.address)).to.be.equal(1);
    expect(await pSApeCoin.balanceOf(user1.address)).equal(0);
    expect(await pSApeCoin.balanceOf(user2.address)).equal(0);
  });

  it("TC-pool-ape-staking-23 test market accept bid offer should success", async () => {
    const {
      bayc,
      nBAYC,
      usdc,
      pool,
      ape,
      users: [taker, maker, middleman],
    } = await loadFixture(fixture);
    const makerInitialBalance = "800";
    const middlemanInitialBalance = "200";
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");

    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = 0;

    // 1, mint USDC to maker
    await mintAndValidate(usdc, makerInitialBalance, maker);

    // 2, middleman supplies USDC to pool to be borrowed by maker later
    await supplyAndValidate(usdc, middlemanInitialBalance, middleman, true);

    // 3, mint ntoken for taker
    await mintAndValidate(ape, "15000", taker);
    await supplyAndValidate(bayc, "1", taker, true);

    // 4, ape staking for ntoken
    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(taker.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    expect(await nBAYC.balanceOf(taker.address)).to.be.equal(1);
    expect(await nBAYC.balanceOf(maker.address)).to.be.equal(0);
    expect(await pSApeCoin.balanceOf(taker.address)).equal(amount);
    expect(await pSApeCoin.balanceOf(maker.address)).equal(0);

    // 5, accept  order
    await executeAcceptBidWithCredit(
      nBAYC,
      usdc,
      startAmount,
      endAmount,
      creditAmount,
      nftId,
      maker,
      taker
    );

    // taker bayc should reduce
    expect(await nBAYC.balanceOf(taker.address)).to.be.equal(0);
    expect(await nBAYC.balanceOf(maker.address)).to.be.equal(1);
    expect(await pSApeCoin.balanceOf(taker.address)).equal(0);
    expect(await pSApeCoin.balanceOf(maker.address)).equal(0);
  });

  it("TC-pool-ape-staking-24 test market buy with credit should success", async () => {
    const {
      bayc,
      nBAYC,
      usdc,
      pool,
      ape,
      users: [maker, taker, middleman],
    } = await loadFixture(fixture);
    const makerInitialBalance = "800";
    const middlemanInitialBalance = "200";
    const payNowAmount = await convertToCurrencyDecimals(usdc.address, "800");
    const creditAmount = await convertToCurrencyDecimals(usdc.address, "200");

    const startAmount = payNowAmount.add(creditAmount);
    const endAmount = startAmount; // fixed price but offerer cannot afford this
    const nftId = 0;

    // 1, mint USDC to taker
    await mintAndValidate(usdc, makerInitialBalance, taker);

    // 2, middleman supplies USDC to pool to be borrowed by taker later
    await supplyAndValidate(usdc, middlemanInitialBalance, middleman, true);

    // 3, mint ntoken for maker
    await mintAndValidate(ape, "15000", maker);
    await supplyAndValidate(bayc, "1", maker, true);

    // 4, ape staking for ntoken
    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    expect(
      await pool.connect(maker.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    expect(await nBAYC.balanceOf(maker.address)).to.be.equal(1);
    expect(await nBAYC.balanceOf(taker.address)).to.be.equal(0);
    expect(await pSApeCoin.balanceOf(maker.address)).equal(amount);
    expect(await pSApeCoin.balanceOf(taker.address)).equal(0);

    // 5, buy with credit
    await waitForTx(
      await usdc.connect(taker.signer).approve(pool.address, startAmount)
    );
    await executeSeaportBuyWithCredit(
      nBAYC,
      usdc,
      startAmount,
      endAmount,
      creditAmount,
      nftId,
      maker,
      taker
    );

    // taker bayc should reduce
    expect(await nBAYC.balanceOf(maker.address)).to.be.equal(0);
    expect(await nBAYC.balanceOf(taker.address)).to.be.equal(1);
    expect(await pSApeCoin.balanceOf(maker.address)).equal(0);
    expect(await pSApeCoin.balanceOf(taker.address)).equal(0);
  });

  it("TC-pool-ape-staking-25 unstakeApePositionAndRepay should set cApe as collateral", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
    } = await loadFixture(fixture);

    const apeData = await pool.getReserveData(cApe.address);
    await supplyAndValidate(ape, "1", user1, true);
    await waitForTx(
      await pool
        .connect(user1.signer)
        .setUserUseERC20AsCollateral(ape.address, false)
    );
    let userConfig = BigNumber.from(
      (await pool.getUserConfiguration(user1.address)).data
    );
    expect(isUsingAsCollateral(userConfig, apeData.id)).to.be.false;

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
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

    userConfig = BigNumber.from(
      (await pool.getUserConfiguration(user1.address)).data
    );
    expect(isUsingAsCollateral(userConfig, apeData.id)).to.be.true;
  });

  it("TC-pool-ape-staking-26 test borrowApeAndStake: User tries to staking on not Supplying (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      bayc,
      pool,
    } = await loadFixture(fixture);

    await mintAndValidate(bayc, "1", user1);
    await mintAndValidate(ape, "15000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    await expect(
      pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_OWNER);
  });

  it("TC-pool-ape-staking-27 test borrowApeAndStake: User tries to staking 0 ape icon for BAYC (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      bayc,
      pool,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);
    await mintAndValidate(ape, "15000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "0");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = amount1.add(amount2);
    await expect(
      pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    ).to.be.revertedWith("DepositMoreThanOneAPE()");
  });

  it("TC-pool-ape-staking-28 test borrowApeAndStake: only staking BAKC", async () => {
    const {
      users: [user1],
      ape,
      bayc,
      nBAYC,
      pool,
      weth,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);

    await mintAndValidate(ape, "15000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "0");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = amount1.add(amount2);
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount}]
      )
    );

    // User 1 - totalStake should increased in Stake amount
    const totalStake = await nBAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);

    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    // User 1 - Debt should increased in borrowAmount
    const apeDebt = await variableDebtApeCoin.balanceOf(user1.address);
    expect(apeDebt).equal(amount2);

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(2);

    const userAccount = await pool.getUserAccountData(user1.address);
    //50 + 8000*0.001 = 58
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "58")
    );
    //8000*0.001 = 8
    expect(userAccount.totalDebtBase).equal(
      await convertToCurrencyDecimals(weth.address, "8")
    );

    //50 * 0.4 + 8 * 0.2 - 8=13.6
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(weth.address, "13.6")
    // );
  });

  it("TC-pool-ape-staking-29 test borrowApeAndStake: BAYC staked Add BAKC after first Pairing", async () => {
    const {
      users: [user1],
      bayc,
      ape,
      pool,
      weth,
      nBAYC,
      bakc,
    } = await loadFixture(fixture);
    await supplyAndValidate(bayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = amount1.add(amount2);

    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](user1.address, amount)
    );

    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        []
      )
    );

    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: 0,
        },
        [],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    // User 1 - totalStake should increased in Stake amount
    const totalStake = await nBAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);

    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    // User 1 - Debt should increased in borrowAmount
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
    //50 * 0.4 + 15 * 0.2 - 8=15
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(weth.address, "15")
    // );
  });

  it("TC-pool-ape-staking-30 test borrowApeAndStake: MAYC staked Add BAKC after first Pairing", async () => {
    const {
      users: [user1],
      mayc,
      weth,
      nMAYC,
      ape,
      pool,
      bakc,
    } = await loadFixture(fixture);
    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = amount1.add(amount2);

    await waitForTx(
      await ape
        .connect(user1.signer)
        ["mint(address,uint256)"](user1.address, amount)
    );

    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        []
      )
    );

    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: 0,
        },
        [],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );
    // User 1 - totalStake should increased in Stake amount
    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);

    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    // User 1 - Debt should increased in borrowAmount
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
    //50 * 0.325 + 15 * 0.2 - 8=11.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(weth.address, "11.25")
    // );
  });

  it("TC-pool-ape-staking-31 test borrowApeAndStake: Insufficient liquidity of borrow ape (revert expected)", async () => {
    const {
      users: [user1],
      bayc,
      ape,
      pool,
    } = await loadFixture(fixture);

    await supplyAndValidate(bayc, "1", user1, true);

    // reduce pool liquidity
    await borrowAndValidate(ape, "13000", user1);
    const amount1 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount = amount1.add(amount2);

    await ape
      .connect(user1.signer)
      ["mint(address,uint256)"](user1.address, amount);

    await expect(
      pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: bayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount1,
          cashAmount: amount2,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("TC-pool-ape-staking-32 test borrowApeAndStake: success use 100% cash when hf < 1", async () => {
    const {
      users: [user1, user2],
      ape,
      mayc,
      pool,
      usdt,
      nMAYC,
      weth,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await supplyAndValidate(usdt, "1000", user2, true);
    await borrowAndValidate(ape, "5000", user1);
    await borrowAndValidate(usdt, "800", user1);
    await mintAndValidate(ape, "7000", user1);

    const amount = await convertToCurrencyDecimals(ape.address, "7000");

    await changePriceAndValidate(mayc, "20");
    await changePriceAndValidate(usdt, "0.0009");
    await changePriceAndValidate(ape, "0.005");
    await changeSApePriceAndValidate(sApeAddress, "0.005");

    const healthFactor = (await pool.getUserAccountData(user1.address))
      .healthFactor;

    expect(healthFactor).to.be.lt(parseEther("1"));

    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount}]
      )
    );
    const healthFactorAfter = (await pool.getUserAccountData(user1.address))
      .healthFactor;

    // health factor should improve greater than 1
    expect(healthFactorAfter).to.be.gt(parseEther("1"));

    // User 1 - totalStake should increased in Stake amount
    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);

    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(2);

    const userAccount = await pool.getUserAccountData(user1.address);

    //20 + 7000*0.005 = 55
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(weth.address, "55")
    );

    //5000*0.005 + 800 * 0.0009 = 25.72
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(weth.address, "25.72")
    );

    //availableBorrowsInBaseCurrency < totalDebtInBaseCurrency = 0
    almostEqual(
      userAccount.availableBorrowsBase,
      await convertToCurrencyDecimals(weth.address, "0")
    );
  });

  it("TC-pool-ape-staking-33 test safeTransferFrom BAKC: original owner withdraws all", async () => {
    const {
      users: [user1, , user3],
      ape,
      mayc,
      pool,
      nMAYC,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    const userBalance = await ape.balanceOf(user1.address);
    const user3Balance = await ape.balanceOf(user3.address);

    await waitForTx(
      await bakc
        .connect(user1.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user3.address,
          "0"
        )
    );

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(1);

    const bakcBalanceUser3 = await bakc.balanceOf(user3.address);
    expect(bakcBalanceUser3).equal(1);

    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: amount2, isUncommit: true},
        ])
    );

    // User 1 - totalStake should have decreased in BAKC amount
    const totalStakeAfter = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStakeAfter).equal(totalStake.sub(amount2));

    // User 1 - totalStake should have increased in BAKC amount
    const pSApeBalanceAfter = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalanceAfter).equal(pSApeBalance.sub(amount2));

    // User 1 - Ape Balance should have increased in BAKC amount
    const userBalanceAfter = await ape.balanceOf(user1.address);
    expect(userBalanceAfter).equal(userBalance.add(amount2));

    // User 3 - Ape Balance should remain the same
    const user3BalanceAfter = await ape.balanceOf(user3.address);
    expect(user3BalanceAfter).equal(user3Balance);
  });

  it("TC-pool-ape-staking-34 test safeTransferFrom BAKC: original owner withdraws part ape (revert expected)", async () => {
    const {
      users: [user1, , user3],
      ape,
      mayc,
      pool,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );
    await waitForTx(
      await bakc
        .connect(user1.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user3.address,
          "0"
        )
    );

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(1);

    const bakcBalanceUser3 = await bakc.balanceOf(user3.address);
    expect(bakcBalanceUser3).equal(1);

    // Only withdraw all
    await expect(
      pool
        .connect(user1.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: amount1, isUncommit: false},
        ])
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_BAKC_OWNER);
  });

  it("TC-pool-ape-staking-35 test safeTransferFrom BAKC: original owner claim bakc reward (revert expected)", async () => {
    const {
      users: [user1, , user3],
      ape,
      mayc,
      pool,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );
    await waitForTx(
      await bakc
        .connect(user1.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user3.address,
          "0"
        )
    );

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(1);

    const bakcBalanceUser3 = await bakc.balanceOf(user3.address);
    expect(bakcBalanceUser3).equal(1);

    // advance in time
    await advanceTimeAndBlock(parseInt("86400"));

    await expect(
      pool
        .connect(user1.signer)
        .claimBAKC(mayc.address, [{mainTokenId: 0, bakcTokenId: 0}])
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_BAKC_OWNER);
  });

  it("TC-pool-ape-staking-36 test safeTransferFrom BAKC: new owner withdraw all (revert expected)", async () => {
    const {
      users: [user1, , user3],
      ape,
      mayc,
      pool,
      bakc,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await waitForTx(
      await bakc
        .connect(user1.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user3.address,
          "0"
        )
    );

    const bakcBalance = await bakc.balanceOf(user1.address);
    expect(bakcBalance).equal(1);

    const bakcBalanceUser3 = await bakc.balanceOf(user3.address);
    expect(bakcBalanceUser3).equal(1);

    // New owner
    await expect(
      pool
        .connect(user3.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: amount2, isUncommit: true},
        ])
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_OWNER);
  });

  it("TC-pool-ape-staking-37 test safeTransferFrom: transfer fails when hf < 1 (revert expected)", async () => {
    const {
      users: [user1, user2, user3],
      ape,
      mayc,
      nMAYC,
      pool,
      usdt,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user1, true);
    await supplyAndValidate(usdt, "1000", user2, true);
    await borrowAndValidate(ape, "5000", user1);
    await borrowAndValidate(usdt, "800", user1);
    await mintAndValidate(ape, "7000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "100");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");

    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount2,
          cashAmount: amount1,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    await changePriceAndValidate(mayc, "0.001");
    await changePriceAndValidate(ape, "0.1");
    await changeSApePriceAndValidate(sApeAddress, "0.002");

    await expect(
      nMAYC
        .connect(user1.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user3.address,
          0,
          {gasLimit: 5000000}
        )
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("TC-pool-ape-staking-38 test withdrawBAKC success when hf > 1 after withdrawBAKC", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      bakc,
    } = await loadFixture(fixture);
    // 1. supply 1 mayc
    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    // 2. stake  one bakc and borrow 15000 ape
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const userAccount = await pool.getUserAccountData(user1.address);
    const healthFactor = (await pool.getUserAccountData(user1.address))
      .healthFactor;

    expect(healthFactor.gt(parseEther("1"))).to.be.true;
    // User1 - collateral amount should increased mayc amount * price + ape amount * ape price =  50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(ape.address, "65")
    );
    // User1 - debt amount should increased ape amount * ape price = 15000*0.001 = 15
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(ape.address, "15")
    );
    // User1 - available borrow should increased amount * baseLTVasCollateral - debt amount = 50 * 0.325 + 15 * 0.2 - 15=4.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(ape.address, "4.25")
    // );
    let totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    // User 1 - totalStake should increased in Stake amount
    expect(totalStake).equal(amount);
    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    const withdrawAmount = await convertToCurrencyDecimals(ape.address, "8000");
    await waitForTx(
      await pool.connect(user1.signer).withdrawBAKC(mayc.address, [
        {
          mainTokenId: 0,
          bakcTokenId: 0,
          amount: withdrawAmount,
          isUncommit: true,
        },
      ])
    );

    const bakcBalance = await bakc.balanceOf(user1.address);
    // User 1 - bakc balanace should increased 2
    expect(bakcBalance).equal(2);
    // User1 - ape balance should increased amount2
    expect(await ape.balanceOf(user1.address)).eq(amount2);
    totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    // User1 - total stake should increased amount1
    expect(totalStake).equal(amount1);
  });

  it("TC-pool-ape-staking-39 test withdrawApeCoin success when hf > 1 after withdrawApeCoin", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    // supply 1 mayc
    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    // borrow and stake 15000
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const userAccount = await pool.getUserAccountData(user1.address);
    const healthFactor = (await pool.getUserAccountData(user1.address))
      .healthFactor;

    expect(healthFactor.gt(parseEther("1"))).to.be.true;
    // User1 - collateral amount should increased mayc amount * price + ape amount * ape price =  50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(ape.address, "65")
    );
    // User1 - debt amount should increased ape amount * ape price = 15000*0.001 = 15
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(ape.address, "15")
    );
    // User1 - available borrow should increased amount * baseLTVasCollateral - debt amount = 50 * 0.325 + 15 * 0.2 - 15=4.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(ape.address, "4.25")
    // );
    let totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    // User 1 - totalStake should increased in Stake amount
    expect(totalStake).equal(amount);
    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawApeCoin(mayc.address, [{tokenId: 0, amount: amount1}])
    );
    const apeBalance = await ape.balanceOf(user1.address);
    expect(apeBalance).equal(amount1);
    totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    // User 1 - totalStake should increased in amount2
    expect(totalStake).equal(amount2);
  });

  it("TC-pool-ape-staking-40 test withdrawBAKC fails when sender is not NFT owner (revert expected)", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);
    // 1. supply 1 mayc
    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    // 2. stake  one bakc and borrow 15000 ape
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const userAccount = await pool.getUserAccountData(user1.address);
    // User1 - collateral amount should increased mayc amount * price + ape amount * ape price =  50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(ape.address, "65")
    );
    // User1 - debt amount should increased ape amount * ape price = 15000*0.001 = 15
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(ape.address, "15")
    );
    // User1 - available borrow should increased amount * baseLTVasCollateral - debt amount = 50 * 0.325 + 15 * 0.2 - 15=4.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(ape.address, "4.25")
    // );
    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    // User 1 - totalStake should increased in Stake amount
    expect(totalStake).equal(amount);
    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    await expect(
      pool
        .connect(user1.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 1, bakcTokenId: 0, amount: amount2, isUncommit: true},
        ])
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_OWNER);
  });

  it("TC-pool-ape-staking-41 test withdrawBAKC fails when amount != total staking, the sender is the NFT owner, but the sender is not the BAKC owner(revert expected)", async () => {
    const {
      users: [user1, , user3],
      ape,
      mayc,
      pool,
      nMAYC,
      bakc,
    } = await loadFixture(fixture);
    // 1. supply 1 mayc
    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    // 2. stake  one bakc and borrow 15000 ape
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const userAccount = await pool.getUserAccountData(user1.address);
    // User1 - collateral amount should increased mayc amount * price + ape amount * ape price =  50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(ape.address, "65")
    );
    // User1 - debt amount should increased ape amount * ape price = 15000*0.001 = 15
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(ape.address, "15")
    );
    // User1 - available borrow should increased amount * baseLTVasCollateral - debt amount = 50 * 0.325 + 15 * 0.2 - 15=4.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(ape.address, "4.25")
    // );
    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    // User 1 - totalStake should increased in Stake amount
    expect(totalStake).equal(amount);
    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    await waitForTx(
      await bakc
        .connect(user1.signer)
        .transferFrom(user1.address, user3.address, 0)
    );
    // User 3 - The NFT owner with bakc id 0 should be changed to user3
    expect(await bakc.balanceOf(user3.address)).equal(1);
    expect(await bakc.ownerOf(0)).eq(user3.address);

    const withdrawAmount = await convertToCurrencyDecimals(ape.address, "6000");

    await expect(
      pool.connect(user1.signer).withdrawBAKC(mayc.address, [
        {
          mainTokenId: 0,
          bakcTokenId: 0,
          amount: withdrawAmount,
          isUncommit: false,
        },
      ])
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_BAKC_OWNER);
  });

  it("TC-pool-ape-staking-42 test withdrawBAKC success when withdraw amount == bakc staking amount, it will automatically claim and transfer the reward to the BACK owner", async () => {
    const {
      users: [user1, , user3],
      ape,
      mayc,
      pool,
      nMAYC,
      apeCoinStaking,
      bakc,
    } = await loadFixture(fixture);
    // 1. supply 1 mayc
    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    // 2. stake  one bakc and borrow 15000 ape
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const userAccount = await pool.getUserAccountData(user1.address);

    // User1 - collateral amount should increased mayc amount * price + ape amount * ape price =  50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(ape.address, "65")
    );
    // User1 - debt amount should increased ape amount * ape price = 15000*0.001 = 15
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(ape.address, "15")
    );
    // User1 - available borrow should increased amount * baseLTVasCollateral - debt amount = 50 * 0.325 + 15 * 0.2 - 15=4.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(ape.address, "4.25")
    // );
    // User 1 - totalStake should increased in Stake amount
    let totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);
    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    await advanceTimeAndBlock(parseInt("86400"));

    // bayc rewards
    const pendingRewardsPool2 = await apeCoinStaking.pendingRewards(
      2,
      nMAYC.address,
      "0"
    );
    // bakc rewards
    const pendingRewardsPool3 = await apeCoinStaking.pendingRewards(
      3,
      nMAYC.address,
      "0"
    );

    await waitForTx(
      await bakc
        .connect(user1.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user3.address,
          0
        )
    );
    // User 3 - The NFT owner with bakc id 0 should be changed to user3
    expect(await bakc.ownerOf(0)).eq(user3.address);

    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: amount2, isUncommit: true},
        ])
    );

    // User1 - ape balance should increased amount2
    expect(await ape.balanceOf(user1.address)).eq(amount2);
    // User 3 - ape balance should increased pendingRewardsPool3
    expect(await ape.balanceOf(user3.address)).eq(pendingRewardsPool3);
    totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    // User1 - total stake should increased amount1 + pendingRewardsPool2
    expect(totalStake).equal(amount1.add(pendingRewardsPool2));
  });

  it("TC-pool-ape-staking-43 test withdrawBAKC success when withdraw amount == bakc staking amount, and the sender is not the BAKC owner, it will automatically claim and transfer the reward to the BACK owner", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      apeCoinStaking,
    } = await loadFixture(fixture);
    // 1. supply 1 mayc
    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    // 2. stake  one bakc and borrow 15000 ape
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const userAccount = await pool.getUserAccountData(user1.address);

    // User1 - collateral amount should increased mayc amount * price + ape amount * ape price =  50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(ape.address, "65")
    );
    // User1 - debt amount should increased ape amount * ape price = 15000*0.001 = 15
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(ape.address, "15")
    );
    // User1 - available borrow should increased amount * baseLTVasCollateral - debt amount = 50 * 0.325 + 15 * 0.2 - 15=4.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(ape.address, "4.25")
    // );
    // User 1 - totalStake should increased in Stake amount
    let totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);
    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    await advanceTimeAndBlock(parseInt("86400"));

    // bayc rewards
    const pendingRewardsPool2 = await apeCoinStaking.pendingRewards(
      2,
      nMAYC.address,
      "0"
    );
    // bakc rewards
    const pendingRewardsPool3 = await apeCoinStaking.pendingRewards(
      3,
      nMAYC.address,
      "0"
    );

    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawBAKC(mayc.address, [
          {mainTokenId: 0, bakcTokenId: 0, amount: amount2, isUncommit: true},
        ])
    );

    // User1 - ape balance should increased amount2 + pendingRewardsPool3
    expect(await ape.balanceOf(user1.address)).eq(
      amount2.add(pendingRewardsPool3)
    );
    totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    // User1 - total stake should increased amount1 + pendingRewardsPool2
    expect(totalStake).equal(amount1.add(pendingRewardsPool2));
  });

  it("TC-pool-ape-staking-44 test withdrawApeCoin fails when the sender is not the NFT owner(revert expected)", async () => {
    const {
      users: [user1, , user3],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    // supply 1 mayc
    await supplyAndValidate(mayc, "1", user1, true);
    await mintAndValidate(ape, "1000", user1);

    const amount = await convertToCurrencyDecimals(ape.address, "1000");
    // 2. stake  one bakc and borrow 15000 ape
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount}],
        []
      )
    );

    const userAccount = await pool.getUserAccountData(user1.address);

    // User1 - collateral amount should increased mayc amount * price + ape amount * ape price =  50 + 1000*0.001 = 51
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(ape.address, "51")
    );
    // User1 - debt amount should increased 0
    almostEqual(userAccount.totalDebtBase, 0);
    // User1 - available borrow should increased amount * baseLTVasCollateral = 50 * 0.325 + 1 * 0.2=16.45
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(ape.address, "16.45")
    // );
    // User 1 - totalStake should increased in Stake amount
    const totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);
    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    await waitForTx(
      await nMAYC
        .connect(user1.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user1.address,
          user3.address,
          0
        )
    );
    expect(await nMAYC.balanceOf(user3.address)).eq(1);
    expect(await nMAYC.ownerOf(0)).eq(user3.address);

    await expect(
      pool
        .connect(user1.signer)
        .withdrawApeCoin(mayc.address, [{tokenId: 1, amount: amount}])
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_OWNER);
  });

  it("TC-pool-ape-staking-45 test withdrawApeCoin success when withdraw amount == NFT staking amount, it will automatically claim and transfer the reward to the user account", async () => {
    const {
      users: [user1],
      ape,
      mayc,
      pool,
      nMAYC,
      apeCoinStaking,
    } = await loadFixture(fixture);
    // 1. supply 1 mayc
    await supplyAndValidate(mayc, "1", user1, true);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    // 2. stake  one bakc and borrow 15000 ape
    await waitForTx(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: amount,
          cashAmount: 0,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const userAccount = await pool.getUserAccountData(user1.address);

    // User1 - collateral amount should increased mayc amount * price + ape amount * ape price =  50 + 15000*0.001 = 65
    expect(userAccount.totalCollateralBase).equal(
      await convertToCurrencyDecimals(ape.address, "65")
    );
    // User1 - debt amount should increased ape amount * ape price = 15000*0.001 = 15
    almostEqual(
      userAccount.totalDebtBase,
      await convertToCurrencyDecimals(ape.address, "15")
    );
    // User1 - available borrow should increased amount * baseLTVasCollateral - debt amount = 50 * 0.325 + 15 * 0.2 - 15=4.25
    // almostEqual(
    //   userAccount.availableBorrowsBase,
    //   await convertToCurrencyDecimals(ape.address, "4.25")
    // );
    // User 1 - totalStake should increased in Stake amount
    let totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount);
    // User 1 - pSape should increased in Stake amount
    const pSApeBalance = await pSApeCoin.balanceOf(user1.address);
    expect(pSApeBalance).equal(amount);

    // advance in time
    await advanceTimeAndBlock(parseInt("86400"));

    const pendingRewardsPool2 = await apeCoinStaking.pendingRewards(
      2,
      nMAYC.address,
      "0"
    );
    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawApeCoin(mayc.address, [{tokenId: 0, amount: amount1}])
    );

    // User1 - ape balance should increased amount1 + pendingRewardsPool2
    expect(await ape.balanceOf(user1.address)).to.be.eq(
      amount1.add(pendingRewardsPool2)
    );
    // User1 - total stake should increased amount2
    totalStake = await nMAYC.getUserApeStakingAmount(user1.address);
    expect(totalStake).equal(amount2);
  });

  it("TC-pool-ape-staking-46 test borrowApeAndStake will turn on the sAPE collateral", async () => {
    const {
      users: [user1, , user3],
      ape,
      mayc,
      pool,
      nMAYC,
    } = await loadFixture(fixture);

    await supplyAndValidate(mayc, "1", user3, true);
    // transfer mayc#0 to user1 who hasn't collateralized sAPE
    await waitForTx(
      await nMAYC
        .connect(user3.signer)
        ["safeTransferFrom(address,address,uint256)"](
          user3.address,
          user1.address,
          "0"
        )
    );
    await mintAndValidate(ape, "15000", user1);

    const amount1 = await convertToCurrencyDecimals(ape.address, "7000");
    const amount2 = await convertToCurrencyDecimals(ape.address, "8000");
    const amount = await convertToCurrencyDecimals(ape.address, "15000");
    const sApeReserveData = await pool.getReserveData(sApeAddress);
    const configDataBefore = (await pool.getUserConfiguration(user1.address))
      .data;
    expect(isUsingAsCollateral(configDataBefore, sApeReserveData.id)).false;

    expect(
      await pool.connect(user1.signer).borrowApeAndStake(
        {
          nftAsset: mayc.address,
          borrowAsset: ape.address,
          borrowAmount: 0,
          cashAmount: amount,
        },
        [{tokenId: 0, amount: amount1}],
        [{mainTokenId: 0, bakcTokenId: 0, amount: amount2}]
      )
    );

    const configDataAfter = (await pool.getUserConfiguration(user1.address))
      .data;
    expect(isUsingAsCollateral(configDataAfter, sApeReserveData.id)).true;
  });
});
