/**
 * The Blueprint document → what the design pages render.
 *
 * Requirements table, the 19 canonical sections, validation findings, the architecture graph and the
 * deterministic permission model. Every value is read off the Blueprint; a limit the Blueprint left
 * unresolved renders as UNRESOLVED / REQUIRED, never as a number.
 */
import type {
  ArchEdge, ArchEdgeKind, ArchLayer, ArchNode, ArchNodeKind, ArchitectureGraph, Blueprint, BlueprintField, BlueprintSection,
  NetworkRole, PermissionRule, PermissionsModel, Severity, Status, TrustClass, ValidationFinding, ValidationGroup, Verdict,
} from '../../types';
import { known, type BlueprintDocument, type BlueprintGraph, type BuildView, type Finding, type GraphNode, type MaybeUnknown, type ValidationIssue } from '../types';
import type { CodeFile } from '../../types';
import type { DetectedRequirement } from '../../content/composer';

/* ─────────────────────────── formatting ─────────────────────────── */

export const usd = (cents: number | null | undefined): string =>
  cents === null || cents === undefined ? 'UNRESOLVED' : `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const mu = <T,>(m: MaybeUnknown<T> | undefined | null, f: (v: T) => string = String): string => {
  const v = known(m);
  return v === null ? 'UNRESOLVED' : f(v);
};

const list = (xs: string[]): string => (xs.length ? xs.join(' · ') : '—');

/* ─────────────────────────── requirements ─────────────────────────── */

export interface RequirementsEvent {
  objective?: string;
  /** The Requirements agent names each unknown as `{field, reason}`; older payloads carried strings. */
  unknowns?: Array<string | { field: string; reason?: string }>;
  allowedActions?: Array<string | { id?: string; statement?: string; kind?: string }>;
  forbiddenActions?: Array<string | { id?: string; statement?: string; kind?: string }>;
}

const asText = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    const head = (o.statement ?? o.field ?? o.kind ?? o.id) as string | undefined;
    const tail = typeof o.reason === 'string' ? ` — ${o.reason}` : '';
    return head ? `${head}${tail}` : JSON.stringify(v);
  }
  return String(v);
};

/**
 * The requirements table (spec §10).
 *
 * From the Blueprint when there is one, and from the requirements event before that. A field the
 * pipeline could not establish is REQUIRED with the pipeline's own reason — the interview asks
 * about exactly these.
 */
export function detectedRequirements(bp: BlueprintDocument | null, ev: RequirementsEvent | null): DetectedRequirement[] {
  if (!bp && !ev) return [];
  const req = (id: string, label: string, value: string, status: Status, note?: string): DetectedRequirement => ({ id, label, value, status, note });
  if (!bp) {
    const unknowns = (ev?.unknowns ?? []).map(asText);
    const allowed = (ev?.allowedActions ?? []).map(asText);
    const forbidden = (ev?.forbiddenActions ?? []).map(asText);
    return [
      req('req_objective', 'Objective', ev?.objective ?? '—', ev?.objective ? 'PASS' : 'WARN'),
      req('req_action', 'Allowed actions', list(allowed), allowed.length > 0 ? 'PASS' : 'WARN'),
      req('req_forbidden', 'Forbidden actions', list(forbidden), forbidden.length > 0 ? 'PASS' : 'WARN'),
      ...unknowns.map((u, i) => req(`req_unknown_${i}`, 'Not stated', u, 'REQUIRED', 'The pipeline named this as unknown; it will not be invented.')),
    ];
  }
  const auto = bp.autonomousPolicy.maxValueUsdCents;
  const escMin = bp.escalationPolicy.minValueUsdCents;
  const escMax = bp.escalationPolicy.maxValueUsdCents;
  const unresolved = (m: MaybeUnknown<unknown>) => (!m.known ? (m.reason ?? 'Not stated in the description') : undefined);
  const data = bp.dataRequirements.length ? bp.dataRequirements : null;
  const recipients = bp.actions.map((a) => (a.recipientPolicy.mode === 'self-only' ? 'the vault only' : a.recipientPolicy.mode === 'fixed-allowlist' ? 'fixed allowlist' : 'ARBITRARY'));
  const arbitrary = bp.actions.some((a) => a.targetPolicy.mode === 'arbitrary' || a.recipientPolicy.mode === 'arbitrary');
  return [
    req('req_objective', 'Objective', bp.objective, 'PASS'),
    req('req_protocol', 'Protocols', list(bp.protocols.map((p) => `${p.displayName} · ${p.kind}`)), 'PASS'),
    req('req_trigger', 'Triggers', list(bp.triggers.map((t) => `${t.description}${t.thresholdIsConfidential ? ' (confidential threshold)' : ''}`)), 'PASS'),
    req('req_action', 'Actions', list(bp.actions.map((a) => a.displayName)), bp.actions.length ? 'PASS' : 'WARN'),
    req('req_data', 'Data requirements', data ? list(data.map((d) => `${d.kind} · ${d.minimumTrustClass} · ≤ ${Math.round(d.maxAgeMs / 1000)}s`)) : 'None declared', data ? 'PASS' : 'WARN'),
    req('req_autonomous', 'Autonomous limit', mu(auto, (v) => `${usd(v)} per action`), auto.known ? 'PASS' : 'REQUIRED', unresolved(auto) ?? (auto.known && auto.sourceQuote ? `from your words: “${auto.sourceQuote}”` : undefined)),
    req('req_escalation', 'Escalation band', escMin.known && escMax.known ? `${usd(escMin.value)} – ${usd(escMax.value)} · ${bp.escalationPolicy.mechanism}` : 'UNRESOLVED', escMin.known && escMax.known ? 'PASS' : 'REQUIRED', unresolved(escMin) ?? unresolved(escMax)),
    req('req_ceiling', 'Hard deny ceiling', mu(escMax, (v) => `above ${usd(v)} — DENY, no path to execution`), escMax.known ? 'PASS' : 'REQUIRED', unresolved(escMax) ?? 'A hard ceiling is never inferred from the other limits.'),
    req('req_recipients', 'Recipient restriction', list([...new Set(recipients)]), arbitrary ? 'FAIL' : 'PASS', arbitrary ? 'An arbitrary target or recipient needs a written justification and is flagged by the validator.' : undefined),
    req('req_forbidden', 'Forbidden actions', list(bp.permissions.denied.map((d) => d.statement)), bp.permissions.denied.length ? 'PASS' : 'REQUIRED'),
    req('req_ttl', 'Capability TTL', `${bp.capabilityPolicy.ttlSeconds}s · ${bp.capabilityPolicy.bindings.length} bindings`, 'PASS'),
  ];
}

/* ─────────────────────────── validation ─────────────────────────── */

function groupOf(code: string, path: string): ValidationGroup {
  if (code.startsWith('ADP')) return 'adapter-compatibility';
  if (/trust|age|fresh/i.test(code + path)) return 'trust-freshness';
  if (/chain|network|execution/i.test(path)) return 'execution-network';
  if (/unknown|unresolved|missing|UNKNOWN/i.test(code + path)) return 'missing-required';
  if (code.startsWith('BP-') || code.startsWith('SEC-')) return 'security-invariant';
  return 'schema';
}

function sectionOfPath(path: string): BlueprintSection['id'] {
  const head = path.split(/[.[]/)[0] ?? '';
  const map: Record<string, BlueprintSection['id']> = {
    identity: 'identity', objective: 'objective', protocols: 'protocols', assets: 'assets', triggers: 'triggers', actions: 'actions',
    permissions: 'permissions', autonomousPolicy: 'autonomous-policy', perActionLimits: 'autonomous-policy', escalationPolicy: 'escalation-policy',
    confidentialPolicy: 'confidential-policy', dataRequirements: 'data-requirements', contextSources: 'data-requirements', adapters: 'generated-modules',
    capabilityPolicy: 'capability-policy', ens: 'ens', cre: 'cre', ledger: 'ledger', execution: 'execution-networks',
    simulationScenarios: 'simulation-requirements', generatedModules: 'generated-modules', securityAssertions: 'security-assertions',
    requiredExecutionCapabilities: 'generated-modules', security: 'security-assertions',
  };
  return map[head] ?? 'security-assertions';
}

export function toValidationFindings(issues: Array<ValidationIssue | Finding>): ValidationFinding[] {
  return issues.map((i, n) => ({
    id: `${i.code}-${n}`,
    group: groupOf(i.code, i.path),
    severity: i.severity as Severity,
    message: `${i.code} — ${i.message}`,
    detail: ('remediation' in i && i.remediation ? i.remediation : 'source' in i ? `Raised by ${i.source}.` : '') || i.message,
    sectionId: sectionOfPath(i.path),
    fieldKey: i.path,
  }));
}

/* ─────────────────────────── sections ─────────────────────────── */

const F = (key: string, label: string, value: string, extra: Partial<BlueprintField> = {}): BlueprintField => ({ key, label, value, ...extra });

export function blueprintSections(bp: BlueprintDocument): BlueprintSection[] {
  const auto = bp.autonomousPolicy.maxValueUsdCents;
  const escMin = bp.escalationPolicy.minValueUsdCents;
  const escMax = bp.escalationPolicy.maxValueUsdCents;
  const sections: BlueprintSection[] = [
    { id: 'identity', index: 1, title: 'Identity', summary: 'Who this agent is, as a distinct principal.', fields: [
      F('identity.agentId', 'Agent id', bp.identity.agentId, { mono: true }),
      F('identity.ensName', 'ENS name', bp.identity.ensName, { mono: true, editable: true, hint: 'The name the executor reads live at execution time.' }),
      F('identity.network', 'Network', `${bp.identity.network} (${bp.identity.chainId})`),
      F('identity.agentAddress', 'Agent address', mu(bp.identity.agentAddress), { mono: true, hint: 'Signs requests only; holds no financial authority.' }),
    ] },
    { id: 'objective', index: 2, title: 'Objective', summary: 'The single purpose this agent exists to serve.', fields: [
      F('objective', 'Objective', bp.objective, { editable: true }),
    ] },
    { id: 'protocols', index: 3, title: 'Protocols', summary: 'The exact venues this agent may interact with.', fields: bp.protocols.flatMap((p) => [
      F(`protocols.${p.id}`, p.displayName, `${p.kind} · chain ${p.chainId}`),
      ...p.contracts.map((c) => F(`protocols.${p.id}.${c.role}`, `${p.displayName} · ${c.role}`, mu(c.address), { mono: true })),
    ]) },
    { id: 'assets', index: 4, title: 'Assets', summary: 'Which assets may be read and which may be moved.', fields: bp.assets.map((a) => F(`assets.${a.symbol}`, a.symbol, `${mu(a.address)} · ${a.decimals} decimals`, { mono: true })) },
    { id: 'triggers', index: 5, title: 'Triggers', summary: 'What causes this agent to evaluate an action.', fields: bp.triggers.map((t) => F(`triggers.${t.id}`, `${t.kind}`, `${t.description}${t.thresholdIsConfidential ? ` · confidential threshold${t.confidentialParameterName ? ` (${t.confidentialParameterName})` : ''}` : t.publicThreshold ? ` · ${mu(t.publicThreshold)}` : ''}`)) },
    { id: 'actions', index: 6, title: 'Actions', summary: 'Everything the agent can ask the executor to do, and to whom.', fields: bp.actions.flatMap((a) => [
      F(`actions.${a.id}`, a.displayName, `${a.kind} on ${a.protocolRef} · spends ${list(a.spendsAssets)}`),
      F(`actions.${a.id}.target`, `${a.displayName} · target`, a.targetPolicy.mode === 'protocol-resolved' ? `${a.targetPolicy.protocolRef}.${a.targetPolicy.contractRole}` : a.targetPolicy.mode === 'fixed-allowlist' ? list((a.targetPolicy.allowed ?? []).map((x) => mu(x))) : `ARBITRARY — ${a.targetPolicy.justification ?? ''}`, { mono: a.targetPolicy.mode !== 'arbitrary' }),
      F(`actions.${a.id}.recipient`, `${a.displayName} · recipient`, a.recipientPolicy.mode === 'self-only' ? 'self-only (the vault)' : a.recipientPolicy.mode === 'fixed-allowlist' ? list((a.recipientPolicy.allowed ?? []).map((x) => mu(x))) : `ARBITRARY — ${a.recipientPolicy.justification ?? ''}`),
      ...a.approvals.map((ap) => F(`actions.${a.id}.approval.${ap.assetSymbol}`, `${a.displayName} · approval ${ap.assetSymbol}`, `${ap.spenderRole} · ${ap.maxAmountPolicy} · never unlimited`)),
    ]) },
    { id: 'permissions', index: 7, title: 'Permissions', summary: 'Stated allow and deny rules, as the policy compiler reads them.', fields: [
      ...bp.permissions.allowed.map((p) => F(`permissions.allowed.${p.id}`, 'ALLOW', p.statement)),
      ...bp.permissions.denied.map((p) => F(`permissions.denied.${p.id}`, 'DENY', p.statement)),
    ] },
    { id: 'autonomous-policy', index: 8, title: 'Autonomous policy', summary: 'What the agent may do with no human involved.', fields: [
      F('autonomousPolicy.maxValueUsdCents', 'Max value per action', mu(auto, (v) => usd(v)), { editable: true, hint: auto.known && auto.sourceQuote ? `From your words: “${auto.sourceQuote}”` : !auto.known ? (auto.reason ?? 'Not established') : undefined }),
      F('autonomousPolicy.allowedActionRefs', 'Allowed actions', list(bp.autonomousPolicy.allowedActionRefs)),
      ...bp.perActionLimits.map((l) => F(`perActionLimits.${l.actionRef}`, `${l.actionRef} (tightening)`, `auto ${mu(l.autonomousMaxUsdCents, usd)} · escalate ${mu(l.escalationMinUsdCents, usd)}–${mu(l.escalationMaxUsdCents, usd)}`, { hint: `“${l.sourceQuote}”` })),
    ] },
    { id: 'escalation-policy', index: 9, title: 'Escalation policy', summary: 'The band that needs a human, and the ceiling above which nothing can run.', fields: [
      F('escalationPolicy.minValueUsdCents', 'Escalate from', mu(escMin, usd), { editable: true }),
      F('escalationPolicy.maxValueUsdCents', 'Hard deny above', mu(escMax, usd), { editable: true }),
      F('escalationPolicy.mechanism', 'Mechanism', bp.escalationPolicy.mechanism === 'ledger-device' ? 'Ledger device (no physical evidence — BLK-002)' : 'approval registry stand-in (BLK-002)'),
      F('escalationPolicy.denyIsTerminal', 'DENY is terminal', 'true — no approval can turn a DENY into execution'),
    ] },
    { id: 'confidential-policy', index: 10, title: 'Confidential policy', summary: 'What the CRE workflow evaluates privately. Names only — values are never in the Blueprint.', fields: [
      F('confidentialPolicy.required', 'Required', bp.confidentialPolicy.required ? 'yes' : 'no'),
      F('confidentialPolicy.placement', 'Placement', bp.confidentialPolicy.placement),
      F('confidentialPolicy.parameterNames', 'Parameters', list(bp.confidentialPolicy.parameterNames), { hint: 'Values are confidential and are never rendered anywhere.' }),
      F('confidentialPolicy.reasonCodes', 'Reason codes', list(bp.confidentialPolicy.reasonCodes), { mono: true }),
    ] },
    { id: 'data-requirements', index: 11, title: 'Data requirements', summary: 'What the policy needs to know, at what trust class and how fresh.', fields: [
      ...bp.dataRequirements.map((d) => F(`dataRequirements.${d.key}`, d.key, `${d.kind}${d.subject ? ` (${d.subject})` : ''} · ≥ ${d.minimumTrustClass} · ≤ ${Math.round(d.maxAgeMs / 1000)}s${d.confidential ? ' · confidential' : ''}${d.fallback ? ` · fallback ${d.fallback.adapterId}@${d.fallback.adapterVersion} at ${d.fallback.allowedTrust}` : ' · no fallback'}`)),
      ...bp.contextSources.map((c) => F(`contextSources.${c.id}`, `${c.id} (context source)`, `${c.dataKind} · ≥ ${c.minimumTrustClass} · ≤ ${Math.round(c.maxAgeMs / 1000)}s · ${c.placement}${c.fallbackAllowed ? ' · fallback allowed' : ''}`)),
    ] },
    { id: 'capability-policy', index: 12, title: 'Capability policy', summary: 'What a single capability binds, and for how long.', fields: [
      F('capabilityPolicy.ttlSeconds', 'TTL', `${bp.capabilityPolicy.ttlSeconds}s`, { editable: true }),
      F('capabilityPolicy.nonceStrategy', 'Nonce', bp.capabilityPolicy.nonceStrategy),
      F('capabilityPolicy.bindings', 'Bindings', list(bp.capabilityPolicy.bindings), { mono: true }),
    ] },
    { id: 'ens', index: 13, title: 'ENS', summary: 'Identity and revocation. Never financial permission.', fields: [
      F('ens.identityReadAt', 'Identity read', bp.ens.identityReadAt),
      F('ens.revocationInvalidatesOutstanding', 'Revocation', 'invalidates outstanding capabilities'),
      F('ens.financialPermissionsInEns', 'Financial roles in ENS', 'none — ContextLock policy defines permissions'),
    ] },
    { id: 'cre', index: 14, title: 'CRE', summary: 'Where confidential evaluation runs, and in which mode.', fields: [
      F('cre.required', 'Required', bp.cre.required ? 'yes' : 'no'),
      F('cre.mode', 'Mode', bp.cre.mode),
      F('cre.confidentialHandler', 'Confidential handler', bp.cre.confidentialHandler ? 'yes' : 'no'),
      F('cre.verdicts', 'Verdicts', list(bp.cre.verdicts)),
    ] },
    { id: 'ledger', index: 15, title: 'Ledger / elevation', summary: 'The human gate.', fields: [
      F('ledger.keyRingRequired', 'Key Ring', bp.ledger.keyRingRequired ? 'required' : 'not required'),
      F('ledger.humanApprovalRequired', 'Human approval', bp.ledger.humanApprovalRequired ? 'required for ESCALATE' : 'not required'),
      F('ledger.physicalDeviceEvidence', 'Physical device evidence', `none${bp.ledger.blockerRef ? ` (${bp.ledger.blockerRef})` : ''}`),
    ] },
    { id: 'execution-networks', index: 16, title: 'Execution networks', summary: 'Where transactions may go. Never a production chain.', fields: [
      F('execution.chainId', 'Chain', `${bp.execution.chainId} (Ethereum Sepolia; the fork lab executes on a local fork, chain 31337)`),
      F('execution.executorAddress', 'Executor', mu(bp.execution.executorAddress), { mono: true }),
      F('execution.relayerSubmits', 'Submits transactions', 'the relayer — the agent holds no key'),
      F('execution.agentHoldsCapabilityIssuerKey', 'Agent holds issuer key', 'no'),
      F('execution.agentHoldsProtocolAdminKey', 'Agent holds admin key', 'no'),
    ] },
    { id: 'simulation-requirements', index: 17, title: 'Simulation requirements', summary: 'Every scenario the mandatory pass runs, with what it must produce.', fields: bp.simulationScenarios.map((s) => F(`simulationScenarios.${s.scenarioId}`, s.scenarioId, `${s.description} → ${s.expectedVerdict} / ${s.expectedOutcome}${s.expectedStopStage !== 'NONE' ? ` (stops at ${s.expectedStopStage})` : ''}`)) },
    { id: 'generated-modules', index: 18, title: 'Generated modules & adapters', summary: 'What the build must produce, and which adapters it binds.', fields: [
      // One adapter can be bound more than once (a state adapter feeding two requirements), so the
      // key is the binding, not the adapter.
      ...bp.adapters.map((a, i) => F(`adapters.${i}.${a.adapterId}.${a.role}`, `${a.adapterId}@${a.adapterVersion}`, `${a.role} · ${a.configRef}${a.rationale ? ` — ${a.rationale}` : ''}`)),
      ...bp.generatedModules.map((m) => F(`generatedModules.${m.moduleId}`, m.path, `${m.kind} · ${m.templateRef}${m.reusesContextLockCore ? ' · reuses ContextLock core' : ''}`, { mono: true })),
    ] },
    { id: 'security-assertions', index: 19, title: 'Security assertions', summary: 'What the build must prove, and which tests prove it.', fields: bp.securityAssertions.map((a) => F(`securityAssertions.${a.id}`, a.id, `${a.statement} — proven by ${list(a.provenBy)}`)) },
  ];
  return sections;
}

export function toBlueprint(bp: BlueprintDocument, issues: Array<ValidationIssue | Finding>, opts: { isDraft?: boolean; baseRevision?: number | null } = {}): Blueprint {
  const findings = toValidationFindings(issues);
  const critical = findings.some((f) => f.severity === 'CRITICAL');
  return {
    revision: bp.revision,
    status: critical ? 'BLOCKED' : findings.some((f) => f.severity === 'HIGH') ? 'WARN' : 'VALID',
    isDraft: opts.isDraft ?? false,
    baseRevision: opts.baseRevision ?? null,
    sections: blueprintSections(bp),
    findings,
    raw: bp as unknown as Record<string, unknown>,
  };
}

/* ─────────────────────────── architecture ─────────────────────────── */

const KIND_OF: Record<string, ArchNodeKind> = {
  User: 'operator', Agent: 'agent-runtime', EnsIdentity: 'ens', Broker: 'policy', CreWorkflow: 'cre', PrivatePolicy: 'cre',
  AuthorizationRegistry: 'policy', Capability: 'capability', LedgerKeyRing: 'ledger', LedgerApproval: 'ledger', Executor: 'executor',
  DefiProtocol: 'aave', Adapter: 'adapter-broker', DataSource: 'chainlink-feed',
};

const LAYERS_OF: Record<ArchNodeKind, ArchLayer[]> = {
  operator: ['identity'], 'agent-runtime': ['runtime'], ens: ['identity', 'security-boundaries'], policy: ['policy', 'security-boundaries'],
  cre: ['policy', 'data'], 'chainlink-feed': ['data'], 'the-graph': ['data'], aave: ['execution'], uniswap: ['execution'],
  'adapter-broker': ['data', 'execution'], 'reality-engine': ['data'], 'local-fork': ['execution'], capability: ['policy', 'execution', 'security-boundaries'],
  executor: ['execution', 'security-boundaries'], treasury: ['execution'], ledger: ['policy', 'identity'],
};

function kindOf(n: GraphNode): ArchNodeKind {
  if (n.kind === 'DefiProtocol') {
    const l = n.label.toLowerCase();
    if (l.includes('uniswap') || l.includes('dex') || l.includes('router')) return 'uniswap';
    return 'aave';
  }
  if (n.kind === 'DataSource' || n.kind === 'Adapter') {
    const l = (n.label + ' ' + (n.sublabel ?? '')).toLowerCase();
    if (l.includes('graph')) return 'the-graph';
    if (l.includes('chainlink') || l.includes('oracle') || l.includes('price') || l.includes('feed')) return 'chainlink-feed';
    return n.kind === 'Adapter' ? 'adapter-broker' : 'reality-engine';
  }
  return KIND_OF[n.kind] ?? 'policy';
}

function statusOfNode(state: GraphNode['state']): Status {
  switch (state) {
    case 'PASS': return 'PASS';
    case 'FAIL': return 'FAIL';
    case 'WARN': return 'WARN';
    case 'BLOCKED': return 'BLOCKED';
    case 'RUNNING': return 'RUNNING';
    case 'GENERATING': return 'RUNNING';
    case 'READY': return 'READY';
    default: return 'PENDING';
  }
}

const EDGE_KIND_OF: Record<string, ArchEdgeKind> = { authority: 'AUTHORIZATION', data: 'READ', control: 'POLICY' };

function edgeKindOf(e: BlueprintGraph['edges'][number]): ArchEdgeKind {
  const l = (e.label ?? '').toLowerCase();
  if (l.includes('escalate')) return 'ESCALATE';
  if (l.includes('exact call') || l.includes('prepare')) return 'EXECUTE';
  if (l.includes('instruct') || l.includes('propose')) return 'TRIGGER';
  if (l.includes('who is') || l.includes('threshold') || l.includes('secret') || l.includes('identity read')) return e.kind === 'authority' ? 'AUTHORIZATION' : 'CONTEXT';
  return EDGE_KIND_OF[e.kind] ?? 'CONTEXT';
}

/** Runtime overlay states from the control plane → the graph's live status. */
export type LiveNodeStates = Partial<Record<ArchNodeKind, Status>>;

export function toArchitecture(g: BlueprintGraph, bp: BlueprintDocument | null, live: LiveNodeStates = {}, nodeStates: Record<string, string> = {}): ArchitectureGraph {
  const chainIdOf = (kind: ArchNodeKind): NetworkRole =>
    kind === 'chainlink-feed' || kind === 'the-graph' || kind === 'reality-engine' ? 'MAINNET_READ_ONLY'
    : kind === 'operator' || kind === 'agent-runtime' || kind === 'cre' || kind === 'adapter-broker' ? 'OFF_CHAIN'
    : 'EXECUTION_TESTNET';
  const trustOf = (kind: ArchNodeKind): TrustClass | undefined =>
    kind === 'chainlink-feed' ? 'VERIFIED_ORACLE' : kind === 'the-graph' ? 'INDEXED' : kind === 'reality-engine' ? 'READ_ONLY' : kind === 'cre' ? 'SIMULATED' : undefined;

  const nodes: ArchNode[] = g.nodes.map((n) => {
    const kind = kindOf(n);
    const detail = Object.fromEntries(n.detail.map((d) => [d.label, d.value]));
    const refValue = Object.values(detail).find((v) => /^0x[0-9a-fA-F]{40}$/.test(v));
    const overlay = nodeStates[n.id] ? statusOfNode(nodeStates[n.id] as GraphNode['state']) : statusOfNode(n.state);
    return {
      id: n.id,
      // The backend lays out on a 260×130 grid for 180px nodes; ours are 216px wide and taller.
      position: { x: n.position.x * 1.35, y: n.position.y * 1.15 },
      data: {
        kind,
        label: n.label,
        purpose: n.sublabel ?? detail.Role ?? detail.Objective ?? n.detail[0]?.value ?? '',
        adapter: n.kind === 'Adapter' ? n.label : undefined,
        version: detail.Version,
        trustClass: trustOf(kind),
        networkRole: chainIdOf(kind),
        status: overlay,
        liveStatus: live[kind],
        ref: refValue ? { label: 'Address', value: refValue, kind: 'address' } : undefined,
        capabilities: n.detail.filter((d) => d.label !== 'Objective').map((d) => `${d.label}: ${d.value}`),
        generatedModule: bp?.generatedModules.find((m) => n.id.startsWith('adapter-') && m.templateRef.startsWith(n.id.replace(/^adapter-/, '').split('-')[0] ?? ''))?.path,
        layers: LAYERS_OF[kind],
        blueprintSection: kind === 'ens' ? 'ens' : kind === 'cre' ? 'cre' : kind === 'ledger' ? 'ledger' : kind === 'capability' ? 'capability-policy' : kind === 'aave' || kind === 'uniswap' ? 'protocols' : kind === 'policy' ? 'permissions' : undefined,
      },
    };
  });
  const edges: ArchEdge[] = g.edges.map((e) => {
    const kind = edgeKindOf(e);
    const src = nodes.find((n) => n.id === e.source)?.data.layers ?? [];
    const dst = nodes.find((n) => n.id === e.target)?.data.layers ?? [];
    return { id: e.id, source: e.source, target: e.target, kind, label: e.label ? e.label.toUpperCase() : kind, layers: [...new Set([...src, ...dst])], requiresCre: e.source === 'cre' || e.target === 'cre' };
  });
  return { revision: g.revision, nodes, edges };
}

/* ─────────────────────────── permissions ─────────────────────────── */

export function toPermissions(bp: BlueprintDocument, findings: Finding[], executionSummary: string): PermissionsModel {
  const auto = known(bp.autonomousPolicy.maxValueUsdCents);
  const escMin = known(bp.escalationPolicy.minValueUsdCents);
  const escMax = known(bp.escalationPolicy.maxValueUsdCents);
  const critical = findings.some((f) => f.severity === 'CRITICAL');
  const unresolved = auto === null || escMax === null;
  const sims = (ids: string[]) => bp.simulationScenarios.filter((s) => ids.some((id) => s.scenarioId.includes(id))).map((s) => s.scenarioId);
  const rules: PermissionRule[] = [];
  const rule = (id: string, verdict: Verdict, label: string, detail: string, proven: string[]) => rules.push({ id, verdict, label, detail, provenSimulationIds: proven, policyRef: id });

  for (const d of bp.dataRequirements) rule(`READ-${d.key}`, 'ALLOW', `Read ${d.kind}`, `${d.minimumTrustClass} or better, no older than ${Math.round(d.maxAgeMs / 1000)}s${d.fallback ? '' : ' — no fallback'}`, sims(['STALE', 'FRESH']));
  for (const a of bp.actions) {
    const perAction = bp.perActionLimits.find((l) => l.actionRef === a.id);
    const aAuto = perAction ? known(perAction.autonomousMaxUsdCents) : auto;
    const aMin = perAction ? known(perAction.escalationMinUsdCents) : escMin;
    const aMax = perAction ? known(perAction.escalationMaxUsdCents) : escMax;
    rule(`ALLOW-${a.id}`, 'ALLOW', `${a.displayName} ≤ ${usd(aAuto)}`, `Autonomous, ${a.recipientPolicy.mode === 'self-only' ? 'to the vault only' : 'to the allowlist only'}, on ${a.protocolRef}.`, sims(['NORMAL', 'AMOUNT']));
    rule(`ESC-${a.id}`, 'ESCALATE', `${a.displayName} ${usd(aMin ?? aAuto)} – ${usd(aMax)}`, `Requires a human signature in the approval registry; DENY cannot be overridden by it.`, sims(['ESCALATE', 'APPROVAL']));
    rule(`DENY-${a.id}-CAP`, 'DENY', `${a.displayName} above ${usd(aMax)}`, 'Hard ceiling. No approval path exists for this.', sims(['AMOUNT', 'CAP']));
  }
  for (const d of bp.permissions.denied) rule(`DENY-${d.id}`, 'DENY', d.statement, d.actionRef ? `Applies to ${d.actionRef}.` : 'Not in the action allowlist at any amount.', sims(['PROMPT_INJECTION', 'TARGET', 'RECIPIENT']));
  rule('DENY-MAINNET', 'DENY', 'Any write on a production chain', 'Production-chain execution is disabled for this project; refused at four independent layers.', sims(['MAINNET']));

  return {
    posture: critical ? 'FAIL' : unresolved ? 'BLOCKED' : 'PASS',
    executionSummary,
    mainnetWrites: 'PROHIBITED',
    policyRevision: bp.revision,
    rules,
    panels: [
      { id: 'capability', title: 'Capability bindings', description: 'Every capability binds exactly one transaction.', items: [
        { label: 'TTL', value: `${bp.capabilityPolicy.ttlSeconds}s` },
        { label: 'Nonce', value: bp.capabilityPolicy.nonceStrategy, mono: true },
        { label: 'Bound fields', value: bp.capabilityPolicy.bindings.join(', '), mono: true },
      ] },
      { id: 'recipients', title: 'Recipient / target restrictions', description: 'Where value may go, per action.', items: bp.actions.map((a) => ({ label: a.displayName, value: `target ${a.targetPolicy.mode} · recipient ${a.recipientPolicy.mode}`, tone: a.targetPolicy.mode === 'arbitrary' || a.recipientPolicy.mode === 'arbitrary' ? 'deny' : 'pass' })) },
      { id: 'expiry', title: 'Expiry / nonce rules', description: 'Replay is refused on chain, not by the agent.', items: [
        { label: 'Expiry', value: `${bp.capabilityPolicy.ttlSeconds}s after issue` },
        { label: 'Replay', value: 'nonce consumed on success; a second use reverts', tone: 'pass' },
      ] },
      { id: 'data-trust', title: 'Data trust requirements', description: 'A weaker source is never substituted silently.', items: bp.dataRequirements.map((d) => ({ label: d.key, value: `≥ ${d.minimumTrustClass} · ≤ ${Math.round(d.maxAgeMs / 1000)}s${d.fallback ? ` · fallback ${d.fallback.adapterId}` : ' · no fallback'}`, tone: d.fallback ? 'warn' : 'pass' })) },
      { id: 'confidentiality', title: 'Confidentiality evidence', description: 'What the CRE workflow keeps private.', items: [
        { label: 'Placement', value: bp.confidentialPolicy.placement },
        { label: 'Parameters', value: bp.confidentialPolicy.parameterNames.join(', ') || 'none' },
        { label: 'Execution', value: bp.cre.mode === 'official-cli-simulator' ? 'official CLI simulator — no DON, no TEE' : bp.cre.mode, tone: 'sim' },
      ] },
      { id: 'identity', title: 'Identity / revocation', description: 'ENS identifies and revokes; it never grants spend.', items: [
        { label: 'ENS name', value: bp.identity.ensName, mono: true },
        { label: 'Read at', value: bp.ens.identityReadAt },
        { label: 'Revocation', value: 'invalidates outstanding capabilities', tone: 'pass' },
      ] },
      { id: 'org', title: 'Organization aggregate rules', description: 'Shared budgets across principals, when the agent belongs to one.', items: [{ label: 'Membership', value: 'set on the Organization page when this agent is a member' }] },
    ],
  };
}

/* ─────────────────────────── editing ─────────────────────────── */

export interface AuthorityDiff {
  field: string;
  label: string;
  before: string;
  after: string;
  expansion: boolean;
  note: string;
}

const parseUsdCents = (v: string): number | null => {
  const n = Number(v.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
};

/**
 * Turn field edits into the PATCH the backend applies, and the authority diff a reviewer sees.
 *
 * Only the fields the schema lets a person change are handled; anything else on the page is
 * read-only. A raised limit is an expansion and is said so; a lowered one is a tightening.
 */
export function blueprintPatch(bp: BlueprintDocument, edits: Record<string, string>): { patch: Partial<BlueprintDocument>; diff: AuthorityDiff[]; problems: string[] } {
  const patch: Partial<BlueprintDocument> = {};
  const diff: AuthorityDiff[] = [];
  const problems: string[] = [];
  const src = 'edited in the Blueprint editor';

  if (edits.objective !== undefined && edits.objective.trim() && edits.objective !== bp.objective) {
    patch.objective = edits.objective.trim();
    diff.push({ field: 'objective', label: 'Objective', before: bp.objective, after: patch.objective, expansion: false, note: 'Wording only — authority is defined by the limits and permissions, not the objective.' });
  }
  if (edits['identity.ensName'] !== undefined && edits['identity.ensName'] !== bp.identity.ensName) {
    const v = edits['identity.ensName'].trim().toLowerCase();
    if (!/^([a-z0-9-]+\.)+eth$/.test(v)) problems.push('ENS name must be a lowercase .eth name');
    else {
      patch.identity = { ...bp.identity, ensName: v };
      diff.push({ field: 'identity.ensName', label: 'ENS name', before: bp.identity.ensName, after: v, expansion: false, note: 'A different identity; outstanding capabilities for the old one are not honoured.' });
    }
  }
  const auto = edits['autonomousPolicy.maxValueUsdCents'];
  if (auto !== undefined) {
    const cents = parseUsdCents(auto);
    if (cents === null) problems.push('Autonomous limit must be a dollar amount');
    else {
      const before = known(bp.autonomousPolicy.maxValueUsdCents);
      if (cents !== before) {
        patch.autonomousPolicy = { ...bp.autonomousPolicy, maxValueUsdCents: { known: true, value: cents, sourceQuote: src } };
        const expansion = before === null || cents > before;
        diff.push({ field: 'autonomousPolicy.maxValueUsdCents', label: 'Autonomous amount per action', before: usd(before), after: usd(cents), expansion, note: expansion ? `The agent may autonomously move ${before === null ? 'up to this amount' : `an additional ${usd(cents - before)}`} per action.` : `Tighter autonomous limit — ${usd((before ?? 0) - cents)} less per action without a human.` });
      }
    }
  }
  const escMinEdit = edits['escalationPolicy.minValueUsdCents'];
  const escMaxEdit = edits['escalationPolicy.maxValueUsdCents'];
  if (escMinEdit !== undefined || escMaxEdit !== undefined) {
    const minBefore = known(bp.escalationPolicy.minValueUsdCents);
    const maxBefore = known(bp.escalationPolicy.maxValueUsdCents);
    const min = escMinEdit !== undefined ? parseUsdCents(escMinEdit) : minBefore;
    const max = escMaxEdit !== undefined ? parseUsdCents(escMaxEdit) : maxBefore;
    if (escMinEdit !== undefined && min === null) problems.push('Escalation floor must be a dollar amount');
    if (escMaxEdit !== undefined && max === null) problems.push('Hard ceiling must be a dollar amount');
    if (min !== null && max !== null && min > max) problems.push('The escalation floor cannot exceed the hard ceiling');
    if (problems.length === 0 && (min !== minBefore || max !== maxBefore)) {
      patch.escalationPolicy = {
        ...bp.escalationPolicy,
        minValueUsdCents: min === null ? bp.escalationPolicy.minValueUsdCents : { known: true, value: min, sourceQuote: src },
        maxValueUsdCents: max === null ? bp.escalationPolicy.maxValueUsdCents : { known: true, value: max, sourceQuote: src },
      };
      if (min !== minBefore) diff.push({ field: 'escalationPolicy.minValueUsdCents', label: 'Escalation band starts at', before: usd(minBefore), after: usd(min), expansion: min !== null && (minBefore === null || min > minBefore), note: min !== null && minBefore !== null && min > minBefore ? 'The band that requires a human starts higher: more runs autonomously.' : 'The band that requires a human starts lower.' });
      if (max !== maxBefore) diff.push({ field: 'escalationPolicy.maxValueUsdCents', label: 'Hard deny ceiling', before: usd(maxBefore), after: usd(max), expansion: max !== null && (maxBefore === null || max > maxBefore), note: max !== null && maxBefore !== null && max > maxBefore ? `Actions up to ${usd(max)} become possible with approval; they were denied outright.` : 'Fewer actions are possible even with approval.' });
    }
  }
  const ttl = edits['capabilityPolicy.ttlSeconds'];
  if (ttl !== undefined) {
    const n = Number(ttl.replace(/[^\d]/g, ''));
    if (!Number.isFinite(n) || n < 15 || n > 3600) problems.push('Capability TTL must be between 15 and 3600 seconds');
    else if (n !== bp.capabilityPolicy.ttlSeconds) {
      patch.capabilityPolicy = { ...bp.capabilityPolicy, ttlSeconds: n };
      diff.push({ field: 'capabilityPolicy.ttlSeconds', label: 'Capability TTL', before: `${bp.capabilityPolicy.ttlSeconds}s`, after: `${n}s`, expansion: n > bp.capabilityPolicy.ttlSeconds, note: n > bp.capabilityPolicy.ttlSeconds ? 'A capability stays valid longer after issue.' : 'A capability expires sooner.' });
    }
  }
  return { patch, diff, problems };
}

/* ─────────────────────────── generated files ─────────────────────────── */


export function groupOfPath(path: string): CodeFile['group'] {
  const p = path.toLowerCase();
  if (/(^|\/)(tests?|__tests__)\//.test(p) || /\.(test|spec)\.[tj]sx?$/.test(p)) return 'tests';
  if (/(^|\/)(workflows?|cre)\//.test(p)) return 'cre-workflow';
  if (/(^|\/)adapters?\//.test(p)) return 'adapter-modules';
  if (/(^|\/)contextlock\//.test(p) || /contextlock/.test(p) && /\.(ts|sol)$/.test(p)) return 'contextlock-modules';
  if (/dockerfile|(^|\/)(deploy|deployment|scripts|infra)\//.test(p) || /docker-compose/.test(p)) return 'deployment';
  if (/(^|\/)(agent|src)\//.test(p) && /\.[tj]sx?$/.test(p)) return 'generated-agent';
  if (/\.(json|ya?ml|toml|md|env|example|txt)$/.test(p) || /^\./.test(p.split('/').pop() ?? '')) return 'config';
  return 'generated-agent';
}

export function languageOfPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  return ({ ts: 'typescript', tsx: 'typescript', js: 'javascript', mjs: 'javascript', json: 'json', md: 'markdown', sol: 'solidity', yaml: 'yaml', yml: 'yaml', toml: 'toml', sh: 'shell', env: 'ini', example: 'ini' } as Record<string, string>)[ext] ?? 'plaintext';
}

export function toCodeFiles(files: BuildView['files'], currentBlueprintRevision: number | null, currentBuildRevision: number): CodeFile[] {
  return files.map((f) => {
    const stale = (currentBlueprintRevision !== null && f.blueprintRevision < currentBlueprintRevision) || f.buildRevision < currentBuildRevision;
    const group = groupOfPath(f.path);
    return {
      path: f.path,
      name: f.path.split('/').pop() ?? f.path,
      group,
      language: languageOfPath(f.path),
      marks: [group === 'adapter-modules' || group === 'contextlock-modules' ? 'template-owned' : 'generated', 'locked', ...(stale ? ['stale' as const] : [])],
      readOnly: true,
      revision: f.buildRevision,
      blueprintSection: group === 'cre-workflow' ? 'cre' : group === 'adapter-modules' ? 'generated-modules' : group === 'contextlock-modules' ? 'capability-policy' : group === 'tests' ? 'simulation-requirements' : undefined,
      content: '',
    };
  });
}
