import rawBRE from "hardhat";
import axios from "axios";

const getCollectionListings = async () => {
  // get Vessls listing from Reservior
  const contract = "0x5b1085136a811e55b2bb2ca1ea456ba82126a376";
  const url = `https://api.reservoir.tools/orders/asks/v4?source=blur.io&sortBy=price&status=active&contracts=${contract}`;
  const {
    data: {orders},
  } = await axios.get(url, {
    headers: {
      "x-api-key": process.env.RESERVIOR_kEY,
    },
  });

  console.dir(orders.slice(0, 10), {depth: null});
};

async function main() {
  await rawBRE.run("set-DRE");
  await getCollectionListings();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
