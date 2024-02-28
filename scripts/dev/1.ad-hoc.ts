import rawBRE from "hardhat";
import {getAccount, getNToken} from "../../helpers/contracts-getters";

const adHoc = async () => {
  console.time("ad-hoc");
  const nPPG = await getNToken("0xae18f036459823223f5BAad8137Dd50663f96644");
  const owners: Array<string> = [];
  const total = await nPPG.totalSupply();
  for (let i = 0; i < total.toNumber(); i++) {
    const tokenId = await nPPG.tokenByIndex(i);
    const owner = await nPPG.ownerOf(tokenId);
    if (!owners.includes(owner)) {
      owners.push(owner);
    }
  }
  console.log("owners:", JSON.stringify(owners));
  for (let i = 0; i < owners.length; i++) {
    const balance = await nPPG.balanceOf(owners[i]);
    console.log("owner:", owners[i], " balance:", balance.toNumber());
    const account = await getAccount(owners[i]);
    const eoa = await account.owner();
    console.log("eoa:", eoa);
  }

  console.timeEnd("ad-hoc");
};

async function main() {
  await rawBRE.run("set-DRE");
  await adHoc();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
