import { keccak256, toBytes, type Address, type Hex } from "viem";
import {
  IDRIS_START,
  MEI_START,
  POST_OFFICE,
  POSTED_STAMP,
  QUOTE_WINDOW,
  REHEARSAL_NOW,
  SEND_AMOUNT,
} from "./constants";
import { expectCode, Post, type Letter } from "./desk";
import { rehearsalKeys, type DerivedKey } from "./keys";
import { dollars } from "./money";
import { ausdDomain, letterTypes, receiveTypes, stampDomain } from "./typed";

export type BeatId = "hold" | "open" | "quoted" | "landed" | "notyou" | "late" | "full" | "again";

export type Beat = {
  id: BeatId;
  stamp: string;
  tone: "hold" | "good" | "bad";
  title: string;
  detail: string;
  phone: "lock" | "home" | "quote" | "sent";
  mei: bigint;
  idris: bigint;
  post: bigint;
};

export type Story = {
  beats: Beat[];
  mei: Address;
  idris: Address;
  clerk: Address;
  post: Address;
  meiPath: string;
  amount: bigint;
  stampFee: bigint;
  window: bigint;
  validBefore: bigint;
  meiAfter: bigint;
  idrisAfter: bigint;
  postAfter: bigint;
  refused: string;
  late: string;
  wiped: string;
  replay: string;
  desk: Post;
};

function nonce(label: string): Hex {
  return keccak256(toBytes(label));
}

function letter(from: Address, to: Address, amount: bigint, stamp: bigint, nonceValue: Hex, validAfter: bigint): Letter {
  return {
    from,
    to,
    amount,
    stamp,
    validAfter,
    validBefore: validAfter + QUOTE_WINDOW,
    nonce: nonceValue,
  };
}

async function signLetter(who: DerivedKey, value: Letter, desk: Post) {
  return who.account.signTypedData({
    domain: stampDomain(desk.verifyingContract, desk.chainId),
    types: letterTypes,
    primaryType: "Letter",
    message: value,
  });
}

async function signReceive(who: DerivedKey, value: Letter, desk: Post) {
  return who.account.signTypedData({
    domain: ausdDomain(desk.token, desk.chainId),
    types: receiveTypes,
    primaryType: "ReceiveWithAuthorization",
    message: {
      from: value.from,
      to: desk.verifyingContract,
      value: value.amount + value.stamp,
      validAfter: value.validAfter,
      validBefore: value.validBefore,
      nonce: value.nonce,
    },
  });
}

function beat(
  id: BeatId,
  stamp: string,
  tone: Beat["tone"],
  title: string,
  detail: string,
  phone: Beat["phone"],
  desk: Post,
  mei: Address,
  idris: Address,
): Beat {
  return {
    id,
    stamp,
    tone,
    title,
    detail,
    phone,
    mei: desk.balance(mei),
    idris: desk.balance(idris),
    post: desk.balance(POST_OFFICE),
  };
}

export async function rehearse(): Promise<Story> {
  const { mei, idris, clerk } = rehearsalKeys();
  const desk = new Post();
  desk.credit(mei.address, MEI_START);
  desk.credit(idris.address, IDRIS_START);
  const now = REHEARSAL_NOW;

  const sunday = letter(mei.address, idris.address, SEND_AMOUNT, POSTED_STAMP, nonce("stamp.sunday.mei.idris.80"), now);
  const sundaySig = await signLetter(mei, sunday, desk);
  const sundayToken = await signReceive(mei, sunday, desk);

  const held = letter(mei.address, idris.address, SEND_AMOUNT, POSTED_STAMP, nonce("stamp.sunday.mei.idris.late"), now);
  const heldSig = await signLetter(mei, held, desk);
  const heldToken = await signReceive(mei, held, desk);

  const wiped = letter(mei.address, idris.address, SEND_AMOUNT, 0n, nonce("stamp.sunday.mei.idris.full"), now);
  const wipedSig = await signLetter(mei, wiped, desk);
  const wipedToken = await signReceive(mei, wiped, desk);

  const beats: Beat[] = [];
  beats.push(
    beat(
      "hold",
      "HOLD",
      "hold",
      "The phone is locked",
      "No letter is open. The balance stays off the glass until Mei unlocks it.",
      "lock",
      desk,
      mei.address,
      idris.address,
    ),
  );
  beats.push(
    beat(
      "open",
      "OPEN",
      "good",
      "Passkey, no phrase",
      `Mei Chen, Shenzhen. ${dollars(MEI_START)} is on the phone. The twenty-four words are not.`,
      "home",
      desk,
      mei.address,
      idris.address,
    ),
  );
  beats.push(
    beat(
      "quoted",
      "QUOTED",
      "good",
      "Eighty dollars, thirty cents",
      `${dollars(SEND_AMOUNT)} to Idris Adeyemi in Lagos. Postage ${dollars(POSTED_STAMP)}. The letter dies in ${QUOTE_WINDOW.toString()} seconds.`,
      "quote",
      desk,
      mei.address,
      idris.address,
    ),
  );

  await desk.land(sunday, sundaySig, sundayToken, now);
  beats.push(
    beat(
      "landed",
      "LANDED",
      "good",
      "Idris has the eighty",
      `One inclusion. Idris now holds ${dollars(desk.balance(idris.address))}. The post office holds ${dollars(desk.balance(POST_OFFICE))}. Mei holds ${dollars(desk.balance(mei.address))}.`,
      "sent",
      desk,
      mei.address,
      idris.address,
    ),
  );

  const rewritten: Letter = { ...sunday, to: clerk.address };
  const refused = await expectCode(() => desk.land(rewritten, sundaySig, sundayToken, now));
  beats.push(
    beat(
      "notyou",
      "NOT YOU",
      "bad",
      "The clerk rewrote the name",
      "He kept Mei’s signature and put his own address on the letter. The counter returned it. The balances did not move.",
      "sent",
      desk,
      mei.address,
      idris.address,
    ),
  );

  const late = await expectCode(() => desk.land(held, heldSig, heldToken, held.validBefore + 1n));
  beats.push(
    beat(
      "late",
      "LATE",
      "bad",
      "Filed on the 91st second",
      `A second letter, signed and held past the ${QUOTE_WINDOW.toString()}-second window. It does not land.`,
      "sent",
      desk,
      mei.address,
      idris.address,
    ),
  );

  const wipedCode = await expectCode(() => desk.land(wiped, wipedSig, wipedToken, now));
  beats.push(
    beat(
      "full",
      "FULL",
      "bad",
      "The stamp stays thirty cents",
      `A letter with a zero stamp is refused. The posted stamp is ${dollars(POSTED_STAMP)}.`,
      "sent",
      desk,
      mei.address,
      idris.address,
    ),
  );

  const replay = await expectCode(() => desk.land(sunday, sundaySig, sundayToken, now));
  beats.push(
    beat(
      "again",
      "AGAIN",
      "bad",
      "The same letter pays nothing",
      `Filed again inside the window. Idris is still at ${dollars(desk.balance(idris.address))}.`,
      "sent",
      desk,
      mei.address,
      idris.address,
    ),
  );

  return {
    beats,
    mei: mei.address,
    idris: idris.address,
    clerk: clerk.address,
    post: POST_OFFICE,
    meiPath: mei.path,
    amount: SEND_AMOUNT,
    stampFee: POSTED_STAMP,
    window: QUOTE_WINDOW,
    validBefore: sunday.validBefore,
    meiAfter: desk.balance(mei.address),
    idrisAfter: desk.balance(idris.address),
    postAfter: desk.balance(POST_OFFICE),
    refused,
    late,
    wiped: wipedCode,
    replay,
    desk,
  };
}
