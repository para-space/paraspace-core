import {task} from "hardhat/config";
import {step_06} from "../../deploy/tasks/deployments/testnet/steps/06_poolAddressesProviderRegistry";

const verify = process.env.ETHERSCAN_VERIFICATION === "true" ? true : false;

task("deploy:pool-addresses-provider-registry", "Deploy pool addresses provider registry")
  .setAction(async (_, DRE) => {
    await DRE.run("set-DRE")
    await step_06(verify)
  })
