import {utils} from "ethers";
import {task} from "hardhat/config";
import {DRY_RUN} from "../../helpers/hardhat-constants";
import {waitForTx} from "../../helpers/misc-utils";

task("set-ltv", "Set LTV")
  .addPositionalParam("assets", "assets")
  .addPositionalParam("ltv", "ltv")
  .setAction(async ({assets, ltv}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {
      getPoolConfiguratorProxy,
      getPoolAddressesProvider,
      getUiPoolDataProvider,
    } = await import("../../helpers/contracts-getters");
    const ui = await getUiPoolDataProvider();
    const provider = await getPoolAddressesProvider();
    const configurator = await getPoolConfiguratorProxy();
    const [reservesData] = await ui.getReservesData(provider.address);

    for (const asset of assets.split(",")) {
      const reserveData = reservesData.find(
        (x) => x.underlyingAsset === utils.getAddress(asset)
      );
      if (!reserveData) {
        return;
      }

      const encodedData = configurator.interface.encodeFunctionData(
        "configureReserveAsCollateral",
        [
          reserveData.underlyingAsset,
          ltv,
          reserveData.reserveLiquidationThreshold,
          reserveData.reserveLiquidationBonus,
        ]
      );
      if (DRY_RUN) {
        await dryRunEncodedData(configurator.address, encodedData);
      } else {
        await waitForTx(
          await configurator.configureReserveAsCollateral(
            reserveData.underlyingAsset,
            ltv,
            reserveData.reserveLiquidationThreshold,
            reserveData.reserveLiquidationBonus
          )
        );
      }
    }
  });

task("set-liquidation-threshold", "Set liquidation threshold")
  .addPositionalParam("assets", "assets")
  .addPositionalParam("liquidationThreshold", "liquidation threshold")
  .setAction(async ({assets, liquidationThreshold}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {
      getPoolConfiguratorProxy,
      getPoolAddressesProvider,
      getUiPoolDataProvider,
    } = await import("../../helpers/contracts-getters");
    const ui = await getUiPoolDataProvider();
    const provider = await getPoolAddressesProvider();
    const configurator = await getPoolConfiguratorProxy();
    const [reservesData] = await ui.getReservesData(provider.address);

    for (const asset of assets.split(",")) {
      const reserveData = reservesData.find(
        (x) => x.underlyingAsset === utils.getAddress(asset)
      );
      if (!reserveData) {
        return;
      }

      const encodedData = configurator.interface.encodeFunctionData(
        "configureReserveAsCollateral",
        [
          reserveData.underlyingAsset,
          reserveData.baseLTVasCollateral,
          liquidationThreshold,
          reserveData.reserveLiquidationBonus,
        ]
      );
      if (DRY_RUN) {
        await dryRunEncodedData(configurator.address, encodedData);
      } else {
        await waitForTx(
          await configurator.configureReserveAsCollateral(
            reserveData.underlyingAsset,
            reserveData.baseLTVasCollateral,
            liquidationThreshold,
            reserveData.reserveLiquidationBonus
          )
        );
      }
    }
  });

task("set-reserve-factor", "Set reserve factor")
  .addPositionalParam("assets", "assets")
  .addPositionalParam("reserveFactor", "reserve factor")
  .setAction(async ({assets, reserveFactor}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {
      getPoolConfiguratorProxy,
      getPoolAddressesProvider,
      getUiPoolDataProvider,
    } = await import("../../helpers/contracts-getters");
    const ui = await getUiPoolDataProvider();
    const provider = await getPoolAddressesProvider();
    const configurator = await getPoolConfiguratorProxy();
    const [reservesData] = await ui.getReservesData(provider.address);

    for (const asset of assets.split(",")) {
      const reserveData = reservesData.find(
        (x) => x.underlyingAsset === utils.getAddress(asset)
      );
      if (!reserveData) {
        return;
      }

      const encodedData = configurator.interface.encodeFunctionData(
        "setReserveFactor",
        [reserveData.underlyingAsset, reserveFactor]
      );
      if (DRY_RUN) {
        await dryRunEncodedData(configurator.address, encodedData);
      } else {
        await waitForTx(
          await configurator.setReserveFactor(
            reserveData.underlyingAsset,
            reserveFactor
          )
        );
      }
    }
  });

task("reset-all-asset-reserve-factor", "Reset all asset reserve factor")
  .addPositionalParam("reserveFactor", "reserve factor")
  .setAction(async ({reserveFactor}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {getPoolProxy, getPoolConfiguratorProxy} = await import(
      "../../helpers/contracts-getters"
    );
    const configurator = await getPoolConfiguratorProxy();
    const poolProxy = await getPoolProxy();
    const assets = await poolProxy.getReservesList();

    for (const asset of assets) {
      const encodedData = configurator.interface.encodeFunctionData(
        "setReserveFactor",
        [asset, reserveFactor]
      );
      if (DRY_RUN) {
        await dryRunEncodedData(configurator.address, encodedData);
      } else {
        await waitForTx(
          await configurator.setReserveFactor(asset, reserveFactor)
        );
      }
    }
  });

task("set-interest-rate-strategy", "Set interest rate strategy")
  .addPositionalParam("assets", "assets")
  .addPositionalParam(
    "interestRateStrategyAddress",
    "interest rate strategy address"
  )
  .setAction(async ({assets, interestRateStrategyAddress}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {
      getPoolConfiguratorProxy,
      getPoolAddressesProvider,
      getUiPoolDataProvider,
    } = await import("../../helpers/contracts-getters");
    const ui = await getUiPoolDataProvider();
    const provider = await getPoolAddressesProvider();
    const configurator = await getPoolConfiguratorProxy();
    const [reservesData] = await ui.getReservesData(provider.address);

    for (const asset of assets.split(",")) {
      const reserveData = reservesData.find(
        (x) => x.underlyingAsset === utils.getAddress(asset)
      );
      if (!reserveData) {
        continue;
      }
      const encodedData = configurator.interface.encodeFunctionData(
        "setReserveInterestRateStrategyAddress",
        [reserveData.underlyingAsset, interestRateStrategyAddress]
      );
      if (DRY_RUN) {
        await dryRunEncodedData(configurator.address, encodedData);
      } else {
        await waitForTx(
          await configurator.setReserveInterestRateStrategyAddress(
            reserveData.underlyingAsset,
            interestRateStrategyAddress
          )
        );
      }
    }
  });

task("set-auction-strategy", "Set auction strategy")
  .addPositionalParam("asset", "asset")
  .addPositionalParam("auctionStrategyAddress", "auction strategy address")
  .setAction(async ({asset, auctionStrategyAddress}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {
      getPoolConfiguratorProxy,
      getPoolAddressesProvider,
      getUiPoolDataProvider,
    } = await import("../../helpers/contracts-getters");
    const ui = await getUiPoolDataProvider();
    const provider = await getPoolAddressesProvider();
    const configurator = await getPoolConfiguratorProxy();
    const [reservesData] = await ui.getReservesData(provider.address);

    const reserveData = reservesData.find(
      (x) => x.underlyingAsset === utils.getAddress(asset)
    );
    if (!reserveData) {
      return;
    }

    const encodedData = configurator.interface.encodeFunctionData(
      "setReserveAuctionStrategyAddress",
      [reserveData.underlyingAsset, auctionStrategyAddress]
    );
    if (DRY_RUN) {
      await dryRunEncodedData(configurator.address, encodedData);
    } else {
      await waitForTx(
        await configurator.setReserveAuctionStrategyAddress(
          reserveData.underlyingAsset,
          auctionStrategyAddress
        )
      );
    }
  });

task("set-timelock-strategy", "Set timelock strategy")
  .addPositionalParam("assets", "assets")
  .addPositionalParam("timeLockStrategyAddress", "time lock strategy address")
  .setAction(async ({assets, timeLockStrategyAddress}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {
      getPoolConfiguratorProxy,
      getPoolAddressesProvider,
      getUiPoolDataProvider,
    } = await import("../../helpers/contracts-getters");
    const ui = await getUiPoolDataProvider();
    const provider = await getPoolAddressesProvider();
    const configurator = await getPoolConfiguratorProxy();
    const [reservesData] = await ui.getReservesData(provider.address);

    for (const asset of assets.split(",")) {
      const reserveData = reservesData.find(
        (x) => x.underlyingAsset === utils.getAddress(asset)
      );
      if (!reserveData) {
        continue;
      }
      const encodedData = configurator.interface.encodeFunctionData(
        "setReserveTimeLockStrategyAddress",
        [reserveData.underlyingAsset, timeLockStrategyAddress]
      );
      if (DRY_RUN) {
        await dryRunEncodedData(configurator.address, encodedData);
      } else {
        await waitForTx(
          await configurator.setReserveTimeLockStrategyAddress(
            reserveData.underlyingAsset,
            timeLockStrategyAddress
          )
        );
      }
    }
  });

task("set-supply-cap", "Set supply cap")
  .addPositionalParam("asset", "asset")
  .addPositionalParam("supplyCap", "new supply cap")
  .setAction(async ({asset, supplyCap}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {
      getPoolConfiguratorProxy,
      getPoolAddressesProvider,
      getUiPoolDataProvider,
    } = await import("../../helpers/contracts-getters");
    const ui = await getUiPoolDataProvider();
    const provider = await getPoolAddressesProvider();
    const configurator = await getPoolConfiguratorProxy();
    const [reservesData] = await ui.getReservesData(provider.address);

    const reserveData = reservesData.find(
      (x) => x.underlyingAsset === utils.getAddress(asset)
    );
    if (!reserveData) {
      return;
    }

    const encodedData = configurator.interface.encodeFunctionData(
      "setSupplyCap",
      [reserveData.underlyingAsset, supplyCap]
    );
    if (DRY_RUN) {
      await dryRunEncodedData(configurator.address, encodedData);
    } else {
      await waitForTx(
        await configurator.setSupplyCap(reserveData.underlyingAsset, supplyCap)
      );
    }
  });

task("set-borrow-cap", "Set borrow cap")
  .addPositionalParam("asset", "asset")
  .addPositionalParam("borrowCap", "new borrow cap")
  .setAction(async ({asset, borrowCap}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {
      getPoolConfiguratorProxy,
      getPoolAddressesProvider,
      getUiPoolDataProvider,
    } = await import("../../helpers/contracts-getters");
    const ui = await getUiPoolDataProvider();
    const provider = await getPoolAddressesProvider();
    const configurator = await getPoolConfiguratorProxy();
    const [reservesData] = await ui.getReservesData(provider.address);

    const reserveData = reservesData.find(
      (x) => x.underlyingAsset === utils.getAddress(asset)
    );
    if (!reserveData) {
      return;
    }

    const encodedData = configurator.interface.encodeFunctionData(
      "setBorrowCap",
      [reserveData.underlyingAsset, borrowCap]
    );
    if (DRY_RUN) {
      await dryRunEncodedData(configurator.address, encodedData);
    } else {
      await waitForTx(
        await configurator.setBorrowCap(reserveData.underlyingAsset, borrowCap)
      );
    }
  });

task("set-pool-pause", "Set pool pause")
  .addPositionalParam("paused", "paused", "true")
  .setAction(async ({paused}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {getPoolConfiguratorProxy} = await import(
      "../../helpers/contracts-getters"
    );
    const configurator = await getPoolConfiguratorProxy();
    paused = paused == "false" ? false : true;

    const encodedData = paused
      ? configurator.interface.encodeFunctionData("pausePool")
      : configurator.interface.encodeFunctionData("unpausePool");
    if (DRY_RUN) {
      await dryRunEncodedData(configurator.address, encodedData);
    } else if (paused) {
      await waitForTx(await configurator.pausePool());
    } else {
      await waitForTx(await configurator.unpausePool());
    }
  });

task("set-reserve-pause", "Set reserve pause")
  .addPositionalParam("asset", "asset")
  .addPositionalParam("paused", "paused", "true")
  .setAction(async ({asset, paused}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {getPoolConfiguratorProxy} = await import(
      "../../helpers/contracts-getters"
    );
    const configurator = await getPoolConfiguratorProxy();
    paused = paused == "false" ? false : true;

    const encodedData = paused
      ? configurator.interface.encodeFunctionData("pauseReserve", [asset])
      : configurator.interface.encodeFunctionData("unpauseReserve", [asset]);
    if (DRY_RUN) {
      await dryRunEncodedData(configurator.address, encodedData);
    } else if (paused) {
      await waitForTx(await configurator.pauseReserve(asset));
    } else {
      await waitForTx(await configurator.unpauseReserve(asset));
    }
  });

task("set-cAPE-pause", "Set cAPE pause")
  .addPositionalParam("paused", "paused", "true")
  .setAction(async ({paused}, DRE) => {
    await DRE.run("set-DRE");
    const {dryRunEncodedData} = await import("../../helpers/contracts-helpers");
    const {getAutoCompoundApe} = await import(
      "../../helpers/contracts-getters"
    );
    const cAPE = await getAutoCompoundApe();
    paused = paused == "false" ? false : true;

    const encodedData = paused
      ? cAPE.interface.encodeFunctionData("pause")
      : cAPE.interface.encodeFunctionData("unpause");
    if (DRY_RUN) {
      await dryRunEncodedData(cAPE.address, encodedData);
    } else if (paused) {
      await waitForTx(await cAPE.pause());
    } else {
      await waitForTx(await cAPE.unpause());
    }
  });
