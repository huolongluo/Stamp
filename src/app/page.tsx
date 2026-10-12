import Link from "next/link";
import { Footer, Header } from "../components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <main className="wrap">
        <p className="kicker">Metropolis · Consumer products & payments</p>
        <h1>Sunday money, with the name still on it.</h1>
        <p className="lede">
          Mei Chen in Shenzhen sends eighty dollars to Idris Adeyemi in Lagos.
          The phone says postage, thirty cents, arrives now. A clerk can carry the letter.
          The stamp keeps his hands off the name, the fee, and the minute.
        </p>
        <div className="row">
          <Link className="btn red" href="/phone?play=1">Play Sunday</Link>
          <Link className="btn ghost" href="/how">The rules on the stamp</Link>
        </div>
        <div className="grid three">
          <article className="card">
            <p className="kicker">01</p>
            <h2>A phone</h2>
            <p>Mei unlocks with a passkey. The glass shows Shenzhen, Lagos, and a dollar balance. The phrase stays off it.</p>
          </article>
          <article className="card">
            <p className="kicker">02</p>
            <h2>Thirty cents</h2>
            <p>The stamp is 0.30 AUSD, written into the letter she signs. A zero stamp is returned. A rewritten recipient is returned.</p>
          </article>
          <article className="card">
            <p className="kicker">03</p>
            <h2>Ninety seconds</h2>
            <p>The quote dies in a minute and a half. One inclusion lands inside it. The same letter, filed again, pays nothing.</p>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
