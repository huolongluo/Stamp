import type { Address } from "viem";

/** Keep in sync with contracts/Postage.sol */
export const POSTED_STAMP = 300_000n;
export const QUOTE_WINDOW = 90n;
export const MIN_AMOUNT = 1_000_000n;
export const AUSD_DECIMALS = 6;

export const MONAD_CHAIN_ID = 143;

/** Agora AUSD on Monad mainnet. 6 decimals. The rehearsal ledger uses the same unit. */
export const AUSD_ADDRESS: Address = "0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a";

/** Placeholder until a deployment writes NEXT_PUBLIC_POSTAGE_ADDRESS. */
export const POSTAGE_ADDRESS: Address = "0x00000000000000000000000000000000000057a1";

/** The stamp is paid here. A clerk cannot pass a different address inside a signed letter. */
export const POST_OFFICE: Address = "0x0000000000000000000000000000000000000a57";

export const MEI_START = 240_000_000n;
export const IDRIS_START = 12_000_000n;
export const SEND_AMOUNT = 80_000_000n;

/** Fixed rehearsal clock. The letter is valid for QUOTE_WINDOW seconds from here. */
export const REHEARSAL_NOW = 1_760_227_200n;

export const PAYER_INDEX = 0;
