'use client';

/**
 * Escalation approvals for a STAND_IN deployment: the fork's own approver key signs on the server.
 * No wallet is involved, and the panel says so on every row. Not a Ledger device (BLK-002).
 */
import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Badge, BlockerBanner, StatusBadge, TimeAgo } from '../primitives';
import { fork as forkApi } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import type { ForkPositionView, PendingEscalation } from '@/lib/studio/api/types';

export function StandInApprovals({ deploymentId, position, onChanged }: { deploymentId: string; position: ForkPositionView; onChanged: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});

  const act = async (p: PendingEscalation, approve: boolean) => {
    setError(null);
    setBusy(p.correlationId);
    try {
      if (approve) {
        const r = await forkApi.approve(deploymentId, p.correlationId, null);
        setDone((d) => ({ ...d, [p.correlationId]: `executed · ${r.execution.txs.length} fork transaction(s) · signed by ${r.signer}` }));
      } else {
        await forkApi.decline(deploymentId, p.correlationId, 'declined by the operator');
        setDone((d) => ({ ...d, [p.correlationId]: 'declined — the authorization stays ESCALATE and can never run' }));
      }
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="cl-col" style={{ gap: 10 }}>
      {error ? <BlockerBanner tone="deny" title="Approval not recorded">{error}</BlockerBanner> : null}
      {position.pending.map((p) => (
        <div key={p.correlationId} className="cl-card" style={{ borderColor: 'var(--cl-warn)' }}>
          <div className="cl-card-head" style={{ background: 'var(--cl-warn-bg)' }}>
            <div className="cl-card-title">{p.label}</div>
            <StatusBadge status="ESCALATE" />
          </div>
          <div className="cl-card-body">
            <dl className="cl-kv">
              <div style={{ display: 'contents' }}><dt>Protocol</dt><dd>{p.protocol}</dd></div>
              <div style={{ display: 'contents' }}><dt>Amount</dt><dd>${(Number(p.amountUsd6) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd></div>
              <div style={{ display: 'contents' }}><dt>Reason</dt><dd className="cl-mono">{p.reasonCode}</dd></div>
              <div style={{ display: 'contents' }}><dt>Waiting since</dt><dd><TimeAgo iso={new Date(p.sinceMs).toISOString()} /></dd></div>
              <div style={{ display: 'contents' }}><dt>Signer</dt><dd>{position.approver.note}</dd></div>
            </dl>
            {done[p.correlationId] ? (
              <p className="cl-meta" style={{ marginTop: 8 }}>{done[p.correlationId]}</p>
            ) : (
              <div className="cl-row" style={{ marginTop: 12, gap: 8 }}>
                <button type="button" className="cl-btn cl-btn-primary" onClick={() => void act(p, true)} disabled={!!busy}>
                  <CheckCircle2 size={13} aria-hidden />
                  {busy === p.correlationId ? 'Recording…' : 'Approve (stand-in key)'}
                </button>
                <button type="button" className="cl-btn" onClick={() => void act(p, false)} disabled={!!busy}>
                  <XCircle size={13} aria-hidden />
                  Decline
                </button>
                <Badge tone="blocked">Not a Ledger device · BLK-002</Badge>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
