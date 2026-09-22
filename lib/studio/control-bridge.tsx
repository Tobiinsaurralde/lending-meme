'use client';

/**
 * Control bridge.
 *
 * The Context Agent and the command palette may *request* that a security
 * control be opened; only the owning page may render its native deterministic
 * dialog. This bridge carries the request and nothing else — no execution path
 * passes through it (spec §6.4, §4.5).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { ControlCommand } from './types';

interface ControlBridgeValue {
  /** Control the page should open, if any. */
  pending: ControlCommand | null;
  /** Ask the owning page to open a control's confirmation dialog. */
  requestControl: (control: ControlCommand) => void;
  /** Called by the page once it has opened the dialog. */
  consume: () => void;
}

const ControlBridgeContext = createContext<ControlBridgeValue | null>(null);

export function ControlBridgeProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ControlCommand | null>(null);

  const requestControl = useCallback((control: ControlCommand) => setPending(control), []);
  const consume = useCallback(() => setPending(null), []);

  const value = useMemo(() => ({ pending, requestControl, consume }), [pending, requestControl, consume]);
  return <ControlBridgeContext.Provider value={value}>{children}</ControlBridgeContext.Provider>;
}

export function useControlBridge(): ControlBridgeValue {
  const ctx = useContext(ControlBridgeContext);
  if (!ctx) throw new Error('useControlBridge must be used inside <ControlBridgeProvider>');
  return ctx;
}

/**
 * Page-side helper: when `control` is requested, invoke `open` once and clear.
 */
export function useControlRequest(control: ControlCommand, open: () => void) {
  const { pending, consume } = useControlBridge();
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    if (pending !== control) return;
    openRef.current();
    consume();
  }, [pending, control, consume]);
}
