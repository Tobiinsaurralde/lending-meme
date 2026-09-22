'use client';

/**
 * Assembles the workbench live-state envelope from the backend and renders the shell.
 *
 * The shell only consumes typed data. Everything here is a projection of what the project context
 * already read — the Lab lifecycle, the build, the fork deployment and the control-plane overview —
 * so the title bar, the badges and the status bar cannot disagree with the page beneath them.
 */
import { useMemo, type ReactNode } from 'react';
import { Workbench, type WorkbenchLiveState } from './shell/Workbench';
import type { NavBadge } from './shell/LeftWorkbench';
import { useStudioProject } from '@/lib/studio/api/project-context';
import { useActivity, useProjectsIndex } from '@/lib/studio/api/queries';
import { freshnessOf, policyStatusOf, runtimeStatusOf, toRuntimeEvent } from '@/lib/studio/api/adapters/operate';
import { organizationSummaryOf, projectSummaryOf } from '@/lib/studio/api/adapters/shell';
import type { Project, ProjectSummary, Status } from '@/lib/studio/types';

const STAGE_LABEL: Record<string, string> = {
  INTAKE: 'created', REQUIREMENTS: 'understanding request', BLUEPRINT: 'designing permissions', SECURITY_REVIEW: 'security review',
  AWAITING_APPROVAL: 'awaiting your review', BUILD: 'generating code', TEST: 'compiling and testing', SIMULATE: 'simulating attacks',
  REPAIR: 'repairing', FINAL_VERIFY: 'final verification', EXPORT_READY: 'built',
};

/** A shell for the Composer before any build exists. */
function draftProject(id: string): Project {
  return {
    id, name: 'New agent', description: 'Describe the agent to create the project.', agentCount: 1, lifecycle: 'DRAFT', lastRevision: null,
    executionNetwork: 'Ethereum Sepolia', creMode: 'MY_CRE_SIMULATOR', updatedAt: new Date(0).toISOString(), alerts: 0, organization: null,
    agents: [{
      id: 'draft', name: 'New agent', slug: 'agent', role: 'Not designed yet', objective: '', status: 'DRAFT', executionClass: 'WRITE_CAPABLE',
      ensName: '—', ensNode: '', address: '', allowedAdapters: [], budget: { autonomousPerAction: 0, windowLimit: 0, windowUsed: 0, window: 'per action' },
      orgBudgetImpact: 0, policyHash: '', runtimeRevision: null, parentId: null, projectId: null, buildId: null,
    }],
    revisions: { requirements: null, blueprint: null, blueprintDraft: null, strategy: null, build: null, deployment: null, runtime: null, policy: null, creArtifactHash: null },
    environment: { executionNetwork: 'Ethereum Sepolia', executionChainId: 11155111, realitySource: 'Ethereum Mainnet', realityMode: 'LIVE_MAINNET_MIRROR', mainnetWrites: 'PROHIBITED', creMode: 'MY_CRE_SIMULATOR', label: 'TESTNET LAB' },
    blockers: [],
  };
}

export function StudioShell({ children }: { children: ReactNode }) {
  const ctx = useStudioProject();
  const index = useProjectsIndex();
  const events = useActivity(ctx.deploymentId, { limit: '100' }, true);

  const projects = useMemo<ProjectSummary[]>(() => {
    const d = index.data;
    if (!d) return [];
    return [...d.organizations.map(organizationSummaryOf), ...d.projects.filter((p) => !p.organization).map((p) => projectSummaryOf(p, null))];
  }, [index.data]);

  const project = ctx.project ?? draftProject(ctx.routeProjectId);

  const live = useMemo<WorkbenchLiveState>(() => {
    const view = ctx.buildView;
    const state = ctx.labState;
    const overview = ctx.overview;
    const build = view?.build ?? null;
    const failing = view?.tests.filter((t) => t.failed > 0).length ?? 0;
    const criticals = view?.findings.filter((f) => f.severity === 'CRITICAL').length ?? 0;

    const navBadges: Record<string, NavBadge[]> = {};
    if (criticals) navBadges.security = [{ label: `${criticals}`, tone: 'deny', title: `${criticals} CRITICAL security finding(s)` }];
    if (failing) navBadges.simulation = [{ label: `${failing}`, tone: 'deny', title: `${failing} failing test suite(s)` }];
    if (view?.staleSimulations) navBadges.simulation = [...(navBadges.simulation ?? []), { label: 'STALE', tone: 'warn', title: `${view.staleSimulations} simulation result(s) predate the current revision` }];
    if (view?.codeStale) navBadges.code = [{ label: 'STALE', tone: 'warn', title: 'Generated code trails the current Blueprint revision' }];
    navBadges.cre = [{ label: 'SIM', tone: 'sim', title: 'Official CLI simulator — no DON, no TEE evidence' }];
    if (ctx.deploymentId) {
      navBadges.overview = [{ label: state?.hasFinancialAuthority ? 'LIVE' : 'DEPLOYED', tone: state?.hasFinancialAuthority ? 'pass' : 'sim', title: state?.label.detail ?? 'a fork deployment exists' }];
      navBadges.activity = [{ label: 'LIVE', tone: 'pass', title: 'Streaming RuntimeEvents from the fork deployment' }];
      const rt = runtimeStatusOf(overview?.panels.runtime.state);
      navBadges.runtime = [{ label: rt, tone: rt === 'HEALTHY' ? 'pass' : rt === 'PAUSED' || rt === 'STOPPED' ? 'blocked' : 'warn', title: overview?.panels.runtime.note ?? '' }];
      const pol = policyStatusOf(overview);
      navBadges.policies = [{ label: pol, tone: pol === 'ENABLED' ? 'pass' : 'blocked', title: pol === 'ENABLED' ? 'Financial authority is enabled on the fork' : 'Financial authority is disabled' }];
      if (overview?.alerts.open) navBadges['control-plane'] = [{ label: `${overview.alerts.open} alert${overview.alerts.open === 1 ? '' : 's'}`, tone: overview.alerts.critical ? 'deny' : 'warn', title: `${overview.alerts.open} open alert(s)` }];
    }
    if (project.blockers.some((b) => b.id === 'BLK-V2-GRAPH-KEY')) navBadges.integrations = [{ label: 'BLOCKED', tone: 'blocked', title: 'The Graph adapter is UNAVAILABLE' }];
    navBadges.reality = [{ label: 'LIMITED', tone: 'warn', title: 'Historical Replay is limited without an archive RPC' }];

    const buildStatus = build
      ? { label: `Build${build.buildRevision ? ` r${build.buildRevision}` : ''} · ${build.status === 'RUNNING' ? STAGE_LABEL[build.stage] ?? build.stage : build.status.toLowerCase().replace(/_/g, ' ')}`,
          status: build.status === 'RUNNING' ? 'RUNNING' : build.status === 'COMPLETED' ? 'PASS' : build.status === 'AWAITING_APPROVAL' ? 'REQUIRED' : build.status === 'FAILED' ? 'FAIL' : 'WARN' }
      : { label: ctx.isDraft ? 'No build yet' : 'No build', status: 'UNKNOWN' };

    const creStatus: Status = ctx.labState?.computedFrom.creSimulationPassed ? 'SIMULATED' : 'UNKNOWN';
    const runtimeState: Status = ctx.deploymentId ? runtimeStatusOf(overview?.panels.runtime.state) : 'STOPPED';
    return {
      policyState: ctx.deploymentId ? policyStatusOf(overview) : (state?.computedFrom.policy ? (state.computedFrom.policy.enabled ? 'ENABLED' : 'DISABLED') : 'UNKNOWN'),
      policyFreshness: freshnessOf(overview?.panels.policy ?? null, 'fork rpc'),
      runtimeState,
      creStatus,
      syncSeconds: overview?.panels.policy ? Math.max(0, Math.round(overview.panels.policy.ageMs / 1000)) : 0,
      buildStatus,
      navBadges,
      events: (events.data ?? []).map((e) => toRuntimeEvent(e, ctx.agent?.id ?? 'agent', ctx.deployment?.blueprintRevision ?? null, project.environment.creMode)),
      problemCount: ctx.problems.length,
    };
  }, [ctx, events.data, project]);

  return (
    <Workbench project={project} projects={projects} live={live}>
      {children}
    </Workbench>
  );
}
