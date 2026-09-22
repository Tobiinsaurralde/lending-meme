'use client';

/**
 * Server state (spec §38).
 *
 * Every query key carries the session user and the ids it depends on, so a wallet switch or a project
 * change is a different cache entry rather than a stale one. Observed chain/runtime state is refetched
 * on a short interval while a deployment is live; the freshness the backend attaches is what the
 * screens display, never the age of this cache.
 */
import { useSyncExternalStore } from 'react';
import { useQuery, useQueryClient, useMutation, type UseQueryOptions } from '@tanstack/react-query';
import { control, fork, lab, studio } from './endpoints';
import { ApiError } from './client';
import { ANONYMOUS_USER, sessionUserId, subscribeSession } from './session';
import type {
  ActivityFilters, BuildView, ForkDeploymentView, LabStateView, OverviewData, ProjectRow, OrganizationRow, OrgView,
} from './types';

/* ─────────────────────────── session ─────────────────────────── */

export function useSessionUser(): string {
  // The server has no wallet, so it renders the anonymous user; the client hydrates to the same
  // value and only then reads the stored session. A `useState` initializer would read storage
  // during hydration and mismatch the server's HTML.
  return useSyncExternalStore(subscribeSession, sessionUserId, () => ANONYMOUS_USER);
}

/** Treat a 404 as "absent" (null) rather than an error; anything else still throws. */
export async function absentAsNull<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch (e) {
    if (e instanceof ApiError && e.isAbsent) return null;
    throw e;
  }
}

const LIVE_MS = 5_000;

/* ─────────────────────────── studio ─────────────────────────── */

export function useHealth() {
  return useQuery({ queryKey: ['health'], queryFn: studio.health, staleTime: 60_000 });
}

export function useProjectsIndex() {
  const user = useSessionUser();
  return useQuery({ queryKey: ['projects', user], queryFn: studio.projects });
}

export function useAdapters(chainId?: number) {
  return useQuery({ queryKey: ['adapters', chainId ?? 'all'], queryFn: () => studio.adapters(chainId), staleTime: 300_000 });
}

/** Ids of the form `org-…` are organizations; everything else is a project. */
export const isOrgId = (id: string | null | undefined): boolean => !!id && id.startsWith('org-');
/** The Composer's pseudo project, before a build exists. */
export const DRAFT_PROJECT_ID = 'new';

export function useProjectRow(projectId: string | null) {
  const user = useSessionUser();
  return useQuery<{ project: ProjectRow; organization: OrganizationRow | null } | null>({
    queryKey: ['project', user, projectId],
    queryFn: () => absentAsNull(studio.project(projectId!)),
    enabled: !!projectId && !isOrgId(projectId) && projectId !== DRAFT_PROJECT_ID,
  });
}

export function useOrganization(orgId: string | null) {
  const user = useSessionUser();
  return useQuery<OrgView | null>({
    queryKey: ['organization', user, orgId],
    queryFn: () => absentAsNull(studio.organization(orgId!)),
    enabled: !!orgId,
  });
}

export function useBuild(buildId: string | null, opts: Partial<UseQueryOptions<BuildView | null>> = {}) {
  const user = useSessionUser();
  return useQuery<BuildView | null>({
    queryKey: ['build', user, buildId],
    queryFn: () => absentAsNull(studio.get(buildId!)),
    enabled: !!buildId,
    ...opts,
  });
}

export function useBuildFile(buildId: string | null, path: string | null) {
  return useQuery({
    queryKey: ['build-file', buildId, path],
    queryFn: () => studio.file(buildId!, path!),
    enabled: !!buildId && !!path,
    staleTime: 60_000,
  });
}

/* ─────────────────────────── lab ─────────────────────────── */

const labEnabled = (id: string | null) => !!id && !isOrgId(id) && id !== DRAFT_PROJECT_ID;

export function useLabState(projectId: string | null, live = false) {
  const user = useSessionUser();
  return useQuery<LabStateView | null>({
    queryKey: ['lab', 'state', user, projectId],
    queryFn: () => absentAsNull(lab.state(projectId!)),
    enabled: labEnabled(projectId),
    refetchInterval: live ? LIVE_MS : false,
  });
}
export function useLabSummary(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'summary', user, projectId], queryFn: () => absentAsNull(lab.summary(projectId!)), enabled: labEnabled(projectId) });
}
export function useReality() {
  return useQuery({ queryKey: ['lab', 'reality'], queryFn: lab.reality, staleTime: 60_000 });
}
export function useCre(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'cre', user, projectId], queryFn: () => absentAsNull(lab.cre(projectId!)), enabled: labEnabled(projectId) });
}
export function useCreConnect(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'cre-connect', user, projectId], queryFn: () => absentAsNull(lab.creConnect(projectId!)), enabled: labEnabled(projectId) });
}
export function useCreParity(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'cre-parity', user, projectId], queryFn: () => absentAsNull(lab.creParity(projectId!)), enabled: labEnabled(projectId) });
}
export function useCreSimulations(projectId: string | null, live = false) {
  const user = useSessionUser();
  return useQuery({
    queryKey: ['lab', 'cre-sims', user, projectId],
    queryFn: () => lab.creSimulations(projectId!),
    enabled: labEnabled(projectId),
    refetchInterval: live ? 3_000 : false,
  });
}
export function useAttacks(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'attacks', user, projectId], queryFn: () => absentAsNull(lab.attacks(projectId!)), enabled: labEnabled(projectId) });
}
export function useSimulationCenter(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'sim-center', user, projectId], queryFn: () => absentAsNull(lab.simulationCenter(projectId!)), enabled: labEnabled(projectId) });
}
export function useTokenRequirements(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'tokens', user, projectId], queryFn: () => absentAsNull(lab.tokenRequirements(projectId!)), enabled: labEnabled(projectId) });
}
export function useActivation(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'activation', user, projectId], queryFn: () => absentAsNull(lab.activation(projectId!)), enabled: labEnabled(projectId), refetchInterval: LIVE_MS });
}
export function useShadow(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'shadow', user, projectId], queryFn: () => absentAsNull(lab.shadow(projectId!)), enabled: labEnabled(projectId) });
}
export function useScenarios(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'scenarios', user, projectId], queryFn: () => absentAsNull(lab.scenarios(projectId!)), enabled: labEnabled(projectId) });
}
export function useDecision(projectId: string | null, correlationId: string | null) {
  const user = useSessionUser();
  return useQuery({
    queryKey: ['lab', 'decision', user, projectId, correlationId],
    queryFn: () => absentAsNull(lab.decision(projectId!, correlationId!)),
    enabled: labEnabled(projectId) && !!correlationId,
  });
}
export function useSafetyReport(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'safety-report', user, projectId], queryFn: () => absentAsNull(lab.safetyReport(projectId!)), enabled: labEnabled(projectId) });
}
export function usePublicSafetyReport(projectId: string | null, enabled = true) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'safety-report-public', user, projectId], queryFn: () => absentAsNull(lab.publicSafetyReport(projectId!)), enabled: labEnabled(projectId) && enabled });
}
export function useDeployReadiness(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['lab', 'deploy-readiness', user, projectId], queryFn: () => absentAsNull(lab.deployReadiness(projectId!)), enabled: labEnabled(projectId) });
}

/* ─────────────────────────── fork lab ─────────────────────────── */

export function useForkReadiness(projectId: string | null) {
  const user = useSessionUser();
  return useQuery({ queryKey: ['fork', 'readiness', user, projectId], queryFn: () => absentAsNull(fork.readiness(projectId!)), enabled: labEnabled(projectId) });
}
export function useForkDeployments(projectId: string | null, live = false) {
  const user = useSessionUser();
  return useQuery<ForkDeploymentView[]>({
    queryKey: ['fork', 'deployments', user, projectId],
    queryFn: () => fork.list(projectId!),
    enabled: labEnabled(projectId),
    refetchInterval: live ? LIVE_MS : false,
  });
}
export function useForkDeployment(deploymentId: string | null, live = false) {
  return useQuery<ForkDeploymentView | null>({
    queryKey: ['fork', 'deployment', deploymentId],
    queryFn: () => absentAsNull(fork.get(deploymentId!)),
    enabled: !!deploymentId,
    refetchInterval: live ? 2_000 : false,
  });
}
export function useForkPosition(deploymentId: string | null, live = true) {
  return useQuery({
    queryKey: ['fork', 'position', deploymentId],
    queryFn: () => absentAsNull(fork.position(deploymentId!)),
    enabled: !!deploymentId,
    refetchInterval: live ? LIVE_MS : false,
  });
}

/** The deployment a project's screens read: the newest one that is not FAILED. */
export function currentDeployment(list: ForkDeploymentView[] | undefined | null): ForkDeploymentView | null {
  return list?.find((d) => d.state !== 'FAILED') ?? null;
}

/* ─────────────────────────── control plane ─────────────────────────── */

export function useOverview(deploymentId: string | null, live = true) {
  return useQuery<OverviewData | null>({
    queryKey: ['control', 'overview', deploymentId],
    queryFn: () => absentAsNull(control.overview(deploymentId!)),
    enabled: !!deploymentId,
    refetchInterval: live ? LIVE_MS : false,
  });
}
export function useActivity(deploymentId: string | null, filters: ActivityFilters, live = true) {
  return useQuery({
    queryKey: ['control', 'activity', deploymentId, filters],
    queryFn: () => control.activity(deploymentId!, filters),
    enabled: !!deploymentId,
    refetchInterval: live ? LIVE_MS : false,
  });
}
export function useTrace(deploymentId: string | null, correlationId: string | null) {
  return useQuery({
    queryKey: ['control', 'trace', deploymentId, correlationId],
    queryFn: () => absentAsNull(control.trace(deploymentId!, correlationId!)),
    enabled: !!deploymentId && !!correlationId,
  });
}
export function useAlerts(deploymentId: string | null, live = true) {
  return useQuery({
    queryKey: ['control', 'alerts', deploymentId],
    queryFn: () => control.alerts(deploymentId!),
    enabled: !!deploymentId,
    refetchInterval: live ? LIVE_MS : false,
  });
}
export function useOperations() {
  return useQuery({ queryKey: ['control', 'operations'], queryFn: control.operations, staleTime: 300_000 });
}
export function useCommands(deploymentId: string | null) {
  return useQuery({ queryKey: ['control', 'commands', deploymentId], queryFn: () => control.commands(deploymentId!), enabled: !!deploymentId, refetchInterval: LIVE_MS });
}

/* ─────────────────────────── invalidation ─────────────────────────── */

/** After anything that changes server state: drop every cached read. Cheap, and never wrong. */
export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}

export function useControlCommand(deploymentId: string | null, projectId?: string) {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (body: Parameters<typeof control.issueCommand>[1]) => control.issueCommand(deploymentId!, body, projectId),
    onSettled: () => void invalidate(),
  });
}
