'use client';

/**
 * Wallet session — the light half.
 *
 * The wallet is a workspace-level connection, not a Deploy-only detail: you
 * connect once and stay connected across the app. But the runtime behind it
 * (wagmi + RainbowKit + viem + WalletConnect) is roughly 7,000 modules, and
 * mounting that on every route is what made pages slow.
 *
 * So the session splits in two:
 *  - this context, which imports nothing heavy and only tracks whether the
 *    wallet runtime should exist at all;
 *  - the runtime itself, dynamically imported and mounted only once the session
 *    is active.
 *
 * A returning visitor activates after hydration, once the runtime chunk is
 * loaded. The first paint matches the server (public shell). The page is not
 * unmounted while that chunk arrives.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface WalletSessionValue {
  /** True once wagmi is mounted and hooks are safe to call. */
  activated: boolean;
  /** True once the runtime chunk should start loading. The page stays up. */
  booting: boolean;
  /** Set when the user asked to connect, so the runtime can open its modal. */
  autoOpen: boolean;
  /** Starts the runtime and asks it to open the connect modal. */
  requestConnect: () => void;
  /** Called by the runtime once it has handled the open request. */
  consumeAutoOpen: () => void;
  /** Called once the runtime is wrapped around the page. */
  markReady: () => void;
}

const WalletSessionContext = createContext<WalletSessionValue | null>(null);

/** wagmi v2 persists its connection here; presence means "reconnect me". */
function hasPersistedConnection(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = window.localStorage.getItem('wagmi.store');
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { state?: { connections?: { value?: unknown[] } } };
    const connections = parsed?.state?.connections?.value;
    return Array.isArray(connections) ? connections.length > 0 : Boolean(connections);
  } catch {
    return false;
  }
}

export function WalletSessionProvider({ children }: { children: ReactNode }) {
  // The server cannot know whether this visitor connected before, and the runtime is client-only;
  // so the first render is always "not activated" on both sides and a previously connected visitor
  // activates right after hydration. Reading storage in the initializer would render a different
  // tree on the client than the server sent and React would throw the hydration away.
  const [activated, setActivated] = useState(false);
  const [booting, setBooting] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  useEffect(() => {
    if (hasPersistedConnection()) setBooting(true);
  }, []);

  const requestConnect = useCallback(() => {
    setAutoOpen(true);
    setBooting(true);
  }, []);

  const consumeAutoOpen = useCallback(() => setAutoOpen(false), []);
  const markReady = useCallback(() => setActivated(true), []);

  const value = useMemo(
    () => ({ activated, booting, autoOpen, requestConnect, consumeAutoOpen, markReady }),
    [activated, booting, autoOpen, requestConnect, consumeAutoOpen, markReady],
  );

  return <WalletSessionContext.Provider value={value}>{children}</WalletSessionContext.Provider>;
}

export function useWalletSession(): WalletSessionValue {
  const ctx = useContext(WalletSessionContext);
  if (!ctx) throw new Error('useWalletSession must be used inside <WalletSessionProvider>');
  return ctx;
}
