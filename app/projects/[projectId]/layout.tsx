import { Suspense, type ReactNode } from 'react';
import { StudioProviders } from '@/components/studio/StudioProviders';
import { StudioShell } from '@/components/studio/StudioShell';
import { StudioProjectProvider } from '@/lib/studio/api/project-context';

export const metadata = {
  title: 'ContextLock Studio',
  description: 'Agentic IDE for designing, proving, deploying and operating financial agents.',
};

/**
 * Workbench layout. Every project route renders inside the persistent
 * three-column shell; the landing page at "/" is untouched by this tree.
 */
export default function ProjectLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Workbench styles layer on top of the site's tokens from webflow.css */}
      <link rel="stylesheet" href="/styles/studio.css" precedence="high" />
      <StudioProviders>
        <Suspense fallback={<ShellFallback />}>
          <StudioProjectProvider>
            <StudioShell>{children}</StudioShell>
          </StudioProjectProvider>
        </Suspense>
      </StudioProviders>
    </>
  );
}

function ShellFallback() {
  return (
    <div
      className="cl-studio"
      style={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', background: 'var(--cl-canvas)' }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--serif)', fontSize: 24, letterSpacing: '-0.4px' }}>ContextLock Studio</div>
        <div className="cl-meta" style={{ marginTop: 8 }}>
          Loading workspace…
        </div>
      </div>
    </div>
  );
}
