'use client';

/**
 * Ledger signing sheet, driven end to end by the device.
 *
 * Every step is a state the hardware reported: the PIN panel because the device
 * answered LOCKED, the review panel because the Ethereum app returned an
 * address, the signed panel because a signature came back.
 *
 * The transaction is signed but deliberately NOT broadcast — no funds are
 * needed and nothing is spent. The signature is real and verifiable either way.
 *
 * Chrome or Edge, over localhost or https, with Ledger Live closed.
 */
import { useEffect, useState } from 'react';
import { LedgerSignSheet } from '@/components/studio/ledger/LedgerSignSheet';
import { useLedgerDevice, type UnsignedTx } from '@/components/studio/ledger/useLedgerDevice';

/** What the device will display and sign. A plain Sepolia transfer, so it
 *  needs no blind signing and every field is readable on the device screen. */
const DEMO_TX: UnsignedTx = {
  chainId: 11155111, // Ethereum Sepolia
  nonce: 0,
  to: '0xCBd9417e2c8b05d3f6a91e4c7b2d8f0a5e937F24',
  value: 740_000_000_000_000n, // 0.00074 ETH
  gas: 21_000n,
  maxFeePerGas: 30_000_000_000n,
  maxPriorityFeePerGas: 1_500_000_000n,
};

export default function LedgerDemoPage() {
  const [open, setOpen] = useState(true);
  const device = useLedgerDevice(open);

  /*
   * The moment the Ethereum app is open, hand the transaction over. The device
   * then shows its own confirmation screens, and `sign` stays pending for
   * exactly as long as the user is reviewing — which is what makes the
   * "Review on your Ledger" panel literally true rather than a guess.
   */
  useEffect(() => {
    if (device.step === 'review' && !device.rejected && !device.signature) {
      void device.sign(DEMO_TX);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [device.step, device.rejected, device.signature]);

  return (
    <div
      className="cl-studio"
      style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', alignContent: 'center', gap: 16, background: 'var(--cl-canvas)' }}
    >
      <link rel="stylesheet" href="/styles/ledger-sheet.css" precedence="high" />

      {!open ? (
        <button type="button" className="cl-btn cl-btn-primary" onClick={() => { device.reset(); setOpen(true); }}>
          Sign with Ledger
        </button>
      ) : null}

      {/* Evidence panel. These values come off the device, which is what
          separates this from a scripted sequence. */}
      <div className="cl-card" style={{ minWidth: 400, maxWidth: 480 }}>
        <div className="cl-card-body">
          <div className="cl-label" style={{ marginBottom: 8 }}>Read from the device</div>
          <dl className="cl-kv">
            <dt>WebHID</dt>
            <dd>{device.supported ? 'available' : 'unsupported browser'}</dd>
            <dt>Device</dt>
            <dd>{device.device ?? '—'}</dd>
            <dt>State</dt>
            <dd className="cl-mono">{device.step}</dd>
            <dt>Address</dt>
            <dd className="cl-mono" style={{ fontSize: 11.5 }}>{device.address ?? '—'}</dd>
            <dt>Signature r</dt>
            <dd className="cl-mono" style={{ fontSize: 11 }}>{device.signature?.r ?? '—'}</dd>
          </dl>
          {device.hint ? <p className="cl-meta" style={{ marginTop: 10 }}>{device.hint}</p> : null}
          {device.error ? <p className="cl-meta" style={{ marginTop: 6, color: 'var(--cl-deny)' }}>{device.error}</p> : null}
          {device.rejected ? (
            <div className="cl-row" style={{ marginTop: 10, gap: 8 }}>
              <button type="button" className="cl-btn cl-btn-sm" onClick={() => void device.sign(DEMO_TX)}>
                Ask again
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <p className="cl-meta">Signed, not broadcast · animations © Ledger · MIT</p>

      <LedgerSignSheet
        open={open}
        step={device.step}
        onConnect={device.requestPermission}
        onDismiss={() => setOpen(false)}
        agentName="guardian.treasury.ctxlock.eth"
        transaction={{
          action: 'Repay USDC debt',
          amount: '0.00074 ETH',
          to: '0xCBd9…7F24',
          network: 'Ethereum Sepolia',
          withinPolicy: true,
        }}
        signer={{
          device: device.device ?? 'Ledger',
          address: device.address ? `${device.address.slice(0, 6)}…${device.address.slice(-4)}` : '—',
          txHash: device.signature ? `${device.signature.r.slice(0, 10)}…` : undefined,
        }}
      />
    </div>
  );
}
