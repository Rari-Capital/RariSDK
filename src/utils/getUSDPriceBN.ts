import axios from "axios";
import { parseUnits } from "ethers/lib/utils";

export const getEthUsdPriceBN = async function () {
  // Returns a USD price. Which means its a floating point of at least 2 decimal numbers.

  const usdPrice: number = (
    await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?vs_currencies=usd&ids=ethereum"
    )
  ).data.ethereum.usd;

  // Now we turn it into a big number
  const usdPriceBN = parseUnits(usdPrice.toString(), 18);

  // To parse this back into USD usdPriceBN.div(constants.WeiPerEther).toString()
  return usdPriceBN;
};
