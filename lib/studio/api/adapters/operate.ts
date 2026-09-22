/**
 * Control-plane observations → the operate pages' types.
 *
 * Freshness is carried through untouched: a panel is FRESH only when the backend says its reading is
 * current. Nothing here turns a stale HEALTHY into a green one.
 */
import type {
  Alert, CreMode, DecisionRow, EventSource, Freshness, RuntimeEvent, Severity, Status, TopologyComponent, Verdict,
} from '../../types';
import type { AlertRow, ForkDecision, ObservationFreshness, OverviewData, RuntimeEventRow, TickSample } from '../types';

export function freshnessOf(f: ObservationFreshness | null | undefined, source: string, ttlSeconds = 30): Freshness {
  if (!f) return { source, observedAt: null, ttlSeconds, state: 'UNKNOWN', lastSuccessfulAt: null, staleReason: 'Never read' };
  return {
    source: f.source || source,
    observedAt: new Date(f.observedAtMs).toISOString(),
    ttlSeconds,
    state: f.isCurrent ? 'FRESH' : 'STALE',
    lastSuccessfulAt: new Date(f.observedAtMs).toISOString(),
    staleReason: f.isCurrent ? undefined : (f.reason ?? 'The reading is older than its time-to-live'),
  };
}

export function sampleFreshness(sample: TickSample | null | undefined, ttlSeconds = 30): Freshness {
  if (!sample) return { source: 'fork runtime', observedAt: null, ttlSeconds, state: 'UNKNOWN', lastSuccessfulAt: null, staleReason: 'No observation yet' };
  const age = (Date.now() - sample.atMs) / 1000;
  return {
    source: `fork block ${sample.blockNumber}`,
    observedAt: new Date(sample.atMs).toISOString(),
    ttlSeconds,
    state: age <= ttlSeconds ? 'FRESH' : 'STALE',
    lastSuccessfulAt: new Date(sample.atMs).toISOString(),
    staleReason: age <= ttlSeconds ? undefined : 'The runtime has not observed the fork recently',
  };
}

/* ─────────────────────────── status words ─────────────────────────── */

export function runtimeStatusOf(state: string | null | undefined): Status {
  switch (state) {
    case 'HEALTHY': return 'HEALTHY';
    case 'DEGRADED': return 'DEGRADED';
    case 'PAUSED': return 'PAUSED';
    case 'STOPPED': case 'STOPPING': return 'STOPPED';
    case 'CRASH_LOOP': case 'FAILED': return 'FAIL';
    case 'PROVISIONING': case 'STARTING': return 'RUNNING';
    default: return 'UNKNOWN';
  }
}

export function policyStatusOf(overview: OverviewData | null | undefined, pending: 'ENABLING' | 'DISABLING' | null = null): Status {
  if (pending) return pending;
  const p = overview?.panels.policy;
  if (!p || !p.value) return 'UNKNOWN';
  return p.value.enabled ? 'ENABLED' : 'DISABLED';
}

export function severityOf(s: string | null | undefined): Severity {
  switch ((s ?? '').toUpperCase()) {
    case 'CRITICAL': return 'CRITICAL';
    case 'ERROR': case 'HIGH': return 'HIGH';
    case 'WARNING': case 'MEDIUM': return 'MEDIUM';
    case 'NOTICE': case 'LOW': return 'LOW';
    default: return 'INFO';
  }
}

/* ─────────────────────────── events ─────────────────────────── */

const SOURCE_OF: Record<string, EventSource> = {
  AGENT: 'agent', MODEL_GATEWAY: 'agent', ADAPTER: 'adapter', CRE: 'cre', CONTEXTLOCK: 'policy',
  CHAIN: 'chain', RUNTIME: 'runtime', OPERATOR: 'operator', SYSTEM: 'runtime',
};

const VERDICT_OF: Record<string, Verdict> = {
  DECISION_ALLOW: 'ALLOW', DECISION_DENY: 'DENY', DECISION_ESCALATE: 'ESCALATE',
};

function statusOfEvent(e: RuntimeEventRow): Status {
  switch (e.type) {
    case 'DECISION_ALLOW': return 'PASS';
    case 'DECISION_DENY': return 'DENY';
    case 'DECISION_ESCALATE': case 'CAPABILITY_REQUESTED': return 'ESCALATE';
    case 'EXECUTION_MINED': case 'EXECUTION_FINALIZED': case 'AGENT_RUN_COMPLETED': return 'PASS';
    case 'EXECUTION_REVERTED': return 'FAIL';
    case 'EXECUTION_SUBMITTED': return 'RUNNING';
    case 'CAPABILITY_REJECTED': return 'DENY';
    case 'STATE_DRIFT_DETECTED': return 'WARN';
    case 'EMERGENCY_LOCK_COMPLETED': case 'EMERGENCY_LOCK_PARTIAL': return 'BLOCKED';
    default:
      return e.severity === 'ERROR' || e.severity === 'CRITICAL' ? 'FAIL' : e.severity === 'WARNING' ? 'WARN' : 'READY';
  }
}

const str = (v: unknown): string => (v === null || v === undefined ? '' : typeof v === 'string' ? v : typeof v === 'object' ? JSON.stringify(v) : String(v));

function summaryOf(e: RuntimeEventRow): string {
  const m = e.publicMetadata;
  const pick = (...keys: string[]) => keys.map((k) => str(m[k])).filter(Boolean).join(' · ');
  switch (e.type) {
    case 'DECISION_ALLOW': case 'DECISION_DENY': case 'DECISION_ESCALATE':
      return pick('action', 'label', 'protocol', 'reasonCode') || e.type;
    case 'CAPABILITY_REQUESTED': return str(m.waitingFor) || 'waiting for a human signature';
    case 'EXECUTION_MINED': return pick('label', 'protocol', 'network');
    case 'AGENT_RUN_COMPLETED': return pick('action', 'protocol', 'after');
    case 'AUTHORIZATION_RECORDED': return pick('verdict', 'approval', 'signer');
    case 'POLICY_STATE_OBSERVED': return `policy ${m.enabled ? 'ENABLED' : 'DISABLED'}${m.note ? ` — ${str(m.note)}` : ''}`;
    case 'RUNTIME_STATE_CHANGED': return pick('state', 'note', 'reason');
    case 'STATE_DRIFT_DETECTED': return pick('protocol', 'stress', 'detail');
    default: {
      const first = Object.entries(m).slice(0, 3).map(([k, v]) => `${k}: ${str(v).slice(0, 60)}`);
      return first.join(' · ') || e.type;
    }
  }
}

export function toRuntimeEvent(e: RuntimeEventRow, agentId: string, revision: number | null, creMode: CreMode): RuntimeEvent {
  const m = e.publicMetadata;
  const onFork = e.chainId === 31337 || str(m.network).includes('FORK');
  const verdict = VERDICT_OF[e.type] ?? (typeof m.verdict === 'string' && ['ALLOW', 'ESCALATE', 'DENY'].includes(m.verdict) ? (m.verdict as Verdict) : null);
  return {
    id: e.eventId,
    at: new Date(e.timestamp).toISOString(),
    source: SOURCE_OF[e.source] ?? 'runtime',
    type: e.type,
    summary: summaryOf(e),
    status: statusOfEvent(e),
    verdict,
    reasonCode: typeof m.reasonCode === 'string' ? m.reasonCode : null,
    correlationId: e.correlationId,
    agentId,
    deploymentRevision: revision,
    blueprintRevision: revision,
    txHash: e.txHash,
    txKind: e.txHash ? (onFork ? 'LOCAL_FORK' : 'TESTNET') : null,
    capability: e.capabilityId ? { id: e.capabilityId, issued: true, expiresAt: null } : null,
    creExecution: e.creExecutionId ? { id: e.creExecutionId, mode: creMode, result: 'SIMULATED' } : null,
    publicMetadata: Object.entries(m).map(([key, value]) => ({ key, value: str(value), mono: /hash|id|address|digest/i.test(key) })),
    confidential: false,
    sourceFreshness: null,
    relatedEventIds: e.correctsEventId ? [e.correctsEventId] : [],
    amount: typeof m.amountUsd === 'number' ? `$${m.amountUsd.toLocaleString()}` : undefined,
    action: typeof m.action === 'string' ? m.action : typeof m.label === 'string' ? m.label : undefined,
  };
}

/* ─────────────────────────── decisions ─────────────────────────── */

export function toDecisionRow(d: ForkDecision): DecisionRow {
  return {
    id: d.correlationId,
    at: new Date(d.atMs).toISOString(),
    verdict: d.verdict,
    action: d.label,
    amount: `$${(Number(d.amountUsd6) / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 })}`,
    reason: d.reasonCode,
    reasonCode: d.reasonCode,
    executionResult: d.verdict === 'DENY' ? 'NOT_ISSUED' : d.executed ? 'PASS' : d.verdict === 'ESCALATE' ? 'PENDING' : 'NOT_SUBMITTED',
    correlationId: d.correlationId,
  };
}

/* ─────────────────────────── alerts ─────────────────────────── */

export function toAlert(a: AlertRow): Alert {
  return {
    id: a.alertId,
    severity: severityOf(a.severity),
    type: a.rule,
    resource: a.subject,
    firstSeen: new Date(a.firstSeenAtMs ?? Date.now()).toISOString(),
    lastSeen: new Date(a.lastSeenAtMs ?? Date.now()).toISOString(),
    occurrences: a.occurrences,
    state: a.state === 'RESOLVED' ? 'RESOLVED' : a.state === 'ACKNOWLEDGED' ? 'ACKNOWLEDGED' : 'OPEN',
    detail: a.reason,
    evidenceEventIds: [],
  };
}

/* ─────────────────────────── topology ─────────────────────────── */

export function topologyOf(o: OverviewData, runtimeStateHint: string | null): TopologyComponent[] {
  const policy = o.panels.policy;
  const identity = o.panels.identity;
  const rt = runtimeStatusOf(o.panels.runtime.state);
  const now = new Date().toISOString();
  const noRead: Freshness = { source: 'not observed', observedAt: null, ttlSeconds: 30, state: 'UNKNOWN', lastSuccessfulAt: null, staleReason: 'No reading' };
  const driftOf = (subject: string) => o.drift.find((d) => d.subject.toLowerCase().includes(subject)) ?? null;
  const drift = (subject: string) => driftOf(subject) !== null;
  // The expected state is the operator's intent. The control plane reports it only when the fork
  // disagrees (a drift row); with no drift, what is observed is what was intended.
  const policyState = policyStatusOf(o);
  const policyDrift = driftOf('policy');
  const policyExpected: Status = policyDrift ? (policyDrift.expected.toUpperCase().includes('ENABLED') ? 'ENABLED' : 'DISABLED') : policyState;
  return [
    { id: 'chain-observer', name: 'Chain observer', currentState: policy ? (policy.isCurrent ? 'HEALTHY' : 'STALE') : 'UNKNOWN', expectedState: 'HEALTHY', freshness: freshnessOf(policy, 'fork rpc'), drift: false, lastFailure: null, detail: policy ? `reads the fork's registries · ${policy.source}` : 'no chain reading yet' },
    { id: 'policy', name: 'Policy state', currentState: policyState, expectedState: policyExpected, freshness: freshnessOf(policy, 'fork rpc'), drift: drift('policy'), lastFailure: null, detail: policy?.value ? `binding version ${policy.value.bindingVersion} · admin ${policy.value.policyAdmin.slice(0, 10)}…` : 'not read' },
    { id: 'ens', name: 'Agent identity', currentState: identity?.value ? (identity.value.revoked ? 'REVOKED' : 'ACTIVE') : 'UNKNOWN', expectedState: 'ACTIVE', freshness: freshnessOf(identity, 'identity verifier'), drift: drift('identity'), lastFailure: null, detail: identity?.value?.boundAgent ? `bound to ${identity.value.boundAgent.slice(0, 10)}…` : 'no binding read' },
    { id: 'runtime', name: 'Agent runtime', currentState: rt, expectedState: 'HEALTHY', freshness: { source: 'runtime heartbeat', observedAt: now, ttlSeconds: 30, state: rt === 'UNKNOWN' ? 'UNKNOWN' : 'FRESH', lastSuccessfulAt: now }, drift: false, lastFailure: o.panels.runtime.reasons[0] ?? null, detail: o.panels.runtime.note || runtimeStateHint || '' },
    { id: 'cre', name: 'CRE mode / runtime', currentState: 'SIMULATED', expectedState: 'SIMULATED', freshness: o.panels.cre.lastSyncedAtMs ? { source: 'official CLI simulator', observedAt: new Date(o.panels.cre.lastSyncedAtMs).toISOString(), ttlSeconds: 86400, state: 'FRESH', lastSuccessfulAt: new Date(o.panels.cre.lastSyncedAtMs).toISOString() } : noRead, drift: false, lastFailure: null, detail: `${o.panels.cre.headline}${o.panels.cre.detail ? ` — ${o.panels.cre.detail}` : ''}` },
    ...o.panels.adapters.map((a) => ({
      id: `adapter-${a.adapterId}`, name: `Adapter · ${a.adapterId}`, currentState: (a.state === 'HEALTHY' ? 'HEALTHY' : a.state === 'DEGRADED' ? 'DEGRADED' : a.state === 'DISABLED' ? 'BLOCKED' : 'UNKNOWN') as Status,
      expectedState: 'HEALTHY' as Status, freshness: { source: 'fork runtime', observedAt: now, ttlSeconds: 30, state: a.state === 'UNKNOWN' ? 'UNKNOWN' as const : 'FRESH' as const, lastSuccessfulAt: now }, drift: false, lastFailure: a.reason ?? null, detail: a.reason ?? 'observed on the fork',
    })),
    { id: 'event-pipeline', name: 'Event pipeline', currentState: 'HEALTHY', expectedState: 'HEALTHY', freshness: { source: 'sqlite event store', observedAt: now, ttlSeconds: 30, state: 'FRESH', lastSuccessfulAt: now }, drift: false, lastFailure: null, detail: 'RuntimeEvents persisted by the Studio server' },
  ];
}

/* ─────────────────────────── deployments ─────────────────────────── */

import type { Deployment, DeploymentProgressStep } from '../../types';
import type { ForkDeploymentView } from '../types';

export function toDeployment(d: ForkDeploymentView, index: number, creHash: string | null): Deployment {
  const r = d.record;
  const status: Status = d.state === 'READY_TO_ACTIVATE' ? 'READY' : d.state === 'DEPLOYING' ? 'RUNNING' : d.state === 'STOPPED' ? 'STOPPED' : 'FAIL';
  const progress: DeploymentProgressStep[] = r.phases.map((p) => ({
    id: p.key,
    label: p.key.replace(/_/g, ' ').toLowerCase(),
    status: p.status === 'DONE' ? 'PASS' : p.status === 'RUNNING' ? 'RUNNING' : p.status === 'FAILED' ? 'FAIL' : 'PENDING',
    detail: p.detail ?? undefined,
    at: p.finishedAtMs ? new Date(p.finishedAtMs).toISOString() : undefined,
  }));
  const txFor = (name: string) => r.setupTransactions.find((t) => t.label.toLowerCase().includes(name.toLowerCase()))?.hash ?? '';
  return {
    id: d.deploymentId,
    revision: index,
    blueprintRevision: d.blueprintRevision,
    buildRevision: 0,
    network: 'Local mainnet fork (chain 31337)',
    status,
    createdAt: d.createdAt,
    runtimeImageDigest: 'none — in-process fork runtime',
    creMode: 'MY_CRE_SIMULATOR',
    creWasmHash: creHash ?? '',
    securityStatus: r.failure ? 'FAIL' : 'PASS',
    policyStartsDisabled: true,
    contracts: Object.entries(r.contracts ?? {}).map(([name, address]) => ({ name, address, txHash: txFor(name), verified: true })),
    progress,
  };
}

/* ─────────────────────────── policy ─────────────────────────── */

import type { AuthorityMatrixRow, PolicyState, PolicyPrecondition } from '../../types';
import type { ActivationView, BlueprintDocument, LabStateView } from '../types';
import { known } from '../types';

const usd = (cents: number | null): string => (cents === null ? 'UNRESOLVED' : `$${(cents / 100).toLocaleString()}`);

/**
 * The observed policy, from the control plane's fresh read of the fork's registry — never from a
 * stored flag. The authority matrix is derived from the Blueprint the deployment runs.
 */
export function toPolicyState(args: {
  overview: OverviewData | null;
  deployment: ForkDeploymentView | null;
  bp: BlueprintDocument | null;
  state: LabStateView | null;
  activation: ActivationView | null;
  network: string;
  pending: 'ENABLING' | 'DISABLING' | null;
}): PolicyState {
  const { overview, deployment, bp, activation, network, pending } = args;
  const p = overview?.panels.policy ?? null;
  const observed: Status = p?.value ? (p.value.enabled ? 'ENABLED' : 'DISABLED') : 'UNKNOWN';
  const rec = deployment?.record ?? null;
  const contracts = rec?.contracts ?? {};
  const auto = bp ? known(bp.autonomousPolicy.maxValueUsdCents) : null;
  const escMin = bp ? known(bp.escalationPolicy.minValueUsdCents) : null;
  const escMax = bp ? known(bp.escalationPolicy.maxValueUsdCents) : null;
  const ttl = bp?.capabilityPolicy.ttlSeconds ?? 0;
  // One entry per trust class, at the tightest freshness the Blueprint asks of it.
  const tightest = new Map<string, number>();
  for (const d of bp?.dataRequirements ?? []) tightest.set(d.minimumTrustClass, Math.min(tightest.get(d.minimumTrustClass) ?? Infinity, d.maxAgeMs));
  const data = [...tightest].map(([cls, ms]) => `${cls} · ≤ ${Math.round(ms / 1000)}s`).join(' · ') || '—';

  const matrix: AuthorityMatrixRow[] = [];
  for (const a of bp?.actions ?? []) {
    const per = bp?.perActionLimits.find((l) => l.actionRef === a.id);
    const aAuto = per ? known(per.autonomousMaxUsdCents) : auto;
    const aMin = per ? known(per.escalationMinUsdCents) : escMin;
    const aMax = per ? known(per.escalationMaxUsdCents) : escMax;
    const recipients = a.recipientPolicy.mode === 'self-only' ? 'the vault only' : a.recipientPolicy.mode === 'fixed-allowlist' ? 'fixed allowlist' : 'ARBITRARY (justified)';
    const targets = a.targetPolicy.mode === 'protocol-resolved' ? `${a.targetPolicy.protocolRef}.${a.targetPolicy.contractRole}` : a.targetPolicy.mode;
    matrix.push({ action: a.displayName, limit: `≤ ${usd(aAuto)} per action`, recipients, targets, trustFreshness: data, expiryNonce: `${ttl}s expiry · single-use nonce`, escalation: 'Not required', verdict: 'ALLOW' });
    matrix.push({ action: a.displayName, limit: `${usd(aMin ?? aAuto)} – ${usd(aMax)} per action`, recipients, targets, trustFreshness: data, expiryNonce: `${ttl}s expiry · single-use nonce`, escalation: 'Human approval required', verdict: 'ESCALATE' });
    matrix.push({ action: a.displayName, limit: `> ${usd(aMax)} per action`, recipients: '—', targets: '—', trustFreshness: '—', expiryNonce: '—', escalation: 'Never permitted', verdict: 'DENY' });
  }
  for (const d of bp?.permissions.denied ?? []) {
    matrix.push({ action: d.statement, limit: 'Any amount', recipients: '—', targets: '—', trustFreshness: '—', expiryNonce: '—', escalation: 'Never permitted', verdict: 'DENY' });
  }
  matrix.push({ action: 'Any write on a production chain', limit: 'Any amount', recipients: '—', targets: '—', trustFreshness: '—', expiryNonce: '—', escalation: 'Never permitted', verdict: 'DENY' });

  const rows = activation?.readiness.rows ?? [];
  const enablePreconditions: PolicyPrecondition[] = rows.length
    ? rows.map((r) => ({ id: r.label.toLowerCase().replace(/\s+/g, '-'), label: r.label, status: r.status === 'READY' ? 'PASS' : r.status === 'NOT_READY' ? 'FAIL' : 'PASS', detail: `${r.value} — ${r.detail}` }))
    : [{ id: 'deployment', label: 'Deployment verified', status: deployment?.state === 'READY_TO_ACTIVATE' || observed === 'ENABLED' ? 'PASS' : 'FAIL', detail: deployment ? `${deployment.state}` : 'no deployment' }];

  return {
    version: deployment?.blueprintRevision ?? bp?.revision ?? 0,
    observed,
    transitional: pending,
    network,
    matrix,
    onChain: {
      enabled: p?.value?.enabled ?? false,
      policyHash: rec?.policyHash ?? '',
      admin: p?.value?.policyAdmin ?? rec?.roles.deployer ?? '',
      contracts: Object.entries(contracts).map(([label, address]) => ({ label, address })),
      lastVerifiedBlock: Number(deployment?.record.fork?.forkBlock ?? 0),
      freshness: freshnessOf(p, 'fork policy registry'),
    },
    drift: (overview?.drift ?? []).map((d) => ({ field: d.subject, expected: d.expected, observed: d.observed, drifted: true, severity: severityOf(d.severity) })),
    enablePreconditions,
  };
}

/* ─────────────────────────── runtime ─────────────────────────── */

import type { RuntimeDependency, RuntimeState } from '../../types';
import type { ForkPositionView } from '../types';

/**
 * The fork runtime as the Runtime page renders it. It is an in-process loop, not a container: there
 * is no image digest, no CPU/memory limit and no revision history, and every one of those says so.
 */
export function toRuntimeState(overview: OverviewData | null, position: ForkPositionView | null, deployment: ForkDeploymentView | null): RuntimeState {
  const stateWord = runtimeStatusOf(overview?.panels.runtime.state ?? position?.runtime.state);
  const latest = position?.latest ?? null;
  const heartbeat = sampleFreshness(latest);
  const started = deployment?.record.phases.find((p) => p.key === 'STARTING_RUNTIME')?.finishedAtMs ?? null;
  const uptime = started ? Math.max(0, Math.round((Date.now() - started) / 1000)) : 0;
  const forkUp = !!deployment?.live.fork;
  const runtimeUp = !!deployment?.live.runtime;
  const errors = position?.runtime.lastError ? 1 : 0;
  const dependencies: RuntimeDependency[] = [
    { id: 'process', name: 'Process', status: runtimeUp ? (position?.runtime.paused ? 'PAUSED' : 'HEALTHY') : 'STOPPED', detail: runtimeUp ? `${position?.runtime.ticks ?? 0} observations` : 'no runtime in the Studio server process', freshness: heartbeat },
    { id: 'fork', name: 'Fork RPC', status: forkUp ? 'HEALTHY' : 'UNAVAILABLE', detail: forkUp ? `anvil at block ${latest?.blockNumber ?? '—'}` : 'the fork process is gone', freshness: heartbeat },
    { id: 'model-gateway', name: 'Model gateway', status: 'READY', detail: 'not used — decisions come from the deterministic policy engine, not a model', freshness: { source: 'design', observedAt: new Date().toISOString(), ttlSeconds: 86_400, state: 'FRESH', lastSuccessfulAt: new Date().toISOString() } },
    { id: 'broker', name: 'ContextLock broker', status: forkUp ? 'HEALTHY' : 'UNAVAILABLE', detail: 'issuer, authorizer and relayer roles held in memory for this fork', freshness: heartbeat },
    { id: 'policy-read', name: 'Policy read', status: overview?.panels.policy?.isCurrent ? 'HEALTHY' : overview?.panels.policy ? 'STALE' : 'UNKNOWN', detail: overview?.panels.policy?.value ? `isPolicyEnabled = ${overview.panels.policy.value.enabled}` : 'not read', freshness: freshnessOf(overview?.panels.policy, 'fork policy registry') },
    ...(overview?.panels.adapters ?? []).map((a) => ({ id: `adapter-${a.adapterId}`, name: `Adapter · ${a.adapterId}`, status: (a.state === 'HEALTHY' ? 'HEALTHY' : a.state === 'DEGRADED' ? 'DEGRADED' : 'UNKNOWN') as Status, detail: a.reason ?? 'observed on the fork', freshness: heartbeat })),
  ];
  const broken = dependencies.some((d) => d.status === 'DEGRADED' || d.status === 'UNAVAILABLE' || d.status === 'STALE');
  return {
    state: stateWord,
    revision: deployment ? 1 : 0,
    imageDigest: 'none — in-process fork runtime, not a container image',
    startedAt: started ? new Date(started).toISOString() : null,
    heartbeat,
    brokerConnectivity: forkUp ? 'HEALTHY' : 'UNAVAILABLE',
    modelGateway: 'READY',
    eventCursor: latest ? `fork block ${latest.blockNumber}` : 'no observation yet',
    credentialValidity: forkUp ? 'PASS' : 'UNKNOWN',
    restartCount: 0,
    metrics: { cpuPercent: 0, memoryMb: 0, memoryLimitMb: 0, uptimeSeconds: uptime, requests: position?.runtime.ticks ?? 0, errors },
    dependencies,
    overall: stateWord === 'HEALTHY' && broken ? 'DEGRADED' : stateWord,
    revisions: deployment ? [{ revision: 1, imageDigest: 'in-process', blueprintRevision: deployment.blueprintRevision, buildRevision: 0, createdAt: deployment.createdAt, status: runtimeUp ? 'ACTIVE' : 'STOPPED', current: true, compatible: true }] : [],
    credentialFenced: !runtimeUp,
  };
}

/* ─────────────────────────── CRE ─────────────────────────── */

import type { CreModeOption, CreRun, CreState } from '../../types';
import type { CreConnectView, CreSimulationRun, CreView, ParityView } from '../types';

export function toCreState(cre: CreView | null, runs: CreSimulationRun[], parity: ParityView | null): CreState {
  const latest = runs.find((r) => r.status !== 'RUNNING') ?? null;
  const running = runs.some((r) => r.status === 'RUNNING');
  const st = cre?.status ?? null;
  const conn = cre?.connection ?? null;
  const ran = !!latest && latest.status === 'PASSED';
  const observedAt = latest?.finishedAt ?? latest?.startedAt ?? null;
  return {
    mode: st?.executionMode === 'SIMULATED_PLATFORM' ? 'CONTEXTLOCK_SIMULATOR' : st?.executionMode === 'DEPLOYED_USER' ? 'MY_CRE_DEPLOYMENT' : 'MY_CRE_SIMULATOR',
    cliVersion: conn?.cliVersion ?? latest?.result.cliVersion ?? 'not detected',
    accountMode: st?.account ?? 'Local user session',
    organization: conn?.organizationName ?? conn?.organizationId ?? null,
    deployAccess: conn?.deployAccess === true,
    registry: (st?.registries ?? conn?.registries ?? ['private']).join(', '),
    simulationId: latest?.id ?? null,
    workflowId: null,
    wasmHash: st?.workflowBinary ?? latest?.result.binaryHash ?? '',
    configHash: latest?.result.configHash ?? '',
    productionLimits: st?.productionLimits ?? (latest?.result.productionLimits ? 'ENABLED' : 'DISABLED'),
    lastRun: observedAt,
    status: running ? 'RUNNING' : latest ? (latest.status === 'PASSED' ? 'PASS' : 'FAIL') : 'UNKNOWN',
    donDeployment: st?.donDeployment === 'YES',
    hardwareTeeEvidence: st?.hardwareTee === 'YES',
    truth: { officialSimulation: ran, realDon: st?.donDeployment === 'YES', realDonConsensus: st?.donDeployment === 'YES', hardwareTee: st?.hardwareTee === 'YES' },
    paritySuite: parity ? (parity.result.semanticParity ? 'PASS' : parity.result.rows.every((r) => r.notRun) ? 'PENDING' : 'FAIL') : null,
    approvedWasmHash: null,
    freshness: observedAt
      ? { source: 'official CLI simulator run', observedAt, ttlSeconds: 86_400, state: 'FRESH', lastSuccessfulAt: observedAt }
      : { source: 'official CLI simulator', observedAt: null, ttlSeconds: 86_400, state: 'UNKNOWN', lastSuccessfulAt: null, staleReason: 'No simulation run recorded for this project' },
  };
}

export function toCreModeOptions(cre: CreView | null, connect: CreConnectView | null): CreModeOption[] {
  const conn = cre?.connection ?? null;
  const cliPresent = conn?.connected === true;
  return [
    {
      mode: 'CONTEXTLOCK_SIMULATOR',
      title: 'ContextLock Simulator',
      description: 'The official CRE CLI simulator run by the Studio server, using its own CRE session.',
      bullets: ['Official CLI simulator', 'Internal-only account', 'No DON', 'No hardware TEE'],
      available: false,
      blockerReason: 'Not offered by this server: the simulator runs under the operator’s own local CRE CLI session (BLK-CRE-PLATFORM-MULTITENANT).',
    },
    {
      mode: 'MY_CRE_SIMULATOR',
      title: 'My CRE Simulator',
      description: 'The official simulator run locally under your own CRE login. This is the mode every run on this page uses.',
      bullets: ['Your CRE account', cliPresent ? `CRE CLI ${conn?.cliVersion ?? ''} detected on this machine` : 'CRE CLI not detected', 'No DON', 'No hardware TEE'],
      available: cliPresent,
      blockerReason: cliPresent ? undefined : (connect?.account.note ?? 'The CRE CLI is not installed or not logged in on the Studio server’s machine. Install it and run `cre login` there.'),
    },
    {
      mode: 'MY_CRE_DEPLOYMENT',
      title: 'My CRE Deployment',
      description: 'A real workflow deployed to your own private registry. Execution still remains testnet-only.',
      bullets: ['Requires CRE Deploy Access', 'Private registry', 'Real DON execution', 'Evidence-gated TEE claims'],
      available: conn?.deployAccess === true,
      blockerReason: conn?.deployAccess === true ? undefined : (cre?.promotion.message ?? 'Deploy Access is not enabled for this CRE organization (BLK-V2-CRE-DEPLOY).'),
    },
  ];
}

export function toCreRuns(runs: CreSimulationRun[]): CreRun[] {
  return runs.map((r) => ({
    id: r.id,
    at: r.startedAt,
    trigger: `Sepolia CapabilityRequested log · tx ${r.result.triggerTxHash ? `${r.result.triggerTxHash.slice(0, 10)}…` : '(fixture)'}`,
    result: r.status === 'RUNNING' ? 'RUNNING' : r.status === 'PASSED' ? 'PASS' : 'FAIL',
    reason: r.status === 'FAILED' ? (r.result.failure ?? r.result.outputTail?.slice(-1)[0] ?? 'failed') : r.result.verdict ?? null,
    configHash: r.result.configHash ? `${r.result.configHash.slice(0, 12)}…` : '—',
    binaryHash: r.result.binaryHash ? `${r.result.binaryHash.slice(0, 12)}…` : '—',
    productionLimitMode: r.result.productionLimits ? 'production limits ENABLED' : r.status === 'RUNNING' ? 'running…' : 'limits not confirmed',
    broadcast: 'DRY_RUN',
  }));
}

/* ─────────────────────────── identity ─────────────────────────── */

import type { Agent, IdentityState } from '../../types';

/**
 * The agent's identity as the fork's verifier reports it. On the fork the ENS name is bound in a
 * local identity verifier (LocalAgentIdentityVerifier), not on public ENSv2 — the page says so.
 */
export function toIdentityState(agent: Agent, agents: Agent[], overview: OverviewData | null, deployment: ForkDeploymentView | null, bp: BlueprintDocument | null): IdentityState {
  const id = overview?.panels.identity ?? null;
  const rec = deployment?.record ?? null;
  const bound = id?.value?.boundAgent ?? null;
  const revoked = id?.value?.revoked === true;
  const state: Status = !deployment ? 'DRAFT' : id?.value ? (revoked ? 'REVOKED' : 'ACTIVE') : 'UNKNOWN';
  return {
    ensName: bp?.identity.ensName ?? agent.ensName,
    node: rec?.ensNode ?? '',
    owner: rec?.roles.deployer ?? '',
    manager: rec?.roles.deployer ?? '',
    agentAddress: bound ?? known(bp?.identity.agentAddress) ?? '',
    identityHash: rec?.agentIdentityHash ?? '',
    expiry: null,
    state,
    freshness: freshnessOf(id, 'fork identity verifier'),
    records: [
      ...(rec?.contracts?.LocalAgentIdentityVerifier ? [{ key: 'verifier', value: rec.contracts.LocalAgentIdentityVerifier, kind: 'resolver-metadata' as const }] : []),
      ...(rec ? [{ key: 'agent-identity-hash', value: rec.agentIdentityHash, kind: 'agent-context' as const }, { key: 'policy-hash', value: rec.policyHash, kind: 'agent-context' as const }] : []),
      ...(bound ? [{ key: 'bound-agent', value: bound, kind: 'agent-context' as const }] : []),
      { key: 'network', value: deployment ? 'local mainnet fork (chain 31337) — a local identity verifier stands in for public ENSv2' : 'not deployed', kind: 'resolver-metadata' as const },
    ],
    siblings: agents.filter((a) => a.id !== agent.id).map((a) => ({ agentId: a.id, ensName: a.ensName, affected: false })),
  };
}
