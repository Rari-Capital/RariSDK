/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import { Provider } from "@ethersproject/providers";
import type {
  FusePoolLensSecondary,
  FusePoolLensSecondaryInterface,
} from "../FusePoolLensSecondary";

const _abi = [
  {
    inputs: [],
    name: "directory",
    outputs: [
      {
        internalType: "contract FusePoolDirectory",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "contract FusePoolDirectory",
        name: "_directory",
        type: "address",
      },
    ],
    name: "initialize",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract Comptroller",
        name: "comptroller",
        type: "address",
      },
    ],
    name: "getPoolOwnership",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
      {
        components: [
          {
            internalType: "address",
            name: "cToken",
            type: "address",
          },
          {
            internalType: "address",
            name: "admin",
            type: "address",
          },
          {
            internalType: "bool",
            name: "adminHasRights",
            type: "bool",
          },
          {
            internalType: "bool",
            name: "fuseAdminHasRights",
            type: "bool",
          },
        ],
        internalType: "struct FusePoolLensSecondary.CTokenOwnership[]",
        name: "",
        type: "tuple[]",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "contract CToken",
        name: "cTokenModify",
        type: "address",
      },
    ],
    name: "getMaxRedeem",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
      {
        internalType: "contract CToken",
        name: "cTokenModify",
        type: "address",
      },
    ],
    name: "getMaxBorrow",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract Comptroller",
        name: "comptroller",
        type: "address",
      },
    ],
    name: "getRewardSpeedsByPool",
    outputs: [
      {
        internalType: "contract CToken[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "contract RewardsDistributor[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "uint256[][]",
        name: "",
        type: "uint256[][]",
      },
      {
        internalType: "uint256[][]",
        name: "",
        type: "uint256[][]",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "contract Comptroller[]",
        name: "comptrollers",
        type: "address[]",
      },
    ],
    name: "getRewardSpeedsByPools",
    outputs: [
      {
        internalType: "contract CToken[][]",
        name: "",
        type: "address[][]",
      },
      {
        internalType: "contract RewardsDistributor[][]",
        name: "",
        type: "address[][]",
      },
      {
        internalType: "address[][]",
        name: "",
        type: "address[][]",
      },
      {
        internalType: "uint256[][][]",
        name: "",
        type: "uint256[][][]",
      },
      {
        internalType: "uint256[][][]",
        name: "",
        type: "uint256[][][]",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "holder",
        type: "address",
      },
      {
        internalType: "contract RewardsDistributor[]",
        name: "distributors",
        type: "address[]",
      },
    ],
    name: "getUnclaimedRewardsByDistributors",
    outputs: [
      {
        internalType: "address[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "contract CToken[][]",
        name: "",
        type: "address[][]",
      },
      {
        internalType: "uint256[2][][]",
        name: "",
        type: "uint256[2][][]",
      },
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "supplier",
        type: "address",
      },
    ],
    name: "getRewardsDistributorsBySupplier",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
      {
        internalType: "contract Comptroller[]",
        name: "",
        type: "address[]",
      },
      {
        internalType: "contract RewardsDistributor[][]",
        name: "",
        type: "address[][]",
      },
    ],
    stateMutability: "view",
    type: "function",
    constant: true,
  },
];

export class FusePoolLensSecondary__factory {
  static readonly abi = _abi;
  static createInterface(): FusePoolLensSecondaryInterface {
    return new utils.Interface(_abi) as FusePoolLensSecondaryInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): FusePoolLensSecondary {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as FusePoolLensSecondary;
  }
}