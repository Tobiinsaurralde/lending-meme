import type { ReactNode } from 'react';
import { ServerStateProvider } from '@/components/studio/ServerStateProvider';
import { WalletSessionProvider } from '@/lib/studio/wallet-session';
import { WalletProvider } from '@/components/studio/wallet/WalletProvider';

/**
 * Shared shell for every BagFi desk. Section changes stay inside this layout,
 * so the navy ground and the wallet runtime do not unmount between pages.
 */
export default function DeskLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/styles/studio.css" precedence="high" />
      <link rel="stylesheet" href="/styles/market.css?v=26" precedence="high" />
      <style>{`
        html, body.body { background-color: #10246e; }
      `}</style>
      <ServerStateProvider>
        <WalletSessionProvider>
          <WalletProvider>
            <div className="lm-market" style={{ minHeight: '100vh' }}>
              {children}
            </div>
          </WalletProvider>
        </WalletSessionProvider>
      </ServerStateProvider>
    </>
  );
}
