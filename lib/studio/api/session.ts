/**
 * The workspace session.
 *
 * The backend identifies a user by the `x-studio-user` header. The connected wallet address is that
 * identity: projects belong to the wallet that made them, and switching wallets switches projects.
 * Without a wallet the session is the anonymous local operator, which is what the backend defaults
 * to as well — so the product is walkable before connecting and simply becomes yours once you do.
 *
 * This store exists because wagmi's hooks only work inside the (lazily mounted) wallet runtime, but
 * the API client runs everywhere. The runtime mirrors the account in here; everything else reads it.
 */

export const ANONYMOUS_USER = 'local-user';
const STORAGE_KEY = 'ctxlock.session.address';

type Listener = (address: string | null) => void;

let current: string | null = null;
let hydrated = false;
const listeners = new Set<Listener>();

function hydrate(): void {
  if (hydrated || typeof window === 'undefined') return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && /^0x[0-9a-fA-F]{40}$/.test(raw)) current = raw.toLowerCase();
  } catch {
    /* storage unavailable: anonymous until the wallet runtime reports an account */
  }
}

/** The connected wallet address (lowercase), or null. */
export function sessionAddress(): string | null {
  hydrate();
  return current;
}

/** The user id sent to the backend. */
export function sessionUserId(): string {
  return sessionAddress() ?? ANONYMOUS_USER;
}

/** Called by the wallet runtime whenever the account changes. */
export function setSessionAddress(address: string | null | undefined): void {
  hydrate();
  const next = address ? address.toLowerCase() : null;
  if (next === current) return;
  current = next;
  try {
    if (next) window.localStorage.setItem(STORAGE_KEY, next);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  for (const l of listeners) l(next);
}

export function subscribeSession(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
