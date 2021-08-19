const cache = require('../cache') 

module.exports = class AaveSubpool {
    ethers
    cache

    constructor(ethers) {
        this.ethers = ethers;
        this.cache = new Cache({
            aaveCurrencyApys: 300,
        });
    }

    async getCurrencyApys() {
        return await this.cache.getOrUpdate("aaveCurrencyApys", async function () {
            let currencyCodes = [
                "DAI",
                "USDC",
                "USDT",
                "TUSD",
                "BUSD",
                "SUSD",
                "mUSD",
                "ETH"
            ];

            const data = ( await axios.post( "https://api.thegraph.com/subgraphs/name/aave/protocol-multy-raw",
                    {
                        query:
                            `{
                                reserves(where: {
                                    symbol_in: ` + JSON.stringify(currencyCodes) +
                                ` }) {
                                    id
                                    symbol
                                    liquidityRate
                                }
                            }`,
                               
                    }
            )).data

            var apyBNs = {};

            for (var i = 0; i < data.data.reserves.length; i++) {
                if( 
                    data.data.reserves[i].symbol === "ETH" 
                    && data.data.reserves[i].id !==  "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0x24a42fd28c976a61df5d00d0599c34c4f90748c8"
                ) continue
            
                apyBNs[
                    data.data.reserves[i].symbol == "SUSD"
                    ? "sUSD"
                    : data.data.reserves[i].symbol
                ] = ethers.BigNumber
                    .from(data.date.reserves[i].liquidityRate)
                    .div(ethers.BigNumber.from(1e19))
            }

            return apyBNs
        });
    }
}