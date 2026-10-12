import { HDKey } from "@scure/bip32";
import { entropyToMnemonic, mnemonicToSeedSync } from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { PAYER_INDEX } from "./constants";

function prfFromLabel(label: string): Uint8Array {
  const out = new Uint8Array(32);
  out.set(new TextEncoder().encode(label).slice(0, 32));
  return out;
}

/** Public rehearsal roots. Anyone can derive these. Do not fund them. */
export const MEI_PRF = prfFromLabel("stamp.rehearsal.v1.mei");
export const CLERK_PRF = prfFromLabel("stamp.rehearsal.v1.clerk");
export const IDRIS_PRF = prfFromLabel("stamp.rehearsal.v1.idris");

export function deriveEvmPrivateKey(prfOutput: Uint8Array): Uint8Array {
  if (prfOutput.length !== 32) throw new Error("PRF must be 32 bytes");
  const phrase = entropyToMnemonic(prfOutput, wordlist);
  const seed = mnemonicToSeedSync(phrase);
  const node = HDKey.fromMasterSeed(seed).derive(`m/44'/60'/0'/0/${PAYER_INDEX}`);
  if (!node.privateKey) throw new Error("derivation produced no key");
  return node.privateKey;
}

export function toHexKey(key: Uint8Array): `0x${string}` {
  let hex = "";
  for (const byte of key) hex += byte.toString(16).padStart(2, "0");
  return `0x${hex}`;
}

export type DerivedKey = {
  account: PrivateKeyAccount;
  address: `0x${string}`;
  path: string;
};

/** Mera's published recipe, payer index only. The phrase is derived and not returned. */
export function deriveAccount(prfOutput: Uint8Array): DerivedKey {
  const account = privateKeyToAccount(toHexKey(deriveEvmPrivateKey(prfOutput)));
  return {
    account,
    address: account.address,
    path: `m/44'/60'/0'/0/${PAYER_INDEX}`,
  };
}

export function rehearsalKeys() {
  return {
    mei: deriveAccount(MEI_PRF),
    idris: deriveAccount(IDRIS_PRF),
    clerk: deriveAccount(CLERK_PRF),
  };
}
