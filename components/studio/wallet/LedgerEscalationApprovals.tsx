'use client';

/**
 * Escalation approvals signed on a Ledger over WebHID.
 *
 * The same contract as the browser-wallet path — the backend hands over the EIP-712 typed data,
 * something signs it, the backend relays the signatures and executes — with the device as the
 * signer. The address is read from the device and must be the deployment's approver; the sheet
 * moves only when the hardware reports a state (locked, app open, signed, rejected); and an
 * escalation with two capabilities is two approvals on the device, one per digest, exactly as the
 * approval registry records them.
 *
 * Chrome or Edge, with Ledger Live closed. A rejection on the device is an answer, not an error:
 * the authorization stays ESCALATE and nothing runs.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Usb, XCircle } from 'lucide-react';
import { Badge, BlockerBanner, StatusBadge, TimeAgo } from '../primitives';
import { LedgerSignSheet } from '../ledger/LedgerSignSheet';
import { useLedgerDevice } from '../ledger/useLedgerDevice';
import { fork as forkApi } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import type { ApprovalTypedData, ForkPositionView, PendingEscalation } from '@/lib/studio/api/types';

type Signing = {
  escalation: PendingEscalation;
  typed: ApprovalTypedData;
  /** Index of the message the device is being asked for next. */
  index: number;
  signatures: Array<{ capabilityDigest: string; expiresAt: number; signature: string }>;
  clearSigned: boolean;
};

export function LedgerEscalationApprovals({
  deploymentId,
  position,
  agentName,
  onChanged,
}: {
  deploymentId: string;
  position: ForkPositionView;
  agentName: string;
  onChanged: () => void;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const device = useLedgerDevice(sheetOpen);
  const [signing, setSigning] = useState<Signing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});
  const inFlight = useRef(false);

  const approver = position.approver.address;
  const deviceMatches = !!device.address && device.address.toLowerCase() === approver.toLowerCase();

  const begin = async (p: PendingEscalation) => {
    setError(null);
    try {
      const typed = await forkApi.approvalTypedData(deploymentId, p.correlationId);
      setSigning({ escalation: p, typed, index: 0, signatures: [], clearSigned: true });
      device.reset();
      setSheetOpen(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  /*
   * The device drives the sheet; this effect drives the device. Once the Ethereum app is open and
   * the address is the approver's, ask for the next message. `signTypedData` stays pending for as
   * long as the user is reviewing, which is what the "Review on your Ledger" panel means.
   */
  useEffect(() => {
    if (!signing || !sheetOpen || device.step !== 'review' || device.rejected || inFlight.current) return;
    if (!deviceMatches) return;
    if (signing.index >= signing.typed.messages.length) return;
    inFlight.current = true;
    const m = signing.typed.messages[signing.index]!;
    void (async () => {
      const r = await device.signTypedData({
        domain: signing.typed.domain,
        types: signing.typed.types,
        primaryType: signing.typed.primaryType,
        message: { capabilityDigest: m.message.capabilityDigest, approver: m.message.approver, expiresAt: m.message.expiresAt },
      });
      inFlight.current = false;
      if (!r) return; // rejected or failed: the hook has already said so on the sheet
      const next: Signing = {
        ...signing,
        index: signing.index + 1,
        clearSigned: signing.clearSigned && r.clearSigned,
        signatures: [...signing.signatures, { capabilityDigest: m.message.capabilityDigest, expiresAt: m.message.expiresAt, signature: r.signature }],
      };
      setSigning(next);
      if (next.index < next.typed.messages.length) {
        // More digests to approve on this connection: back to review for the next one.
        device.rearm();
        return;
      }
      try {
        const res = await forkApi.approve(deploymentId, next.escalation.correlationId, next.signatures);
        setDone((d) => ({
          ...d,
          [next.escalation.correlationId]: `executed · ${res.execution.txs.length} fork transaction(s) · ${next.signatures.length} approval(s) signed on ${device.device ?? 'the Ledger'} (${next.clearSigned ? 'clear-signed EIP-712' : 'EIP-712 hashes'})`,
        }));
        onChanged();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : (e as Error).message);
        setSheetOpen(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signing, sheetOpen, device.step, device.rejected, deviceMatches]);

  const decline = async (p: PendingEscalation) => {
    setError(null);
    try {
      await forkApi.decline(deploymentId, p.correlationId, 'declined by the operator');
      setDone((d) => ({ ...d, [p.correlationId]: 'declined — the authorization stays ESCALATE and can never run' }));
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  const current = signing?.typed.messages[Math.min(signing.index, signing.typed.messages.length - 1)] ?? null;
  const usd = (p: PendingEscalation) => `$${(Number(p.amountUsd6) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  const sheetTransaction = useMemo(
    () =>
      signing && current
        ? {
            action: `${signing.escalation.label} — approval ${Math.min(signing.index + 1, signing.typed.messages.length)} of ${signing.typed.messages.length}`,
            amount: usd(signing.escalation),
            to: `${signing.typed.domain.verifyingContract.slice(0, 6)}…${signing.typed.domain.verifyingContract.slice(-4)} (approval registry)`,
            network: `Local Anvil fork · chain ${signing.typed.domain.chainId}`,
            withinPolicy: true,
          }
        : { action: '—', amount: '—', to: '—', network: '—', withinPolicy: true },
    [signing, current],
  );

  return (
    <div className="cl-col" style={{ gap: 10 }}>
      <link rel="stylesheet" href="/styles/ledger-sheet.css" precedence="high" />
      {error ? <BlockerBanner tone="deny" title="Approval not recorded">{error}</BlockerBanner> : null}
      {device.supported === false ? (
        <BlockerBanner tone="warn" title="WebHID unavailable">Signing on a Ledger over USB needs Chrome or Edge. Connect the Ledger through a browser wallet instead (Ledger Live or MetaMask).</BlockerBanner>
      ) : null}
      {device.address && !deviceMatches ? (
        <BlockerBanner tone="warn" title="This Ledger is not the approver">
          The device holds <span className="cl-mono">{device.address}</span>; this deployment's approver is <span className="cl-mono">{approver}</span>. Only the approver's signature is accepted by the registry.
        </BlockerBanner>
      ) : null}
      {position.pending.map((p) => (
        <div key={p.correlationId} className="cl-card" style={{ borderColor: 'var(--cl-warn)' }}>
          <div className="cl-card-head" style={{ background: 'var(--cl-warn-bg)' }}>
            <div className="cl-card-title">{p.label}</div>
            <StatusBadge status="ESCALATE" />
          </div>
          <div className="cl-card-body">
            <dl className="cl-kv">
              <div style={{ display: 'contents' }}><dt>Protocol</dt><dd>{p.protocol}</dd></div>
              <div style={{ display: 'contents' }}><dt>Amount</dt><dd>{usd(p)}</dd></div>
              <div style={{ display: 'contents' }}><dt>Reason</dt><dd className="cl-mono">{p.reasonCode}</dd></div>
              <div style={{ display: 'contents' }}><dt>Waiting since</dt><dd><TimeAgo iso={new Date(p.sinceMs).toISOString()} /></dd></div>
              <div style={{ display: 'contents' }}><dt>Capabilities</dt><dd className="cl-mono">{p.capabilityIds.map((c) => `${c.slice(0, 10)}…`).join(', ')} · expire {new Date(p.expiresAtUnix * 1000).toLocaleTimeString()}</dd></div>
              <div style={{ display: 'contents' }}><dt>Signer</dt><dd><Usb size={12} aria-hidden /> Ledger over USB — one EIP-712 ContextLockApproval per capability, reviewed on the device</dd></div>
            </dl>
            {done[p.correlationId] ? (
              <p className="cl-meta" style={{ marginTop: 8 }}>{done[p.correlationId]}</p>
            ) : (
              <div className="cl-row" style={{ marginTop: 12, gap: 8 }}>
                <button type="button" className="cl-btn cl-btn-primary" onClick={() => void begin(p)} disabled={sheetOpen}>
                  <CheckCircle2 size={13} aria-hidden />
                  Sign on Ledger
                </button>
                <button type="button" className="cl-btn" onClick={() => void decline(p)} disabled={sheetOpen}>
                  <XCircle size={13} aria-hidden />
                  Decline
                </button>
                <Badge tone="neutral" title="The approval is signed on the hardware device over WebHID. The ContextLock Key Ring (server-side Ledger) is not attached: BLK-002.">Hardware-signed · Key Ring not attached (BLK-002)</Badge>
              </div>
            )}
          </div>
        </div>
      ))}

      {signing ? (
        <LedgerSignSheet
          open={sheetOpen}
          step={device.step}
          onConnect={device.requestPermission}
          onDismiss={() => setSheetOpen(false)}
          agentName={agentName}
          transaction={sheetTransaction}
          signer={{
            device: device.device ?? 'Ledger',
            address: device.address ? `${device.address.slice(0, 6)}…${device.address.slice(-4)}` : '—',
            txHash: device.signature ? `${device.signature.r.slice(0, 10)}…` : undefined,
          }}
        />
      ) : null}
      {sheetOpen && signing ? (
        <p className="cl-meta" style={{ whiteSpace: 'normal' }}>
          {device.hint ?? (device.address ? `Device ${device.device} · ${device.address}` : 'Waiting for the device…')}
          {device.rejected ? (
            <>
              {' '}
              <button type="button" className="cl-btn cl-btn-sm" onClick={() => { device.rearm(); }}>Ask again</button>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
