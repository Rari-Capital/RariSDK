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

interface ChainMetadata {
  chainId: number;
  name: string;
  imageUrl?: string;
  supported: boolean;
  rpcUrl: string;
  blockExplorerURL: string;
  color: string;
}

export const chainMetadata = {
  [ChainID.ETHEREUM]: {
    chainId: ChainID.ETHEREUM,
    name: "Ethereum",
    imageUrl: "/static/networks/ethereum.png",
    supported: true,
    rpcUrl:
      "https://eth-mainnet.alchemyapi.io/v2/2Mt-6brbJvTA4w9cpiDtnbTo6qOoySnN",
    blockExplorerURL: "https://etherscan.io",
    color: "#627EEA",
  },
  [ChainID.ROPSTEN]: {
    chainId: ChainID.ROPSTEN,
    name: "Ropsten",
    supported: false,
    rpcUrl: "https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorerURL: "https://etherscan.io",
    color: "#627EEA",
  },
  [ChainID.RINKEBY]: {
    chainId: ChainID.RINKEBY,
    name: "Rinkeby",
    supported: false,
    rpcUrl: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorerURL: "https://etherscan.io",
    color: "#627EEA",
  },
  [ChainID.GÖRLI]: {
    chainId: ChainID.GÖRLI,
    name: "Goerli",
    supported: false,
    rpcUrl: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorerURL: "https://etherscan.io",
    color: "#627EEA",
  },
  [ChainID.KOVAN]: {
    chainId: ChainID.KOVAN,
    name: "Kovan",
    supported: false,
    rpcUrl: "https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    blockExplorerURL: "https://etherscan.io",
    color: "#627EEA",
  },
  [ChainID.ARBITRUM]: {
    chainId: ChainID.ARBITRUM,
    name: "Arbitrum",
    imageUrl: "/static/networks/arbitrum.svg",
    supported: true,
    rpcUrl:
      "https://arb-mainnet.g.alchemy.com/v2/rNfYbx5O5Ng09hw9s9YE-huxzVNaWWbX",
    blockExplorerURL: "https://arbiscan.io",
    color: "#28A0EF",
  },
  [ChainID.ARBITRUM_TESTNET]: {
    chainId: ChainID.ARBITRUM_TESTNET,
    name: "Arbi Rinkeby",
    imageUrl: "/static/networks/arbitrum.svg",
    supported: false,
    rpcUrl:
      "https://arb-rinkeby.g.alchemy.com/v2/PkZ7ilUhTBT6tHUsgToel62IOcuyKcwb",
    blockExplorerURL: "https://testnet.arbiscan.io",
    color: "#28A0EF",
  },
  [ChainID.OPTIMISM]: {
    chainId: ChainID.OPTIMISM,
    name: "Optimism",
    imageUrl: "/static/networks/optimism.svg",
    supported: false,
    rpcUrl: "https://mainnet.optimism.io/",
    blockExplorerURL: "https://optimistic.etherscan.io",
    color: "#FE0521",
  },
};

export const isSupportedChainId = (chainId: number) =>
  Object.values(ChainID).includes(chainId);

export function getSupportedChains(): ChainMetadata[] {
  return Object.values(chainMetadata).filter(
    (chainMetadata) => chainMetadata.supported
  );
}

export function getChainMetadata(chainId: ChainID): ChainMetadata {
  return chainMetadata[chainId];
}
