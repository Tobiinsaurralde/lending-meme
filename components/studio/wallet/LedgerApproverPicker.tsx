'use client';

/**
 * Pick a Ledger's address as the escalation approver, before deploying.
 *
 * The approver is fixed at deployment and cannot be changed after, so the address has to come
 * from the device that will later sign — read over WebHID from the Ethereum app, never typed.
 * Nothing is signed here; the device only answers `getAddress`.
 */
import { useState } from 'react';
import { Usb, CheckCircle2 } from 'lucide-react';
import { useLedgerDevice } from '../ledger/useLedgerDevice';

export function LedgerApproverPicker({
  chosen,
  onChoose,
}: {
  /** The Ledger address currently chosen as approver, if any. */
  chosen: string | null;
  onChoose: (address: string | null) => void;
}) {
  const [reading, setReading] = useState(false);
  const device = useLedgerDevice(reading);

  if (chosen) {
    return (
      <div className="cl-row cl-row-wrap" style={{ gap: 10, alignItems: 'center' }}>
        <CheckCircle2 size={13} aria-hidden style={{ color: 'var(--cl-pass)' }} />
        <span className="cl-meta" style={{ whiteSpace: 'normal' }}>
          Ledger <span className="cl-mono">{chosen}</span> will be the approver; escalations are signed on the device.
        </span>
        <button type="button" className="cl-btn cl-btn-sm" onClick={() => { onChoose(null); setReading(false); }}>Use the browser wallet instead</button>
      </div>
    );
  }

  if (!reading) {
    return (
      <div className="cl-row cl-row-wrap" style={{ gap: 10, alignItems: 'center' }}>
        <button type="button" className="cl-btn" onClick={() => setReading(true)}>
          <Usb size={13} aria-hidden />
          Use a Ledger as approver
        </button>
        <span className="cl-meta" style={{ flex: '1 1 260px', whiteSpace: 'normal' }}>
          Reads the first Ethereum address off the device over USB (Chrome or Edge, Ledger Live closed). Escalations are then reviewed and signed on the device itself.
        </span>
      </div>
    );
  }

  return (
    <div className="cl-col" style={{ gap: 8 }}>
      {device.supported === false ? (
        <p className="cl-meta" style={{ whiteSpace: 'normal' }}>WebHID needs Chrome or Edge. Connect the Ledger through Ledger Live or MetaMask and use it as the browser wallet instead.</p>
      ) : null}
      <dl className="cl-kv">
        <div style={{ display: 'contents' }}><dt>Device</dt><dd>{device.device ?? '—'}</dd></div>
        <div style={{ display: 'contents' }}><dt>State</dt><dd className="cl-mono">{device.step}</dd></div>
        <div style={{ display: 'contents' }}><dt>Address</dt><dd className="cl-mono">{device.address ?? '—'}</dd></div>
      </dl>
      {device.hint ? <p className="cl-meta" style={{ whiteSpace: 'normal' }}>{device.hint}</p> : null}
      {device.error ? <p className="cl-meta" style={{ whiteSpace: 'normal', color: 'var(--cl-deny)' }}>{device.error}</p> : null}
      <div className="cl-row" style={{ gap: 8 }}>
        {device.step === 'connect' ? (
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => void device.requestPermission()}>
            <Usb size={13} aria-hidden />
            Connect device
          </button>
        ) : null}
        {device.address ? (
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => onChoose(device.address)}>
            <CheckCircle2 size={13} aria-hidden />
            Use this Ledger as approver
          </button>
        ) : null}
        <button type="button" className="cl-btn cl-btn-sm" onClick={() => setReading(false)}>Cancel</button>
      </div>
    </div>
  );
}
