'use client';

/**
 * Testnet wallet connection for deployment (spec §20).
 *
 * The wallet exists to sign deployment transactions on a testnet. The component
 * therefore states the connected chain explicitly and refuses to present a
 * production chain as usable: connecting on mainnet is reported as a wrong
 * network, not silently accepted.
 *
 * Funding is informational only — links to public faucets, never a claim that
 * value will arrive.
 */
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useEffect, useRef } from 'react';
import { useAccount, useBalance } from 'wagmi';
import { AlertTriangle, ExternalLink, Wallet } from 'lucide-react';
import { Badge, BlockerBanner, KeyValue, StatusBadge } from '../primitives';
import { WALLET_READY, isExecutionChain } from '@/lib/studio/wagmi';

const FAUCETS = [
  { name: 'Google Cloud Sepolia faucet', href: 'https://cloud.google.com/application/web3/faucet/ethereum/sepolia' },
  { name: 'Alchemy Sepolia faucet', href: 'https://www.alchemy.com/faucets/ethereum-sepolia' },
];

export function ConnectTestnetWallet({
  recommendedEth,
  onStateChange,
  role = 'deployer',
}: {
  recommendedEth: number;
  onStateChange?: (state: { connected: boolean; sufficient: boolean; onExecutionChain: boolean }) => void;
  /**
   * What the wallet is for. A deployer pays testnet gas and must be on the execution chain; an
   * approver only signs EIP-712 approvals, for which the connected chain and balance do not matter.
   */
  role?: 'deployer' | 'approver';
}) {
  const { address, isConnected, chain } = useAccount();
  const { data: balance } = useBalance({ address });

  const onExecutionChain = isExecutionChain(chain?.id);
  const balanceEth = balance ? Number(balance.formatted) : null;
  const sufficient = balanceEth !== null && balanceEth >= recommendedEth;

  /* Report state to the parent from an effect, and only when it changes. Calling the parent's
     setState during render with a fresh object each time re-rendered the parent, which re-rendered
     this, forever — the Deploy page froze the moment a wallet was connected. */
  const onStateChangeRef = useRef(onStateChange);
  onStateChangeRef.current = onStateChange;
  useEffect(() => {
    onStateChangeRef.current?.({ connected: isConnected, sufficient, onExecutionChain });
  }, [isConnected, sufficient, onExecutionChain]);

  return (
    <div className="cl-col" style={{ gap: 14 }}>
      {!WALLET_READY ? (
        <BlockerBanner tone="warn" title="WalletConnect project id is not configured">
          Browser-extension wallets still connect. WalletConnect-based wallets stay unavailable until
          <span className="cl-mono"> NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID</span> is set in
          <span className="cl-mono"> frontend/.env.local</span>.
        </BlockerBanner>
      ) : null}

      <ConnectButton.Custom>
        {({ account, chain: rkChain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
          if (!mounted) {
            return <div className="cl-skeleton" style={{ height: 32, width: 220 }} aria-hidden />;
          }

          if (!account || !rkChain) {
            return (
              <div className="cl-row cl-row-wrap" style={{ gap: 10 }}>
                <button type="button" className="cl-btn cl-btn-primary" onClick={openConnectModal}>
                  <Wallet size={13} aria-hidden />
                  Connect Testnet Wallet
                </button>
                <span className="cl-meta">
                  {role === 'approver' ? 'Needed to sign escalation approvals. Nothing is signed without an explicit confirmation.' : 'Needed to sign the deployment transactions. Nothing is signed without an explicit confirmation.'}
                </span>
              </div>
            );
          }

          return (
            <div className="cl-col" style={{ gap: 12 }}>
              <div className="cl-row cl-row-wrap" style={{ gap: 8 }}>
                <button type="button" className="cl-btn" onClick={openAccountModal}>
                  <Wallet size={13} aria-hidden />
                  {account.displayName}
                </button>
                <button type="button" className="cl-btn" onClick={openChainModal}>
                  {rkChain.name ?? `Chain ${rkChain.id}`}
                </button>
                {role === 'approver' ? (
                  <Badge tone="sim">APPROVER</Badge>
                ) : onExecutionChain ? (
                  <Badge tone="sim">TESTNET</Badge>
                ) : (
                  <Badge tone="deny">WRONG NETWORK</Badge>
                )}
              </div>

              {role === 'deployer' && !onExecutionChain ? (
                <BlockerBanner
                  tone="deny"
                  title="Connected wallet is not on the execution network"
                  actions={
                    <button type="button" className="cl-btn cl-btn-sm" onClick={openChainModal}>
                      Switch network
                    </button>
                  }
                >
                  Deployment targets Ethereum Sepolia. A production chain is never an execution target for this
                  project, so a mainnet connection cannot be used to deploy.
                </BlockerBanner>
              ) : null}

              <KeyValue
                rows={
                  role === 'approver'
                    ? [
                        { label: 'Approver address', value: address ?? '—', mono: true },
                        { label: 'Signs', value: 'ContextLockApproval EIP-712 messages for escalated actions — one per capability, in the wallet, on request' },
                        { label: 'Pays', value: 'nothing on the fork' },
                      ]
                    : [
                        { label: 'Deployer address', value: address ?? '—', mono: true },
                        {
                          label: 'Balance',
                          value: balance ? `${Number(balance.formatted).toFixed(5)} ${balance.symbol}` : 'reading…',
                        },
                        { label: 'Recommended balance', value: `${recommendedEth} SepoliaETH` },
                        {
                          label: 'Sufficient',
                          value: <StatusBadge status={sufficient ? 'PASS' : 'BLOCKED'} />,
                        },
                      ]
                }
              />

              {role === 'deployer' && !sufficient ? (
                <div>
                  <div className="cl-label" style={{ marginBottom: 8 }}>
                    Fund testnet wallet
                  </div>
                  <div className="cl-row cl-row-wrap" style={{ gap: 8 }}>
                    {FAUCETS.map((faucet) => (
                      <a
                        key={faucet.href}
                        className="cl-btn cl-btn-sm"
                        href={faucet.href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={11} aria-hidden />
                        {faucet.name}
                      </a>
                    ))}
                  </div>
                  <p className="cl-meta" style={{ marginTop: 8, whiteSpace: 'normal' }}>
                    These are third-party faucets. ContextLock does not distribute test ether and cannot promise that a
                    faucet will fund this address.
                  </p>
                </div>
              ) : null}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}

/** Shown where the wallet has not been mounted, so the page never implies a connection. */
export function WalletUnavailable() {
  return (
    <span className="cl-row" style={{ gap: 8 }}>
      <AlertTriangle size={13} aria-hidden style={{ color: 'var(--cl-warn)' }} />
      <span className="cl-meta">Wallet unavailable on this surface.</span>
    </span>
  );
}
