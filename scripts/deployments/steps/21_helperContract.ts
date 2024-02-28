import {deployHelperContract} from "../../../helpers/contracts-deployments";
import {getParaSpaceConfig} from "../../../helpers/misc-utils";
import {ERC20TokenContractId} from "../../../helpers/types";
import {getAllTokens} from "../../../helpers/contracts-getters";
export const step_21 = async (verify = false) => {
  const paraSpaceConfig = getParaSpaceConfig();
  try {
    if (!paraSpaceConfig.ReservesConfig[ERC20TokenContractId.APE]) {
      console.log("Not Ape Config, skip deploy HelperContract");
      return;
    }

    const allTokens = await getAllTokens();
    //for test env, we use same address for cApeV1 and cApeV2
    await deployHelperContract(allTokens.cAPE.address, verify);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};
