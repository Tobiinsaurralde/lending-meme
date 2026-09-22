'use client';

/**
 * The @mention surface, from what the project currently has.
 *
 * Every row here is something a page shows. Credentials never appear: an adapter is mentionable,
 * its secret is not, and the backend never returns a secret to build one from anyway.
 */
import { useMemo } from 'react';
import { useStudioProject } from './project-context';
import { useActivity, useAttacks } from './queries';
import { toAlert, toRuntimeEvent } from './adapters/operate';
import type { MentionSource } from '../mentions';

export function useMentionSource(): MentionSource {
  const ctx = useStudioProject();
  const attacks = useAttacks(ctx.dataProjectId);
  const events = useActivity(ctx.deploymentId, { limit: '40' }, false);

  return useMemo<MentionSource>(() => {
    const bp = ctx.buildView?.blueprint ?? null;
    const sims = ctx.buildView?.simulations ?? [];
    const dep = ctx.deployment;
    return {
      agents: ctx.agents,
      policy: ctx.overview?.panels.policy?.value
        ? { version: bp?.revision ?? null, observed: ctx.overview.panels.policy.value.enabled ? 'ENABLED' : 'DISABLED', network: 'local mainnet fork' }
        : null,
      adapters: (bp?.adapters ?? []).map((a) => ({ id: a.adapterId, adapterId: a.adapterId, name: a.adapterId, trustClass: a.role, status: 'BOUND' })),
      scenarios: (bp?.simulationScenarios ?? []).map((s) => {
        const last = sims.filter((r) => r.scenarioId === s.scenarioId).at(-1);
        return { id: s.scenarioId, name: s.scenarioId, group: s.expectedVerdict, result: last ? (last.passed ? 'PASS' : 'FAIL') : null };
      }),
      attacks: (attacks.data?.applicable ?? []).map((a) => ({ id: a.scenario, name: a.title, severity: a.expectedStoppedBy, lastResult: null })),
      deployments: dep
        ? [{
            id: dep.deploymentId, revision: dep.blueprintRevision, network: 'local mainnet fork', status: dep.state,
            contracts: Object.entries(dep.record.contracts ?? {}).map(([name]) => ({ name, txHash: dep.record.setupTransactions.find((t) => t.label.toLowerCase().includes(name.toLowerCase()))?.hash ?? null })),
          }]
        : [],
      events: (events.data ?? []).map((e) => toRuntimeEvent(e, ctx.agent?.id ?? 'agent', dep?.blueprintRevision ?? null, ctx.project?.environment.creMode ?? 'MY_CRE_SIMULATOR')),
      alerts: (ctx.overview?.alerts.rows ?? []).map((r) => toAlert({ ...r, state: r.state ?? 'OPEN', firstSeenAtMs: r.firstSeenAtMs ?? Date.now(), lastSeenAtMs: r.lastSeenAtMs ?? Date.now() })),
      files: (ctx.buildView?.files ?? []).map((f) => ({ name: f.path.split('/').pop() ?? f.path, path: f.path, group: f.path.split('/')[0] ?? 'generated' })),
      problems: ctx.problems,
    };
  }, [ctx, attacks.data, events.data]);
}
