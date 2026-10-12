# Portal paste

**Name:** Stamp

**Track:** Consumer Products & Payments

**Bounty:** Best Cross-Border Payments App on Monad

**One line:** Mei sends $80 from Shenzhen to Lagos. The postage is $0.30, locked in her signature for 90 seconds. A clerk cannot rewrite the name.

**Description:**

Stamp is a phone for Sunday money. Mei Chen unlocks with a passkey. The glass shows dollars, Shenzhen, and Lagos. It does not show a seed phrase.

She signs a letter: $80 to Idris Adeyemi, stamp $0.30, valid for 90 seconds. She also signs an AUSD `ReceiveWithAuthorization` for $80.30, paid to the counter. A relayer lands both in one inclusion. Idris receives $80. The post office receives $0.30.

The counter returns a letter whose recipient was rewritten, a letter filed at second 91, a letter with the stamp wiped to zero, and the same letter filed twice. After the landing, Idris’s balance does not move again.

Rehearsal keys are public and unfunded. `npm test` needs no key. Replay: `/phone?play=1`.

AUSD on Monad: `0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a`. Chain 143. The rehearsal token domain is `AUSD` / `1`. Read the deployed domain before pointing `Postage` at mainnet.

**Demo path:** Play Sunday. Watch HOLD, OPEN, QUOTED, LANDED, then NOT YOU, LATE, FULL, AGAIN. The phone stays on “Idris has it.” The counter is where the copies die.
