import {expect} from "chai";
import {TestEnv} from "./helpers/make-suite";
import {waitForTx} from "../helpers/misc-utils";
import {ZERO_ADDRESS} from "../helpers/constants";
import {convertToCurrencyDecimals} from "../helpers/contracts-helpers";
import {
  almostEqual,
  createNewPool,
  mintNewPosition,
  fund,
  approveTo,
} from "./helpers/izumi-helper";
import {encodeSqrtRatioX96} from "@uniswap/v3-sdk";
import {
  getIZUMIOracleWrapper,
  getIZUMIPositionManager,
  getNTokenIZUMI,
} from "../helpers/contracts-getters";
import {ProtocolErrors} from "../helpers/types";
import {snapshot} from "./helpers/snapshot-manager";
import {loadFixture} from "@nomicfoundation/hardhat-network-helpers";
import {testEnvFixture} from "./helpers/setup-env";
import {LiquidityManager, NTokenIzumi} from "../types";

describe("IZUMI LP NFT supply, withdraw, setCollateral, liquidation and transfer test", () => {
  let testEnv: TestEnv;
  let nftPositionManager: LiquidityManager;
  let nTokenIzumi: NTokenIzumi;

  before(async () => {
    testEnv = await loadFixture(testEnvFixture);

    const {
      users: [user1],
      dai,
      weth,
      pool,
    } = testEnv;

    nftPositionManager = await getIZUMIPositionManager();
    const nIzumiAddress = await pool.getReserveXToken(
      nftPositionManager.address
    );
    nTokenIzumi = await getNTokenIZUMI(nIzumiAddress);

    const userDaiAmount = await convertToCurrencyDecimals(dai.address, "10000");
    const userWethAmount = await convertToCurrencyDecimals(weth.address, "10");
    await fund({token: dai, user: user1, amount: userDaiAmount});
    await fund({token: weth, user: user1, amount: userWethAmount});
    const nft = nftPositionManager.connect(user1.signer);
    await approveTo({
      target: nftPositionManager.address,
      token: dai,
      user: user1,
    });
    await approveTo({
      target: nftPositionManager.address,
      token: weth,
      user: user1,
    });
    const fee = 2000;
    const tickSpacing = fee / 50;
    const initialPrice = encodeSqrtRatioX96(1, 1000);
    const lowerPrice = encodeSqrtRatioX96(1, 10000);
    const upperPrice = encodeSqrtRatioX96(1, 100);
    await createNewPool({
      positionManager: nft,
      token0: dai,
      token1: weth,
      fee: fee,
      initialSqrtPrice: initialPrice,
    });
    await mintNewPosition({
      nft: nft,
      token0: dai,
      token1: weth,
      fee: fee,
      user: user1,
      tickSpacing: tickSpacing,
      lowerPrice,
      upperPrice,
      token0Amount: userDaiAmount,
      token1Amount: userWethAmount,
    });
    expect(await nftPositionManager.balanceOf(user1.address)).to.eq(1);

    await nft.setApprovalForAll(pool.address, true);
  });

  it("supply IZUMI LP failed if underlying erc20 was inactive[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(weth.address, false));
    await expect(
      pool
        .connect(user1.signer)
        .supplyERC721(
          nftPositionManager.address,
          [{tokenId: 0, useAsCollateral: true}],
          user1.address,
          0,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(ProtocolErrors.RESERVE_INACTIVE);
  });

  it("supply IZUMI LP success if underlying erc20 was active[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(weth.address, true));
    await waitForTx(
      await pool
        .connect(user1.signer)
        .supplyERC721(
          nftPositionManager.address,
          [{tokenId: 0, useAsCollateral: true}],
          user1.address,
          0,
          {
            gasLimit: 12_450_000,
          }
        )
    );
    expect(await nTokenIzumi.balanceOf(user1.address)).to.eq(1);
  });

  it("supply IZUMI LP failed if underlying erc20 was paused[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawERC721(nftPositionManager.address, [0], user1.address, {
          gasLimit: 12_450_000,
        })
    );

    await waitForTx(await configurator.pauseReserve(weth.address));
    await expect(
      pool
        .connect(user1.signer)
        .supplyERC721(
          nftPositionManager.address,
          [{tokenId: 0, useAsCollateral: true}],
          user1.address,
          0,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(ProtocolErrors.RESERVE_PAUSED);
  });

  it("supply IZUMI LP success if underlying erc20 was not paused[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.unpauseReserve(weth.address));
    await waitForTx(
      await pool
        .connect(user1.signer)
        .supplyERC721(
          nftPositionManager.address,
          [{tokenId: 0, useAsCollateral: true}],
          user1.address,
          0,
          {
            gasLimit: 12_450_000,
          }
        )
    );
    expect(await nTokenIzumi.balanceOf(user1.address)).to.eq(1);
  });

  it("supply IZUMI LP failed if underlying erc20 was frozen[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawERC721(nftPositionManager.address, [0], user1.address, {
          gasLimit: 12_450_000,
        })
    );

    await waitForTx(await configurator.setReserveFreeze(weth.address, true));
    await expect(
      pool
        .connect(user1.signer)
        .supplyERC721(
          nftPositionManager.address,
          [{tokenId: 0, useAsCollateral: true}],
          user1.address,
          0,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(ProtocolErrors.RESERVE_FROZEN);
  });

  it("supply IZUMI LP success if underlying erc20 was not frozen[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.setReserveFreeze(weth.address, false));
    await waitForTx(
      await pool
        .connect(user1.signer)
        .supplyERC721(
          nftPositionManager.address,
          [{tokenId: 0, useAsCollateral: true}],
          user1.address,
          0,
          {
            gasLimit: 12_450_000,
          }
        )
    );
    expect(await nTokenIzumi.balanceOf(user1.address)).to.eq(1);
  });

  it("withdraw IZUMI LP failed if underlying erc20 was not active[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(weth.address, false));
    await expect(
      pool
        .connect(user1.signer)
        .withdrawERC721(nftPositionManager.address, [0], user1.address, {
          gasLimit: 12_450_000,
        })
    ).to.be.revertedWith(ProtocolErrors.RESERVE_INACTIVE);
  });

  it("withdraw IZUMI LP success if underlying erc20 was active[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(weth.address, true));
    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawERC721(nftPositionManager.address, [0], user1.address, {
          gasLimit: 12_450_000,
        })
    );
    expect(await nftPositionManager.balanceOf(user1.address)).to.eq(1);
  });

  it("withdraw IZUMI LP failed if underlying erc20 was paused[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(
      await pool
        .connect(user1.signer)
        .supplyERC721(
          nftPositionManager.address,
          [{tokenId: 0, useAsCollateral: true}],
          user1.address,
          0,
          {
            gasLimit: 12_450_000,
          }
        )
    );
    await waitForTx(await configurator.pauseReserve(weth.address));
    await expect(
      pool
        .connect(user1.signer)
        .withdrawERC721(nftPositionManager.address, [0], user1.address, {
          gasLimit: 12_450_000,
        })
    ).to.be.revertedWith(ProtocolErrors.RESERVE_PAUSED);
  });

  it("withdraw IZUMI LP success if underlying erc20 was not paused[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.unpauseReserve(weth.address));
    await waitForTx(
      await pool
        .connect(user1.signer)
        .withdrawERC721(nftPositionManager.address, [0], user1.address, {
          gasLimit: 12_450_000,
        })
    );
    expect(await nftPositionManager.balanceOf(user1.address)).to.eq(1);
  });

  it("setAsCollateral failed if underlying erc20 was not active[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(
      await pool
        .connect(user1.signer)
        .supplyERC721(
          nftPositionManager.address,
          [{tokenId: 0, useAsCollateral: true}],
          user1.address,
          0,
          {
            gasLimit: 12_450_000,
          }
        )
    );
    await waitForTx(await configurator.setReserveActive(weth.address, false));
    await expect(
      pool
        .connect(user1.signer)
        .setUserUseERC721AsCollateral(nftPositionManager.address, [0], false, {
          gasLimit: 12_450_000,
        })
    ).to.be.revertedWith(ProtocolErrors.RESERVE_INACTIVE);
  });

  it("setAsCollateral success if underlying erc20 was active[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(weth.address, true));
    await waitForTx(
      await pool
        .connect(user1.signer)
        .setUserUseERC721AsCollateral(nftPositionManager.address, [0], false, {
          gasLimit: 12_450_000,
        })
    );
    expect(await nTokenIzumi.collateralizedBalanceOf(user1.address)).to.eq(0);
  });

  it("setAsCollateral failed if underlying erc20 was paused[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.pauseReserve(weth.address));
    await expect(
      pool
        .connect(user1.signer)
        .setUserUseERC721AsCollateral(nftPositionManager.address, [0], true, {
          gasLimit: 12_450_000,
        })
    ).to.be.revertedWith(ProtocolErrors.RESERVE_PAUSED);
  });

  it("setAsCollateral success if underlying erc20 was not paused[ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.unpauseReserve(weth.address));
    await waitForTx(
      await pool
        .connect(user1.signer)
        .setUserUseERC721AsCollateral(nftPositionManager.address, [0], true, {
          gasLimit: 12_450_000,
        })
    );
    expect(await nTokenIzumi.collateralizedBalanceOf(user1.address)).to.eq(1);
  });

  it("decreaseLiquidity failed if underlying erc20 was not active [ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      configurator,
      weth,
      pool,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(weth.address, false));

    const beforeLiquidity = (await nftPositionManager.liquidities(0)).liquidity;

    await expect(
      pool
        .connect(user1.signer)
        .decreaseLiquidity(
          nftPositionManager.address,
          0,
          beforeLiquidity.div(2),
          0,
          0,
          false,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(ProtocolErrors.RESERVE_INACTIVE);
  });

  it("decreaseLiquidity success if underlying erc20 was active [ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(weth.address, true));

    const preLiquidationSnapshot = await snapshot.take();

    const beforeLiquidity = (await nftPositionManager.liquidities(0)).liquidity;

    await waitForTx(
      await pool
        .connect(user1.signer)
        .decreaseLiquidity(
          nftPositionManager.address,
          0,
          beforeLiquidity.div(2),
          0,
          0,
          false,
          {
            gasLimit: 12_450_000,
          }
        )
    );

    await snapshot.revert(preLiquidationSnapshot);
  });

  it("decreaseLiquidity failed if underlying erc20 was paused [ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      configurator,
      weth,
      pool,
    } = testEnv;

    await waitForTx(await configurator.pauseReserve(weth.address));

    const beforeLiquidity = (await nftPositionManager.liquidities(0)).liquidity;

    await expect(
      pool
        .connect(user1.signer)
        .decreaseLiquidity(
          nftPositionManager.address,
          0,
          beforeLiquidity.div(2),
          0,
          0,
          false,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(ProtocolErrors.RESERVE_PAUSED);
  });

  it("decreaseLiquidity success if underlying erc20 was not paused [ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.unpauseReserve(weth.address));

    const preLiquidationSnapshot = await snapshot.take();

    const beforeLiquidity = (await nftPositionManager.liquidities(0)).liquidity;

    await waitForTx(
      await pool
        .connect(user1.signer)
        .decreaseLiquidity(
          nftPositionManager.address,
          0,
          beforeLiquidity.div(2),
          0,
          0,
          false,
          {
            gasLimit: 12_450_000,
          }
        )
    );

    await snapshot.revert(preLiquidationSnapshot);
  });

  it("decreaseLiquidity failed if not owner [ @skip-on-coverage ]", async () => {
    const {users, pool} = testEnv;

    const beforeLiquidity = (await nftPositionManager.liquidities(0)).liquidity;

    await expect(
      pool
        .connect(users[1].signer)
        .decreaseLiquidity(
          nftPositionManager.address,
          0,
          beforeLiquidity.div(2),
          0,
          0,
          false,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(ProtocolErrors.NOT_THE_OWNER);
  });

  it("transfer failed if underlying erc20 was paused [ @skip-on-coverage ]", async () => {
    const {
      users: [user1, user2],
      configurator,
      weth,
    } = testEnv;

    await waitForTx(await configurator.pauseReserve(weth.address));

    await expect(
      nTokenIzumi
        .connect(user1.signer)
        .transferFrom(user1.address, user2.address, 0, {
          gasLimit: 12_450_000,
        })
    ).to.be.revertedWith(ProtocolErrors.RESERVE_PAUSED);
  });

  it("transfer success if underlying erc20 was not paused [ @skip-on-coverage ]", async () => {
    const {
      users: [user1, user2],
      weth,
      configurator,
    } = testEnv;
    await waitForTx(await configurator.unpauseReserve(weth.address));

    const preLiquidationSnapshot = await snapshot.take();

    await waitForTx(
      await nTokenIzumi
        .connect(user1.signer)
        .transferFrom(user1.address, user2.address, 0, {
          gasLimit: 12_450_000,
        })
    );

    expect(await nTokenIzumi.balanceOf(user1.address)).to.eq(0);
    expect(await nTokenIzumi.balanceOf(user2.address)).to.eq(1);

    await snapshot.revert(preLiquidationSnapshot);
  });

  it("borrow asset by using IZUMI Lp as collateral [ @skip-on-coverage ]", async () => {
    const {
      users: [user1, depositor],
      weth,
      dai,
      pool,
      paraspaceOracle,
      oracle,
    } = testEnv;

    const ethAmount = await convertToCurrencyDecimals(weth.address, "30");
    await fund({token: weth, user: depositor, amount: ethAmount});
    await approveTo({
      target: pool.address,
      token: weth,
      user: depositor,
    });
    await waitForTx(
      await pool
        .connect(depositor.signer)
        .supply(weth.address, ethAmount, depositor.address, "0")
    );

    await waitForTx(
      await paraspaceOracle.setAssetSources([dai.address], [ZERO_ADDRESS])
    );
    await oracle.setAssetPrice(dai.address, "1000000000000000"); //weth = 1000 dai

    const nftValue = await convertToCurrencyDecimals(weth.address, "20");
    const borrowableValue = await convertToCurrencyDecimals(weth.address, "6");

    const izumiOracle = await getIZUMIOracleWrapper();
    const tokenPrice = await izumiOracle.getTokenPrice(0);
    almostEqual(tokenPrice, nftValue);

    const userAccountData = await pool.getUserAccountData(user1.address);
    expect(userAccountData.ltv).to.eq(3000);
    almostEqual(userAccountData.availableBorrowsBase, borrowableValue);

    await waitForTx(
      await pool
        .connect(user1.signer)
        .borrow(
          weth.address,
          userAccountData.availableBorrowsBase.sub(1),
          "0",
          user1.address
        )
    );
  });

  it("decreaseLiquidity failed if hf < 1 [ @skip-on-coverage ]", async () => {
    const {
      users: [user1],
      pool,
    } = testEnv;
    // get current liquidity
    const beforeLiquidity = (await nftPositionManager.liquidities(0)).liquidity;

    await expect(
      pool
        .connect(user1.signer)
        .decreaseLiquidity(
          nftPositionManager.address,
          0,
          beforeLiquidity.mul(3).div(4),
          0,
          0,
          false,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("transfer failed if hf < 1 [ @skip-on-coverage ]", async () => {
    const {
      users: [user1, user2],
    } = testEnv;

    await expect(
      nTokenIzumi
        .connect(user1.signer)
        .transferFrom(user1.address, user2.address, 0, {
          gasLimit: 12_450_000,
        })
    ).to.be.revertedWith(
      ProtocolErrors.HEALTH_FACTOR_LOWER_THAN_LIQUIDATION_THRESHOLD
    );
  });

  it("IZUMI LP asset can be auctioned [ @skip-on-coverage ]", async () => {
    const {
      users: [borrower, liquidator],
      pool,
      oracle,
      dai,
      weth,
    } = testEnv;
    await oracle.setAssetPrice(dai.address, "100000000000000"); //weth = 10000 dai

    const ethAmount = await convertToCurrencyDecimals(weth.address, "20");
    await fund({token: weth, user: liquidator, amount: ethAmount});
    await approveTo({
      target: pool.address,
      token: weth,
      user: liquidator,
    });

    const user1Balance = await nTokenIzumi.balanceOf(borrower.address);
    const liquidatorBalance = await nTokenIzumi.balanceOf(liquidator.address);
    expect(user1Balance).to.eq(1);
    expect(liquidatorBalance).to.eq(0);

    // try to start auction
    await waitForTx(
      await pool
        .connect(liquidator.signer)
        .startAuction(borrower.address, nftPositionManager.address, 0)
    );

    expect(await nTokenIzumi.isAuctioned(0)).to.be.true;
  });

  it("liquidation failed if underlying erc20 was not active [ @skip-on-coverage ]", async () => {
    const {
      users: [user1, liquidator],
      configurator,
      weth,
      dai,
      pool,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(dai.address, false));

    const liquidationValue = await convertToCurrencyDecimals(
      weth.address,
      "20"
    );

    await expect(
      pool
        .connect(liquidator.signer)
        .liquidateERC721(
          nftPositionManager.address,
          user1.address,
          0,
          liquidationValue,
          true,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(ProtocolErrors.RESERVE_INACTIVE);
  });

  it("liquidation success if underlying erc20 was active [ @skip-on-coverage ]", async () => {
    const {
      users: [user1, liquidator],
      weth,
      dai,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.setReserveActive(dai.address, true));

    const preLiquidationSnapshot = await snapshot.take();

    const liquidationValue = await convertToCurrencyDecimals(
      weth.address,
      "20"
    );

    await waitForTx(
      await pool
        .connect(liquidator.signer)
        .liquidateERC721(
          nftPositionManager.address,
          user1.address,
          0,
          liquidationValue,
          true,
          {
            gasLimit: 12_450_000,
          }
        )
    );

    await snapshot.revert(preLiquidationSnapshot);
  });

  it("liquidation failed if underlying erc20 was paused [ @skip-on-coverage ]", async () => {
    const {
      users: [user1, liquidator],
      configurator,
      weth,
      pool,
    } = testEnv;

    await waitForTx(await configurator.pauseReserve(weth.address));

    const liquidationValue = await convertToCurrencyDecimals(
      weth.address,
      "20"
    );

    await expect(
      pool
        .connect(liquidator.signer)
        .liquidateERC721(
          nftPositionManager.address,
          user1.address,
          0,
          liquidationValue,
          true,
          {
            gasLimit: 12_450_000,
          }
        )
    ).to.be.revertedWith(ProtocolErrors.RESERVE_PAUSED);
  });

  it("liquidation success if underlying erc20 was not paused [ @skip-on-coverage ]", async () => {
    const {
      users: [user1, liquidator],
      weth,
      pool,
      configurator,
    } = testEnv;

    await waitForTx(await configurator.unpauseReserve(weth.address));

    const preLiquidationSnapshot = await snapshot.take();

    const liquidationValue = await convertToCurrencyDecimals(
      weth.address,
      "20"
    );

    await waitForTx(
      await pool
        .connect(liquidator.signer)
        .liquidateERC721(
          nftPositionManager.address,
          user1.address,
          0,
          liquidationValue,
          true,
          {
            gasLimit: 12_450_000,
          }
        )
    );

    await snapshot.revert(preLiquidationSnapshot);
  });
});