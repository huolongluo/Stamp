import { recoverTypedDataAddress, type Address, type Hex } from "viem";
import {
  AUSD_ADDRESS,
  MIN_AMOUNT,
  MONAD_CHAIN_ID,
  POST_OFFICE,
  POSTAGE_ADDRESS,
  POSTED_STAMP,
  QUOTE_WINDOW,
} from "./constants";
import { ausdDomain, letterTypes, receiveTypes, stampDomain } from "./typed";

export type Letter = {
  from: Address;
  to: Address;
  amount: bigint;
  stamp: bigint;
  validAfter: bigint;
  validBefore: bigint;
  nonce: Hex;
};

export type FailCode = "BAD_SIGNER" | "BAD_TOKEN" | "LATE" | "EARLY" | "WINDOW" | "USED" | "STAMP" | "SELF" | "SHORT" | "DUST";

export class StampError extends Error {
  constructor(public code: FailCode) {
    super(code);
  }
}

export class Post {
  readonly balances = new Map<Address, bigint>();
  readonly used = new Set<Hex>();

  constructor(
    public readonly verifyingContract: Address = POSTAGE_ADDRESS,
    public readonly token: Address = AUSD_ADDRESS,
    public readonly chainId = MONAD_CHAIN_ID,
    public readonly postOffice: Address = POST_OFFICE,
  ) {}

  credit(who: Address, amount: bigint) {
    this.balances.set(who, (this.balances.get(who) ?? 0n) + amount);
  }

  balance(who: Address): bigint {
    return this.balances.get(who) ?? 0n;
  }

  /**
   * Land a signed letter. The token authorization pays amount+stamp to this desk.
   * The amount is forwarded to `to`. The stamp stays at the post office.
   */
  async land(letter: Letter, letterSig: Hex, tokenSig: Hex, now: bigint) {
    if (letter.from === letter.to) throw new StampError("SELF");
    if (letter.stamp !== POSTED_STAMP) throw new StampError("STAMP");
    if (letter.amount < MIN_AMOUNT) throw new StampError("DUST");
    if (letter.validBefore <= letter.validAfter) throw new StampError("WINDOW");
    if (letter.validBefore - letter.validAfter > QUOTE_WINDOW) throw new StampError("WINDOW");

    const letterFrom = await recoverTypedDataAddress({
      domain: stampDomain(this.verifyingContract, this.chainId),
      types: letterTypes,
      primaryType: "Letter",
      message: letter,
      signature: letterSig,
    });
    if (letterFrom !== letter.from) throw new StampError("BAD_SIGNER");

    const tokenFrom = await recoverTypedDataAddress({
      domain: ausdDomain(this.token, this.chainId),
      types: receiveTypes,
      primaryType: "ReceiveWithAuthorization",
      message: {
        from: letter.from,
        to: this.verifyingContract,
        value: letter.amount + letter.stamp,
        validAfter: letter.validAfter,
        validBefore: letter.validBefore,
        nonce: letter.nonce,
      },
      signature: tokenSig,
    });
    if (tokenFrom !== letter.from) throw new StampError("BAD_TOKEN");

    if (now < letter.validAfter) throw new StampError("EARLY");
    if (now > letter.validBefore) throw new StampError("LATE");
    if (this.used.has(letter.nonce)) throw new StampError("USED");

    const debit = letter.amount + letter.stamp;
    const bal = this.balance(letter.from);
    if (bal < debit) throw new StampError("SHORT");

    this.used.add(letter.nonce);
    this.balances.set(letter.from, bal - debit);
    this.credit(letter.to, letter.amount);
    this.credit(this.postOffice, letter.stamp);
  }
}

export async function expectCode(run: () => Promise<void>): Promise<FailCode> {
  try {
    await run();
  } catch (error) {
    if (error instanceof StampError) return error.code;
    throw error;
  }
  throw new Error("LAND_SHOULD_HAVE_FAILED");
}
