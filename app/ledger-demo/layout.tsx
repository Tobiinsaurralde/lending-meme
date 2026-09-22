import type { ReactNode } from 'react';

export default function LedgerDemoLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <link rel="stylesheet" href="/styles/studio.css" precedence="high" />
      {children}
    </>
  );
}
