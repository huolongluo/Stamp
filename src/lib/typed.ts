import type { Address } from "viem";
import { AUSD_ADDRESS, MONAD_CHAIN_ID, POSTAGE_ADDRESS } from "./constants";

export const letterTypes = {
  Letter: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "stamp", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

/** Same type string as contracts/Postage.sol LETTER_TYPEHASH. */
export function stampDomain(verifyingContract: Address = POSTAGE_ADDRESS, chainId = MONAD_CHAIN_ID) {
  return {
    name: "Stamp",
    version: "1",
    chainId,
    verifyingContract,
  } as const;
}

/**
 * ERC-3009 receiveWithAuthorization, bound to the rehearsal token domain.
 * Agora's deployed AUSD domain must be read from the token before a mainnet pull.
 */
export const receiveTypes = {
  ReceiveWithAuthorization: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "validAfter", type: "uint256" },
    { name: "validBefore", type: "uint256" },
    { name: "nonce", type: "bytes32" },
  ],
} as const;

export function ausdDomain(verifyingContract: Address = AUSD_ADDRESS, chainId = MONAD_CHAIN_ID) {
  return {
    name: "AUSD",
    version: "1",
    chainId,
    verifyingContract,
  } as const;
}
