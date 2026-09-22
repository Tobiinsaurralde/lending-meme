import type { ReactNode } from 'react';
import { ServerStateProvider } from '@/components/studio/ServerStateProvider';
import { WalletSessionProvider } from '@/lib/studio/wallet-session';
import { WalletProvider } from '@/components/studio/wallet/WalletProvider';

/**
 * The wallet is a workspace connection, so its session lives at the top of the
 * /projects tree rather than inside the workbench. Connecting on the projects
 * list and walking into a project is one session, not two — and the connected
 * address is the identity every API request carries.
 *
 * WalletProvider still keeps the heavy runtime behind a dynamic import, so this
 * costs nothing until someone actually connects.
 */
export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/styles/studio.css" precedence="high" />
      <ServerStateProvider>
        <WalletSessionProvider>
          <WalletProvider>{children}</WalletProvider>
        </WalletSessionProvider>
      </ServerStateProvider>
    </>
  );
}
