/**
 * ContextLock Studio — domain types.
 *
 * These mirror the artifact vocabulary in the product spec so that swapping the
 * mock data layer for a real backend is a data-source change, not a rewrite.
 * Every surface in the app reads these shapes and nothing else.
 */

/* ---------------------------------------------------------------- vocabulary */

/** Canonical status vocabulary (spec §8.1). No synonyms are permitted. */
export type Status =
  | 'READY'
  | 'RUNNING'
  | 'PASS'
  | 'WARN'
  | 'ESCALATE'
  | 'DENY'
  | 'FAIL'
  | 'BLOCKED'
  | 'UNAVAILABLE'
  | 'DEGRADED'
  | 'STALE'
  | 'PAUSED'
  | 'STOPPED'
  | 'UNKNOWN'
  | 'HEALTHY'
  | 'ACTIVE'
  | 'DISABLED'
  | 'ENABLED'
  | 'DISABLING'
  | 'ENABLING'
  | 'PENDING'
  | 'REQUIRED'
  | 'NOT_ISSUED'
  | 'NOT_SUBMITTED'
  | 'NOT_REQUESTED'
  | 'SIMULATED'
  | 'LIMITED'
  | 'VALID'
  | 'DRAFT'
  | 'REVOKED'
  | 'COMPLETE';

/** Semantic tone used by badges/banners. Colour is never the only signal. */
export type Tone = 'pass' | 'warn' | 'deny' | 'sim' | 'data' | 'blocked' | 'neutral';

/** Authority verdict produced by the policy layer. */
export type Verdict = 'ALLOW' | 'ESCALATE' | 'DENY';

/** Data trust classification shown on every source (spec §19). */
export type TrustClass =
  | 'VERIFIED_ORACLE'
  | 'INDEXED'
  | 'READ_ONLY'
  | 'SIMULATED'
  | 'LOCAL_FORK'
  | 'UNVERIFIED';

/** How a node participates in the execution network (spec §13). */
export type NetworkRole =
  | 'EXECUTION_TESTNET'
  | 'MAINNET_READ_ONLY'
  | 'LOCAL_FORK'
  | 'OFF_CHAIN'
  | 'NONE';

/** CRE operating mode — simulator vs user simulator vs real DON (spec §26). */
export type CreMode =
  | 'CONTEXTLOCK_SIMULATOR'
  | 'MY_CRE_SIMULATOR'
  | 'MY_CRE_DEPLOYMENT'
  | 'NONE';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

/** Freshness envelope attached to every observed value (spec §33). */
export interface Freshness {
  source: string;
  observedAt: string | null;
  ttlSeconds: number;
  state: 'FRESH' | 'STALE' | 'UNKNOWN' | 'UNAVAILABLE';
  lastSuccessfulAt?: string | null;
  staleReason?: string;
}

/* ------------------------------------------------------------------- project */

export type ProjectLifecycle =
  | 'DRAFT'
  | 'BUILDING'
  | 'BUILT'
  | 'DEPLOYED'
  | 'ACTIVE'
  | 'ARCHIVED';

export interface RevisionSet {
  requirements: number | null;
  blueprint: number | null;
  blueprintDraft: number | null;
  strategy: number | null;
  build: number | null;
  deployment: number | null;
  runtime: number | null;
  policy: number | null;
  creArtifactHash: string | null;
}

export interface Environment {
  executionNetwork: string;
  executionChainId: number;
  realitySource: string;
  realityMode: RealityMode;
  mainnetWrites: 'PROHIBITED';
  creMode: CreMode;
  label: 'TESTNET LAB';
}

export interface Blocker {
  id: string;
  title: string;
  detail: string;
  severity: Severity;
  surface: PageKind;
  actionLabel?: string;
  actionHref?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  lifecycle: ProjectLifecycle;
  lastRevision: number | null;
  executionNetwork: string;
  creMode: CreMode;
  updatedAt: string;
  alerts: number;
  organization: string | null;
  template?: string;
}

export interface Project extends ProjectSummary {
  agents: Agent[];
  revisions: RevisionSet;
  environment: Environment;
  blockers: Blocker[];
}

/* --------------------------------------------------------------------- agent */

export type ExecutionClass = 'WRITE_CAPABLE' | 'READ_ONLY' | 'REPORTING_ONLY';

export interface Agent {
  id: string;
  name: string;
  slug: string;
  role: string;
  objective: string;
  status: Status;
  executionClass: ExecutionClass;
  ensName: string;
  ensNode: string;
  address: string;
  allowedAdapters: string[];
  budget: { autonomousPerAction: number; windowLimit: number; windowUsed: number; window: string };
  orgBudgetImpact: number;
  policyHash: string;
  runtimeRevision: number | null;
  parentId: string | null;
  /**
   * The backend project this agent's artifacts live in. A single-agent project is its own; each
   * member of an organization is a project of its own, so pages read the selected agent's.
   */
  projectId?: string | null;
  buildId?: string | null;
  /** Set when the member has no build yet — the Organization page offers to start one. */
  unbuilt?: boolean;
}

/* ----------------------------------------------------------------- blueprint */

export type BlueprintSectionId =
  | 'identity'
  | 'objective'
  | 'protocols'
  | 'assets'
  | 'triggers'
  | 'actions'
  | 'permissions'
  | 'autonomous-policy'
  | 'escalation-policy'
  | 'confidential-policy'
  | 'data-requirements'
  | 'capability-policy'
  | 'ens'
  | 'cre'
  | 'ledger'
  | 'execution-networks'
  | 'simulation-requirements'
  | 'generated-modules'
  | 'security-assertions';

export interface BlueprintField {
  key: string;
  label: string;
  value: string;
  /** Present when the draft revision changes this field. */
  previousValue?: string;
  /** True when the change grants the agent more authority than the last revision. */
  authorityExpansion?: boolean;
  authorityNote?: string;
  hint?: string;
  mono?: boolean;
  editable?: boolean;
}

export interface BlueprintSection {
  id: BlueprintSectionId;
  index: number;
  title: string;
  summary: string;
  fields: BlueprintField[];
}

export type ValidationGroup =
  | 'schema'
  | 'security-invariant'
  | 'missing-required'
  | 'trust-freshness'
  | 'adapter-compatibility'
  | 'execution-network';

export interface ValidationFinding {
  id: string;
  group: ValidationGroup;
  severity: Severity;
  message: string;
  detail: string;
  sectionId: BlueprintSectionId;
  fieldKey?: string;
}

export interface Blueprint {
  revision: number;
  status: Status;
  isDraft: boolean;
  baseRevision: number | null;
  sections: BlueprintSection[];
  findings: ValidationFinding[];
  raw: Record<string, unknown>;
}

/* -------------------------------------------------------------- architecture */

export type ArchNodeKind =
  | 'operator'
  | 'agent-runtime'
  | 'ens'
  | 'policy'
  | 'cre'
  | 'chainlink-feed'
  | 'the-graph'
  | 'aave'
  | 'uniswap'
  | 'adapter-broker'
  | 'reality-engine'
  | 'local-fork'
  | 'capability'
  | 'executor'
  | 'treasury'
  | 'ledger';

export type ArchEdgeKind =
  | 'READ'
  | 'CONTEXT'
  | 'TRIGGER'
  | 'POLICY'
  | 'AUTHORIZATION'
  | 'EXECUTE'
  | 'ESCALATE';

export type ArchLayer =
  | 'identity'
  | 'data'
  | 'policy'
  | 'execution'
  | 'runtime'
  | 'live-health'
  | 'security-boundaries';

export interface ArchNodeData extends Record<string, unknown> {
  kind: ArchNodeKind;
  label: string;
  purpose: string;
  adapter?: string;
  version?: string;
  trustClass?: TrustClass;
  networkRole: NetworkRole;
  status: Status;
  liveStatus?: Status;
  freshness?: Freshness;
  ref?: { label: string; value: string; network?: string; kind: 'address' | 'hash' | 'node' };
  capabilities?: string[];
  generatedModule?: string;
  layers: ArchLayer[];
  blueprintSection?: BlueprintSectionId;
  codePath?: string;
  relatedEventIds?: string[];
  relatedSimulationId?: string;
}

export interface ArchNode {
  id: string;
  position: { x: number; y: number };
  data: ArchNodeData;
}

export interface ArchEdge {
  id: string;
  source: string;
  target: string;
  kind: ArchEdgeKind;
  label: string;
  layers: ArchLayer[];
  requiresCre?: boolean;
  note?: string;
}

export interface ArchitectureGraph {
  revision: number;
  nodes: ArchNode[];
  edges: ArchEdge[];
}

/* ----------------------------------------------------------- permissions */

export interface PermissionRule {
  id: string;
  verdict: Verdict;
  label: string;
  detail: string;
  provenSimulationIds: string[];
  policyRef: string;
}

export interface PermissionPanelItem {
  label: string;
  value: string;
  mono?: boolean;
  tone?: Tone;
}

export interface PermissionPanel {
  id: string;
  title: string;
  description: string;
  items: PermissionPanelItem[];
}

export interface PermissionsModel {
  posture: Status;
  executionSummary: string;
  mainnetWrites: string;
  policyRevision: number;
  rules: PermissionRule[];
  panels: PermissionPanel[];
}

/* ----------------------------------------------------------------- simulation */

export type ScenarioGroup =
  | 'baseline'
  | 'policy-boundaries'
  | 'prompt-injection'
  | 'mutation-replay'
  | 'ens-policy-lifecycle'
  | 'data-freshness'
  | 'adapter-failures'
  | 'protocol-specific'
  | 'cross-chain'
  | 'organization'
  | 'cre';

export interface SecurityPathStep {
  layer: string;
  status: Status;
  detail?: string;
  reasonCode?: string;
}

export interface SimulationScenario {
  id: string;
  name: string;
  group: ScenarioGroup;
  description: string;
  mandatory: boolean;
  /** Revision the last run was built against — drives the STALE banner. */
  builtAgainstBlueprint: number | null;
  lastRun: string | null;
  result: Status | null;
  expected: string;
  actual: string | null;
  reasonCode: string | null;
  inputs: { key: string; value: string }[];
  mutation?: { field: string; original: string; injected: string };
  changedFields: string[];
  layersEvaluated: string[];
  durationMs: number | null;
  path: SecurityPathStep[];
  logs: string[];
  isCre?: boolean;
}

/* -------------------------------------------------------------- reality lab */

export type RealityMode = 'LIVE_MAINNET_MIRROR' | 'HISTORICAL_REPLAY' | 'LOCAL_MAINNET_FORK' | 'SYNTHETIC';

export interface RealityModeOption {
  mode: RealityMode;
  label: string;
  description: string;
  availability: 'AVAILABLE' | 'BLOCKED' | 'LIMITED';
  blockerReason?: string;
}

export interface RealitySource {
  id: string;
  provider: string;
  dataType: string;
  value: string;
  trustClass: TrustClass;
  sourceBlock: number | null;
  sourceTime: string | null;
  freshness: Freshness;
  lifecycle: string;
  status: Status;
  provenance: { key: string; value: string; mono?: boolean }[];
}

export interface RealitySnapshot {
  id: string;
  anchorBlock: number;
  anchorHash: string;
  createdAt: string;
  ageSeconds: number;
  coherence: string;
  hash: string;
  sources: RealitySource[];
}

export interface LocalFork {
  id: string;
  sourceChain: string;
  blockNumber: number;
  blockHash: string;
  anvilVersion: string;
  state: Status;
  endpoint: string;
  lifetimeSeconds: number;
  createdAt: string;
}

export interface SyntheticOverlay {
  id: string;
  label: string;
  description: string;
  applied: boolean;
  effects: { key: string; value: string }[];
}

/* ------------------------------------------------------------------ attacks */

export type AttackCategory =
  | 'prompt-agent-compromise'
  | 'transaction-mutation'
  | 'replay-expiry'
  | 'identity-ens'
  | 'data-oracle'
  | 'policy'
  | 'cre-runtime'
  | 'cross-agent'
  | 'cross-chain'
  | 'network-boundary';

export interface Attack {
  id: string;
  name: string;
  category: AttackCategory;
  description: string;
  applicable: boolean;
  notApplicableReason?: string;
  severity: Severity;
  lastResult: Status | null;
  lastRun: string | null;
  stoppingLayer: string | null;
  reasonCode: string | null;
  mutation?: { field: string; original: string; injected: string };
  path: SecurityPathStep[];
  /** Defences that were actually exercised by the run — never a static claim. */
  defencesExercised: string[];
  relatedPolicyRuleId?: string;
  relatedSimulationId?: string;
}

/* --------------------------------------------------------------------- code */

export type CodeFileGroup =
  | 'generated-agent'
  | 'contextlock-modules'
  | 'adapter-modules'
  | 'tests'
  | 'cre-workflow'
  | 'deployment'
  | 'config';

export type CodeFileMark = 'generated' | 'template-owned' | 'modified' | 'stale' | 'locked';

export interface CodeFile {
  path: string;
  name: string;
  group: CodeFileGroup;
  language: string;
  marks: CodeFileMark[];
  readOnly: boolean;
  revision: number;
  blueprintSection?: BlueprintSectionId;
  coveredByTest?: string;
  content: string;
  previousContent?: string;
}

/* ------------------------------------------------------------- integrations */

export interface Adapter {
  id: string;
  name: string;
  adapterId: string;
  version: string;
  type: string;
  network: string;
  networkRole: NetworkRole;
  capabilities: string[];
  trustClass: TrustClass;
  status: Status;
  lifecycle: string;
  usedByAgentIds: string[];
  freshness: Freshness;
  blockerReason?: string;
  provenance: { key: string; value: string; mono?: boolean }[];
  conformance: Status | null;
}

export type CredentialBoundary = 'LOCAL_BRIDGE' | 'CRE_LOCAL_SESSION' | 'SECRET_MANAGER' | 'LEDGER_KEY_RING' | 'NONE_PUBLIC';

export interface Credential {
  id: string;
  name: string;
  scope: string;
  boundary: CredentialBoundary;
  status: Status;
  lastVerified: string | null;
  usedBy: string[];
  rotatable: boolean;
  reconnectable: boolean;
  /** The backend's own one-line account of where this credential is held. */
  note?: string;
}

export interface OpenApiIntegration {
  id: string;
  name: string;
  specVersion: string;
  allowedHost: string;
  authType: string;
  generatedAdapter: string | null;
  validation: { message: string; status: Status }[];
  conformance: Status;
}

/* ----------------------------------------------------------------- deployment */

export interface PreflightStep {
  index: number;
  id: string;
  name: string;
  status: Status;
  detail: string;
  blockerId?: string;
}

export interface CostSection {
  id: string;
  title: string;
  description: string;
  rows: { label: string; value: string; hint?: string; tone?: Tone }[];
}

export interface DeploymentPlanItem {
  contract: string;
  action: 'DEPLOY' | 'REUSE';
  address?: string;
  estimatedGas: number;
}

export interface DeploymentProgressStep {
  id: string;
  label: string;
  status: Status;
  detail?: string;
  at?: string;
}

export interface Deployment {
  id: string;
  revision: number;
  blueprintRevision: number;
  buildRevision: number;
  network: string;
  status: Status;
  createdAt: string;
  runtimeImageDigest: string;
  creMode: CreMode;
  creWasmHash: string;
  securityStatus: Status;
  policyStartsDisabled: true;
  contracts: { name: string; address: string; txHash: string; verified: boolean }[];
  progress: DeploymentProgressStep[];
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  network: string | null;
  chainId: number | null;
  balanceEth: string | null;
  recommendedBalanceEth: string;
  sufficient: boolean;
  isTestnet: boolean;
}

/* -------------------------------------------------------------------- policy */

export interface AuthorityMatrixRow {
  action: string;
  limit: string;
  recipients: string;
  targets: string;
  trustFreshness: string;
  expiryNonce: string;
  escalation: string;
  verdict: Verdict;
}

export interface PolicyOnChainState {
  enabled: boolean;
  policyHash: string;
  admin: string;
  contracts: { label: string; address: string }[];
  lastVerifiedBlock: number;
  freshness: Freshness;
}

export interface DriftRow {
  field: string;
  expected: string;
  observed: string;
  drifted: boolean;
  severity: Severity;
}

export interface PolicyPrecondition {
  id: string;
  label: string;
  status: Status;
  detail: string;
}

export interface PolicyState {
  version: number;
  observed: Status;
  transitional: Status | null;
  network: string;
  matrix: AuthorityMatrixRow[];
  onChain: PolicyOnChainState;
  drift: DriftRow[];
  enablePreconditions: PolicyPrecondition[];
}

/* ------------------------------------------------------------------- runtime */

export interface RuntimeDependency {
  id: string;
  name: string;
  status: Status;
  detail: string;
  freshness: Freshness;
}

export interface RuntimeRevisionRow {
  revision: number;
  imageDigest: string;
  blueprintRevision: number;
  buildRevision: number;
  createdAt: string;
  status: Status;
  current: boolean;
  compatible: boolean;
}

export interface RuntimeState {
  state: Status;
  revision: number;
  imageDigest: string;
  startedAt: string | null;
  heartbeat: Freshness;
  brokerConnectivity: Status;
  modelGateway: Status;
  eventCursor: string;
  credentialValidity: Status;
  restartCount: number;
  metrics: { cpuPercent: number; memoryMb: number; memoryLimitMb: number; uptimeSeconds: number; requests: number; errors: number };
  dependencies: RuntimeDependency[];
  overall: Status;
  revisions: RuntimeRevisionRow[];
  credentialFenced: boolean;
}

/* ------------------------------------------------------------- control plane */

export interface TopologyComponent {
  id: string;
  name: string;
  currentState: Status;
  expectedState: Status;
  freshness: Freshness;
  drift: boolean;
  lastFailure: string | null;
  detail: string;
}

export interface Alert {
  id: string;
  severity: Severity;
  type: string;
  resource: string;
  firstSeen: string;
  lastSeen: string;
  occurrences: number;
  state: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  detail: string;
  evidenceEventIds: string[];
}

export interface EmergencyStep {
  id: string;
  label: string;
  status: Status;
  detail?: string;
}

export interface EmergencyLockResult {
  outcome: 'EMERGENCY_LOCK_COMPLETE' | 'EMERGENCY_LOCK_PARTIAL' | 'EMERGENCY_LOCK_FAILED';
  steps: EmergencyStep[];
  policyState: Status;
  at: string;
}

/* ----------------------------------------------------------------------- cre */

export interface CreState {
  mode: CreMode;
  cliVersion: string;
  accountMode: string;
  organization: string | null;
  deployAccess: boolean;
  registry: string;
  simulationId: string | null;
  workflowId: string | null;
  wasmHash: string;
  configHash: string;
  productionLimits: string;
  lastRun: string | null;
  status: Status;
  donDeployment: boolean;
  hardwareTeeEvidence: boolean;
  truth: { officialSimulation: boolean; realDon: boolean; realDonConsensus: boolean; hardwareTee: boolean };
  paritySuite: Status | null;
  approvedWasmHash: string | null;
  freshness: Freshness;
}

export interface CreModeOption {
  mode: CreMode;
  title: string;
  description: string;
  bullets: string[];
  available: boolean;
  blockerReason?: string;
}

export interface CreRun {
  id: string;
  at: string;
  trigger: string;
  result: Status;
  reason: string | null;
  configHash: string;
  binaryHash: string;
  productionLimitMode: string;
  broadcast: 'TESTNET_BROADCAST' | 'DRY_RUN';
}

/* ----------------------------------------------------------------- identity */

export interface EnsRecord {
  key: string;
  value: string;
  kind: 'agent-context' | 'endpoint' | 'resolver-metadata';
}

export interface IdentityState {
  ensName: string;
  node: string;
  owner: string;
  manager: string;
  agentAddress: string;
  identityHash: string;
  expiry: string | null;
  state: Status;
  freshness: Freshness;
  records: EnsRecord[];
  siblings: { agentId: string; ensName: string; affected: boolean }[];
}

/* -------------------------------------------------------------------- events */

export type EventSource =
  | 'agent'
  | 'cre'
  | 'policy'
  | 'chain'
  | 'adapter'
  | 'runtime'
  | 'operator';

export interface RuntimeEvent {
  id: string;
  at: string;
  source: EventSource;
  type: string;
  summary: string;
  status: Status;
  verdict: Verdict | null;
  reasonCode: string | null;
  correlationId: string;
  agentId: string;
  deploymentRevision: number | null;
  blueprintRevision: number | null;
  txHash: string | null;
  /** Local fork transactions must never render a public explorer link. */
  txKind: 'TESTNET' | 'LOCAL_FORK' | null;
  capability: { id: string; issued: boolean; expiresAt: string | null } | null;
  creExecution: { id: string; mode: CreMode; result: Status } | null;
  publicMetadata: { key: string; value: string; mono?: boolean }[];
  confidential: boolean;
  sourceFreshness: Freshness | null;
  relatedEventIds: string[];
  amount?: string;
  action?: string;
}

export interface DecisionRow {
  id: string;
  at: string;
  verdict: Verdict;
  action: string;
  amount: string;
  reason: string;
  reasonCode: string | null;
  executionResult: Status;
  correlationId: string;
}

/* ------------------------------------------------------------------- reports */

export type ReportType =
  | 'agent-safety'
  | 'deployment-receipt'
  | 'simulation'
  | 'attack-lab'
  | 'reality-fork'
  | 'cre-evidence'
  | 'test-results';

export interface Report {
  id: string;
  type: ReportType;
  title: string;
  revision: number;
  generatedAt: string | null;
  hash: string | null;
  current: boolean;
  privacy: 'SECRET_FREE' | 'INTERNAL' | 'UNSCANNED';
  secretScan: Status;
  sections?: { title: string; rows: { label: string; value: string; mono?: boolean }[] }[];
}

/* ------------------------------------------------------------------ settings */

export interface StudioSettings {
  project: { name: string; description: string; organization: string; defaultAgentId: string };
  appearance: { theme: 'light' | 'dark'; density: 'comfortable' | 'compact'; editorFontSize: number };
  simulationLimits: { userRunsPerDay: number; userRunsUsed: number; mandatoryRegressionRuns: number; serverEnforced: true };
  runtime: { autoRestart: boolean; restartBackoffSeconds: number; logRetentionDays: number };
  notifications: { criticalAlerts: boolean; deploymentEvents: boolean; simulationFailures: boolean; weeklyDigest: boolean };
  developerMode: { enabled: boolean; showRawIds: boolean; showRawJson: boolean; constrainedTerminal: boolean; verboseEvents: boolean };
}

/* ---------------------------------------------------------------- agent chat */

export type PageKind =
  | 'projects'
  | 'composer'
  | 'organization'
  | 'blueprint'
  | 'architecture'
  | 'permissions'
  | 'simulation'
  | 'reality'
  | 'attacks'
  | 'code'
  | 'integrations'
  | 'deploy'
  | 'deployment'
  | 'overview'
  | 'activity'
  | 'policies'
  | 'runtime'
  | 'control-plane'
  | 'cre'
  | 'identity'
  | 'reports'
  | 'settings';

/** Typed context envelope sent to the backend — never a hand-built mega prompt. */
export interface AgentPageContext {
  projectId: string;
  agentId?: string;
  route: string;
  pageKind: PageKind;
  blueprintRevision?: number;
  strategyRevision?: number;
  buildRevision?: number;
  deploymentRevision?: number;
  runtimeRevision?: number;
  selectedEntity?: { kind: string; id: string; label?: string };
  safeContextRefs: string[];
}

export type AgentAuthorityTier =
  | 'read'
  | 'navigate'
  | 'draft'
  | 'safe-computation'
  | 'project-mutation'
  | 'deployment-mutation'
  | 'financial-authority'
  | 'emergency';

export interface AgentCitation {
  label: string;
  kind: string;
  id: string;
  href?: string;
}

export type AgentResponseCard =
  | { kind: 'explanation'; text: string; citations?: AgentCitation[] }
  | { kind: 'reference'; text: string; refs: AgentCitation[] }
  | {
      kind: 'proposed-patch';
      title: string;
      /** Page the patch applies to, so Apply can deliver it there (§6.4). */
      targetPage: PageKind;
      target: string;
      summary: string;
      diff: { field: string; before: string; after: string; authorityExpansion?: boolean }[];
      applied?: boolean;
      rejected?: boolean;
    }
  | { kind: 'suggested-simulation'; title: string; scenarioId: string; rationale: string }
  | { kind: 'navigation'; title: string; href: string; label: string }
  | {
      kind: 'control-suggestion';
      title: string;
      rationale: string;
      /** Opens the deterministic native dialog. Never executes. */
      control: ControlCommand;
      buttonLabel: string;
      tier: AgentAuthorityTier;
    }
  /**
   * A prohibited shortcut (spec §30). The agent was asked to do something its
   * page forbids — invent a financial cap, rewrite a test to pass, promote a
   * trust class by prose — and says so instead of complying. Refusing visibly
   * is the product behaviour: a silent decline reads as a broken feature.
   */
  | {
      kind: 'refusal';
      title: string;
      /** What was asked, restated plainly. */
      text: string;
      /** Why this specific thing is not the agent's to do. */
      because: string;
      /** The legitimate route to the same goal, when one exists. */
      alternative?: { label: string; href?: string };
    };

/**
 * A patch the agent proposed and the user accepted with an explicit Apply
 * (spec §6.4, project-mutation tier).
 *
 * Accepting does not mutate anything by itself — it delivers the proposal to
 * the page that owns the artifact, which shows it as a pending draft change for
 * the user to review there. The agent never reaches into a page's state.
 */
export interface AgentPatch {
  id: string;
  targetPage: PageKind;
  title: string;
  target: string;
  summary: string;
  diff: { field: string; before: string; after: string; authorityExpansion?: boolean }[];
  at: string;
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'agent';
  at: string;
  text?: string;
  cards?: AgentResponseCard[];
  context?: AgentPageContext;
  streaming?: boolean;
}

export interface AgentThread {
  id: string;
  title: string;
  createdAt: string;
  messages: AgentMessage[];
}

/* ------------------------------------------------------------------ commands */

/** Typed mutations (spec §43). The frontend never issues arbitrary RPC. */
export type ControlCommand =
  | 'RUN_SIMULATION'
  | 'DEPLOY_TESTNET'
  | 'ACTIVATE_TESTNET_POLICY'
  | 'DISABLE_POLICY'
  | 'PAUSE_RUNTIME'
  | 'RESUME_RUNTIME'
  | 'START_RUNTIME'
  | 'RESTART_RUNTIME'
  | 'STOP_RUNTIME'
  | 'ROLLBACK_RUNTIME'
  | 'START_CRE_SIMULATOR'
  | 'STOP_CRE_SIMULATOR'
  | 'RESTART_CRE_SIMULATOR'
  | 'PROMOTE_CRE_WORKFLOW'
  | 'PAUSE_CRE_WORKFLOW'
  | 'ACTIVATE_CRE_WORKFLOW'
  | 'REVOKE_AGENT'
  | 'EMERGENCY_LOCK'
  | 'CREATE_FORK'
  | 'RESET_FORK'
  | 'DESTROY_FORK'
  | 'ARCHIVE_PROJECT'
  | 'DISABLE_ADAPTER';

/* ------------------------------------------------------------------ workbench */

export interface EditorTab {
  id: string;
  title: string;
  href: string;
  pageKind: PageKind;
  preview: boolean;
  dirty?: boolean;
  stale?: boolean;
  live?: boolean;
}

export type BottomPanelTab = 'problems' | 'output' | 'tests' | 'events' | 'terminal';

export interface ProblemItem {
  id: string;
  severity: Severity;
  message: string;
  detail: string;
  resource: string;
  href?: string;
}

export interface TestResult {
  id: string;
  suite: string;
  name: string;
  status: Status;
  durationMs: number;
  failure?: string;
}
