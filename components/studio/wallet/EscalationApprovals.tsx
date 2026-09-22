'use client';

/**
 * Escalations waiting for a human, and the human's answer.
 *
 * An ESCALATE verdict has a capability issued and an authorization recorded as ESCALATE; the executor
 * will run it only once the approval registry holds the approver's EIP-712 signature over each
 * capability digest. For a WALLET deployment that signature comes from here: the backend returns the
 * typed data, the connected wallet signs it (nothing leaves the wallet but the signature), and the
 * backend relays it and executes. For a STAND_IN deployment the backend signs with the fork's own key,
 * and the panel says which it was. Neither is a Ledger device (BLK-002).
 *
 * Rendered through the wallet runtime so wagmi's hooks exist; the page mounts it only when there is
 * something pending.
 */
import { useState } from 'react';
import { useAccount, useSignTypedData } from 'wagmi';
import { CheckCircle2, XCircle, Wallet } from 'lucide-react';
import { Badge, BlockerBanner, StatusBadge, TimeAgo } from '../primitives';
import { fork as forkApi } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import type { ForkPositionView, PendingEscalation } from '@/lib/studio/api/types';

export function EscalationApprovals({
  deploymentId,
  position,
  onChanged,
}: {
  deploymentId: string;
  position: ForkPositionView;
  onChanged: () => void;
}) {
  const { address, isConnected } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, string>>({});

  const walletMode = position.approver.mode === 'WALLET';
  const approverMatches = !!address && address.toLowerCase() === position.approver.address.toLowerCase();

  const approve = async (p: PendingEscalation) => {
    setError(null);
    setBusy(p.correlationId);
    try {
      let signatures: Array<{ capabilityDigest: string; expiresAt: number; signature: string }> | null = null;
      if (walletMode) {
        if (!isConnected || !address) throw new Error('Connect the approver wallet to sign this escalation.');
        if (!approverMatches) throw new Error(`The connected wallet ${address} is not this deployment's approver ${position.approver.address}.`);
        const typed = await forkApi.approvalTypedData(deploymentId, p.correlationId);
        signatures = [];
        for (const m of typed.messages) {
          const signature = await signTypedDataAsync({
            domain: { name: typed.domain.name, version: typed.domain.version, chainId: typed.domain.chainId, verifyingContract: typed.domain.verifyingContract as `0x${string}` },
            types: typed.types,
            primaryType: typed.primaryType,
            message: { capabilityDigest: m.message.capabilityDigest as `0x${string}`, approver: m.message.approver as `0x${string}`, expiresAt: BigInt(m.message.expiresAt) },
          });
          signatures.push({ capabilityDigest: m.message.capabilityDigest, expiresAt: m.message.expiresAt, signature });
        }
      }
      const r = await forkApi.approve(deploymentId, p.correlationId, signatures);
      setDone((d) => ({ ...d, [p.correlationId]: `executed · ${r.execution.txs.length} fork transaction(s) · signed by ${r.signer}` }));
      onChanged();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const decline = async (p: PendingEscalation) => {
    setError(null);
    setBusy(p.correlationId);
    try {
      await forkApi.decline(deploymentId, p.correlationId, 'declined by the operator');
      setDone((d) => ({ ...d, [p.correlationId]: 'declined — the authorization stays ESCALATE and can never run' }));
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
      {walletMode && (!isConnected || !approverMatches) ? (
        <BlockerBanner tone="warn" title={isConnected ? 'Wrong wallet' : 'Approver wallet not connected'}>
          This deployment's approver is <span className="cl-mono">{position.approver.address}</span>. {isConnected ? `The connected wallet is ${address}.` : 'Connect it to sign escalations.'}
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
              <div style={{ display: 'contents' }}><dt>Amount</dt><dd>${(Number(p.amountUsd6) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd></div>
              <div style={{ display: 'contents' }}><dt>Reason</dt><dd className="cl-mono">{p.reasonCode}</dd></div>
              <div style={{ display: 'contents' }}><dt>Waiting since</dt><dd><TimeAgo iso={new Date(p.sinceMs).toISOString()} /></dd></div>
              <div style={{ display: 'contents' }}><dt>Capabilities</dt><dd className="cl-mono">{p.capabilityIds.map((c) => `${c.slice(0, 10)}…`).join(', ')} · expire {new Date(p.expiresAtUnix * 1000).toLocaleTimeString()}</dd></div>
              <div style={{ display: 'contents' }}><dt>Signer</dt><dd>{walletMode ? <span><Wallet size={12} aria-hidden /> your wallet (Ledger via Ledger Live or MetaMask works) — EIP-712 ContextLockApproval, one signature per capability</span> : position.approver.note}</dd></div>
            </dl>
            {done[p.correlationId] ? (
              <p className="cl-meta" style={{ marginTop: 8 }}>{done[p.correlationId]}</p>
            ) : (
              <div className="cl-row" style={{ marginTop: 12, gap: 8 }}>
                <button type="button" className="cl-btn cl-btn-primary" onClick={() => void approve(p)} disabled={!!busy || (walletMode && !approverMatches)}>
                  <CheckCircle2 size={13} aria-hidden />
                  {busy === p.correlationId ? 'Signing…' : walletMode ? 'Sign & Approve' : 'Approve (stand-in key)'}
                </button>
                <button type="button" className="cl-btn" onClick={() => void decline(p)} disabled={!!busy}>
                  <XCircle size={13} aria-hidden />
                  Decline
                </button>
                {walletMode ? (
                  <Badge tone="neutral" title="The signature is made in your wallet — a Ledger through Ledger Live or MetaMask included. The ContextLock Key Ring (server-side Ledger) is not attached: BLK-002.">Signed in your wallet · Key Ring not attached (BLK-002)</Badge>
                ) : (
                  <Badge tone="blocked">Not a Ledger device · BLK-002</Badge>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
