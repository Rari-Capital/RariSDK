export enum ChainID {
  ETHEREUM = 1,
  ROPSTEN = 3,
  RINKEBY = 4,
  GÖRLI = 5,
  KOVAN = 42,
  //
  ARBITRUM = 42161,
  ARBITRUM_TESTNET = 421611,
  //
  OPTIMISM = 10,
}

export const isSupportedChainId = (chainId: number) => {
  const isSupported = Object.values(ChainID).includes(chainId);
  console.log(Object.values(chainId), chainId, { isSupportedChainId });
  return isSupported;
};
