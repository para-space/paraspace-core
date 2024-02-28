import {deployP2PPairStaking} from "../../../helpers/contracts-deployments";
import {
  getAllTokens,
  getNTokenBAKC,
  getNTokenBAYC,
  getNTokenMAYC,
  getPoolProxy,
} from "../../../helpers/contracts-getters";
import {getParaSpaceConfig, waitForTx} from "../../../helpers/misc-utils";
import {
  ERC20TokenContractId,
  ERC721TokenContractId,
} from "../../../helpers/types";

export const step_20 = async (verify = false) => {
  const paraSpaceConfig = getParaSpaceConfig();
  try {
    if (!paraSpaceConfig.ReservesConfig[ERC20TokenContractId.APE]) {
      console.log("Not Ape Config, skip deploy P2PPairStaking");
      return;
    }
    // deploy P2PPairStaking
    const p2pPairStaking = await deployP2PPairStaking(verify);
    const allTokens = await getAllTokens();
    const pool = await getPoolProxy();

    const bayc = allTokens[ERC721TokenContractId.BAYC];
    const mayc = allTokens[ERC721TokenContractId.MAYC];
    const bakc = allTokens[ERC721TokenContractId.BAKC];

    if (bayc) {
      const nBAYC = await getNTokenBAYC(
        (
          await pool.getReserveData(bayc.address)
        ).xTokenAddress
      );
      await waitForTx(
        await nBAYC.setApprovalForAllTo(
          bayc.address,
          p2pPairStaking.address,
          true
        )
      );
    }

    if (mayc) {
      const nMAYC = await getNTokenMAYC(
        (
          await pool.getReserveData(mayc.address)
        ).xTokenAddress
      );
      await waitForTx(
        await nMAYC.setApprovalForAllTo(
          mayc.address,
          p2pPairStaking.address,
          true
        )
      );
    }

    if (bakc) {
      const nBAKC = await getNTokenBAKC(
        (
          await pool.getReserveData(bakc.address)
        ).xTokenAddress
      );
      await waitForTx(
        await nBAKC.setApprovalForAllTo(
          bakc.address,
          p2pPairStaking.address,
          true
        )
      );
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
