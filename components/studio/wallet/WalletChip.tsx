'use client';

/**
 * Workspace-level wallet control.
 *
 * Before the session is activated this is a plain button with no wallet code
 * behind it. Once activated, the live chip is loaded separately and reads the
 * real account through wagmi.
 */
import dynamic from 'next/dynamic';
import { Wallet } from 'lucide-react';
import { useWalletSession } from '@/lib/studio/wallet-session';

const WalletChipLive = dynamic(() => import('./WalletChipLive').then((m) => m.WalletChipLive), {
  ssr: false,
  loading: () => (
    <span className="cl-chip" data-static="true">
      <Wallet size={12} aria-hidden />
      Connecting…
    </span>
  ),
});

export function WalletChip() {
  const { activated, requestConnect } = useWalletSession();

  if (!activated) {
    return (
      <button type="button" className="cl-chip" onClick={requestConnect} title="Connect a testnet wallet">
        <Wallet size={12} aria-hidden />
        Connect wallet
      </button>
    );
  }

  return <WalletChipLive />;
}
