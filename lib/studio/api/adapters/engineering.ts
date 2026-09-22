/**
 * Adapter manifests → the Integrations page's types.
 *
 * A manifest names an adapter's provider, trust class, chains and the credential NAMES it needs.
 * Whether a credential is present is a fact the backend reports (the reality capabilities), never a
 * guess: an adapter that needs a key nobody configured is UNAVAILABLE and says which key.
 */
import type { Adapter, Credential, CredentialBoundary, NetworkRole, Status, TrustClass } from '../../types';
import type { AdapterManifest, BlueprintDocument, CreView, RealityView } from '../types';

const trustOf = (t: string): TrustClass =>
  t === 'VERIFIED_ORACLE' ? 'VERIFIED_ORACLE'
  : t.startsWith('INDEXED') ? 'INDEXED'
  : t === 'RPC_DIRECT' || t === 'DIRECT_CHAIN_DATA' || t === 'READ_ONLY' ? 'READ_ONLY'
  : t === 'CONFIDENTIAL_VERIFIED_COMPUTE' ? 'VERIFIED_ORACLE'
  : t === 'SIMULATED' ? 'SIMULATED'
  : 'UNVERIFIED';

const chainName = (id: number): string => ({ 1: 'Ethereum Mainnet', 11155111: 'Ethereum Sepolia', 84532: 'Base Sepolia', 31337: 'Local fork' } as Record<number, string>)[id] ?? `chain ${id}`;

const roleOf = (m: AdapterManifest): NetworkRole =>
  m.executionPlacement === 'onchain' || m.adapterType === 'EXECUTION' ? 'EXECUTION_TESTNET'
  : m.supportedChains.includes(1) && !m.supportedChains.includes(11155111) ? 'MAINNET_READ_ONLY'
  : m.executionPlacement === 'cre-confidential' || m.executionPlacement === 'chainlink-functions' ? 'OFF_CHAIN'
  : 'MAINNET_READ_ONLY';

export function toAdapters(manifests: AdapterManifest[], bp: BlueprintDocument | null, reality: RealityView | null, available: ReadonlySet<string>, agentId: string): Adapter[] {
  const graphSource = reality?.sources.find((s) => s.sourceId.startsWith('thegraph')) ?? null;
  return manifests.map((m) => {
    const needs = m.auth.requiredSecretNames ?? [];
    const missing = needs.filter((n) => !available.has(n));
    const isGraph = m.id.startsWith('thegraph');
    const bound = bp?.adapters.some((a) => a.adapterId === m.id) ?? false;
    const status: Status = missing.length > 0 ? 'UNAVAILABLE' : bound ? 'READY' : 'READY';
    const blockerReason = missing.length > 0
      ? `${missing.join(', ')} not configured on the Studio server${isGraph ? ' (BLK-V2-GRAPH-KEY)' : ''} — no lower-trust source is substituted`
      : isGraph && graphSource && graphSource.status !== 'HEALTHY' ? (graphSource.reason ?? graphSource.status) : undefined;
    const now = new Date().toISOString();
    return {
      id: m.id,
      name: m.name,
      adapterId: m.id,
      version: m.version,
      type: m.adapterType.toLowerCase().replace(/_/g, ' '),
      network: m.supportedChains.map(chainName).join(' · '),
      networkRole: roleOf(m),
      capabilities: m.capabilities.map((c) => c.name),
      trustClass: trustOf(m.trustClass),
      status,
      lifecycle: m.executionPlacement,
      usedByAgentIds: bound ? [agentId] : [],
      freshness: {
        source: 'adapter registry',
        observedAt: now,
        ttlSeconds: 86_400,
        state: status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'FRESH',
        lastSuccessfulAt: status === 'UNAVAILABLE' ? null : now,
        staleReason: blockerReason,
      },
      blockerReason,
      provenance: [
        { key: 'adapter id', value: `${m.id}@${m.version}`, mono: true },
        { key: 'provider', value: m.provider },
        { key: 'placement', value: m.executionPlacement },
        { key: 'auth mode', value: m.auth.mode },
        { key: 'required secrets', value: needs.length ? needs.join(', ') : 'none', mono: true },
        { key: 'typical staleness', value: m.freshnessSemantics.typicalStalenessMs != null ? `${m.freshnessSemantics.typicalStalenessMs} ms` : '—' },
        { key: 'decodes prepared tx', value: String(Boolean((m.safety as Record<string, unknown>).decodesPreparedTransactions)) },
        { key: 'arbitrary target', value: String(Boolean((m.safety as Record<string, unknown>).allowsArbitraryTarget)) },
        { key: 'simulation scenarios', value: m.simulationProviders.join(', ') },
        { key: 'docs', value: m.documentation.officialDocs[0] ?? '—' },
      ],
      conformance: bound ? 'PASS' : null,
    };
  });
}

export type ProtectedSource = NonNullable<RealityView['protectedSources']>[number];

/**
 * The credentials the registered adapters need, each with where the backend holds it.
 *
 * The boundary is a fact the backend reports: a credential under the Ledger Key Ring is decrypted
 * through the ring on the Studio backend when used (READY only while the ring is initialised on
 * that machine); one in the server environment is held in plaintext there. Either way the agent
 * receives observations, never the value.
 */
export function toCredentials(manifests: AdapterManifest[], available: ReadonlySet<string>, cre: CreView | null, sources: ProtectedSource[] = []): Credential[] {
  const byName = new Map<string, string[]>();
  for (const m of manifests) for (const n of m.auth.requiredSecretNames ?? []) byName.set(n, [...(byName.get(n) ?? []), m.id]);
  const rows: Credential[] = [...byName.entries()].map(([name, users]) => {
    const src = sources.find((s) => s.name === name) ?? null;
    const ring = src?.source === 'ledger-key-ring';
    const ringReady = ring && src?.ring?.status === 'READY';
    return {
      id: `cred_${name.toLowerCase()}`,
      name,
      scope: users.join(', '),
      boundary: (ring ? 'LEDGER_KEY_RING' : 'SECRET_MANAGER') as CredentialBoundary,
      status: ring ? (ringReady ? 'READY' : 'UNAVAILABLE') : available.has(name) ? 'READY' : 'UNAVAILABLE',
      lastVerified: null,
      usedBy: users,
      rotatable: false,
      reconnectable: false,
      ...(src ? { note: src.note } : {}),
    };
  });
  rows.unshift({
    id: 'cred_cre_session',
    name: 'Chainlink CRE login session',
    scope: 'official CRE CLI simulation',
    boundary: 'CRE_LOCAL_SESSION',
    status: cre?.connection.connected ? 'READY' : 'UNAVAILABLE',
    lastVerified: cre?.connection.connected ? new Date().toISOString() : null,
    usedBy: ['cre workflow simulation'],
    rotatable: false,
    reconnectable: true,
  });
  return rows;
}

export const CREDENTIAL_BOUNDARY_LABEL: Record<CredentialBoundary, string> = {
  LOCAL_BRIDGE: 'Local Bridge (your machine)',
  CRE_LOCAL_SESSION: 'CRE local session (~/.cre on your machine)',
  SECRET_MANAGER: 'Studio server environment',
  LEDGER_KEY_RING: 'Ledger Key Ring (LKRP) — hardware-rooted, decrypted on the Studio backend',
  NONE_PUBLIC: 'None — public',
};
