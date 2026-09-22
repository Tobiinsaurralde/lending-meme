'use client';

/**
 * Wallet runtime gate.
 *
 * Renders children untouched until the session is activated, then mounts the
 * wagmi + RainbowKit runtime around them. Because the runtime arrives through
 * next/dynamic it lives in its own chunk: a route that never connects a wallet
 * never downloads those ~7,000 modules, while a connected visitor gets the
 * wallet everywhere in the app rather than only on Deploy.
 */
import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';
import { useWalletSession } from '@/lib/studio/wallet-session';

const WalletRuntime = dynamic(() => import('./WalletRuntime').then((m) => m.WalletRuntime), {
  ssr: false,
  // The workspace stays usable while the wallet chunk loads.
  loading: () => null,
});

export function WalletProvider({ children }: { children: ReactNode }) {
  const { activated } = useWalletSession();

  if (!activated) return <>{children}</>;
  return <WalletRuntime>{children}</WalletRuntime>;
}
