'use client';

/**
 * The escalation panel's gate.
 *
 * A STAND_IN deployment (no wallet was connected at deploy time) is signed by the backend, so no
 * wallet runtime is needed. A WALLET deployment is signed by the approver, and the approver picks
 * how: the browser wallet (wagmi, mounted on demand — a Ledger through Ledger Live or MetaMask
 * arrives this way too), or a Ledger directly over USB (WebHID; Chrome or Edge). Both produce the
 * same EIP-712 signatures and both must be the deployment's approver address; the choice is only
 * which piece of hardware shows the fields.
 */
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Usb, Wallet } from 'lucide-react';
import { useWalletSession } from '@/lib/studio/wallet-session';
import { BlockerBanner } from '../primitives';
import type { ForkPositionView } from '@/lib/studio/api/types';
import { StandInApprovals } from './StandInApprovals';

const EscalationApprovals = dynamic(() => import('./EscalationApprovals').then((m) => m.EscalationApprovals), {
  ssr: false,
  loading: () => <span className="cl-meta">Loading the approver…</span>,
});

const LedgerEscalationApprovals = dynamic(() => import('./LedgerEscalationApprovals').then((m) => m.LedgerEscalationApprovals), {
  ssr: false,
  loading: () => <span className="cl-meta">Loading the Ledger bridge…</span>,
});

type Route = 'wallet' | 'ledger';

export function EscalationPanel({
  deploymentId,
  position,
  agentName = 'the agent',
  onChanged,
}: {
  deploymentId: string;
  position: ForkPositionView;
  agentName?: string;
  onChanged: () => void;
}) {
  const { activated, requestConnect } = useWalletSession();
  const [route, setRoute] = useState<Route>('wallet');

  if (position.approver.mode !== 'WALLET') {
    return <StandInApprovals deploymentId={deploymentId} position={position} onChanged={onChanged} />;
  }

  const selector = (
    <div className="cl-row" style={{ gap: 6, marginBottom: 10 }} role="tablist" aria-label="How to sign">
      <button type="button" role="tab" aria-selected={route === 'wallet'} className={`cl-btn cl-btn-sm${route === 'wallet' ? ' cl-btn-primary' : ''}`} onClick={() => setRoute('wallet')}>
        <Wallet size={12} aria-hidden />
        Browser wallet
      </button>
      <button type="button" role="tab" aria-selected={route === 'ledger'} className={`cl-btn cl-btn-sm${route === 'ledger' ? ' cl-btn-primary' : ''}`} onClick={() => setRoute('ledger')}>
        <Usb size={12} aria-hidden />
        Ledger over USB
      </button>
      <span className="cl-meta" style={{ whiteSpace: 'normal' }}>
        Approver <span className="cl-mono">{position.approver.address.slice(0, 6)}…{position.approver.address.slice(-4)}</span> — the same EIP-712 signature either way.
      </span>
    </div>
  );

  if (route === 'ledger') {
    return (
      <div>
        {selector}
        <LedgerEscalationApprovals deploymentId={deploymentId} position={position} agentName={agentName} onChanged={onChanged} />
      </div>
    );
  }

  if (!activated) {
    return (
      <div>
        {selector}
        <BlockerBanner
          tone="warn"
          title="Approver wallet not connected"
          actions={
            <button type="button" className="cl-btn cl-btn-sm cl-btn-primary" onClick={requestConnect}>
              <Wallet size={12} aria-hidden />
              Connect wallet
            </button>
          }
        >
          {position.pending.length} escalation{position.pending.length === 1 ? '' : 's'} waiting. This deployment's approver is{' '}
          <span className="cl-mono">{position.approver.address}</span>; its signature is the only one the approval registry accepts.
        </BlockerBanner>
      </div>
    );
  }
  return (
    <div>
      {selector}
      <EscalationApprovals deploymentId={deploymentId} position={position} onChanged={onChanged} />
    </div>
  );
}
