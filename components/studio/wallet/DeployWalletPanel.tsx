'use client';

/**
 * Deploy's wallet panel.
 *
 * The wallet runtime only exists once the workspace session is activated, so
 * this renders a connect prompt until then and the live panel afterwards. That
 * keeps wagmi hooks strictly inside the runtime while letting Deploy offer the
 * connection like any other surface.
 */
import dynamic from 'next/dynamic';
import { Wallet } from 'lucide-react';
import { useWalletSession } from '@/lib/studio/wallet-session';

/* Dynamic, not a static import: a static one would pull RainbowKit and wagmi
   back into this route's own bundle, which is exactly what the session gate
   exists to avoid. */
const ConnectTestnetWallet = dynamic(
  () => import('./ConnectTestnetWallet').then((m) => m.ConnectTestnetWallet),
  { ssr: false, loading: () => <span className="cl-meta">Loading wallet…</span> },
);

export function DeployWalletPanel({
  recommendedEth,
  onStateChange,
  role = 'deployer',
}: {
  recommendedEth: number;
  onStateChange?: (state: { connected: boolean; sufficient: boolean; onExecutionChain: boolean }) => void;
  role?: 'deployer' | 'approver';
}) {
  const { activated, requestConnect } = useWalletSession();

  if (!activated) {
    return (
      <div className="cl-row cl-row-wrap" style={{ gap: 12 }}>
        <button type="button" className="cl-btn cl-btn-primary" onClick={requestConnect}>
          <Wallet size={13} aria-hidden />
          {role === 'approver' ? 'Connect Approver Wallet' : 'Connect Testnet Wallet'}
        </button>
        <span className="cl-meta" style={{ flex: '1 1 260px', whiteSpace: 'normal' }}>
          {role === 'approver'
            ? 'Its address becomes the escalation approver at deployment. The connection is shared across the workspace, and nothing is signed without an explicit confirmation.'
            : 'Needed to sign the deployment transactions. The connection is shared across the workspace, and nothing is signed without an explicit confirmation.'}
        </span>
      </div>
    );
  }

  return <ConnectTestnetWallet recommendedEth={recommendedEth} onStateChange={onStateChange} role={role} />;
}
