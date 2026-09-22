'use client';

/**
 * The actual wagmi + RainbowKit mount. Imported only through <WalletProvider>,
 * so this module — and the ~7,000 modules behind it — stays out of every route
 * that never touches a wallet.
 */
import { useEffect, type ReactNode } from 'react';
import { WagmiProvider, useAccount } from 'wagmi';
import { RainbowKitProvider, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { wagmiConfig } from '@/lib/studio/wagmi';
import { setSessionAddress } from '@/lib/studio/api/session';

/** RainbowKit restyled onto the site palette so the modal matches the workbench. */
const walletTheme = lightTheme({
  accentColor: '#0042af',
  accentColorForeground: '#fef1d0',
  borderRadius: 'none',
  fontStack: 'system',
  overlayBlur: 'small',
});

/**
 * Mirrors the connected account into the workspace session.
 *
 * The session store is what the API client reads for `x-studio-user`; wagmi only knows the account
 * inside this runtime. A disconnect clears it, and the next request is anonymous again.
 */
function SessionSync() {
  const { address, isConnected } = useAccount();
  useEffect(() => {
    setSessionAddress(isConnected && address ? address : null);
  }, [address, isConnected]);
  return null;
}

export function WalletRuntime({ children }: { children: ReactNode }) {
  /*
   * No QueryClientProvider of its own. wagmi's hooks use the nearest TanStack client, and the
   * workspace already provides one above this runtime (ServerStateProvider). A nested client here
   * would shadow it for every page below — the API hooks would silently land in a second cache the
   * session-change invalidation never reaches.
   */
  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider theme={walletTheme} modalSize="compact" showRecentTransactions={false}>
        <SessionSync />
        {children}
      </RainbowKitProvider>
    </WagmiProvider>
  );
}
