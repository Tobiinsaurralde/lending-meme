/**
 * Backend response shapes, as the Studio API actually returns them.
 *
 * These are the contract with `apps/studio`. The workbench renders `lib/studio/types.ts`; the
 * `adapters/` directory translates one into the other. Keeping the two apart means a backend field
 * rename is a one-line change in an adapter rather than a hunt through twenty pages.
 */

/* ─────────────────────────── MaybeUnknown ─────────────────────────── */

/**
 * A financial parameter the Blueprint either established from the user's words or left explicitly
 * unresolved. There is deliberately no bare number: an absent limit must never read as a default.
 */
export type MaybeUnknown<T> = { known: true; value: T; sourceQuote?: string } | { known: false; reason?: string };

export function known<T>(m: MaybeUnknown<T> | null | undefined): T | null {
  return m && m.known ? m.value : null;
}

/* ─────────────────────────── blueprint document ─────────────────────────── */

export interface BpTargetPolicy {
  mode: 'fixed-allowlist' | 'protocol-resolved' | 'arbitrary';
  allowed?: MaybeUnknown<string>[];
  protocolRef?: string;
  contractRole?: string;
  justification?: string;
}
export interface BpRecipientPolicy {
  mode: 'self-only' | 'fixed-allowlist' | 'arbitrary';
  allowed?: MaybeUnknown<string>[];
  justification?: string;
}
export interface BpAction {
  id: string;
  kind: string;
  displayName: string;
  protocolRef: string;
  targetPolicy: BpTargetPolicy;
  recipientPolicy: BpRecipientPolicy;
  spendsAssets: string[];
  approvals: Array<{ assetSymbol: string; spenderRole: string; unlimited: false; maxAmountPolicy: string }>;
}
export interface BpPermission {
  id: string;
  statement: string;
  actionRef?: string;
}
export interface BpScenario {
  scenarioId: string;
  description: string;
  expectedVerdict: string;
  expectedOutcome: string;
  expectedStopStage: string;
}
export interface BlueprintDocument {
  schemaVersion: string;
  blueprintId: string;
  revision: number;
  createdAt: string;
  identity: { agentId: string; ensName: string; network: string; chainId: number; agentAddress: MaybeUnknown<string> };
  objective: string;
  protocols: Array<{ id: string; displayName: string; kind: string; chainId: number; contracts: Array<{ role: string; address: MaybeUnknown<string> }> }>;
  assets: Array<{ symbol: string; address: MaybeUnknown<string>; decimals: number; chainId: number }>;
  triggers: Array<{ id: string; kind: string; description: string; thresholdIsConfidential: boolean; confidentialParameterName?: string; publicThreshold?: MaybeUnknown<string> }>;
  actions: BpAction[];
  permissions: { allowed: BpPermission[]; denied: BpPermission[] };
  autonomousPolicy: { maxValueUsdCents: MaybeUnknown<number>; allowedActionRefs: string[] };
  escalationPolicy: { minValueUsdCents: MaybeUnknown<number>; maxValueUsdCents: MaybeUnknown<number>; mechanism: string; denyIsTerminal: true };
  perActionLimits: Array<{ actionRef: string; autonomousMaxUsdCents: MaybeUnknown<number>; escalationMinUsdCents: MaybeUnknown<number>; escalationMaxUsdCents: MaybeUnknown<number>; sourceQuote: string }>;
  confidentialPolicy: { required: boolean; placement: string; parameterNames: string[]; reasonCodes: string[] };
  contextSources: Array<{ id: string; dataKind: string; minimumTrustClass: string; maxAgeMs: number; fallbackAllowed: boolean; placement: string }>;
  adapters: Array<{ adapterId: string; adapterVersion: string; role: string; configRef: string; rationale: string }>;
  dataRequirements: Array<{ key: string; kind: string; subject?: string; chainId: number; unit?: string; minimumTrustClass: string; maxAgeMs: number; confidential: boolean; historical: boolean; fallback?: { adapterId: string; adapterVersion: string; allowedTrust: string; maxAgeMs: number } }>;
  capabilityPolicy: { ttlSeconds: number; nonceStrategy: string; bindings: string[] };
  ens: { required: true; identityReadAt: string; revocationInvalidatesOutstanding: true; financialPermissionsInEns: false };
  cre: { required: boolean; mode: string; confidentialHandler: boolean; verdicts: string[] };
  ledger: { keyRingRequired: boolean; humanApprovalRequired: boolean; physicalDeviceEvidence: false; blockerRef?: string };
  execution: { chainId: number; executorAddress: MaybeUnknown<string>; relayerSubmits: true; agentHoldsNoKey: true; agentHoldsCapabilityIssuerKey: false; agentHoldsProtocolAdminKey: false };
  simulationScenarios: BpScenario[];
  generatedModules: Array<{ moduleId: string; kind: string; path: string; templateRef: string; reusesContextLockCore: boolean }>;
  securityAssertions: Array<{ id: string; statement: string; provenBy: string[] }>;
}

export interface ValidationIssue {
  code: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  path: string;
  message: string;
  remediation?: string;
}

/* ─────────────────────────── builds ─────────────────────────── */

export type NodeState = 'PENDING' | 'GENERATING' | 'READY' | 'RUNNING' | 'PASS' | 'WARN' | 'FAIL' | 'BLOCKED';

export interface GraphNode {
  id: string;
  kind: string;
  label: string;
  sublabel?: string;
  rank: number;
  position: { x: number; y: number };
  state: NodeState;
  detail: Array<{ label: string; value: string }>;
}
export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  kind: 'authority' | 'data' | 'control';
  animated: boolean;
}
export interface BlueprintGraph {
  blueprintId: string;
  revision: number;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type BuildStage =
  | 'INTAKE' | 'REQUIREMENTS' | 'BLUEPRINT' | 'SECURITY_REVIEW' | 'AWAITING_APPROVAL'
  | 'BUILD' | 'TEST' | 'SIMULATE' | 'REPAIR' | 'FINAL_VERIFY' | 'EXPORT_READY';
export type BuildStatus =
  | 'RUNNING' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'FAILED' | 'PAUSED'
  | 'BUILD_LIMIT_REACHED' | 'BUILD_NEEDS_USER_REVIEW' | 'BUILD_PAUSED_UPSTREAM_LIMIT' | 'ABANDONED';

export interface BuildRow {
  id: string;
  projectId: string;
  userId: string;
  stage: BuildStage;
  status: BuildStatus;
  blueprintRevision: number | null;
  buildRevision: number;
  repairCycles: number;
  approvedAt: string | null;
  failureReason: string | null;
}

export interface SimulationResult {
  scenarioId: string;
  verdict: string;
  reasonCode: string;
  outcome: string;
  stoppedAt: string;
  passed: boolean;
  stale?: boolean;
  blueprintRevision: number;
  buildRevision: number;
  stages: Array<{ stage: string; status: string; detail: string; reason?: string }>;
  assertions: Array<{ id: string; statement: string; held: boolean; detail: string }>;
  timeline: Array<{ t: number; label: string }>;
  description?: string;
  expected?: { verdict: string; outcome: string; stopStage: string };
}

export interface Finding {
  code: string;
  severity: string;
  path: string;
  message: string;
  source: string;
}

export interface UsageSnapshot {
  requests: number;
  inputTokens: number;
  outputTokens: number;
  simulations: number;
  userSimulations: number;
  mandatorySimulations: number;
  generatedFiles: number;
  estimatedCostUsd: number | null;
  peakFraction: number;
  warned: boolean;
  limits: Record<string, number>;
}

export interface SecurityScore {
  total: number;
  max: number;
  band: string;
  criticalOutstanding: number;
  categories: Array<{ id: string; label: string; points: number; max: number; reasons: string[]; missing: string[] }>;
}

export interface BuildView {
  build: BuildRow;
  blueprint: BlueprintDocument | null;
  graph: BlueprintGraph | null;
  simulations: SimulationResult[];
  staleSimulations: number;
  codeStale: boolean;
  files: Array<{ path: string; bytes: number; buildRevision: number; blueprintRevision: number }>;
  findings: Finding[];
  tests: Array<{ suite: string; passed: number; failed: number; buildRevision: number }>;
  score: SecurityScore | null;
  usage: UsageSnapshot;
  events: number;
}

export interface DesignResult {
  build: BuildRow;
  blueprint: BlueprintDocument;
  issues: ValidationIssue[];
  graph: BlueprintGraph;
  usage: UsageSnapshot;
}

export interface ExportBundle {
  buildId: string;
  files: Array<{ path: string; content: string }>;
  totalBytes: number;
}

export interface StudioHealth {
  ok: boolean;
  model: string;
  sandboxProviders: string[];
  limits: Record<string, number | null>;
  controlPlane: string;
  lab: string;
  fork: string;
}

/* ─────────────────────────── projects ─────────────────────────── */

export interface ProjectBuildSummary {
  buildId: string;
  stage: BuildStage;
  status: BuildStatus;
  blueprintRevision: number | null;
  buildRevision: number;
  updatedAt: string;
}

export interface ProjectRow {
  id: string;
  name: string;
  prompt: string;
  ensName: string | null;
  createdAt: string;
  updatedAt: string;
  build: ProjectBuildSummary | null;
  organization: { orgId: string; agentId: string; name: string; rootEns: string } | null;
  deployment: { deploymentId: string; state: string; live: boolean } | null;
}

export interface OrganizationRow {
  id: string;
  name: string;
  rootEns: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
  agents: Array<{ id: string; displayName: string; ensName: string; projectId: string | null; buildId: string | null; stage: string | null; status: string | null }>;
}

export interface ProjectsIndex {
  projects: ProjectRow[];
  organizations: OrganizationRow[];
}

/* ─────────────────────────── organizations ─────────────────────────── */

export interface OrgGraphNode {
  id: string;
  kind: string;
  label: string;
  sublabel?: string;
  parentId?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  state: 'OK' | 'WARN' | 'BLOCKED';
  detail: Array<{ label: string; value: string }>;
}
export interface OrgGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  kind: 'resource' | 'message' | 'namespace';
  animated: boolean;
}
export interface OrgAgent {
  id: string;
  displayName: string;
  ensName: string;
  role?: string;
  objective?: string;
  executionCapabilities: string[];
  autonomousMaxUsdCents: number | null;
  escalationMaxUsdCents: number | null;
  dailyMaxUsdCents?: number | null;
  allowedAdapters?: string[];
  canMessage?: string[];
}
export interface OrgView {
  id: string;
  buildable: boolean;
  organization: { orgId: string; rootEns: string; revision?: number; agents: OrgAgent[]; sharedBudgets?: Array<Record<string, unknown>> };
  memberBuilds?: Record<string, { buildId: string; projectId: string; stage: string; status: string }>;
  issues: Array<{ code: string; severity: string; path: string; message: string; remediation: string }>;
  graph: { orgId: string; revision: number; nodes: OrgGraphNode[]; edges: OrgGraphEdge[] };
  scenarios: Array<{ id: string; title: string; probes: string; expected: { outcome: string; reasonCode: string | null } }>;
  blastRadii: Array<{
    compromisedAgentId: string;
    directCapabilities: string[];
    maxAutonomousUsdCents: number | null;
    maxWindowUsdCents: number | null;
    authorityReachesAgents: Array<{ agentId: string; via: string }>;
    canMessageAgents: string[];
    containedBy: string[];
  }>;
  rationale?: string;
  unknowns?: string[];
}

/* ─────────────────────────── adapters ─────────────────────────── */

export interface AdapterManifest {
  id: string;
  version: string;
  adapterType: string;
  name: string;
  description: string;
  provider: string;
  supportedChains: number[];
  capabilities: Array<{ name: string; dataKind?: string; trustClass?: string; description?: string }>;
  trustClass: string;
  freshnessSemantics: { typicalStalenessMs?: number | null; [k: string]: unknown };
  auth: { mode: string; requiredSecretNames?: string[]; [k: string]: unknown };
  executionPlacement: string;
  safety: Record<string, unknown>;
  generatedModules: Array<{ path: string; kind: string }>;
  simulationProviders: string[];
  securityAssertions: Array<{ id: string; statement: string; provenBy: string[] }>;
  documentation: { officialDocs: string[]; [k: string]: unknown };
}

/* ─────────────────────────── lab ─────────────────────────── */

export type LabProjectState =
  | 'DRAFT' | 'ARCHITECTURE_READY' | 'REVIEW_REQUIRED' | 'BUILDING' | 'BUILD_READY'
  | 'SIMULATION_READY' | 'PREFLIGHT_REQUIRED' | 'READY_TO_DEPLOY' | 'DEPLOYING'
  | 'READY_TO_ACTIVATE' | 'LAB_ACTIVE' | 'PAUSED' | 'EMERGENCY_LOCKED' | 'DEGRADED' | 'FAILED';

export interface NetworkBadge {
  chainId: number;
  name: string;
  role: string;
  roleLabel: string;
  purpose: 'MARKET_SOURCE' | 'EXECUTION_TARGET';
}

export interface LabStateView {
  projectId: string;
  state: LabProjectState;
  because: string;
  hasFinancialAuthority: boolean;
  nextAction: string | null;
  degradedDependencies: string[];
  label: { headline: string; detail: string };
  headlineClaim: string;
  executionNetwork: NetworkBadge;
  mode: {
    mode: string;
    execution: { networks: Array<{ chainId: number; name: string; role: string }>; summary: string };
    mainnet: { access: string; summary: string };
    cre: { default: string; summary: string };
    financialPolicy: { owner: string; summary: string };
    runtime: { isolation: string; summary: string };
    monitoring: { owner: string; summary: string };
    productionChainExecution: string;
  };
  computedFrom: {
    build: { stage: string; status: string } | null;
    deterministicSimulationsPassed: boolean;
    creSimulationPassed: boolean;
    preflightPassed: boolean;
    deployment: string | null;
    runtime: string | null;
    cre: string | null;
    policy: { enabled: boolean; observedAtBlock: string; observedAtMs: number; source: string } | null;
    emergencyLockActive: boolean;
    degradedDependencies: string[];
  };
}

export interface CapabilityLine { kind: 'CAN' | 'CANNOT'; statement: string; derivedFrom: string }

export interface LabSummaryView {
  summary: {
    name: string;
    goal: string;
    execution: { chainId: number; name: string; role: string; label: string };
    realityData: { chainId: number; name: string; role: string; label: string } | null;
    protocols: string[];
    verifiedMarketData: string[];
    cre: { required: boolean; mode: string };
    autonomous: string;
    humanApproval: string;
    hardDeny: string;
    forbidden: string[];
    blueprintRevision: number;
    perActionLimits: Array<{ action: string; autonomous: string; humanApproval: string; hardDeny: string; sourceQuote: string }>;
  };
  capabilities: CapabilityLine[];
  unestablishedBoundaries: string[];
  networks: { marketSource: NetworkBadge; executionTarget: NetworkBadge };
}

export interface RealityModeRow {
  mode: 'LIVE_MAINNET_MIRROR' | 'HISTORICAL_REPLAY' | 'LOCAL_MAINNET_FORK' | 'SYNTHETIC';
  label: string;
  availability: 'AVAILABLE' | 'LIMITED' | 'BLOCKED';
  reason: string | null;
  blocker: string | null;
  remedy: string | null;
  effect: string | null;
}
export interface SourceStatus {
  sourceId: string;
  displayName: string;
  status: 'HEALTHY' | 'STALE' | 'UNAVAILABLE' | 'NOT_CONFIGURED';
  reason: string | null;
  effect: string | null;
  securityImpact: string | null;
  blocker: string | null;
  tone: 'GREEN' | 'AMBER' | 'GREY';
}
export interface RealityView {
  modes: RealityModeRow[];
  sources: SourceStatus[];
  /** The NAMES of the secrets the Studio backend holds (e.g. THEGRAPH_API_KEY). Never a value. */
  configuredSecretNames?: string[];
  /** Where each is held — the Ledger Key Ring or the server environment — with the ring's local status. */
  protectedSources?: Array<{ name: string; source: 'ledger-key-ring' | 'env' | 'absent'; ring: { keyName: string; status: 'READY' | 'NOT_INITIALIZED' | 'UNAVAILABLE' } | null; note: string }>;
  networks: { marketSource: NetworkBadge; executionTarget: NetworkBadge };
}

export interface CreView {
  status: {
    mode: string;
    executionMode: string;
    account: string;
    organizationId: string | null;
    workflowBinary: string | null;
    productionLimits: string;
    donDeployment: 'YES' | 'NO';
    hardwareTee: 'YES' | 'NO';
    teeAttestation: 'YES' | 'NO';
    deployAccess: string;
    registries: string[];
  };
  connection: {
    connected: boolean;
    organizationId: string | null;
    organizationName: string | null;
    userEmail: string | null;
    deployAccess: boolean | null;
    registries: string[];
    cliVersion: string | null;
    credentialLocation: string;
  };
  promotion: { available: boolean; reason: string; message: string; blocker: string | null };
}

export interface CreConnectView {
  flow: {
    steps: Array<{ kind: string; label: string; detail: string; carries: string; bridgeOperation: string | null }>;
    neverRequested: string[];
    credentialLocation: string;
    claim: string;
  };
  account: {
    connected: 'YES' | 'NO';
    organization: string;
    deployAccess: 'ENABLED' | 'NOT ENABLED' | 'UNKNOWN';
    registries: string[];
    simulation: 'AVAILABLE' | 'UNAVAILABLE';
    cliVersion: string;
    credentialLocation: string;
    note: string | null;
  };
}

export interface ParityOutcome { verdict: string; reasonCode: string; riskClass: string; publicOutput: string }
export interface ParityView {
  result: {
    rows: Array<{ fixture: string; description: string; simulator: ParityOutcome | null; deployed: ParityOutcome | null; differences: string[]; match: boolean; notRun: string | null }>;
    matched: number;
    total: number;
    semanticParity: boolean;
    comparedFields: string[];
    ignoredFields: string[];
  };
  deployedAvailable: boolean;
  blocker: string | null;
  note: string;
}

export interface CreSimulationResult {
  ran: boolean;
  passed: boolean;
  binaryHash: string | null;
  configHash: string | null;
  verdict: string;
  productionLimits: boolean;
  exitCode: number | null;
  durationMs: number;
  commandLine: string[];
  triggerTxHash?: string;
  cliVersion: string | null;
  outputTail: string[];
  failure: string | null;
}
export interface CreSimulationRun {
  id: string;
  projectId: string;
  buildId: string | null;
  blueprintRevision: number | null;
  kind: 'CRE_SIMULATION';
  status: 'RUNNING' | 'PASSED' | 'FAILED';
  result: Partial<CreSimulationResult>;
  startedAt: string;
  finishedAt: string | null;
}

export interface DeployGate { label: string; status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN'; detail: string; blocker: string | null }

export interface DeployReadinessView {
  readiness: {
    gates: DeployGate[];
    canDeploy: boolean;
    blockedBy: string[];
    executionNetwork: { chainId: number; name: string; role: string };
    mainnetWrites: 'PROHIBITED';
    policyInitialState: 'DISABLED';
  };
  phases: ReadonlyArray<{ key: string; label: string }>;
  controlSemantics: Record<string, { label: string; kind: string; effect: string; doesNot: string }>;
}

export interface SecurityPathStep { layer: string; outcome: 'PASS' | 'DENY' | 'NOT_REACHED' | 'NOT_APPLICABLE'; reasonCode: string | null; detail: string | null }
export interface AttackRun {
  scenario: string;
  title: string;
  result: 'DENIED' | 'ALLOWED' | 'NOT_RUN';
  stoppedBy: string | null;
  reasonCode: string | null;
  stoppedWhereExpected: boolean;
  diffs: Array<{ field: string; original: string; mutated: string }>;
  path: SecurityPathStep[];
  capabilityIssued: boolean;
  transactionSubmitted: boolean;
  additionalDefenses: Array<{ layer: string; reasonCode: string }>;
}
export interface AttackDefinition {
  scenario: string;
  title: string;
  description: string;
  mutatedField: string | null;
  expectedStoppedBy: string;
  expectedReasonCode: string;
  appliesWhen?: string;
}
export interface AttackCatalogue {
  applicable: AttackDefinition[];
  notApplicable: Array<{ scenario: string; title: string; requires: string }>;
}

export interface SimulationLayerView {
  key: 'SECURITY_SIMULATION' | 'CRE_WORKFLOW_SIMULATION' | 'REALITY_TEST' | 'FORK_EXECUTION';
  title: string;
  engine: string;
  status: 'PASS' | 'FAIL' | 'NOT_RUN' | 'BLOCKED';
  passed: number | null;
  total: number | null;
  detail: string;
  proves: string;
  doesNotProve: string;
  blocker: string | null;
  optional: boolean;
}
export interface SimulationCenterView { layers: SimulationLayerView[]; requiredPassed: boolean; outstanding: string[] }

export interface TokenRequirementsView {
  requirements: Array<{ symbol: string; purpose: string; network: string; source: string; realWorldValue: 'NONE'; automaticallyRequested: false }>;
  note: string;
}
export interface ActivationView {
  readiness: {
    rows: Array<{ label: string; value: string; status: 'READY' | 'NOT_READY' | 'STATEMENT'; detail: string }>;
    canActivate: boolean;
    blockedBy: string[];
    consequence: string;
    buttonLabel: string;
  };
  state: LabProjectState;
}

export interface ShadowView {
  run: {
    watching: { chainId: number; name: string; role: string; roleLabel: string };
    decision: string;
    reasonCode: string;
    proposedAction: { kind: string; asset: string; amount: string; protocol: string };
    actualExecution: { environment: 'LOCAL_FORK' | 'TESTNET' | 'NONE'; label: string; chainId: number | null };
    publicMainnetTransaction: 'NONE';
    marketSnapshotHash: string;
    scenarioHash: string | null;
  };
  fork: {
    heading: string;
    sourceChain: string;
    sourceBlock: string;
    sourceBlockHash: string;
    protocol: string;
    input: string;
    output: string;
    transactionHash: string;
    transaction: string;
    publicExplorer: 'NONE';
    explorerNote: string;
    status: 'success' | 'reverted';
    gasUsed: string;
    impersonated: boolean;
  };
}

export interface ScenarioView {
  presets: Array<{ overlayId: string; name: string; description: string; mutates: string[]; applicable: boolean; unavailableReason: string | null; label: string; trustClass: string }>;
  rows: Array<{ label: string; scenario: string; synthetic: boolean; verdict: string; reasonCode: string; snapshotHash: string; scenarioHash: string | null; changedFromBase: string | null }>;
  action: string;
  basis: { fromSnapshot: string[]; neutralised: string[]; action: string };
  baseValuedAt: string | null;
  anchorBlock: string;
}

export interface DecisionDetailView {
  correlationId: string;
  verdict: 'ALLOW' | 'ESCALATE' | 'DENY' | 'NO_ACTION';
  reasonCode: string;
  reasonPlain: string;
  fields: Array<{ label: string; value: string; source: string }>;
  withheld: Array<{ what: string; why: string }>;
  synthetic: boolean;
}

export interface SafetyReportView {
  schemaVersion: string;
  reportId: string;
  generatedAtMs: number;
  agent: { goal: string; ensIdentity: string | null; blueprintHash: string; strategyHash: string; blueprintRevision: number };
  execution: { networks: Array<{ chainId: number; name: string; role: string }>; productionChainExecution: string; productionWriteEvidence: string[] };
  reality: {
    sources: Array<{ sourceId: string; kind: string; trustClass: string; status: string; blocker: string | null }>;
    chainlinkSource: string | null;
    theGraphState: string;
    archiveReplayState: string;
    marketSnapshotHash: string | null;
    anchorBlock: string | null;
  };
  cre: { mode: string; executionMode: string; wasmHash: string | null; productionLimits: string; donDeployment: string; hardwareTee: string; teeAttestation: string; deployAccess: string };
  runtime: { imageDigest: string | null; adapterVersions: string[] };
  testing: { securitySimulations: { passed: number; total: number }; attacks: Array<{ scenario: string; result: string; stoppedBy: string | null; reasonCode: string | null }> };
  deployments: Array<{ name: string; address: string; chainId: number; txHash: string; explorerUrl: string | null }>;
  privacy: Array<{ claim: string; answer: 'VERIFIED' | 'NO' | 'NOT_ESTABLISHED'; evidence: string | null; blocker: string | null }>;
  knownBlockers: Array<{ id: string; effect: string }>;
  reportHash: string;
}

/* ─────────────────────────── fork lab ─────────────────────────── */

export interface ForkGate { label: string; status: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN'; detail: string; blocker: string | null }
export interface ForkPhase { key: string; status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'; startedAtMs: number | null; finishedAtMs: number | null; detail: string | null }

export interface ForkDeploymentRecord {
  deploymentId: string;
  projectId: string;
  buildId: string | null;
  blueprintRevision: number;
  agentId: string;
  ensName: string;
  agentIdentityHash: string;
  ensNode: string;
  policyHash: string;
  upstream: { providerId: string; headBlock: string | null; forkBlock: string | null };
  fork: { forkId: string; chainId: number; sourceChainId: number; forkBlock: string; forkBlockHash: string; endpoint: string; anvilVersion: string; state: string; createdAtMs?: number; expiresAtMs?: number } | null;
  contracts: Record<string, string> | null;
  roles: Record<string, string>;
  approverMode: 'STAND_IN' | 'WALLET';
  policy: { targetHealthFactorBps: number; restoreHealthFactorBps: number; minHealthFactorBps: number; allowedActionKinds: string[]; allowedTargets: string[]; autoLimit?: string; escalationLimit?: string; maxValueHardCapWei?: string };
  position: { user: string; vault: string; scenarios: Array<{ driverId: string; protocol: string; actionKind: string; detail: string }>; unexercisedActionKinds: string[] } | null;
  snapshot: MarketSnapshotView | null;
  phases: ForkPhase[];
  setupTransactions: Array<{ label: string; hash: string; blockNumber: string; gasUsed: string; status: string; network: string }>;
  failure: string | null;
  stoppedReason: string | null;
}

/** The sealed market snapshot a fork deployment was made against (packages/studio-reality). */
export interface MarketSnapshotView {
  snapshotId: string;
  mode: string;
  observedAtMs?: number;
  anchorChainId: number;
  anchorBlock: string;
  anchorBlockHash: string;
  anchorBlockTimestampMs: number;
  snapshotHash: string;
  sources: Array<{
    sourceId: string;
    kind: 'CHAINLINK_DATA_FEED' | 'CHAINLINK_DATA_STREAM' | 'THE_GRAPH' | 'READ_ONLY_RPC' | 'LOCAL_FORK_RPC' | 'EXTERNAL_API';
    adapterId: string;
    adapterVersion: string;
    trustClass: string;
    sourceChainId: number;
    timeSupport: string;
    observedBlock: string | null;
    lagBlocks: number | null;
    healthy: boolean;
    detail: string | null;
  }>;
  observations: Array<{
    observationId: string;
    metric: string;
    value: string;
    decimals: number;
    unit: string;
    dataType: string;
    sourceId: string;
    blockNumber: string | null;
    sourceTimestampMs: number | null;
    retrievedAtMs: number;
    trustClass: string;
    adapterId: string;
    provenance: string;
  }>;
  coherence: { coherent: boolean; reason: string | null; maxBlockSkew: number | null; maxTimeSkewMs: number; staleSources: string[] };
  provenance: string[];
}

export interface ForkDeploymentView {
  deploymentId: string;
  projectId: string;
  buildId: string | null;
  blueprintRevision: number;
  state: 'DEPLOYING' | 'READY_TO_ACTIVATE' | 'STOPPED' | 'FAILED';
  phase: string;
  revision: string;
  record: ForkDeploymentRecord;
  live: { fork: boolean; runtime: boolean };
  createdAt: string;
  updatedAt: string;
}

export interface ForkReadiness {
  gates: ForkGate[];
  canDeploy: boolean;
  blockedBy: string[];
  executionNetwork: { chainId: number; name: string; role: string; forkedFrom: number };
  mainnetWrites: 'PROHIBITED';
  policyInitialState: 'DISABLED';
  phases: Array<{ key: string; label: string }>;
  existing: ForkDeploymentView | null;
}

export interface DriverObservation { driverId: string; protocol: string; label: string; healthBps: number | null; metrics: Record<string, number>; detail: string }
export interface TickSample {
  atMs: number;
  blockNumber: string;
  blockTimestampMs: number;
  healthFactorBps: number;
  ethUsd: number;
  vaultUsdc: number;
  vaultEth: number;
  policyEnabled: boolean;
  protocols: DriverObservation[];
  action: 'NONE' | 'PROPOSED' | 'EXECUTED' | 'ERROR';
  verdict: string | null;
  reasonCode: string | null;
  correlationId: string | null;
}
export interface ForkDecision {
  correlationId: string;
  atMs: number;
  driverId: string;
  protocol: string;
  actionKind: string;
  label: string;
  verdict: 'ALLOW' | 'ESCALATE' | 'DENY';
  reasonCode: string;
  riskBand: string;
  amountUsd6: string;
  healthFactorBps: number | null;
  ethUsd: number;
  policyEnabled: boolean;
  basis: { fromFork: string[]; neutralised: string[] };
  executed: boolean;
  approvedByHuman: boolean;
  txHashes: string[];
  healthFactorAfterBps: number | null;
}
export interface ForkExecution {
  correlationId: string;
  atMs: number;
  driverId: string;
  label: string;
  amountUsd6: string;
  healthFactorBeforeBps: number | null;
  healthFactorAfterBps: number | null;
  approvedByHuman: boolean;
  txs: Array<{ hash: string; blockNumber: string; status: string; gasUsed: string; label: string; from: string; to: string | null }>;
}
export interface PendingEscalation {
  correlationId: string;
  driverId: string;
  protocol: string;
  label: string;
  amountUsd6: string;
  reasonCode: string;
  sinceMs: number;
  capabilityIds: string[];
  expiresAtUnix: number;
}
export interface StressOption { id: string; label: string; kind: 'health-target' | 'amount' }

export interface ForkPositionView {
  deploymentId: string;
  policyEnabled: boolean | null;
  latest: TickSample | null;
  samples: TickSample[];
  decisions: ForkDecision[];
  executions: ForkExecution[];
  pending: PendingEscalation[];
  scenarios: Array<{ driverId: string; protocol: string; actionKind: string; detail: string; stressOptions: StressOption[] }>;
  unexercisedActionKinds: string[];
  runtime: { state: string; reasons: string[]; ticks: number; lastError: string | null; paused: boolean };
  policy: { targetHealthFactorBps: number; restoreHealthFactorBps: number; minHealthFactorBps: number; autoLimitUsd: number; escalationLimitUsd: number };
  vault: { address: string; usdc: number | null; eth: number | null };
  approver: { address: string; mode: 'STAND_IN' | 'WALLET'; note: string };
  network: { chainId: number; role: 'LOCAL_FORK'; forkedFrom: number; forkBlock: string | null; label: string };
}

export interface ApprovalTypedData {
  correlationId: string;
  approver: string;
  approverMode: 'STAND_IN' | 'WALLET';
  domain: { name: 'ContextLockApproval'; version: '1'; chainId: number; verifyingContract: string };
  types: { ContextLockApproval: Array<{ name: string; type: string }> };
  primaryType: 'ContextLockApproval';
  messages: Array<{ label: string; message: { capabilityDigest: string; approver: string; expiresAt: number } }>;
  forkTimestampUnix: number;
}

/* ─────────────────────────── control plane ─────────────────────────── */

export interface ObservationFreshness {
  observedAtMs: number;
  ageMs: number;
  isCurrent: boolean;
  source: string;
  state: string;
  reason: string | null;
}

export interface OverviewData {
  deploymentId: string;
  badge: 'LIVE' | 'INACTIVE';
  notLiveBecause: string[];
  currentRevision: string;
  panels: {
    policy: (ObservationFreshness & { value: { enabled: boolean; bindingVersion: string; policyAdmin: string; cap?: string } | null }) | null;
    runtime: { state: string; reasons: string[]; note: string };
    cre: { state: string; headline: string; detail?: string; blockedBy: string | null; lastSyncedAtMs?: number | null; unavailable?: Record<string, string> };
    identity: (ObservationFreshness & { value: { boundAgent: string | null; revoked: boolean; resolver?: string } | null }) | null;
    adapters: Array<{ adapterId: string; state: string; reason?: string | null }>;
  };
  drift: Array<{ kind: string; severity: string; subject: string; expected: string; observed: string; detail: string }>;
  alerts: {
    open: number;
    critical: number;
    rows: Array<{ alertId: string; rule: string; severity: string; subject: string; reason: string; occurrences: number; requiresReconciliation: boolean; state?: string; firstSeenAtMs?: number; lastSeenAtMs?: number }>;
  };
  note: string;
}

export interface RuntimeEventRow {
  eventId: string;
  timestamp: number;
  source: string;
  type: string;
  severity: string;
  agentId: string | null;
  correlationId: string;
  txHash: string | null;
  adapterId: string | null;
  chainId: number | null;
  blockNumber: string | null;
  correctsEventId: string | null;
  capabilityId?: string | null;
  authorizationId?: string | null;
  creExecutionId?: string | null;
  agentRunId?: string | null;
  publicMetadata: Record<string, unknown>;
}

export interface ActivityFilters {
  source?: string | undefined;
  type?: string | undefined;
  minSeverity?: string | undefined;
  correlationId?: string | undefined;
  txHash?: string | undefined;
  adapterId?: string | undefined;
  sinceMs?: string | undefined;
  limit?: string | undefined;
  order?: 'asc' | 'desc' | undefined;
}

export interface ActionTrace {
  correlationId: string;
  stages: Array<{ stage: string; events: RuntimeEventRow[]; firstAtMs: number; lastAtMs: number }>;
  identifiers: Record<string, string[]>;
  reached: string | null;
  corrected: boolean;
}

export type ControlOperation =
  | 'PAUSE_RUNTIME' | 'RESUME_RUNTIME' | 'ROLLBACK_RUNTIME' | 'ROTATE_RUNTIME_REVISION'
  | 'PAUSE_CRE' | 'ACTIVATE_CRE' | 'DELETE_CRE'
  | 'DISABLE_POLICY' | 'ENABLE_POLICY'
  | 'REVOKE_IDENTITY' | 'EMERGENCY_LOCK';

export interface OperationInfo {
  operation: ControlOperation;
  capability: string;
  affects: string;
  destructive: boolean;
  isFinancialStop: boolean;
}

export interface CommandResult {
  command: string;
  idempotent: boolean;
  ok?: boolean;
  detail?: string;
  result?: unknown;
  previous?: unknown;
  claim?: { warning: string | null };
}

export interface EmergencyLockResultPayload {
  headline: string;
  financialPolicy: string;
  lines: string[];
  lock: {
    state: 'COMPLETE' | 'PARTIAL' | 'FAILED' | 'IN_PROGRESS';
    financialPolicyDisabled: boolean;
    steps: Array<{ step: string; outcome: string; detail?: string | null; verification?: string | null }>;
  };
}

export interface AlertRow {
  alertId: string;
  rule: string;
  severity: string;
  subject: string;
  reason: string;
  occurrences: number;
  requiresReconciliation: boolean;
  state: string;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
  deploymentId?: string;
}

export interface CommandLogRow {
  commandId: string;
  operation: string;
  actorId: string;
  state: string;
  detail: string | null;
  issuedAtMs: number;
  completedAtMs?: number | null;
  result?: unknown;
}
