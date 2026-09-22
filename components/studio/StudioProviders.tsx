'use client';

/**
 * Client providers for every workbench route.
 *
 *  - WorkbenchProvider     local UI state
 *  - ControlBridgeProvider carries "open this control" requests to the page
 *
 * Server state (TanStack Query) and the wallet session live one level up, in app/projects/layout,
 * so the projects list and the workbench share a single cache and a single wallet connection.
 */
import type { ReactNode } from 'react';
import { WorkbenchProvider } from '@/lib/studio/workbench';
import { ControlBridgeProvider } from '@/lib/studio/control-bridge';

export function StudioProviders({ children }: { children: ReactNode }) {
  return (
    <WorkbenchProvider>
      <ControlBridgeProvider>{children}</ControlBridgeProvider>
    </WorkbenchProvider>
  );
}
