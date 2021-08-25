const Rari = require('./index.ts')
const turboGethURL = `https://turbogeth.crows.sh`;


// Ethers
const { ethers: ss } = require('ethers')

const rari = new Rari(turboGethURL);

//const blocks = rari.provider.getBlock(10000).then(res => console.log(res))

const Testing = async () => {
    // GetEthUsdPriceBN

    // const usdprice = (await rari.price()).data.ethereum.usd
    // const price = ss.utils.parseUnits(usdprice.toString(), 2)
    // const usd = price.toNumber()
    // const returssn = await rari.getEthUsdPriceBN()
    // const parsedreturn = ss.utils.formatUnits(returssn, 'ether')
    // const parsedd = returssn.toNumber()
    // console.log(returssn, parsedreturn)
    // console.log(price, usd, usdprice)

    // Get All Tokens
    // const omg = await rari.getAllTokens()
    // console.log(omg)

    // Stable Pool
        // Contract instances
        // const StableContracts = console.log(rari.pools.stable.contracts)

        // Legacy Contract Instances
            // console.log(rari.pools.stable.legacyContracts)

        // Token Contract Instances
            // console.log(rari.pools.stable.internalTokens)

        // Balances
            // getTotalSupply
                //console.log( (await rari.pools.stable.balances.getTotalSupply()).toString() / ss.constants.WeiPerEther )

            // getTotalInterestAccrued
                // console.log( (await rari.pools.stable.balances.getTotalInterestAccrued() ).toString() / ss.constants.WeiPerEther)

            // Balance of
                // console.log( (await rari.pools.stable.balances.balanceOf('0x5853eD4f26A3fceA565b3FBC698bb19cdF6DEB85')).toString() / ss.constants.WeiPerEther)

        // Allocations
            // Get currency allocations with fees
                // const allocations = await rari.pools.stable.allocations.getRawCurrencyAllocations()
                // //@ts-ignore
                // Object.keys(allocations).map(vasl => console.log(
                //     (allocations[vasl]
                //         .div( rari.internalTokens[vasl].decimals === 18
                //             ? ss.constants.WeiPerEther
                //             : 10 ** ss.BigNumber.from(rari.internalTokens[vasl].decimals)
                //         ).toString())))

            //  Get currency allocations in USD
                // const allocationss = await rari.pools.stable.allocations.getRawCurrencyAllocationsInUsd()
                // Object.keys(allocationss).map(val => console.log(
                //     allocationss[val].toString() / ss.constants.WeiPerEther
                // ))

            // Get Pool Allocations
                // const allocations = await rari.pools.stable.allocations.getRawPoolAllocations()
                // Object.keys(allocations).map(val => console.log(
                //      allocations[val].toString() / ss.constants.WeiPerEther
                // ))
                // console.log(allocations)

            // Get Raw Allocations
                // const allocations = await rari.pools.stable.allocations.getRawAllocations()
                // Object.keys(allocations).map(val => Object.keys(allocations[val]).map(valas => console.log(allocations[val][valas].toString())))

            // Get Currency Usd Prices
                // const currencies = await rari.pools.stable.allocations.getCurrencyUsdPrices()
                // Object.keys(currencies).map(key => console.log(currencies[key].toString()))
        // APY
            // Get raw apy
                // const apy = await rari.pools.stable.apy.getCurrentRawApy()
                // console.log(((apy.mul(ss.BigNumber.from(100)) ).toString() / 1e18).toFixed(2))
            // get current apy
                // const response = await rari.pools.stable.apy.getCurrentApy()
                // console.log(response.toString())
                // const response2 = await rari.pools.dai.apy.getCurrentApy()
                // console.log(response2.toString())
            // calculateApy 
                //const response = await rari.pools.stable.apy.calculateApy
                console.log( await rari.pools.stable.rspt.getExchangeRate() )
                console.log( await rari.pools.dai.rspt.getExchangeRate() )


    // dYdX 
        //getCurrencyApys() subpools has to be converted to a property i.e this.subpools
            // const data = await rari.subpools.dYdX.getCurrencyApys()
            // console.log(data)
            // Object.keys(data).forEach(key => console.log(ss.utils.formatUnits(data[key], 77) * 1e18))

    // Compound
        // Get Currency Supplier And Compo Apys
            //console.log( await rari.subpools.Compound.getCurrencySupplierAndCompApys() ) 
        
        // Get Currency APYs
            //console.log( await rari.subpools.Compound.getCurrencyApys() )

    // mStable
        // External contracts
        // console.log( rari.subpools.mStable.externalContracts )

        // getMUsdSavingsApy
            // Print Data
                // const data = await rari.subpools.mStable.getMUsdSavingsApy()
                // console.log(data)
            // Print UsdSwapFee
                // const fee = rari.subpools.mStable.cache
                // console.log(fee)
            // Print total staked
                // const data =  await rari.subpools.mStable.getIMUsdVaultWeeklyRoi()
                // console.log( data.div(ss.constants.WeiPerEther).toString())
            // Print weekly return on investment
                // const data = await rari.subpools.mStable.getMUsdSavingsApy()
            // Print vault apy in BN
                // const data = await rari.subpools.mStable.getMUsdSavingsApy()

            // Print MUsdSavings Apy
                // const data = await rari.subpools.mStable.getMUsdSavingsApy()
                // console.log(data.toString() / 1e16)
    // Alpha
        // External Contracts
            // console.log( Object.keys(rari.subpools.Alpha.externalContracts) )

        // getIBEthApyBN
            //console.log((await rari.subpools.Alpha.getIBEthApyBN()).toString() / 1e18)
    // Fuse
        // getCurrencyAPY
            // console.log(await rari.subpools.Fuse2.getCurrencyApys())
            // console.log(await rari.subpools.Fuse3.getCurrencyApys())
            // console.log(await rari.subpools.Fuse6.getCurrencyApys())
            // console.log(await rari.subpools.Fuse7.getCurrencyApys())
            // console.log(await rari.subpools.Fuse11.getCurrencyApys())
            // console.log(await rari.subpools.Fuse13.getCurrencyApys())
            // console.log(await rari.subpools.Fuse14.getCurrencyApys())
            // console.log(await rari.subpools.Fuse15.getCurrencyApys())
            // console.log(await rari.subpools.Fuse16.getCurrencyApys())
            // console.log(await rari.subpools.Fuse18.getCurrencyApys())
    
    // Dai Pool
        // get contracts
            // console.log(Object.keys(rari.pools.dai.contracts))

        // getAllTokens
            // console.log(Object.keys(await rari.pools.dai.getAllTokens()))
        
        // get legacy contracts
            // console.log(Object.keys(rari.pools.dai.legacyContracts['v1.0.0']))

        // Get allocations in USD
                // const allocations = await rari.pools.dai.allocations.getRawCurrencyAllocationsInUsd()
                // Object.keys(allocations).map(val => console.log(
                //         allocations[val].toString() / ss.constants.WeiPerEther
                // ))
        // Get apy
            // const apy = await rari.pools.dai.apy.getCurrentRawApy()
            // console.log(((apy.mul(ss.BigNumber.from(100)) ).toString() / 1e18).toFixed(2))

        // getTotalSupply
                // console.log( (await rari.pools.dai.balances.getTotalSupply()).toString() / ss.constants.WeiPerEther )

    

}

Testing()