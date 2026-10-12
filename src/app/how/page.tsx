import { Footer, Header } from "../../components/Header";
import { AUSD_ADDRESS, MONAD_CHAIN_ID, POST_OFFICE, POSTAGE_ADDRESS, POSTED_STAMP, QUOTE_WINDOW } from "../../lib/constants";
import { dollars } from "../../lib/money";

export default function How() {
  return (
    <>
      <Header />
      <main className="wrap">
        <p className="kicker">What the counter checks</p>
        <h1>The stamp is the rule.</h1>
        <p className="lede">
          Mei signs two typed messages: the letter, and an AUSD authorization that pays the amount plus the stamp to the counter.
          Anyone can land them. She does not need gas on the glass. The checks below are the product.
        </p>
        <div className="rules">
          <article className="panel">
            <h2>Letter</h2>
            <p>
              <code>Letter(address from,address to,uint256 amount,uint256 stamp,uint256 validAfter,uint256 validBefore,bytes32 nonce)</code>
            </p>
            <p>Domain name <code>Stamp</code>, version <code>1</code>, chain <code>{MONAD_CHAIN_ID}</code>, contract <code>{POSTAGE_ADDRESS}</code>.</p>
          </article>
          <article className="panel">
            <h2>AUSD pull</h2>
            <p>
              <code>ReceiveWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)</code>
            </p>
            <p>
              The payee is the counter. The value is the eighty dollars plus {dollars(POSTED_STAMP)}. Token domain in the rehearsal is <code>AUSD</code> / <code>1</code> at <code>{AUSD_ADDRESS}</code>. Read Agora’s deployed domain before a mainnet pull.
            </p>
          </article>
          <article className="panel">
            <h2>Posted numbers</h2>
            <p>Stamp {dollars(POSTED_STAMP)} · window {QUOTE_WINDOW.toString()} seconds · minimum one dollar · post office <code>{POST_OFFICE}</code>.</p>
            <p>A rewritten recipient fails the letter signature. A late filing fails the clock. A second filing of the same nonce pays nothing. A zero stamp is refused before either signature is accepted as a payment.</p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
