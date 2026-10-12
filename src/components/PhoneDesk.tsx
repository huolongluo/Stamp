"use client";

import { useEffect, useRef, useState } from "react";
import { Header } from "./Header";
import { dollars } from "../lib/money";
import { forgetPasskey, passkeyError, unlockPasskey, type LiveKeys } from "../lib/passkey";
import { rehearse, type Beat, type Story } from "../lib/story";

function short(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function Glass({ beat, story }: { beat: Beat | undefined; story: Story | null }) {
  const phone = beat?.phone ?? "lock";
  return (
    <div className="handset">
      <div className="glass">
        <header>
          <span>9:41</span>
          <span>Sunday</span>
        </header>
        {phone === "lock" ? (
          <div className="lock">
            <div>
              <p className="who">Mei Chen</p>
              <h2>Sunday</h2>
              <p className="who">Unlock to send</p>
            </div>
          </div>
        ) : null}
        {phone === "home" && story ? (
          <div className="screen">
            <p className="who">Mei Chen · Shenzhen</p>
            <h2>Ready</h2>
            <p className="balance">{dollars(beat?.mei ?? 0n)}</p>
            <p className="who">Available</p>
          </div>
        ) : null}
        {phone === "quote" && story ? (
          <div className="screen">
            <p className="who">New letter</p>
            <div className="city">
              <div>
                <span>From</span>
                <strong>Shenzhen</strong>
              </div>
              <div>
                <span>To</span>
                <strong>Lagos</strong>
              </div>
            </div>
            <p className="who">Idris Adeyemi</p>
            <p className="balance">{dollars(story.amount)}</p>
            <div className="postage">
              <div>
                <span>POSTAGE</span>
                <strong>{dollars(story.stampFee)}</strong>
              </div>
              <em>SZX → LOS · {story.window.toString()}s</em>
            </div>
            <button className="send" type="button" disabled>
              Send Sunday
            </button>
          </div>
        ) : null}
        {phone === "sent" && story ? (
          <div className="screen">
            <p className="who">Delivered</p>
            <h2>Idris has it</h2>
            <p className="balance">{dollars(story.amount)}</p>
            <p className="sent-note">Lagos · postage {dollars(story.stampFee)} · arrives now</p>
            <div className="postage">
              <div>
                <span>POSTAGE</span>
                <strong>{dollars(story.stampFee)}</strong>
              </div>
              <em>SZX → LOS</em>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function PhoneDesk() {
  const [story, setStory] = useState<Story | null>(null);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [live, setLive] = useState<LiveKeys | null>(null);
  const [liveError, setLiveError] = useState("");
  const [liveBusy, setLiveBusy] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    let cancel = false;
    rehearse()
      .then((next) => {
        if (!cancel) setStory(next);
      })
      .catch((reason: unknown) => {
        if (!cancel) setError(reason instanceof Error ? reason.message : "The counter failed to open.");
      });
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    if (!story) return;
    if (new URLSearchParams(window.location.search).get("play") !== "1") return;
    run(story.beats.length);
    return () => stop();
    // Autoplay starts once, when the rehearsal is ready.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story]);

  function stop() {
    if (timer.current !== null) window.clearInterval(timer.current);
    timer.current = null;
    setRunning(false);
  }

  function run(total: number) {
    stop();
    setStep(0);
    setRunning(true);
    let index = 0;
    timer.current = window.setInterval(() => {
      index += 1;
      setStep(index);
      if (index >= total - 1) stop();
    }, 1200);
  }

  async function onPasskey() {
    setLiveBusy(true);
    setLiveError("");
    try {
      setLive(await unlockPasskey());
    } catch (reason) {
      setLiveError(passkeyError(reason));
    } finally {
      setLiveBusy(false);
    }
  }

  const beats = story?.beats.slice(0, step + 1) ?? [];
  const current = beats[beats.length - 1];

  return (
    <>
      <Header />
      <main className="wrap">
        <div className="desk-top">
          <div>
            <p className="kicker">Shenzhen → Lagos · rehearsal</p>
            <h1>Sunday money</h1>
          </div>
        </div>
        {error ? <p role="alert">{error}</p> : null}
        {!story ? <p className="note">Opening the counter…</p> : null}
        {story ? (
          <div className="stage">
            <Glass beat={current} story={story} />
            <section className="panel">
              <div className="counter-head">
                <div>
                  <p className="kicker">Counter</p>
                  <h2>{current?.title ?? "Waiting"}</h2>
                </div>
                <div className={`mark ${current?.tone ?? "hold"}`} data-stamp={current?.stamp ?? "HOLD"} aria-live="polite">
                  {current?.stamp ?? "HOLD"}
                </div>
              </div>
              <p>{current?.detail}</p>
              <div className="ledger">
                <div>
                  <span>Mei</span>
                  <strong>{dollars(current?.mei ?? 0n)}</strong>
                </div>
                <div>
                  <span>Idris</span>
                  <strong>{dollars(current?.idris ?? 0n)}</strong>
                </div>
                <div>
                  <span>Post</span>
                  <strong>{dollars(current?.post ?? 0n)}</strong>
                </div>
              </div>
              <ol className="tape counter-scroll">
                {beats.map((beat) => (
                  <li key={beat.id} className={beat.tone} data-beat={beat.id}>
                    <b>{beat.stamp}</b>
                    <span>{beat.title}</span>
                  </li>
                ))}
              </ol>
              <div className="controls">
                <button className="btn red" type="button" onClick={() => run(story.beats.length)} disabled={running}>
                  {running ? "Playing" : "Play Sunday"}
                </button>
                <button className="btn ghost" type="button" onClick={() => { stop(); setStep(0); }}>
                  Reset
                </button>
              </div>
              <div className="live">
                <p className="kicker">This phone</p>
                <p>Passkey path {story.meiPath}. The phrase is dropped. Rehearsal keys are public.</p>
                <div className="controls">
                  <button className="btn ghost" type="button" onClick={onPasskey} disabled={liveBusy}>
                    {liveBusy ? "Waiting" : live ? "Unlock again" : "Unlock with a passkey"}
                  </button>
                  {live ? (
                    <button className="btn ghost" type="button" onClick={() => { forgetPasskey(); setLive(null); }}>
                      Forget this phone
                    </button>
                  ) : null}
                </div>
                {live ? <p className="addr">Account {short(live.payer)} · {live.created ? "created" : "unlocked"}</p> : null}
                {liveError ? <p role="alert">{liveError}</p> : null}
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </>
  );
}
