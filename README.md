# Stamp

**Sunday money, with the name still on it.**

[Metropolis](https://monad.xyz/metropolis) · **Consumer Products & Payments** · Monad mainnet, chain 143 · AUSD

Mei Chen in Shenzhen sends $80 to Idris Adeyemi in Lagos. The phone shows a postage stamp of $0.30 and a 90-second window. A clerk can carry the letter. He cannot put his own name on her signature, file it a minute late, wipe the stamp, or land it twice.

This project lives in `stamp/` only. It does not touch other hackathon folders. Port **3094**.

Replay: [http://localhost:3094/phone?play=1](http://localhost:3094/phone?play=1)

## Why this can win

The track asks for a payments product whose first five minutes matter, and for money that settles without an intermediary. The cross-border bounty asks for AUSD, passkey onboarding, and instant settlement. Stamp is that letter.

| Ask | What is load-bearing |
| --- | --- |
| Never a wallet lecture | The glass says Shenzhen, Lagos, dollars, postage. Chain id 143 stays on the counter. |
| Charge that cannot be rewritten | The stamp is `300000` (0.30 AUSD, 6 decimals) inside the signed letter. A zero stamp reverts `STAMP`. |
| Instant, then over | The quote window is 90 seconds. A filing at second 91 reverts `LATE`. Monad’s block time is what makes the window honest. |
| Settle once | The nonce is consumed on the landing that pays Idris. A second filing reverts `USED`. Balances stay put. |
| Cross-border AUSD | The pull is ERC-3009 `ReceiveWithAuthorization` for amount + stamp, paid to the counter, then forwarded. Agora AUSD on Monad is `0x00000000eFE302BEAA2b3e6e1b18d08D69a9012a`. |
| Passkey, no seed phrase | Live unlock uses Mera. PRF bytes become one BIP-44 account at `m/44'/60'/0'/0/0`. The phrase is never shown. Only the credential id is stored. |

The rehearsal uses a published PRF so a judge can watch every stamp with no gas and no passkey prompt. Those keys are public. Do not fund them.

![Architecture](docs/architecture.svg)

## Stamps

HOLD → OPEN → QUOTED → LANDED → NOT YOU → LATE → FULL → AGAIN

NOT YOU is the clerk pasting his address onto Mei’s signature. LATE is a second letter filed at second 91. FULL is a zero stamp. AGAIN is the landed letter filed again. Idris stays at $92.00.

## Run

```bash
cd stamp
npm install
npm test
npm run dev
```

Open [http://localhost:3094/phone?play=1](http://localhost:3094/phone?play=1). `npm test` needs no key.

On a phone, add the page to the home screen. `start_url` is `/phone`.

## Submit

Portal: [hackathon.monad.xyz](https://hackathon.monad.xyz/). Deadline 13 Oct 2026, 23:59 ET.

- Track: Consumer Products & Payments
- Bounty: Best Cross-Border Payments App on Monad
- Contract: `contracts/Postage.sol` (the tested rules; a mainnet pull must read Agora’s real EIP-712 domain off the token first)

`contracts/Postage.sol` matches the counter: same stamp, same 90-second window, same type strings, signature before the clock, clock before the nonce.
