import {task} from "hardhat/config";
import {ETHERSCAN_VERIFICATION} from "../../deploy/helpers/hardhat-constants";

task("deploy:weth-gateway", "Deploy weth gateway").setAction(async (_, DRE) => {
  await DRE.run("set-DRE");
  const {step_13} = await import(
    "../../deploy/tasks/deployments/full-deployment/steps/13_wethGateway"
  );
  await step_13(ETHERSCAN_VERIFICATION);
});
