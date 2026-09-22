'use client';

/**
 * The project a workbench route is looking at, resolved from the backend.
 *
 * One provider under the workbench layout composes the reads every page and every piece of chrome
 * needs — the project row, the selected agent, its build, the Lab lifecycle, the fork deployment
 * and the control-plane overview — so a page asks `useStudioProject()` and gets the same answer the
 * title bar shows. Nothing is cached here beyond TanStack's own cache; nothing is derived that the
 * backend already decides.
 *
 * Two id shapes arrive on the route: `org-…` is an organization (its members are projects of their
 * own, one per agent), and `new` is the Composer before any build exists.
 */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useParams, useSearchParams } from 'next/navigation';
import type { Agent, Project, ProblemItem, TestResult } from '../types';
import type { BuildView, ForkDeploymentView, LabStateView, OrgView, OrganizationRow, OverviewData, ProjectRow } from './types';
import {
  DRAFT_PROJECT_ID, currentDeployment, isOrgId, useBuild, useCre, useForkDeployments, useLabState, useOrganization,
  useOverview, useProjectRow, useProjectsIndex, useReality,
} from './queries';
import { creModeOf, projectOf } from './adapters/shell';
import { useBuildEvents, type StudioEvent } from './events';
import { logLineOf, type LogLine } from '../log';

export interface StudioProjectValue {
  /** The id on the route. */
  routeProjectId: string;
  isDraft: boolean;
  isOrganization: boolean;
  project: Project | null;
  agents: Agent[];
  agent: Agent | null;
  /** The backend project whose artifacts the current page reads (the selected agent's). */
  dataProjectId: string | null;
  buildId: string | null;
  row: ProjectRow | null;
  organization: OrganizationRow | null;
  orgView: OrgView | null;
  buildView: BuildView | null;
  labState: LabStateView | null;
  deployment: ForkDeploymentView | null;
  deploymentId: string | null;
  overview: OverviewData | null;
  problems: ProblemItem[];
  tests: TestResult[];
  /** The build's event stream, as output-panel lines. Replays from the server on every mount. */
  buildLog: LogLine[];
  /** Raw build events since this provider mounted, newest last. */
  buildEvents: StudioEvent[];
  loading: boolean;
  error: string | null;
  refetchProject: () => void;
}

const Ctx = createContext<StudioProjectValue | null>(null);

export function useStudioProject(): StudioProjectValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStudioProject must be used inside <StudioProjectProvider>');
  return v;
}

/** Live state is worth polling only while something can change under us. */
const LIVE_STATES = new Set(['BUILDING', 'DEPLOYING', 'READY_TO_ACTIVATE', 'LAB_ACTIVE', 'PAUSED', 'DEGRADED', 'EMERGENCY_LOCKED']);

export function StudioProjectProvider({ children }: { children: ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const searchParams = useSearchParams();
  const routeProjectId = params.projectId;
  const isDraft = routeProjectId === DRAFT_PROJECT_ID;
  const isOrganization = isOrgId(routeProjectId);

  const index = useProjectsIndex();
  const rowQ = useProjectRow(isOrganization || isDraft ? null : routeProjectId);
  const row = rowQ.data?.project ?? null;
  const orgRow = isOrganization
    ? (index.data?.organizations.find((o) => o.id === routeProjectId) ?? null)
    : (rowQ.data?.organization ?? null);
  const orgViewQ = useOrganization(orgRow?.id ?? null);
  const members = useMemo(() => {
    if (!orgRow) return [] as ProjectRow[];
    return index.data?.projects.filter((p) => p.organization?.orgId === orgRow.id) ?? [];
  }, [orgRow, index.data]);

  /* Which agent. For an organization, the URL's slug or the first built member; otherwise the one. */
  const agentSlug = searchParams.get('agent');
  const agentRow: ProjectRow | null = useMemo(() => {
    if (!orgRow) return row;
    const byMember = (id: string) => members.find((p) => p.organization?.agentId === id) ?? null;
    const wanted = agentSlug ? orgRow.agents.find((a) => a.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === agentSlug) : null;
    if (wanted) return byMember(wanted.id);
    if (row) return row;
    const firstBuilt = orgRow.agents.find((a) => a.projectId);
    return firstBuilt ? byMember(firstBuilt.id) : null;
  }, [orgRow, row, members, agentSlug]);

  const dataProjectId = agentRow?.id ?? null;
  const buildId = agentRow?.build?.buildId ?? null;

  const labQ = useLabState(dataProjectId, true);
  const live = labQ.data ? LIVE_STATES.has(labQ.data.state) : false;
  const buildQ = useBuild(buildId, { refetchInterval: live || agentRow?.build?.status === 'RUNNING' ? 4_000 : false });
  const deploymentsQ = useForkDeployments(dataProjectId, live);
  const deployment = currentDeployment(deploymentsQ.data);
  const deploymentId = deployment && deployment.state !== 'STOPPED' && deployment.state !== 'FAILED' ? deployment.deploymentId : null;
  const overviewQ = useOverview(deploymentId, true);
  const creQ = useCre(dataProjectId);
  const realityQ = useReality();

  /*
   * The build's SSE stream. Not authoritative — every event that changes what a page shows triggers
   * a re-fetch of the persisted build, so a dropped connection costs nothing but latency.
   */
  const qc = useQueryClient();
  const [buildLog, setBuildLog] = useState<LogLine[]>([]);
  const buildEvents = useBuildEvents(buildId, (e) => {
    const line = logLineOf(e.type, e.payload, e.at, buildQ.data?.build.buildRevision ?? null);
    if (line) setBuildLog((l) => [...l.slice(-500), line]);
    if (
      e.type === 'blueprint.completed' || e.type === 'blueprint.updated' || e.type === 'security.completed' || e.type === 'approval.requested' ||
      e.type === 'build.completed' || e.type === 'build.failed' || e.type === 'simulation.completed' || e.type === 'code.file.created' ||
      e.type === 'test.passed' || e.type === 'test.failed' || e.type === 'build.limit_reached' || e.type === 'build.paused' || e.type === 'build.abandoned'
    ) {
      void qc.invalidateQueries({ queryKey: ['build'] });
      void qc.invalidateQueries({ queryKey: ['lab'] });
      void qc.invalidateQueries({ queryKey: ['project'] });
      void qc.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const value = useMemo<StudioProjectValue>(() => {
    const view = buildQ.data ?? null;
    const state = labQ.data ?? null;
    const overview = overviewQ.data ?? null;
    const graphBlocked = realityQ.data?.sources.some((s) => s.sourceId.startsWith('thegraph') && s.status !== 'HEALTHY') ?? false;
    const project = projectOf({
      row: agentRow ?? (isOrganization ? null : row),
      organization: orgRow,
      orgView: orgViewQ.data ?? null,
      members,
      view,
      state,
      deployment,
      creHash: creQ.data?.status.workflowBinary ?? null,
      creMode: creModeOf(creQ.data?.status.executionMode),
      graphBlocked,
      alerts: overview?.alerts.open ?? 0,
    });
    const agents = project?.agents ?? [];
    const agent = agents.find((a) => a.slug === agentSlug) ?? agents.find((a) => a.projectId === dataProjectId) ?? agents[0] ?? null;

    const problems: ProblemItem[] = [
      ...(view?.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH').map((f) => ({
        id: f.code, severity: f.severity as ProblemItem['severity'], message: `${f.code} — ${f.message.slice(0, 120)}`,
        detail: f.message, resource: `${f.source} · ${f.path}`, href: '/security',
      })) ?? []),
      ...(project?.blockers.filter((b) => !view?.findings.some((f) => f.code === b.id)).map((b) => ({
        id: b.id, severity: b.severity, message: b.title, detail: b.detail, resource: b.surface, href: b.actionHref,
      })) ?? []),
    ];
    const tests: TestResult[] = view?.tests.map((t, i) => ({
      id: `${t.suite}-${t.buildRevision}-${i}`, suite: t.suite, name: `${t.passed} passed · ${t.failed} failed (build r${t.buildRevision})`,
      status: t.failed > 0 ? 'FAIL' : 'PASS', durationMs: 0, failure: t.failed > 0 ? `${t.failed} failing in ${t.suite}` : undefined,
    })) ?? [];

    const loading = index.isLoading || rowQ.isLoading || (isOrganization && orgViewQ.isLoading) || (!!buildId && buildQ.isLoading);
    const err = rowQ.error ?? index.error ?? buildQ.error ?? null;
    return {
      routeProjectId, isDraft, isOrganization, project, agents, agent, dataProjectId, buildId,
      row: agentRow ?? row, organization: orgRow, orgView: orgViewQ.data ?? null, buildView: view, labState: state,
      deployment, deploymentId, overview, problems, tests, buildLog, buildEvents, loading,
      error: err ? (err as Error).message : null,
      refetchProject: () => { void rowQ.refetch(); void index.refetch(); void buildQ.refetch(); void labQ.refetch(); void deploymentsQ.refetch(); },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeProjectId, isDraft, isOrganization, row, agentRow, orgRow, orgViewQ.data, members, buildQ.data, labQ.data, deployment, overviewQ.data, creQ.data, realityQ.data, agentSlug, dataProjectId, buildId, buildLog, buildEvents, index.isLoading, rowQ.isLoading, orgViewQ.isLoading, buildQ.isLoading, rowQ.error, index.error, buildQ.error]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
