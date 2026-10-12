import assert from "node:assert/strict";
import { test } from "node:test";
import { IDRIS_START, MEI_START, POSTED_STAMP, SEND_AMOUNT } from "./constants";
import { dollars } from "./money";
import { rehearse } from "./story";

test("dollars renders AUSD cents", () => {
  assert.equal(dollars(SEND_AMOUNT), "$80.00");
  assert.equal(dollars(POSTED_STAMP), "$0.30");
  assert.equal(dollars(159_700_000n), "$159.70");
});

test("Sunday money lands once and the three copies pay nothing", async () => {
  const story = await rehearse();
  assert.deepEqual(
    story.beats.map((beat) => beat.stamp),
    ["HOLD", "OPEN", "QUOTED", "LANDED", "NOT YOU", "LATE", "FULL", "AGAIN"],
  );
  assert.equal(story.refused, "BAD_SIGNER");
  assert.equal(story.late, "LATE");
  assert.equal(story.wiped, "STAMP");
  assert.equal(story.replay, "USED");
  assert.equal(story.meiAfter, MEI_START - SEND_AMOUNT - POSTED_STAMP);
  assert.equal(story.idrisAfter, IDRIS_START + SEND_AMOUNT);
  assert.equal(story.postAfter, POSTED_STAMP);
  assert.equal(story.beats[3]?.mei, story.meiAfter);
  assert.equal(story.beats[7]?.idris, story.idrisAfter);
  assert.equal(story.beats[7]?.post, story.postAfter);
  assert.equal(story.meiPath, "m/44'/60'/0'/0/0");
});
