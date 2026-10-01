'use client';

/**
 * Wallet runtime gate.
 *
 * Renders children untouched until the session is booting, then mounts the
 * wagmi + RainbowKit runtime around them. The runtime chunk loads behind the
 * page that is already on screen. `activated` flips only after that runtime
 * is wrapped around the same children, so nothing calls wagmi too early and
 * the desk never drops out to the empty body colour.
 */
import dynamic from 'next/dynamic';
import { useLayoutEffect, type ReactNode } from 'react';
import { useWalletSession } from '@/lib/studio/wallet-session';

const shown = { current: null as ReactNode };

function KeepPage() {
  return <>{shown.current}</>;
}

function Activate({ children }: { children: ReactNode }) {
  const { markReady } = useWalletSession();
  useLayoutEffect(() => {
    markReady();
  }, [markReady]);
  return children;
}

const WalletRuntime = dynamic(
  () =>
    import('./WalletRuntime').then((mod) => {
      function Loaded({ children }: { children: ReactNode }) {
        const Runtime = mod.WalletRuntime;
        return (
          <Activate>
            <Runtime>{children}</Runtime>
          </Activate>
        );
      }
      return Loaded;
    }),
  {
    ssr: false,
    loading: KeepPage,
  },
);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { booting } = useWalletSession();
  shown.current = children;
  if (!booting) return <>{children}</>;
  return <WalletRuntime>{children}</WalletRuntime>;
}
