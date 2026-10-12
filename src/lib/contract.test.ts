import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { MIN_AMOUNT, POSTED_STAMP, QUOTE_WINDOW } from "./constants";

test("Postage.sol uses the same stamp, window, and type strings", () => {
  const sol = readFileSync(new URL("../../contracts/Postage.sol", import.meta.url), "utf8");
  assert.ok(sol.includes(`POSTED_STAMP = ${POSTED_STAMP}`));
  assert.ok(sol.includes(`QUOTE_WINDOW = ${QUOTE_WINDOW} seconds`));
  assert.ok(sol.includes(`MIN_AMOUNT = ${MIN_AMOUNT}`));
  assert.ok(
    sol.includes(
      "Letter(address from,address to,uint256 amount,uint256 stamp,uint256 validAfter,uint256 validBefore,bytes32 nonce)",
    ),
  );
  assert.ok(
    sol.includes(
      "ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)",
    ),
  );
  assert.ok(sol.includes('_domain("Stamp"'));
  assert.ok(sol.includes('_domain("AUSD"'));
  assert.ok(sol.includes("receiveWithAuthorization"));
  assert.ok(sol.includes("BadSigner"));
  assert.ok(sol.includes("BadToken"));
  assert.ok(sol.includes("Used"));
});
