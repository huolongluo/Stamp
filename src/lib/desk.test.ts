import assert from "node:assert/strict";
import { test } from "node:test";
import { MEI_START, MIN_AMOUNT, POSTED_STAMP, QUOTE_WINDOW, REHEARSAL_NOW, SEND_AMOUNT } from "./constants";
import { expectCode, Post, type Letter } from "./desk";
import { rehearsalKeys } from "./keys";
import { ausdDomain, letterTypes, receiveTypes, stampDomain } from "./typed";

function draft(over: Partial<Letter> = {}): Letter {
  const { mei, idris } = rehearsalKeys();
  return {
    from: mei.address,
    to: idris.address,
    amount: SEND_AMOUNT,
    stamp: POSTED_STAMP,
    validAfter: REHEARSAL_NOW,
    validBefore: REHEARSAL_NOW + QUOTE_WINDOW,
    nonce: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    ...over,
  };
}

async function signBoth(letter: Letter) {
  const { mei } = rehearsalKeys();
  const desk = new Post();
  const letterSig = await mei.account.signTypedData({
    domain: stampDomain(desk.verifyingContract, desk.chainId),
    types: letterTypes,
    primaryType: "Letter",
    message: letter,
  });
  const tokenSig = await mei.account.signTypedData({
    domain: ausdDomain(desk.token, desk.chainId),
    types: receiveTypes,
    primaryType: "ReceiveWithAuthorization",
    message: {
      from: letter.from,
      to: desk.verifyingContract,
      value: letter.amount + letter.stamp,
      validAfter: letter.validAfter,
      validBefore: letter.validBefore,
      nonce: letter.nonce,
    },
  });
  return { letterSig, tokenSig };
}

test("a short balance cannot cover the stamp", async () => {
  const letter = draft();
  const { letterSig, tokenSig } = await signBoth(letter);
  const desk = new Post();
  desk.credit(letter.from, letter.amount);
  const code = await expectCode(() => desk.land(letter, letterSig, tokenSig, REHEARSAL_NOW));
  assert.equal(code, "SHORT");
  assert.equal(desk.balance(letter.from), letter.amount);
});

test("dust, self-send, a long window, and an early clock are refused", async () => {
  const dust = draft({ amount: MIN_AMOUNT - 1n, nonce: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" });
  const dustSig = await signBoth(dust);
  assert.equal(await expectCode(() => new Post().land(dust, dustSig.letterSig, dustSig.tokenSig, REHEARSAL_NOW)), "DUST");

  const self = draft({ to: draft().from, nonce: "0xcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" });
  const selfSig = await signBoth(self);
  assert.equal(await expectCode(() => new Post().land(self, selfSig.letterSig, selfSig.tokenSig, REHEARSAL_NOW)), "SELF");

  const wide = draft({
    validBefore: REHEARSAL_NOW + QUOTE_WINDOW + 1n,
    nonce: "0xdddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd",
  });
  const wideSig = await signBoth(wide);
  assert.equal(await expectCode(() => new Post().land(wide, wideSig.letterSig, wideSig.tokenSig, REHEARSAL_NOW)), "WINDOW");

  const early = draft({ nonce: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" });
  const earlySig = await signBoth(early);
  const desk = new Post();
  desk.credit(early.from, MEI_START);
  assert.equal(
    await expectCode(() => desk.land(early, earlySig.letterSig, earlySig.tokenSig, early.validAfter - 1n)),
    "EARLY",
  );
});

test("a token authorization aimed at the clerk is refused", async () => {
  const { mei, clerk } = rehearsalKeys();
  const letter = draft({ nonce: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" });
  const desk = new Post();
  desk.credit(mei.address, MEI_START);
  const letterSig = await mei.account.signTypedData({
    domain: stampDomain(desk.verifyingContract, desk.chainId),
    types: letterTypes,
    primaryType: "Letter",
    message: letter,
  });
  const tokenSig = await clerk.account.signTypedData({
    domain: ausdDomain(desk.token, desk.chainId),
    types: receiveTypes,
    primaryType: "ReceiveWithAuthorization",
    message: {
      from: letter.from,
      to: clerk.address,
      value: letter.amount + letter.stamp,
      validAfter: letter.validAfter,
      validBefore: letter.validBefore,
      nonce: letter.nonce,
    },
  });
  assert.equal(await expectCode(() => desk.land(letter, letterSig, tokenSig, REHEARSAL_NOW)), "BAD_TOKEN");
  assert.equal(desk.balance(mei.address), MEI_START);
});
