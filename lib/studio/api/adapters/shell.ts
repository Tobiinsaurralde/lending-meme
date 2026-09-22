/**
 * Backend rows → the workbench's project shell.
 *
 * The chrome (title bar, explorer, status bar) renders `Project`, `Agent`, `RevisionSet`,
 * `Environment` and `Blocker`. The backend has a project row, a build view, a Lab lifecycle and a
 * fork deployment. This file is the translation and nothing else: no field here is invented, and a
 * value the backend has not established is null or UNKNOWN, never a plausible default.
 */
import type {
  Agent, Blocker, CreMode, Environment, ExecutionClass, Project, ProjectLifecycle, ProjectSummary, RevisionSet, Status,
} from '../../types';
import { known, type BuildView, type ForkDeploymentView, type LabProjectState, type LabStateView, type OrgView, type OrganizationRow, type ProjectRow } from '../types';

/* ─────────────────────────── lifecycle ─────────────────────────── */

export function lifecycleOf(state: LabProjectState | null | undefined, build: ProjectRow['build'] | null): ProjectLifecycle {
  switch (state) {
    case 'BUILDING':
      return 'BUILDING';
    case 'BUILD_READY':
    case 'SIMULATION_READY':
    case 'PREFLIGHT_REQUIRED':
    case 'READY_TO_DEPLOY':
      return 'BUILT';
    case 'DEPLOYING':
    case 'READY_TO_ACTIVATE':
      return 'DEPLOYED';
    case 'LAB_ACTIVE':
    case 'PAUSED':
    case 'DEGRADED':
    case 'EMERGENCY_LOCKED':
      return 'ACTIVE';
    case 'FAILED':
    case 'DRAFT':
    case 'ARCHITECTURE_READY':
    case 'REVIEW_REQUIRED':
      return 'DRAFT';
    default:
      // No lifecycle read yet: fall back to the build row alone.
      if (!build) return 'DRAFT';
      if (build.status === 'RUNNING' && build.stage !== 'INTAKE') return 'BUILDING';
      return build.status === 'COMPLETED' ? 'BUILT' : 'DRAFT';
  }
}

/** The lifecycle as a status word for badges. */
export function labStateStatus(state: LabProjectState | null | undefined): Status {
  switch (state) {
    case 'LAB_ACTIVE': return 'ACTIVE';
    case 'PAUSED': return 'PAUSED';
    case 'DEGRADED': return 'DEGRADED';
    case 'EMERGENCY_LOCKED': return 'BLOCKED';
    case 'FAILED': return 'FAIL';
    case 'BUILDING': case 'DEPLOYING': return 'RUNNING';
    case 'READY_TO_ACTIVATE': case 'READY_TO_DEPLOY': case 'BUILD_READY': case 'SIMULATION_READY': return 'READY';
    case 'REVIEW_REQUIRED': case 'PREFLIGHT_REQUIRED': return 'REQUIRED';
    case 'DRAFT': case 'ARCHITECTURE_READY': return 'DRAFT';
    default: return 'UNKNOWN';
  }
}

/* ─────────────────────────── CRE mode ─────────────────────────── */

/** The backend's execution mode → the spec's mode vocabulary. Only the simulator modes exist today. */
export function creModeOf(executionMode: string | null | undefined): CreMode {
  switch (executionMode) {
    case 'SIMULATED_PLATFORM': return 'CONTEXTLOCK_SIMULATOR';
    case 'SIMULATED_USER': return 'MY_CRE_SIMULATOR';
    case 'DEPLOYED_USER': return 'MY_CRE_DEPLOYMENT';
    default: return 'MY_CRE_SIMULATOR';
  }
}

/* ─────────────────────────── agents ─────────────────────────── */

const slugOf = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'agent';

export function agentStatusOf(state: LabProjectState | null | undefined, build: ProjectRow['build'] | null): Status {
  if (!state) {
    if (!build) return 'DRAFT';
    if (build.status === 'AWAITING_APPROVAL') return 'REQUIRED';
    if (build.status === 'RUNNING') return 'RUNNING';
    if (build.status === 'COMPLETED') return 'READY';
    if (build.status === 'FAILED' || build.status === 'BUILD_NEEDS_USER_REVIEW') return 'FAIL';
    return 'DRAFT';
  }
  return labStateStatus(state);
}

/**
 * The single agent of a project, from its Blueprint where one exists and from the project row
 * otherwise. Budgets are the Blueprint's established limits; an unestablished one is 0 and the
 * Permissions page says so in words — never a number nobody chose.
 */
export function agentOfProject(row: ProjectRow, view: BuildView | null, state: LabStateView | null, deployment: ForkDeploymentView | null): Agent {
  const bp = view?.blueprint ?? null;
  const name = row.organization ? row.name.replace(/\s*\(.*\)\s*$/, '') : row.name;
  const writeCapable = (bp?.actions.length ?? 0) > 0;
  const executionClass: ExecutionClass = bp ? (writeCapable ? 'WRITE_CAPABLE' : 'REPORTING_ONLY') : 'WRITE_CAPABLE';
  const auto = known(bp?.autonomousPolicy.maxValueUsdCents) ?? 0;
  const escMax = known(bp?.escalationPolicy.maxValueUsdCents) ?? 0;
  return {
    id: row.id,
    name,
    slug: slugOf(row.organization?.agentId ?? name),
    role: bp?.protocols.map((p) => p.displayName).join(' · ') || 'Financial agent',
    objective: bp?.objective ?? row.prompt,
    status: agentStatusOf(state?.state, row.build),
    executionClass,
    ensName: bp?.identity.ensName ?? row.ensName ?? '—',
    ensNode: deployment?.record.ensNode ?? '',
    address: known(bp?.identity.agentAddress) ?? deployment?.record.roles.deployer ?? '',
    allowedAdapters: bp?.adapters.map((a) => a.adapterId) ?? [],
    budget: { autonomousPerAction: auto / 100, windowLimit: escMax / 100, windowUsed: 0, window: 'per action' },
    orgBudgetImpact: escMax / 100,
    policyHash: deployment?.record.policyHash ?? '',
    runtimeRevision: deployment ? 1 : null,
    parentId: row.organization?.orgId ?? null,
    projectId: row.id,
    buildId: row.build?.buildId ?? null,
  };
}

/** An organization's members as agents. Members without a build are listed as unbuilt drafts. */
export function agentsOfOrganization(org: OrganizationRow, view: OrgView | null, members: ProjectRow[]): Agent[] {
  return org.agents.map((m) => {
    const detail = view?.organization.agents.find((a) => a.id === m.id);
    const project = members.find((p) => p.id === m.projectId) ?? null;
    const writeCapable = (detail?.executionCapabilities.length ?? 0) > 0;
    return {
      id: m.id,
      name: m.displayName,
      slug: slugOf(m.id),
      role: detail?.role ?? (writeCapable ? 'Executing member' : 'Reporting member'),
      objective: detail?.objective ?? '',
      status: project ? agentStatusOf(undefined, project.build) : 'DRAFT',
      executionClass: writeCapable ? 'WRITE_CAPABLE' : 'REPORTING_ONLY',
      ensName: m.ensName,
      ensNode: '',
      address: '',
      allowedAdapters: detail?.allowedAdapters ?? [],
      budget: {
        autonomousPerAction: (detail?.autonomousMaxUsdCents ?? 0) / 100,
        windowLimit: (detail?.dailyMaxUsdCents ?? detail?.escalationMaxUsdCents ?? 0) / 100,
        windowUsed: 0,
        window: detail?.dailyMaxUsdCents != null ? '24h' : 'per action',
      },
      orgBudgetImpact: (detail?.dailyMaxUsdCents ?? 0) / 100,
      policyHash: '',
      runtimeRevision: null,
      parentId: org.id,
      projectId: m.projectId,
      buildId: m.buildId,
      unbuilt: !m.buildId,
    };
  });
}

/* ─────────────────────────── revisions / environment ─────────────────────────── */

export function revisionsOf(view: BuildView | null, deployment: ForkDeploymentView | null, creHash: string | null): RevisionSet {
  const bp = view?.blueprint?.revision ?? view?.build.blueprintRevision ?? null;
  return {
    requirements: bp,
    blueprint: bp,
    blueprintDraft: null,
    strategy: bp,
    build: view ? view.build.buildRevision || null : null,
    deployment: deployment ? deployment.blueprintRevision : null,
    runtime: deployment && deployment.live.runtime ? deployment.blueprintRevision : null,
    policy: deployment ? deployment.blueprintRevision : bp,
    creArtifactHash: creHash,
  };
}

export function environmentOf(state: LabStateView | null, deployment: ForkDeploymentView | null, creMode: CreMode): Environment {
  const onFork = !!deployment && deployment.state !== 'STOPPED' && deployment.state !== 'FAILED';
  return {
    executionNetwork: state?.executionNetwork.name ?? (onFork ? 'Local Anvil fork of Ethereum mainnet' : 'Ethereum Sepolia'),
    executionChainId: state?.executionNetwork.chainId ?? (onFork ? 31337 : 11155111),
    realitySource: 'Ethereum Mainnet',
    realityMode: onFork ? 'LOCAL_MAINNET_FORK' : 'LIVE_MAINNET_MIRROR',
    mainnetWrites: 'PROHIBITED',
    creMode,
    label: 'TESTNET LAB',
  };
}

/* ─────────────────────────── blockers ─────────────────────────── */

export function blockersOf(view: BuildView | null, state: LabStateView | null, deployment: ForkDeploymentView | null, graphBlocked: boolean): Blocker[] {
  const out: Blocker[] = [];
  const criticals = view?.findings.filter((f) => f.severity === 'CRITICAL') ?? [];
  if (criticals.length > 0) {
    out.push({
      id: criticals[0]!.code,
      title: `${criticals.length} CRITICAL security finding${criticals.length === 1 ? '' : 's'}`,
      detail: criticals.map((c) => `${c.code}: ${c.message}`).join(' · '),
      severity: 'CRITICAL',
      surface: 'permissions',
      actionLabel: 'Open Permissions',
      actionHref: '/security',
    });
  }
  if (view?.build.status === 'BUILD_NEEDS_USER_REVIEW' || view?.build.status === 'FAILED') {
    out.push({
      id: view.build.status,
      title: view.build.status === 'FAILED' ? 'Build failed' : 'Build needs your review',
      detail: view.build.failureReason ?? 'The pipeline stopped and recorded why in the build events.',
      severity: 'HIGH',
      surface: 'composer',
      actionLabel: 'Open Composer',
      actionHref: '/build',
    });
  }
  if (deployment?.state === 'FAILED') {
    out.push({
      id: 'FORK-DEPLOY-FAILED',
      title: 'Fork deployment failed',
      detail: deployment.record.failure ?? 'The deployment did not reach READY TO ACTIVATE.',
      severity: 'HIGH',
      surface: 'deploy',
      actionLabel: 'Open Preflight',
      actionHref: '/deploy',
    });
  }
  if (state?.state === 'EMERGENCY_LOCKED') {
    out.push({ id: 'EMERGENCY_LOCK', title: 'Emergency lock engaged', detail: state.because, severity: 'CRITICAL', surface: 'control-plane', actionLabel: 'Open Control Plane', actionHref: '/control-plane' });
  }
  if (graphBlocked) {
    out.push({
      id: 'BLK-V2-GRAPH-KEY',
      title: 'The Graph is unavailable',
      detail: 'No Graph API key is configured, so no indexed data is served. Nothing of lower trust is substituted for it.',
      severity: 'MEDIUM',
      surface: 'integrations',
      actionLabel: 'Open Integrations',
      actionHref: '/integrations',
    });
  }
  return out;
}

/* ─────────────────────────── the project ─────────────────────────── */

export function projectSummaryOf(row: ProjectRow, state: LabStateView | null, alerts = 0): ProjectSummary {
  return {
    id: row.id,
    name: row.name,
    description: row.prompt,
    agentCount: 1,
    lifecycle: lifecycleOf(state?.state, row.build),
    lastRevision: row.build?.blueprintRevision ?? null,
    executionNetwork: row.deployment && row.deployment.state !== 'STOPPED' && row.deployment.state !== 'FAILED' ? 'Local mainnet fork' : 'Ethereum Sepolia',
    creMode: 'MY_CRE_SIMULATOR',
    updatedAt: row.updatedAt,
    alerts,
    organization: row.organization?.name ?? null,
  };
}

export function organizationSummaryOf(org: OrganizationRow): ProjectSummary {
  const built = org.agents.filter((a) => a.buildId).length;
  return {
    id: org.id,
    name: org.name,
    description: `${org.agents.length} principal${org.agents.length === 1 ? '' : 's'} under ${org.rootEns} · ${built} built`,
    agentCount: org.agents.length,
    lifecycle: built === 0 ? 'DRAFT' : built < org.agents.length ? 'BUILDING' : 'BUILT',
    lastRevision: org.revision,
    executionNetwork: 'Ethereum Sepolia',
    creMode: 'MY_CRE_SIMULATOR',
    updatedAt: org.updatedAt,
    alerts: 0,
    organization: org.name,
  };
}

export interface ShellInputs {
  row: ProjectRow | null;
  organization: OrganizationRow | null;
  orgView: OrgView | null;
  members: ProjectRow[];
  view: BuildView | null;
  state: LabStateView | null;
  deployment: ForkDeploymentView | null;
  creHash: string | null;
  creMode: CreMode;
  graphBlocked: boolean;
  alerts: number;
}

export function projectOf(i: ShellInputs): Project | null {
  if (i.organization && !i.row) {
    const summary = organizationSummaryOf(i.organization);
    return {
      ...summary,
      agents: agentsOfOrganization(i.organization, i.orgView, i.members),
      revisions: revisionsOf(null, null, null),
      environment: environmentOf(null, null, i.creMode),
      blockers: [],
    };
  }
  if (!i.row) return null;
  const summary = projectSummaryOf(i.row, i.state, i.alerts);
  const agents = i.organization
    ? agentsOfOrganization(i.organization, i.orgView, i.members.length ? i.members : [i.row])
    : [agentOfProject(i.row, i.view, i.state, i.deployment)];
  return {
    ...summary,
    name: i.organization ? i.organization.name : summary.name,
    agentCount: agents.length,
    agents,
    revisions: revisionsOf(i.view, i.deployment, i.creHash),
    environment: environmentOf(i.state, i.deployment, i.creMode),
    blockers: blockersOf(i.view, i.state, i.deployment, i.graphBlocked),
  };
}
