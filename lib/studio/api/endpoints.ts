/**
 * One function per backend route.
 *
 * Nothing here derives a value — no "denied", no "healthy", no composed sentence. Every screen renders
 * what the backend computed, because a client that derived a security claim would be a second source
 * of truth about the agent's authority.
 */
import { apiGet, apiPatch, apiPost, apiText } from './client';
import type {
  ActionTrace, ActivityFilters, ActivationView, AdapterManifest, AlertRow, ApprovalTypedData, AttackCatalogue, AttackRun,
  BuildView, CommandLogRow, CommandResult, ControlOperation, CreConnectView, CreSimulationResult, CreSimulationRun, CreView,
  DecisionDetailView, DeployReadinessView, DesignResult, ExportBundle, ForkDeploymentView, ForkExecution, ForkPositionView,
  ForkReadiness, LabStateView, LabSummaryView, OperationInfo, OrganizationRow, OrgView, OverviewData, ParityView,
  ProjectRow, ProjectsIndex, RealityView, RuntimeEventRow, SafetyReportView, ScenarioView, ShadowView, SimulationCenterView,
  SimulationResult, StudioHealth, TokenRequirementsView, UsageSnapshot, BlueprintDocument, ValidationIssue, BlueprintGraph,
  DriverObservation, TickSample, BuildRow,
} from './types';

const enc = encodeURIComponent;
const P = (id: string) => `/api/lab/projects/${enc(id)}`;
const F = (id: string) => `/api/fork/projects/${enc(id)}`;
const FD = (id: string) => `/api/fork/deployments/${enc(id)}`;
const C = (id: string) => `/api/control/deployments/${enc(id)}`;

const qs = (q: Record<string, string | undefined>): string => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== '') p.set(k, v);
  const s = p.toString();
  return s ? `?${s}` : '';
};

/* ─────────────────────────── studio ─────────────────────────── */

export const studio = {
  health: () => apiGet<StudioHealth>('/api/studio/health'),

  projects: () => apiGet<ProjectsIndex>('/api/studio/projects'),
  project: (id: string) => apiGet<{ project: ProjectRow; organization: OrganizationRow | null }>(`/api/studio/projects/${enc(id)}`),
  renameProject: (id: string, name: string) => apiPatch<{ ok: true }>(`/api/studio/projects/${enc(id)}`, { name }),
  adapters: (chainId?: number) => apiGet<{ adapters: AdapterManifest[] }>(`/api/studio/adapters${qs({ chainId: chainId?.toString() })}`),

  createBuild: (body: { prompt: string; name?: string; ensName?: string; idempotencyKey: string }) =>
    apiPost<BuildRow>('/api/studio/builds', body),
  design: (buildId: string) => apiPost<DesignResult>(`/api/studio/builds/${enc(buildId)}/design`),
  approve: (buildId: string, acknowledgeFindings: string[]) =>
    apiPost<{ build: BuildRow }>(`/api/studio/builds/${enc(buildId)}/approve`, { acknowledgeFindings }),
  build: (buildId: string) => apiPost<{ build: BuildRow; ok: boolean; files: string[]; simulations: SimulationResult[] }>(`/api/studio/builds/${enc(buildId)}/build`),
  abandon: (buildId: string, reason: string) => apiPost<{ build: BuildRow }>(`/api/studio/builds/${enc(buildId)}/abandon`, { reason }),
  get: (buildId: string) => apiGet<BuildView>(`/api/studio/builds/${enc(buildId)}`),
  editBlueprint: (buildId: string, patch: Partial<BlueprintDocument>) =>
    apiPatch<{ blueprint: BlueprintDocument; issues: ValidationIssue[]; graph: BlueprintGraph }>(`/api/studio/builds/${enc(buildId)}/blueprint`, patch),
  simulate: (buildId: string, scenarioIds: string[] | null) =>
    apiPost<{ simulations: SimulationResult[]; notDeclared: string[]; usage: UsageSnapshot }>(`/api/studio/builds/${enc(buildId)}/simulate`, { scenarioIds }),
  file: (buildId: string, path: string) => apiText(`/api/studio/builds/${enc(buildId)}/files/${path.split('/').map(enc).join('/')}`),
  exportBundle: (buildId: string) => apiGet<ExportBundle>(`/api/studio/builds/${enc(buildId)}/export`),

  createOrganization: (body: { prompt: string; rootEns: string; name?: string }) => apiPost<OrgView>('/api/studio/organizations', body),
  organization: (id: string) => apiGet<OrgView>(`/api/studio/organizations/${enc(id)}`),
  buildMember: (orgId: string, agentId: string) =>
    apiPost<{ build: BuildRow; prompt: string }>(`/api/studio/organizations/${enc(orgId)}/agents/${enc(agentId)}/build`),
};

/* ─────────────────────────── lab ─────────────────────────── */

export const lab = {
  state: (id: string) => apiGet<LabStateView>(`${P(id)}/state`),
  summary: (id: string) => apiGet<LabSummaryView>(`${P(id)}/summary`),
  reality: () => apiGet<RealityView>('/api/lab/reality/modes'),
  cre: (id: string) => apiGet<CreView>(`${P(id)}/cre`),
  creConnect: (id: string) => apiGet<CreConnectView>(`${P(id)}/cre/connect`),
  creParity: (id: string) => apiGet<ParityView>(`${P(id)}/cre/parity`),
  creSimulate: (id: string) => apiPost<{ run: CreSimulationRun | null; result?: CreSimulationResult; note?: string }>(`${P(id)}/cre/simulate`),
  creSimulations: async (id: string) => (await apiGet<{ runs: CreSimulationRun[] }>(`${P(id)}/cre/simulations`)).runs,
  deployReadiness: (id: string, q: { gas?: string; balance?: string; required?: string } = {}) =>
    apiGet<DeployReadinessView>(`${P(id)}/deploy-readiness${qs(q)}`),
  attacks: (id: string) => apiGet<AttackCatalogue>(`${P(id)}/attacks`),
  runAttack: (id: string, scenario: string) => apiPost<AttackRun>(`${P(id)}/attacks/${enc(scenario)}/run`),
  simulationCenter: (id: string) => apiGet<SimulationCenterView>(`${P(id)}/simulation-center`),
  tokenRequirements: (id: string) => apiGet<TokenRequirementsView>(`${P(id)}/token-requirements`),
  activation: (id: string) => apiGet<ActivationView>(`${P(id)}/activation-readiness`),
  shadow: (id: string) => apiGet<ShadowView>(`${P(id)}/shadow`),
  scenarios: (id: string) => apiGet<ScenarioView>(`${P(id)}/scenarios`),
  decision: (id: string, correlationId: string) => apiGet<DecisionDetailView>(`${P(id)}/decisions/${enc(correlationId)}`),
  safetyReport: (id: string) => apiGet<SafetyReportView>(`${P(id)}/safety-report`),
  publicSafetyReport: (id: string) => apiGet<Partial<SafetyReportView>>(`${P(id)}/safety-report/public`),
};

/* ─────────────────────────── fork lab ─────────────────────────── */

export const fork = {
  readiness: (projectId: string) => apiGet<ForkReadiness>(`${F(projectId)}/readiness`),
  deploy: (projectId: string, body: { buildId: string | null; approverAddress: string | null }) =>
    apiPost<ForkDeploymentView>(`${F(projectId)}/deploy`, body),
  list: async (projectId: string) => (await apiGet<{ deployments: ForkDeploymentView[] }>(`${F(projectId)}/deployments`)).deployments,
  get: (deploymentId: string) => apiGet<ForkDeploymentView>(FD(deploymentId)),
  position: (deploymentId: string) => apiGet<ForkPositionView>(`${FD(deploymentId)}/position`),
  tick: (deploymentId: string) => apiPost<{ sample: TickSample | null; live: { fork: boolean; runtime: boolean } }>(`${FD(deploymentId)}/tick`),
  stress: (deploymentId: string, driverId: string, option: string, value: number) =>
    apiPost<{ before: DriverObservation; after: DriverObservation; detail: string; note: string }>(`${FD(deploymentId)}/stress`, { driverId, option, value }),
  approvalTypedData: (deploymentId: string, correlationId: string) =>
    apiGet<ApprovalTypedData>(`${FD(deploymentId)}/approvals/${enc(correlationId)}/typed-data`),
  approve: (deploymentId: string, correlationId: string, signatures: Array<{ capabilityDigest: string; expiresAt: number; signature: string }> | null) =>
    apiPost<{ execution: ForkExecution; signer: string; approverMode: string }>(`${FD(deploymentId)}/approvals/${enc(correlationId)}`, signatures ? { signatures } : {}),
  decline: (deploymentId: string, correlationId: string, reason: string) =>
    apiPost<{ declined: boolean }>(`${FD(deploymentId)}/approvals/${enc(correlationId)}/decline`, { reason }),
  stop: (deploymentId: string, reason: string) => apiPost<ForkDeploymentView>(`${FD(deploymentId)}/stop`, { reason }),
};

/* ─────────────────────────── control plane ─────────────────────────── */

export const control = {
  overview: (deploymentId: string) => apiGet<OverviewData>(`${C(deploymentId)}/overview`),
  activity: async (deploymentId: string, filters: ActivityFilters = {}) =>
    (await apiGet<{ events: RuntimeEventRow[] }>(`${C(deploymentId)}/activity${qs(filters as Record<string, string | undefined>)}`)).events,
  trace: (deploymentId: string, correlationId: string) => apiGet<ActionTrace>(`${C(deploymentId)}/traces/${enc(correlationId)}`),
  traceLookup: (deploymentId: string, q: { txHash?: string; capabilityId?: string }) =>
    apiGet<ActionTrace>(`${C(deploymentId)}/trace-lookup${qs(q)}`),
  alerts: async (deploymentId: string) => (await apiGet<{ alerts: AlertRow[] }>(`${C(deploymentId)}/alerts`)).alerts,
  resolveAlert: (deploymentId: string, alertId: string, evidence: string) =>
    apiPost<{ alert: AlertRow }>(`${C(deploymentId)}/alerts/${enc(alertId)}/resolve`, { evidence }),
  operations: async () => (await apiGet<{ operations: OperationInfo[]; capabilities: string[] }>('/api/control/operations')).operations,
  commands: async (deploymentId: string) => (await apiGet<{ commands: CommandLogRow[] }>(`${C(deploymentId)}/commands`)).commands,
  /**
   * Issue a command.
   *
   * `expectedRevision` is what the screen was showing. The backend rejects it if the deployment has
   * moved since — so a button clicked against a stale page cannot act on something else.
   */
  issueCommand: (
    deploymentId: string,
    body: { operation: ControlOperation; expectedRevision: string; reason?: string; confirmation?: Record<string, unknown> | null; target?: Record<string, string | null> },
    projectId?: string,
  ) => apiPost<CommandResult>(`${C(deploymentId)}/commands${qs({ projectId })}`, { ...body, confirmation: body.confirmation ?? null }),
};
