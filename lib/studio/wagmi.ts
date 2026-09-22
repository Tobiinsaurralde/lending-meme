/**
 * Wallet configuration (RainbowKit + wagmi).
 *
 * Execution is testnet-only: the chains registered here are testnets, plus
 * mainnet strictly as a read-only data source. There is no mainnet write path
 * in the product, and no surface offers one.
 *
 * Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in frontend/.env.local
 * (get one at https://cloud.reown.com). Without it, injected wallets still work;
 * WalletConnect-based wallets are unavailable until it is set.
 */
import { getDefaultConfig, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { ledgerWallet } from '@rainbow-me/rainbowkit/wallets';
import { baseSepolia, mainnet, sepolia } from 'wagmi/chains';
import { http } from 'wagmi';

export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? '';

export const WALLET_READY = WALLETCONNECT_PROJECT_ID.length > 0;

/** Chains the agent may execute on. Mainnet is never in this list. */
export const EXECUTION_CHAIN_IDS: number[] = [sepolia.id, baseSepolia.id];

export function isExecutionChain(chainId: number | undefined): boolean {
  return chainId !== undefined && EXECUTION_CHAIN_IDS.includes(chainId);
}

/**
 * The wallets offered by the connect dialog: RainbowKit's defaults plus Ledger, which signs
 * escalation approvals on the device through Ledger Live (WalletConnect; needs the project id).
 * A Ledger paired to MetaMask works through the MetaMask entry as well.
 */
const wallets = [
  ...getDefaultWallets().wallets,
  { groupName: 'Hardware', wallets: [ledgerWallet] },
];

export const wagmiConfig = getDefaultConfig({
  appName: 'ContextLock Studio',
  // RainbowKit requires a non-empty id; the guard above is what the UI reports on.
  projectId: WALLETCONNECT_PROJECT_ID || 'contextlock-studio-local',
  wallets,
  chains: [sepolia, baseSepolia, mainnet],
  transports: {
    [sepolia.id]: http(),
    [baseSepolia.id]: http(),
    // Mainnet is registered for read-only market data only.
    [mainnet.id]: http(),
  },
  ssr: true,
});
