/**
 * Simulation results, attack runs and reality data → the test pages' types.
 *
 * A result is STALE when it was produced against an older Blueprint or build revision; the backend
 * says so per row and this file carries it through. Nothing here edits an expected result.
 */
import type {
  Attack, AttackCategory, LocalFork, RealityModeOption, RealitySnapshot, RealitySource, SecurityPathStep, Severity,
  SimulationScenario, Status, SyntheticOverlay, TrustClass,
} from '../../types';
import type { AttackCatalogue, AttackRun, BlueprintDocument, BpScenario, ForkDeploymentView, MarketSnapshotView, RealityView, ScenarioView, SimulationResult } from '../types';

/* ─────────────────────────── scenarios ─────────────────────────── */

export function groupOfScenario(id: string): SimulationScenario['group'] {
  const s = id.toUpperCase();
  if (/PROMPT|INJECT/.test(s)) return 'prompt-injection';
  if (/MUTAT|REPLAY|EXPIR|NONCE|TAMPER/.test(s)) return 'mutation-replay';
  if (/ENS|REVOK|POLICY_CHANGE|POLICY_DISABLED|IDENTITY/.test(s)) return 'ens-policy-lifecycle';
  if (/STALE|FRESH|ORACLE|DISAGREE|PRICE_MOVEMENT/.test(s)) return 'data-freshness';
  if (/RPC|429|TIMEOUT|MALFORMED|OUTAGE|UNAVAILABLE|API/.test(s)) return 'adapter-failures';
  if (/CCIP|CROSS|CHAIN/.test(s)) return 'cross-chain';
  if (/ORG|MULTI|AGENT_B|SIBLING/.test(s)) return 'organization';
  if (/CRE|CONTEXT|CONFIDENTIAL/.test(s)) return 'cre';
  if (/NORMAL|HEALTHY|NO_DEBT|BASELINE|QUOTE_NORMAL/.test(s)) return 'baseline';
  if (/AAVE|COMPOUND|MORPHO|LIDO|UNI|SWAP|HEALTH|FLASH|COLLATERAL|REPAY|LIQUID|STAKE/.test(s)) return 'protocol-specific';
  return 'policy-boundaries';
}

const humanize = (id: string) => id.replace(/[_-]+/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

function stepStatus(status: string): Status {
  switch (status.toUpperCase()) {
    case 'PASS': case 'PASSED': case 'OK': return 'PASS';
    case 'DENY': case 'DENIED': return 'DENY';
    case 'ESCALATE': return 'ESCALATE';
    case 'FAIL': case 'FAILED': case 'REVERTED': return 'FAIL';
    case 'NOT_REACHED': case 'SKIPPED': return 'NOT_SUBMITTED';
    case 'NOT_ISSUED': return 'NOT_ISSUED';
    case 'BLOCKED': return 'BLOCKED';
    default: return 'UNKNOWN';
  }
}

export function toSecurityPath(stages: SimulationResult['stages']): SecurityPathStep[] {
  return stages.map((s) => ({ layer: humanize(s.stage), status: stepStatus(s.status), detail: s.detail, reasonCode: s.reason }));
}

/** One row per declared scenario, carrying its latest result (mandatory or user-requested). */
export function toScenarios(bp: BlueprintDocument, results: SimulationResult[], currentBlueprintRevision: number, currentBuildRevision: number): SimulationScenario[] {
  const byId = new Map<string, SimulationResult[]>();
  for (const r of results) byId.set(r.scenarioId, [...(byId.get(r.scenarioId) ?? []), r]);
  const declared = new Map<string, BpScenario>(bp.simulationScenarios.map((s) => [s.scenarioId, s]));
  const ids = [...new Set([...declared.keys(), ...byId.keys()])];
  return ids.map((id) => {
    const decl = declared.get(id);
    const runs = byId.get(id) ?? [];
    const last = runs.at(-1) ?? null;
    const stale = last ? last.blueprintRevision !== currentBlueprintRevision || last.buildRevision !== currentBuildRevision : false;
    return {
      id,
      name: humanize(id),
      group: groupOfScenario(id),
      description: decl?.description ?? `Recorded result for ${id}`,
      mandatory: declared.has(id),
      builtAgainstBlueprint: last?.blueprintRevision ?? null,
      lastRun: null,
      result: last ? (last.passed ? 'PASS' : 'FAIL') : null,
      expected: decl ? `${decl.expectedVerdict} · ${decl.expectedOutcome}${decl.expectedStopStage !== 'NONE' ? ` · stops at ${humanize(decl.expectedStopStage)}` : ''}` : 'as recorded',
      actual: last ? `${last.verdict} · ${last.outcome} · stopped at ${humanize(last.stoppedAt)}` : null,
      reasonCode: last?.reasonCode ?? null,
      inputs: [
        { key: 'scenario', value: id },
        { key: 'expected verdict', value: decl?.expectedVerdict ?? '—' },
        { key: 'expected outcome', value: decl?.expectedOutcome ?? '—' },
        { key: 'expected stop stage', value: decl?.expectedStopStage ?? '—' },
        ...(last ? [{ key: 'blueprint revision', value: `r${last.blueprintRevision}` }, { key: 'build revision', value: `r${last.buildRevision}` }] : []),
      ],
      changedFields: [],
      layersEvaluated: last ? last.stages.map((s) => humanize(s.stage)) : [],
      durationMs: null,
      path: last ? toSecurityPath(last.stages) : [],
      logs: last
        ? [...last.timeline.map((t) => `T+${t.t}  ${t.label}`), ...last.assertions.map((a) => `${a.held ? 'HELD' : 'BROKEN'}  ${a.id} — ${a.statement}${a.detail ? ` (${a.detail})` : ''}`)]
        : [],
      isCre: groupOfScenario(id) === 'cre',
      // Stale is a property of the result, not of the row: an older pass must not read as current.
      ...(stale && last ? { result: 'STALE' as Status } : {}),
    };
  });
}

/* ─────────────────────────── attacks ─────────────────────────── */

export function categoryOfAttack(scenario: string): AttackCategory {
  const s = scenario.toUpperCase();
  if (/PROMPT|INJECT|COMPROMISE/.test(s)) return 'prompt-agent-compromise';
  if (/AMOUNT|RECIPIENT|TARGET|CALLDATA|MUTAT/.test(s)) return 'transaction-mutation';
  if (/REPLAY|EXPIR/.test(s)) return 'replay-expiry';
  if (/ENS|IDENTITY/.test(s)) return 'identity-ens';
  if (/ORACLE|STALE|DATA/.test(s)) return 'data-oracle';
  if (/POLICY/.test(s)) return 'policy';
  if (/CRE|RUNTIME/.test(s)) return 'cre-runtime';
  if (/AGENT|APPROVAL|SIBLING/.test(s)) return 'cross-agent';
  if (/CCIP|CHAIN/.test(s)) return 'cross-chain';
  if (/MAINNET|NETWORK|WRITE/.test(s)) return 'network-boundary';
  return 'policy';
}

function severityOfAttack(scenario: string): Severity {
  const s = scenario.toUpperCase();
  if (/MAINNET|RECIPIENT|PROMPT|REPLAY/.test(s)) return 'CRITICAL';
  if (/AMOUNT|TARGET|ENS|POLICY/.test(s)) return 'HIGH';
  return 'MEDIUM';
}

function outcomeStatus(o: AttackRun['path'][number]['outcome']): Status {
  switch (o) {
    case 'PASS': return 'PASS';
    case 'DENY': return 'DENY';
    case 'NOT_REACHED': return 'NOT_SUBMITTED';
    default: return 'UNKNOWN';
  }
}

export function toAttacks(cat: AttackCatalogue, runs: Record<string, AttackRun | undefined>): Attack[] {
  const applicable: Attack[] = cat.applicable.map((a) => {
    const run = runs[a.scenario];
    return {
      id: a.scenario,
      name: a.title,
      category: categoryOfAttack(a.scenario),
      description: a.description,
      applicable: true,
      severity: severityOfAttack(a.scenario),
      lastResult: run ? (run.result === 'DENIED' ? 'DENY' : run.result === 'ALLOWED' ? 'FAIL' : 'UNKNOWN') : null,
      lastRun: run ? new Date().toISOString() : null,
      stoppingLayer: run?.stoppedBy ?? null,
      reasonCode: run?.reasonCode ?? null,
      mutation: run?.diffs[0] ? { field: run.diffs[0].field, original: run.diffs[0].original, injected: run.diffs[0].mutated } : a.mutatedField ? { field: a.mutatedField, original: '—', injected: '—' } : undefined,
      path: run ? run.path.map((p) => ({ layer: humanize(p.layer), status: outcomeStatus(p.outcome), detail: p.detail ?? undefined, reasonCode: p.reasonCode ?? undefined })) : [],
      /* Only the layers a run actually reached — never a static claim. */
      defencesExercised: run ? [run.stoppedBy, ...run.additionalDefenses.map((d) => `${d.layer} (${d.reasonCode})`)].filter((x): x is string => !!x) : [],
      relatedSimulationId: undefined,
    };
  });
  const notApplicable: Attack[] = cat.notApplicable.map((a) => ({
    id: a.scenario,
    name: a.title,
    category: categoryOfAttack(a.scenario),
    description: '',
    applicable: false,
    notApplicableReason: a.requires,
    severity: severityOfAttack(a.scenario),
    lastResult: null,
    lastRun: null,
    stoppingLayer: null,
    reasonCode: null,
    path: [],
    defencesExercised: [],
  }));
  return [...applicable, ...notApplicable];
}

/* ─────────────────────────── reality ─────────────────────────── */

export function toRealityModes(r: RealityView): RealityModeOption[] {
  const desc: Record<RealityModeOption['mode'], string> = {
    LIVE_MAINNET_MIRROR: 'Read current mainnet state through a read-only RPC; nothing is executed there.',
    HISTORICAL_REPLAY: 'Replay a past mainnet block. Needs an archive-capable RPC for evidence-grade replay.',
    LOCAL_MAINNET_FORK: 'Fork mainnet into a local Anvil chain and let the agent act on real protocol state.',
    SYNTHETIC: 'Apply a synthetic shock over the sealed snapshot to compare decisions.',
  };
  return r.modes.map((m) => ({
    mode: m.mode,
    label: m.label,
    description: desc[m.mode],
    availability: m.availability,
    blockerReason: m.reason ? `${m.reason}${m.blocker ? ` (${m.blocker})` : ''}${m.remedy ? ` — ${m.remedy}` : ''}` : undefined,
  }));
}

const trustOf = (t: string): TrustClass =>
  t === 'VERIFIED_ORACLE' ? 'VERIFIED_ORACLE' : t.startsWith('INDEXED') ? 'INDEXED' : t === 'READ_ONLY' || t === 'RPC_DIRECT' || t === 'DIRECT_CHAIN_DATA' ? 'READ_ONLY' : t === 'SIMULATED' ? 'SIMULATED' : 'UNVERIFIED';

/**
 * The sealed snapshot a fork deployment took, as the Reality Lab renders it: one row per source it actually holds.
 *
 * Every row is read from the snapshot: the source list says what was consulted, the observations
 * say what each source answered, and the coherence block says whether they describe one moment.
 * Nothing is added for a source the snapshot does not name — a Graph key that was not configured
 * shows up as an absent row, not a grey placeholder.
 */
const SOURCE_KIND_LABEL: Record<string, string> = {
  CHAINLINK_DATA_FEED: 'Chainlink feed',
  CHAINLINK_DATA_STREAM: 'Chainlink stream',
  THE_GRAPH: 'The Graph subgraph',
  READ_ONLY_RPC: 'Mainnet RPC (read only)',
  LOCAL_FORK_RPC: 'Local Anvil fork',
  EXTERNAL_API: 'External API',
};

function formatObservation(o: { value: string; decimals: number; unit: string; dataType: string }): string {
  const n = Number(o.value) / 10 ** o.decimals;
  if (!Number.isFinite(n)) return `${o.value} ${o.unit}`;
  if (o.unit === 'USD') return `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (o.unit === 'ratio') return n.toFixed(3);
  if (o.unit === 'bps') return `${n.toLocaleString()} bps`;
  if (o.unit === 'base-units') return `${Number(o.value).toExponential(3)} (base units)`;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${o.unit}`;
}

export function toSnapshot(d: ForkDeploymentView, scenarios: ScenarioView | null): RealitySnapshot | null {
  const s = d.record.snapshot;
  if (!s) return null;
  const observedAt = s.observedAtMs ? new Date(s.observedAtMs) : new Date(d.createdAt);
  const anchorBlock = Number(s.anchorBlock);
  const anchorTime = s.anchorBlockTimestampMs ? new Date(s.anchorBlockTimestampMs).toISOString() : observedAt.toISOString();
  const obsBySource = new Map<string, MarketSnapshotView['observations']>();
  for (const o of s.observations ?? []) obsBySource.set(o.sourceId, [...(obsBySource.get(o.sourceId) ?? []), o]);

  const sources: RealitySource[] = (s.sources ?? []).map((src) => {
    const obs = obsBySource.get(src.sourceId) ?? [];
    const first = obs[0];
    const stale = s.coherence?.staleSources?.includes(src.sourceId) ?? false;
    const sourceTime = first?.sourceTimestampMs ? new Date(first.sourceTimestampMs).toISOString() : anchorTime;
    const value =
      src.kind === 'CHAINLINK_DATA_FEED' && scenarios?.baseValuedAt ? scenarios.baseValuedAt
      : obs.length === 1 && first ? formatObservation(first)
      : obs.length > 1 ? `${obs.length} observation(s)`
      : src.healthy ? '—' : 'refused';
    const dataType =
      src.kind === 'CHAINLINK_DATA_FEED' ? 'price'
      : src.kind === 'THE_GRAPH' ? 'indexed pool liquidity'
      : src.kind === 'LOCAL_FORK_RPC' ? 'protocol position'
      : first?.dataType.toLowerCase().replace(/_/g, ' ') ?? 'state';
    return {
      id: src.sourceId,
      provider: `${SOURCE_KIND_LABEL[src.kind] ?? src.kind}${src.detail ? ` — ${src.detail}` : ''}`,
      dataType,
      value,
      trustClass: trustOf(src.trustClass),
      sourceBlock: src.observedBlock ? Number(src.observedBlock) : null,
      sourceTime,
      freshness: {
        source: src.adapterId,
        observedAt: sourceTime,
        ttlSeconds: 5_400,
        state: !src.healthy ? 'UNKNOWN' : stale ? 'STALE' : 'FRESH',
        lastSuccessfulAt: src.healthy ? sourceTime : null,
        ...(stale ? { staleReason: 'older than its own heartbeat at the anchor' } : {}),
        ...(!src.healthy ? { staleReason: src.detail ?? 'the source refused' } : {}),
      },
      lifecycle: src.healthy ? 'ACTIVE' : 'UNAVAILABLE',
      status: !src.healthy ? 'UNAVAILABLE' : stale ? 'STALE' : 'HEALTHY',
      provenance: [
        { key: 'kind', value: src.kind },
        { key: 'adapter', value: `${src.adapterId} ${src.adapterVersion}`, mono: true },
        { key: 'trust class', value: src.trustClass },
        { key: 'observed block', value: src.observedBlock ?? '—', mono: true },
        ...(src.lagBlocks !== null ? [{ key: 'indexer lag', value: `${src.lagBlocks} block(s) behind the head` }] : []),
        ...obs.map((o) => ({ key: o.metric, value: o.provenance })),
        { key: 'snapshot hash', value: s.snapshotHash, mono: true },
      ],
    };
  });

  const coherence = s.coherence
    ? s.coherence.coherent
      ? `coherent — ${s.coherence.maxBlockSkew === 0 ? 'every source read at the anchor block' : `block skew ${s.coherence.maxBlockSkew ?? 'n/a'}`}`
      : `not coherent — ${s.coherence.reason ?? 'see sources'}`
    : 'single block — every source read at the anchor';
  return {
    id: s.snapshotId,
    anchorBlock,
    anchorHash: s.anchorBlockHash ?? d.record.fork?.forkBlockHash ?? '',
    createdAt: observedAt.toISOString(),
    ageSeconds: Math.max(0, Math.round((Date.now() - observedAt.getTime()) / 1000)),
    coherence,
    hash: s.snapshotHash,
    sources,
  };
}

export function toLocalFork(d: ForkDeploymentView): LocalFork | null {
  const f = d.record.fork;
  if (!f) return null;
  const created = f.createdAtMs ? new Date(f.createdAtMs) : new Date(d.createdAt);
  return {
    id: f.forkId,
    sourceChain: `Ethereum Mainnet (chain ${f.sourceChainId})`,
    blockNumber: Number(f.forkBlock),
    blockHash: f.forkBlockHash,
    anvilVersion: f.anvilVersion,
    state: d.live.fork ? 'ACTIVE' : f.state === 'DESTROYED' || d.state === 'STOPPED' ? 'STOPPED' : (f.state as Status),
    endpoint: f.endpoint,
    lifetimeSeconds: f.expiresAtMs ? Math.max(0, Math.round((f.expiresAtMs - Date.now()) / 1000)) : 30 * 60,
    createdAt: created.toISOString(),
  };
}

export function toOverlays(sc: ScenarioView | null): SyntheticOverlay[] {
  if (!sc) return [];
  return sc.presets.map((p) => {
    const row = sc.rows.find((r) => r.scenario === p.overlayId);
    return {
      id: p.overlayId,
      label: p.name,
      description: p.applicable ? p.description : `${p.description} — ${p.unavailableReason ?? 'not applicable to this snapshot'}`,
      applied: false,
      effects: [
        ...p.mutates.map((m) => ({ key: 'mutates', value: m })),
        ...(row ? [{ key: 'verdict', value: `${row.verdict} · ${row.reasonCode}` }, { key: 'changed', value: row.changedFromBase ?? 'nothing' }] : []),
      ],
    };
  });
}

export const trustClassOf = trustOf;
