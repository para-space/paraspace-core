import {
  getACLManager,
  getAutoCompoundApe,
  getAutoYieldApe,
  getConduit,
  getConduitController,
  getHelperContract,
  getInitializableAdminUpgradeabilityProxy,
  getNFTFloorOracle,
  getP2PPairStaking,
  getPausableZoneController,
  getPoolAddressesProvider,
  getPoolAddressesProviderRegistry,
  getReservesSetupHelper,
  getTimeLockProxy,
  getWETHGatewayProxy,
  getWPunkGatewayProxy,
} from "../../../helpers/contracts-getters";
import {
  getContractAddressInDb,
  getParaSpaceAdmins,
  dryRunEncodedData,
} from "../../../helpers/contracts-helpers";
import {DRY_RUN, GLOBAL_OVERRIDES} from "../../../helpers/hardhat-constants";
import {getParaSpaceConfig, waitForTx} from "../../../helpers/misc-utils";
import {eContractid} from "../../../helpers/types";

export const step_23 = async (
  // eslint-disable-next-line
  verify = false,
  admins?: {
    paraSpaceAdminAddress: string;
    emergencyAdminAddresses: string[];
    gatewayAdminAddress: string;
    riskAdminAddress: string;
  }
) => {
  const {
    paraSpaceAdminAddress,
    emergencyAdminAddresses,
    gatewayAdminAddress,
    riskAdminAddress,
  } = admins || (await getParaSpaceAdmins());

  const paraSpaceConfig = getParaSpaceConfig();

  try {
    const addressesProviderRegistry = await getPoolAddressesProviderRegistry();
    const addressesProvider = await getPoolAddressesProvider();
    const oldParaSpaceAdminAddress = await addressesProvider.owner();
    const reservesSetupHelper = await getReservesSetupHelper();
    let conduitController;
    let conduit;
    let zoneController;
    if (paraSpaceConfig.EnableSeaport) {
      conduitController = await getConduitController();
      conduit = await getConduit();
      zoneController = await getPausableZoneController();
    }
    const aclManager = await getACLManager();

    console.log("new paraSpaceAdmin:", paraSpaceAdminAddress);
    console.log("old paraSpaceAdmin:", oldParaSpaceAdminAddress);
    console.log("new gatewayAdmin:", gatewayAdminAddress);
    console.log("new riskAdmin:", riskAdminAddress);
    console.log();
    if (oldParaSpaceAdminAddress === paraSpaceAdminAddress) {
      return;
    }

    ////////////////////////////////////////////////////////////////////////////////
    // PoolAddressesProviderRegistry & PoolAddressesProvider
    ////////////////////////////////////////////////////////////////////////////////
    console.time("transferring addressesProvider ownership...");
    if (DRY_RUN) {
      const encodedData1 =
        addressesProviderRegistry.interface.encodeFunctionData(
          "transferOwnership",
          [paraSpaceAdminAddress]
        );
      await dryRunEncodedData(addressesProviderRegistry.address, encodedData1);
      const encodedData2 = addressesProvider.interface.encodeFunctionData(
        "setACLAdmin",
        [paraSpaceAdminAddress]
      );
      await dryRunEncodedData(addressesProvider.address, encodedData2);
      const encodedData3 = addressesProvider.interface.encodeFunctionData(
        "transferOwnership",
        [paraSpaceAdminAddress]
      );
      await dryRunEncodedData(addressesProvider.address, encodedData3);
    } else {
      await waitForTx(
        await addressesProviderRegistry.transferOwnership(
          paraSpaceAdminAddress,
          GLOBAL_OVERRIDES
        )
      );
      await waitForTx(
        await addressesProvider.setACLAdmin(
          paraSpaceAdminAddress,
          GLOBAL_OVERRIDES
        )
      );
      await waitForTx(
        await addressesProvider.transferOwnership(
          paraSpaceAdminAddress,
          GLOBAL_OVERRIDES
        )
      );
    }
    console.timeEnd("transferring addressesProvider ownership...");
    console.log();

    ////////////////////////////////////////////////////////////////////////////////
    // ACLManager
    ////////////////////////////////////////////////////////////////////////////////
    console.time("transferring aclManager ownership...");
    if (DRY_RUN) {
      const encodedData1 = aclManager.interface.encodeFunctionData(
        "addPoolAdmin",
        [paraSpaceAdminAddress]
      );
      await dryRunEncodedData(aclManager.address, encodedData1);
      const encodedData2 = aclManager.interface.encodeFunctionData(
        "removePoolAdmin",
        [oldParaSpaceAdminAddress]
      );
      await dryRunEncodedData(aclManager.address, encodedData2);
      if (!(await aclManager.isAssetListingAdmin(paraSpaceAdminAddress))) {
        const encodedData3 = aclManager.interface.encodeFunctionData(
          "addAssetListingAdmin",
          [paraSpaceAdminAddress]
        );
        await dryRunEncodedData(aclManager.address, encodedData3);
      }
      if (await aclManager.isAssetListingAdmin(oldParaSpaceAdminAddress)) {
        const encodedData4 = aclManager.interface.encodeFunctionData(
          "removeAssetListingAdmin",
          [oldParaSpaceAdminAddress]
        );
        await dryRunEncodedData(aclManager.address, encodedData4);
      }
      if (!(await aclManager.isRiskAdmin(riskAdminAddress))) {
        const encodedData5 = aclManager.interface.encodeFunctionData(
          "addRiskAdmin",
          [riskAdminAddress]
        );
        await dryRunEncodedData(aclManager.address, encodedData5);
      }
      if (await aclManager.isRiskAdmin(oldParaSpaceAdminAddress)) {
        const encodedData6 = aclManager.interface.encodeFunctionData(
          "removeRiskAdmin",
          [oldParaSpaceAdminAddress]
        );
        await dryRunEncodedData(aclManager.address, encodedData6);
      }
      const encodedData7 = aclManager.interface.encodeFunctionData(
        "grantRole",
        [await aclManager.DEFAULT_ADMIN_ROLE(), paraSpaceAdminAddress]
      );
      await dryRunEncodedData(aclManager.address, encodedData7);
      const encodedData8 = aclManager.interface.encodeFunctionData(
        "revokeRole",
        [await aclManager.DEFAULT_ADMIN_ROLE(), oldParaSpaceAdminAddress]
      );
      await dryRunEncodedData(aclManager.address, encodedData8);
    } else {
      await waitForTx(
        await aclManager.addPoolAdmin(paraSpaceAdminAddress, GLOBAL_OVERRIDES)
      );
      await waitForTx(
        await aclManager.removePoolAdmin(
          oldParaSpaceAdminAddress,
          GLOBAL_OVERRIDES
        )
      );
      if (!(await aclManager.isAssetListingAdmin(paraSpaceAdminAddress))) {
        await waitForTx(
          await aclManager.addAssetListingAdmin(
            paraSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
      }
      if (await aclManager.isAssetListingAdmin(oldParaSpaceAdminAddress)) {
        await waitForTx(
          await aclManager.removeAssetListingAdmin(
            oldParaSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
      }
      if (!(await aclManager.isRiskAdmin(riskAdminAddress))) {
        await waitForTx(
          await aclManager.addRiskAdmin(riskAdminAddress, GLOBAL_OVERRIDES)
        );
      }
      if (await aclManager.isRiskAdmin(oldParaSpaceAdminAddress)) {
        await waitForTx(
          await aclManager.removeRiskAdmin(
            oldParaSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
      }
      await waitForTx(
        await aclManager.grantRole(
          await aclManager.DEFAULT_ADMIN_ROLE(),
          paraSpaceAdminAddress,
          GLOBAL_OVERRIDES
        )
      );
      await waitForTx(
        await aclManager.revokeRole(
          await aclManager.DEFAULT_ADMIN_ROLE(),
          oldParaSpaceAdminAddress,
          GLOBAL_OVERRIDES
        )
      );
    }
    console.timeEnd("transferring aclManager ownership...");
    console.log();

    ////////////////////////////////////////////////////////////////////////////////
    // ReservesSetupHelper
    ////////////////////////////////////////////////////////////////////////////////
    console.time("transferring reservesSetupHelper ownership...");
    if (DRY_RUN) {
      const encodedData = reservesSetupHelper.interface.encodeFunctionData(
        "transferOwnership",
        [paraSpaceAdminAddress]
      );
      await dryRunEncodedData(reservesSetupHelper.address, encodedData);
    } else {
      await waitForTx(
        await reservesSetupHelper.transferOwnership(
          paraSpaceAdminAddress,
          GLOBAL_OVERRIDES
        )
      );
    }
    console.timeEnd("transferring reservesSetupHelper ownership...");
    console.log();

    ////////////////////////////////////////////////////////////////////////////////
    // Conduit & Zone Controller
    ////////////////////////////////////////////////////////////////////////////////
    if (paraSpaceConfig.EnableSeaport) {
      console.time("transferring conduit & zone Controller ownership...");
      if (DRY_RUN) {
        const encodedData1 = conduitController.interface.encodeFunctionData(
          "transferOwnership",
          [conduit.address, paraSpaceAdminAddress]
        );
        await dryRunEncodedData(conduitController.address, encodedData1);
        const encodedData2 = zoneController.interface.encodeFunctionData(
          "transferOwnership",
          [paraSpaceAdminAddress]
        );
        await dryRunEncodedData(conduitController.address, encodedData2);
      } else {
        await waitForTx(
          await conduitController.transferOwnership(
            conduit.address,
            paraSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
        await waitForTx(
          await zoneController.transferOwnership(
            paraSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
      }
      console.timeEnd("transferring conduit & zone Controller ownership...");
      console.log();
    }

    ////////////////////////////////////////////////////////////////////////////////
    // WETHGateway
    ////////////////////////////////////////////////////////////////////////////////
    if (await getContractAddressInDb(eContractid.WETHGatewayProxy)) {
      console.time("transferring wethGateway ownership...");
      const wethGatewayProxy = await getWETHGatewayProxy();
      if (DRY_RUN) {
        const encodedData = wethGatewayProxy.interface.encodeFunctionData(
          "transferOwnership",
          [gatewayAdminAddress]
        );
        await dryRunEncodedData(wethGatewayProxy.address, encodedData);
      } else {
        await waitForTx(
          await wethGatewayProxy.transferOwnership(
            gatewayAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
      }
      console.timeEnd("transferring wethGateway ownership...");
      console.log();
    }
    ////////////////////////////////////////////////////////////////////////////////
    // WPunksGateway
    ////////////////////////////////////////////////////////////////////////////////
    if (await getContractAddressInDb(eContractid.WPunkGatewayProxy)) {
      console.time("transferring wpunkGateway ownership...");
      const punkGatewayProxy = await getWPunkGatewayProxy();
      if (DRY_RUN) {
        const encodedData = punkGatewayProxy.interface.encodeFunctionData(
          "transferOwnership",
          [gatewayAdminAddress]
        );
        await dryRunEncodedData(punkGatewayProxy.address, encodedData);
      } else {
        await waitForTx(
          await punkGatewayProxy.transferOwnership(
            gatewayAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
      }
      console.timeEnd("transferring wpunkGateway ownership...");
      console.log();
    }

    ////////////////////////////////////////////////////////////////////////////////
    // yAPE
    ////////////////////////////////////////////////////////////////////////////////
    if (await getContractAddressInDb(eContractid.yAPE)) {
      console.time("transferring yAPE ownership...");
      const yApe = await getAutoYieldApe();
      const yApeProxy = await getInitializableAdminUpgradeabilityProxy(
        yApe.address
      );
      if (DRY_RUN) {
        const encodedData1 = yApeProxy.interface.encodeFunctionData(
          "changeAdmin",
          [emergencyAdminAddresses[0]]
        );
        await dryRunEncodedData(yApeProxy.address, encodedData1);
      } else {
        await waitForTx(
          await yApeProxy.changeAdmin(
            emergencyAdminAddresses[0],
            GLOBAL_OVERRIDES
          )
        );
      }
      console.timeEnd("transferring yAPE ownership...");
      console.log();
    }

    ////////////////////////////////////////////////////////////////////////////////
    // cAPE
    ////////////////////////////////////////////////////////////////////////////////
    if (await getContractAddressInDb(eContractid.cAPE)) {
      console.time("transferring cAPE ownership...");
      const cApe = await getAutoCompoundApe();
      const cApeProxy = await getInitializableAdminUpgradeabilityProxy(
        cApe.address
      );
      if (DRY_RUN) {
        const encodedData1 = cApeProxy.interface.encodeFunctionData(
          "changeAdmin",
          [emergencyAdminAddresses[0]]
        );
        await dryRunEncodedData(cApeProxy.address, encodedData1);
      } else {
        await waitForTx(
          await cApeProxy.changeAdmin(
            emergencyAdminAddresses[0],
            GLOBAL_OVERRIDES
          )
        );
      }
      console.timeEnd("transferring cAPE ownership...");
      console.log();
    }

    ////////////////////////////////////////////////////////////////////////////////
    // P2PPairStaking
    ////////////////////////////////////////////////////////////////////////////////
    if (await getContractAddressInDb(eContractid.P2PPairStaking)) {
      console.time("transferring P2PPairStaking ownership...");
      const p2pPairStaking = await getP2PPairStaking();
      const p2pPairStakingProxy =
        await getInitializableAdminUpgradeabilityProxy(p2pPairStaking.address);
      if (DRY_RUN) {
        const encodedData1 = p2pPairStakingProxy.interface.encodeFunctionData(
          "changeAdmin",
          [paraSpaceAdminAddress]
        );
        await dryRunEncodedData(p2pPairStakingProxy.address, encodedData1);
        if (gatewayAdminAddress !== paraSpaceAdminAddress) {
          const encodedData2 = p2pPairStaking.interface.encodeFunctionData(
            "transferOwnership",
            [gatewayAdminAddress]
          );
          await dryRunEncodedData(p2pPairStaking.address, encodedData2);
        }
      } else {
        await waitForTx(
          await p2pPairStakingProxy.changeAdmin(
            paraSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
        if (gatewayAdminAddress !== paraSpaceAdminAddress) {
          await waitForTx(
            await p2pPairStaking.transferOwnership(
              gatewayAdminAddress,
              GLOBAL_OVERRIDES
            )
          );
        }
      }
      console.timeEnd("transferring P2PPairStaking ownership...");
      console.log();
    }

    ////////////////////////////////////////////////////////////////////////////////
    // HelperContract
    ////////////////////////////////////////////////////////////////////////////////
    if (await getContractAddressInDb(eContractid.HelperContract)) {
      console.time("transferring HelperContract ownership...");
      const helperContract = await getHelperContract();
      const helperContractProxy =
        await getInitializableAdminUpgradeabilityProxy(helperContract.address);
      if (DRY_RUN) {
        const encodedData1 = helperContractProxy.interface.encodeFunctionData(
          "changeAdmin",
          [paraSpaceAdminAddress]
        );
        await dryRunEncodedData(helperContractProxy.address, encodedData1);
        if (gatewayAdminAddress !== paraSpaceAdminAddress) {
          const encodedData2 = helperContract.interface.encodeFunctionData(
            "transferOwnership",
            [gatewayAdminAddress]
          );
          await dryRunEncodedData(helperContract.address, encodedData2);
        }
      } else {
        await waitForTx(
          await helperContractProxy.changeAdmin(
            paraSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
        if (gatewayAdminAddress !== paraSpaceAdminAddress) {
          await waitForTx(
            await helperContract.transferOwnership(
              gatewayAdminAddress,
              GLOBAL_OVERRIDES
            )
          );
        }
      }
      console.timeEnd("transferring HelperContract ownership...");
      console.log();
    }

    ////////////////////////////////////////////////////////////////////////////////
    // TimeLock
    ////////////////////////////////////////////////////////////////////////////////
    if (await getContractAddressInDb(eContractid.TimeLockProxy)) {
      console.time("transferring TimeLockProxy ownership...");
      const timeLock = await getTimeLockProxy();
      const timeLockProxy = await getInitializableAdminUpgradeabilityProxy(
        timeLock.address
      );
      if (DRY_RUN) {
        const encodedData1 = timeLockProxy.interface.encodeFunctionData(
          "changeAdmin",
          [paraSpaceAdminAddress]
        );
        await dryRunEncodedData(timeLockProxy.address, encodedData1);
      } else {
        await waitForTx(
          await timeLockProxy.changeAdmin(
            paraSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
      }
      console.timeEnd("transferring TimeLockProxy ownership...");
      console.log();
    }

    ////////////////////////////////////////////////////////////////////////////////
    // NFTFloorOracle
    ////////////////////////////////////////////////////////////////////////////////
    if (await getContractAddressInDb(eContractid.NFTFloorOracle)) {
      console.time("transferring nftFloorOracle ownership...");
      const nftFloorOracle = await getNFTFloorOracle();
      if (DRY_RUN) {
        // const encodedData1 = nftFloorOracle.interface.encodeFunctionData(
        //   "grantRole",
        //   [await nftFloorOracle.UPDATER_ROLE(), paraSpaceAdminAddress]
        // );
        // await dryRunEncodedData(nftFloorOracle.address, encodedData1);
        // const encodedData2 = nftFloorOracle.interface.encodeFunctionData(
        //   "revokeRole",
        //   [await nftFloorOracle.UPDATER_ROLE(), oldParaSpaceAdminAddress]
        // );
        // await dryRunEncodedData(nftFloorOracle.address, encodedData2);
        const encodedData3 = nftFloorOracle.interface.encodeFunctionData(
          "grantRole",
          [await nftFloorOracle.DEFAULT_ADMIN_ROLE(), paraSpaceAdminAddress]
        );
        await dryRunEncodedData(nftFloorOracle.address, encodedData3);
        const encodedData4 = nftFloorOracle.interface.encodeFunctionData(
          "revokeRole",
          [await nftFloorOracle.DEFAULT_ADMIN_ROLE(), oldParaSpaceAdminAddress]
        );
        await dryRunEncodedData(nftFloorOracle.address, encodedData4);
      } else {
        // await waitForTx(
        //   await nftFloorOracle.grantRole(
        //     await nftFloorOracle.UPDATER_ROLE(),
        //     paraSpaceAdminAddress,
        //     GLOBAL_OVERRIDES
        //   )
        // );
        // await waitForTx(
        //   await nftFloorOracle.revokeRole(
        //     await nftFloorOracle.UPDATER_ROLE(),
        //     oldParaSpaceAdminAddress,
        //     GLOBAL_OVERRIDES
        //   )
        // );
        await waitForTx(
          await nftFloorOracle.grantRole(
            await nftFloorOracle.DEFAULT_ADMIN_ROLE(),
            paraSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
        await waitForTx(
          await nftFloorOracle.revokeRole(
            await nftFloorOracle.DEFAULT_ADMIN_ROLE(),
            oldParaSpaceAdminAddress,
            GLOBAL_OVERRIDES
          )
        );
      }
      console.timeEnd("transferring nftFloorOracle ownership...");
      console.log();
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
