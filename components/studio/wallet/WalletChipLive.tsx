'use client';

/**
 * The connected wallet chip. Only ever rendered inside the wallet runtime, so
 * wagmi hooks are available here.
 *
 * A wallet on a production chain is reported as a wrong network rather than
 * shown as simply "connected" — mainnet is never an execution target.
 */
import { useEffect } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet } from 'lucide-react';
import { useWalletSession } from '@/lib/studio/wallet-session';
import { isExecutionChain } from '@/lib/studio/wagmi';

export function WalletChipLive() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => (
        <ChipBody
          ready={mounted}
          label={account?.displayName}
          chainId={chain?.id}
          chainName={chain?.name}
          onAccount={openAccountModal}
          onChain={openChainModal}
          onConnect={openConnectModal}
        />
      )}
    </ConnectButton.Custom>
  );
}

function ChipBody({
  ready,
  label,
  chainId,
  chainName,
  onAccount,
  onChain,
  onConnect,
}: {
  ready: boolean;
  label?: string;
  chainId?: number;
  chainName?: string;
  onAccount: () => void;
  onChain: () => void;
  onConnect: () => void;
}) {
  const { autoOpen, consumeAutoOpen } = useWalletSession();

  /* The user clicked Connect before the runtime existed; open the modal now
     that it does, then clear the request so it fires once. */
  useEffect(() => {
    if (!ready || !autoOpen) return;
    if (!label) onConnect();
    consumeAutoOpen();
  }, [ready, autoOpen, label, onConnect, consumeAutoOpen]);

  if (!ready) {
    return (
      <span className="cl-chip" data-static="true">
        <Wallet size={12} aria-hidden />
        Connecting…
      </span>
    );
  }

  if (!label) {
    return (
      <button type="button" className="cl-chip" onClick={onConnect}>
        <Wallet size={12} aria-hidden />
        Connect wallet
      </button>
    );
  }

  const onTestnet = isExecutionChain(chainId);

  return (
    <span className="cl-row" style={{ gap: 6 }}>
      <button type="button" className="cl-chip" onClick={onAccount} title={`Connected on ${chainName ?? 'unknown network'}`}>
        <Wallet size={12} aria-hidden />
        {label}
      </button>
      <button
        type="button"
        className="cl-chip"
        onClick={onChain}
        title={onTestnet ? 'Execution network' : 'Not the execution network — deployment targets a testnet'}
        style={onTestnet ? undefined : { borderColor: '#f5776d', color: '#f5776d' }}
      >
        {onTestnet ? (chainName ?? 'testnet') : 'wrong network'}
      </button>
    </span>
  );
}
