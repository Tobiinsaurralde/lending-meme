'use client';

/**
 * Ledger signing sheet.
 *
 * A progressive sheet in the shape of Apple's AirPods pairing card: one panel
 * per state, the card resizing and crossfading between them as the device
 * moves through connect → PIN → review → signed.
 *
 * The device artwork is Ledger's own Lottie animation for the Nano S Plus,
 * taken from the MIT-licensed LedgerHQ/ledger-live monorepo, so it is the same
 * animation a user already sees in Ledger Live. Licence text ships alongside
 * the JSON in public/ledger/.
 *
 * The component is *controlled*: it renders whatever `step` it is given and
 * never advances itself. Today a demo harness moves that value; when the
 * transport is real, the device does. Nothing in here needs to know which.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnimationItem } from 'lottie-web';

export type LedgerStep = 'connect' | 'pin' | 'review' | 'signed';

const STEP_ORDER: LedgerStep[] = ['connect', 'pin', 'review', 'signed'];

export interface LedgerTransaction {
  action: string;
  amount: string;
  to: string;
  network: string;
  /** Drives the policy chip. False reads as a refusal, not a warning. */
  withinPolicy: boolean;
}

export interface LedgerSigner {
  device: string;
  address: string;
  txHash?: string;
}

export interface LedgerSignSheetProps {
  open: boolean;
  step: LedgerStep;
  /** ENS name of the agent this signature is being made as. */
  agentName: string;
  transaction: LedgerTransaction;
  signer: LedgerSigner;
  onDismiss: () => void;
  /**
   * Asks the browser for permission to talk to the device. Only the first
   * panel offers it; every step after that is reached by acting on the Ledger
   * itself, so there is nothing here to press.
   */
  onConnect: () => void;
  theme?: 'light' | 'dark';
}

/* ------------------------------------------------------------------ content */

const PANELS: Record<
  LedgerStep,
  { title: string; body: (p: LedgerSignSheetProps) => string; anim: 'pin' | 'continue' | null; still?: boolean }
> = {
  connect: {
    title: 'Connect your Ledger',
    body: (p) => `Plug in your device to sign as ${p.agentName}.`,
    anim: 'continue',
    // Held at frame 0: the device should sit still, not mime a button press
    // it has not asked for yet.
    still: true,
  },
  pin: {
    title: 'Enter your PIN',
    body: () => 'Unlock the device. Your PIN never leaves it.',
    anim: 'pin',
  },
  review: {
    title: 'Review on your Ledger',
    body: () => 'Check every field on the device screen before approving.',
    anim: 'continue',
  },
  signed: {
    title: 'Signed',
    body: () => 'The capability was scoped, single-use, and is already expiring.',
    anim: null,
  },
};

/* -------------------------------------------------------------- animations */

/**
 * Loads each Lottie once and keeps the players alive for the sheet's lifetime.
 *
 * Re-parsing a 100KB animation on every step change is visible as a stutter at
 * exactly the moment the sheet is meant to feel smooth, so the parse happens
 * once and only playback is toggled afterwards.
 */
function useLedgerAnimations(theme: 'light' | 'dark', enabled: boolean) {
  const hosts = useRef(new Map<string, HTMLDivElement | null>());
  const players = useRef(new Map<string, AnimationItem>());
  const [ready, setReady] = useState(false);

  const setHost = useCallback(
    (key: string) => (el: HTMLDivElement | null) => {
      hosts.current.set(key, el);
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const mounted = players.current;

    (async () => {
      // lottie-web touches `document` on import, so it is only pulled in on the
      // client, after the sheet is actually opened.
      const lottie = (await import('lottie-web')).default;

      const names = ['pin', 'continue'] as const;
      const data = await Promise.all(
        names.map(async (n) => {
          const res = await fetch(`/ledger/${theme}/${n}.json`);
          if (!res.ok) throw new Error(`ledger animation ${n} failed: ${res.status}`);
          return [n, await res.json()] as const;
        }),
      );
      if (cancelled) return;

      for (const [key, host] of hosts.current) {
        if (!host || mounted.has(key)) continue;
        const [, animationData] = data.find(([n]) => key.startsWith(n))!;
        mounted.set(
          key,
          lottie.loadAnimation({
            container: host,
            renderer: 'svg',
            loop: true,
            autoplay: false,
            animationData: structuredClone(animationData),
            rendererSettings: { preserveAspectRatio: 'xMidYMid meet' },
          }),
        );
      }
      setReady(true);
    })().catch((err) => console.error('[ledger] animation load failed', err));

    return () => {
      cancelled = true;
      mounted.forEach((a) => a.destroy());
      mounted.clear();
      setReady(false);
    };
  }, [theme, enabled]);

  /** Only the visible animation runs; the rest stay paused. */
  const sync = useCallback((activeKey: string | null, still: boolean) => {
    players.current.forEach((anim, key) => {
      if (key !== activeKey) return anim.pause();
      if (still) anim.goToAndStop(0, true);
      else anim.play();
    });
  }, []);

  return { setHost, sync, ready };
}

/* ------------------------------------------------------------------- sheet */

export function LedgerSignSheet(props: LedgerSignSheetProps) {
  const { open, step, transaction, signer, onDismiss, onConnect, theme = 'light' } = props;

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const panelRefs = useRef(new Map<LedgerStep, HTMLElement | null>());
  const { setHost, sync, ready } = useLedgerAnimations(theme, open);

  /*
   * Panels are absolutely stacked so they can crossfade over one another, which
   * takes them out of flow — so the card's height has to be set explicitly from
   * whichever panel is active. Without this the card jumps between sizes and
   * the whole effect falls apart.
   */
  const measure = useCallback(() => {
    const panel = panelRefs.current.get(step);
    if (panel && viewportRef.current) viewportRef.current.style.height = `${panel.scrollHeight}px`;
  }, [step]);

  useEffect(() => {
    measure();
    const panel = panelRefs.current.get(step);
    if (!panel) return;
    // Re-measure when the box changes for its own reasons: a font landing late,
    // the window resizing, a longer transaction row wrapping.
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // `ready` re-runs this once the animations have mounted: the first
    // measurement happens while the art is still an empty box.
  }, [measure, step, ready]);

  useEffect(() => {
    const meta = PANELS[step];
    sync(meta.anim ? `${meta.anim}:${step}` : null, Boolean(meta.still));
  }, [step, sync]);

  return (
    <div className="cl-ledger-backdrop" data-open={open} aria-hidden={!open}>
      <section
        className="cl-ledger-sheet"
        data-open={open}
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        aria-label="Sign with your Ledger"
      >
        <button type="button" className="cl-ledger-close" onClick={onDismiss} aria-label="Dismiss">
          ✕
        </button>

        <div className="cl-ledger-viewport" ref={viewportRef}>
          {STEP_ORDER.map((id) => {
            const meta = PANELS[id];
            const active = id === step;
            return (
              <article
                key={id}
                className="cl-ledger-panel"
                data-active={active}
                aria-hidden={!active}
                ref={(el) => {
                  panelRefs.current.set(id, el);
                }}
              >
                <div className="cl-ledger-art">
                  {meta.anim ? (
                    <div ref={setHost(`${meta.anim}:${id}`)} />
                  ) : (
                    <SignedTick />
                  )}
                </div>

                <h2 className="cl-ledger-title">{meta.title}</h2>
                <p className="cl-ledger-sub">{meta.body(props)}</p>

                {id === 'review' ? (
                  <dl className="cl-ledger-tx">
                    <Row label="Action" value={transaction.action} />
                    <Row label="Amount" value={transaction.amount} />
                    <Row label="To" value={transaction.to} />
                    <Row label="Network" value={transaction.network} />
                    <Row
                      label="Policy"
                      value={
                        <span className="cl-ledger-chip" data-tone={transaction.withinPolicy ? 'ok' : 'deny'}>
                          {transaction.withinPolicy ? 'WITHIN LIMITS' : 'REFUSED BY POLICY'}
                        </span>
                      }
                    />
                  </dl>
                ) : null}

                {id === 'signed' ? (
                  <dl className="cl-ledger-tx">
                    <Row label="Signer" value={signer.device} />
                    <Row label="Address" value={signer.address} />
                    {signer.txHash ? <Row label="Tx" value={signer.txHash} /> : null}
                  </dl>
                ) : null}

                {/* Only the first step has anything to press. From there the
                    device moves the sheet, not the page. */}
                {id === 'connect' ? (
                  <button type="button" className="cl-ledger-cta" onClick={onConnect}>
                    Connect
                  </button>
                ) : null}

                {id === 'signed' ? (
                  <button type="button" className="cl-ledger-cta" onClick={onDismiss}>
                    Done
                  </button>
                ) : null}

                <div className="cl-ledger-pips" aria-hidden>
                  {STEP_ORDER.map((p) => (
                    <i key={p} className="cl-ledger-pip" data-on={p === step} />
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="cl-ledger-tx-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function SignedTick() {
  return (
    <svg className="cl-ledger-tick" viewBox="0 0 68 68" fill="none" aria-hidden>
      <circle cx="34" cy="34" r="27" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform="rotate(-90 34 34)" />
      <path d="M22 35.5 l8.5 8.5 L47 26" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
