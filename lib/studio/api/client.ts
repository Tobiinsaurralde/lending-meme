/**
 * The HTTP client for the Studio API.
 *
 * A thin transport. It holds no state, caches nothing and interprets nothing: every value it returns
 * came from the backend with its own freshness attached. Two headers travel with every request —
 * the session's user id, and the operator capabilities the control plane checks — and nothing else
 * about identity is ever placed in a body.
 *
 * Requests go to `/api/*` on this origin; `next.config.mjs` rewrites that to the Studio API, so the
 * browser never needs CORS and the SSE stream stays same-origin.
 */
import { sessionUserId } from './session';

/**
 * A failed request, carrying the status.
 *
 * The status matters to a screen. A 404 from the Lab routes usually means *this project does not have
 * that yet* — no compiled Blueprint, no recorded shadow run — which is a normal state with a normal
 * explanation, not a fault. A 500 is a fault. Rendering both the same teaches a user to ignore both.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** True when the project simply has nothing of this kind yet, rather than something being wrong. */
  get isAbsent(): boolean {
    return this.status === 404;
  }

  /** The backend's reason code, when it named one (control-plane refusals do). */
  get reason(): string | null {
    const r = this.body.reason;
    return typeof r === 'string' ? r : null;
  }
}

/**
 * Every operator capability, for the person running a fork on their own machine.
 *
 * The fork is local, its keys are ephemeral and the only person who can reach it is the one at this
 * keyboard. The header is still what the backend checks — this grants nothing on a real deployment.
 */
export const LOCAL_OPERATOR_CAPABILITIES =
  'VIEW,RUNTIME_CONTROL,CRE_CONTROL,POLICY_CONTROL,IDENTITY_CONTROL,EMERGENCY_CONTROL';

export const API_BASE = process.env.NEXT_PUBLIC_STUDIO_API_URL?.replace(/\/$/, '') ?? '';

export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

export function apiHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const user = sessionUserId();
  return {
    'content-type': 'application/json',
    'x-studio-user': user,
    'x-contextlock-actor': user,
    // Header values must be ISO-8859-1: ASCII only, no ellipsis.
    'x-contextlock-actor-name': user === 'local-user' ? 'local operator' : `wallet ${user.slice(0, 6)}...${user.slice(-4)}`,
    'x-contextlock-capabilities': LOCAL_OPERATOR_CAPABILITIES,
    ...extra,
  };
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const message =
      typeof body.error === 'string' ? body.error : `${res.status} ${res.statusText || 'request failed'}`;
    throw new ApiError(message, res.status, body);
  }
  return res.json() as Promise<T>;
}

export async function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(apiUrl(path), { ...init, method: 'GET', headers: apiHeaders(init.headers as Record<string, string>) });
  return parse<T>(res);
}

export async function apiText(path: string): Promise<string> {
  const res = await fetch(apiUrl(path), { headers: apiHeaders() });
  if (!res.ok) throw new ApiError(`${res.status} ${await res.text()}`, res.status);
  return res.text();
}

export async function apiSend<T>(method: 'POST' | 'PATCH' | 'DELETE', path: string, body?: unknown): Promise<T> {
  const res = await fetch(apiUrl(path), {
    method,
    headers: apiHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parse<T>(res);
}

export const apiPost = <T>(path: string, body?: unknown) => apiSend<T>('POST', path, body ?? {});
export const apiPatch = <T>(path: string, body?: unknown) => apiSend<T>('PATCH', path, body ?? {});
