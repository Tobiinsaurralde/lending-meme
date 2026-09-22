'use client';

/**
 * Overview (spec §21) — the primary post-deployment page.
 *
 * Everything here is an observation with a timestamp, from the control plane over the fork
 * deployment: the policy state as read from the fork's registry, the runtime's own health, the
 * identity binding, the adapters, every decision the agent has made and every escalation waiting
 * for a human. A panel is green only when its reading is current. The header never says LIVE
 * unqualified — it says what network, what reality source and what CRE mode.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity as ActivityIcon, Pause, Play, RefreshCw, ShieldAlert, ShieldOff, Swords, Zap } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge, BlockchainRef, BlockerBanner, Card, EmptyState, FreshnessBadge, KeyValue, ReasonCode, Section, StatusBadge, TimeAgo, VerdictBadge,
} from '@/components/studio/primitives';
import { SecurityConfirmation, EmergencyConfirmation } from '@/components/studio/dialogs';
import { EscalationPanel } from '@/components/studio/wallet/EscalationPanel';
import { useWorkbench } from '@/lib/studio/workbench';
import { useControlRequest } from '@/lib/studio/control-bridge';
import { useControlCommand, useForkPosition, useInvalidateAll, useLabSummary } from '@/lib/studio/api/queries';
import { freshnessOf, policyStatusOf, runtimeStatusOf, sampleFreshness, toDecisionRow } from '@/lib/studio/api/adapters/operate';
import { fork as forkApi } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import type { Freshness, Status } from '@/lib/studio/types';

const EMERGENCY_STEPS = ['Disable ContextLock policy', 'Block new capabilities', 'Pause / stop CRE path', 'Stop agent runtime', 'Optionally revoke agent identity'];

export default function OverviewPage() {
  const router = useRouter();
  const { setSelection, pushToast } = useWorkbench();
  const { agent, agentSlug, project, ctx } = useStudioPage('overview');
  const invalidate = useInvalidateAll();
  const summary = useLabSummary(ctx.dataProjectId);
  const positionQ = useForkPosition(ctx.deploymentId, true);
  const command = useControlCommand(ctx.deploymentId, ctx.dataProjectId ?? undefined);

  const [disableOpen, setDisableOpen] = useState(false);
  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [revokeEns, setRevokeEns] = useState(false);
  const [pending, setPending] = useState<'ENABLING' | 'DISABLING' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stressing, setStressing] = useState<string | null>(null);

  useControlRequest('DISABLE_POLICY', () => setDisableOpen(true));
  useControlRequest('EMERGENCY_LOCK', () => setEmergencyOpen(true));

  const go = (segment: string, qs = '') => router.push(`/projects/${ctx.routeProjectId}/${segment}?agent=${agentSlug}${qs}`);

  const overview = ctx.overview;
  const position = positionQ.data ?? null;
  const state = ctx.labState;
  const deployment = ctx.deployment;

  const policyStatus = policyStatusOf(overview, pending);
  const runtimeStatus = runtimeStatusOf(overview?.panels.runtime.state);
  const decisions = useMemo(() => (position?.decisions ?? []).slice(0, 12).map(toDecisionRow), [position]);
  const openAlerts = overview?.alerts.rows ?? [];
  const latest = position?.latest ?? null;

  const issue = async (op: 'PAUSE_RUNTIME' | 'RESUME_RUNTIME' | 'DISABLE_POLICY' | 'ENABLE_POLICY', confirmation?: Record<string, unknown>) => {
    if (!deployment) return;
    setError(null);
    if (op === 'DISABLE_POLICY') setPending('DISABLING');
    if (op === 'ENABLE_POLICY') setPending('ENABLING');
    try {
      const r = await command.mutateAsync({ operation: op, expectedRevision: deployment.revision, confirmation: confirmation ?? null });
      if (r.ok === false) throw new Error(r.detail ?? 'refused');
      pushToast(`${op.replace(/_/g, ' ').toLowerCase()}: ${r.detail ?? 'applied'}${r.claim?.warning ? ` — ${r.claim.warning}` : ''}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setPending(null);
    }
  };

  const emergency = async () => {
    if (!deployment) return;
    setEmergencyOpen(false);
    setError(null);
    try {
      const r = await command.mutateAsync({ operation: 'EMERGENCY_LOCK', expectedRevision: deployment.revision, confirmation: { includeIdentityRevocation: revokeEns } });
      pushToast(r.detail ?? 'Emergency lock issued');
      go('control-plane');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  const stress = async (driverId: string, option: string, value: number) => {
    if (!deployment) return;
    setError(null);
    setStressing(driverId);
    try {
      const r = await forkApi.stress(deployment.deploymentId, driverId, option, value);
      pushToast(`${r.detail} — ${r.note}`);
      await invalidate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setStressing(null);
    }
  };

  if (!ctx.deploymentId || !deployment) {
    return (
      <StudioPage segment="overview" title={agent.name.toUpperCase()} subtitle={agent.objective}>
        <EmptyState
          title={ctx.loading ? 'Loading…' : 'This agent has not been deployed to the Testnet Lab'}
          body={ctx.loading ? '' : state ? `${state.label.headline} — ${state.label.detail}` : 'Deploy it to the local mainnet fork to watch it act on real protocol state under the full ContextLock path.'}
          action={ctx.loading ? undefined : <button type="button" className="cl-btn cl-btn-primary" onClick={() => go('deploy')}>Run Deployment Preflight</button>}
        />
      </StudioPage>
    );
  }

  const policyFresh: Freshness = freshnessOf(overview?.panels.policy, 'fork policy registry');
  const identityFresh: Freshness = freshnessOf(overview?.panels.identity, 'fork identity verifier');
  const runtimeFresh: Freshness = sampleFreshness(latest);
  const creFresh: Freshness = overview?.panels.cre.lastSyncedAtMs
    ? { source: 'official CLI simulator', observedAt: new Date(overview.panels.cre.lastSyncedAtMs).toISOString(), ttlSeconds: 86_400, state: 'FRESH', lastSuccessfulAt: new Date(overview.panels.cre.lastSyncedAtMs).toISOString() }
    : { source: 'official CLI simulator', observedAt: null, ttlSeconds: 86_400, state: 'UNKNOWN', lastSuccessfulAt: null, staleReason: 'No simulation run recorded' };
  const adaptersHealthy = overview?.panels.adapters.filter((a) => a.state === 'HEALTHY').length ?? 0;
  const adaptersTotal = overview?.panels.adapters.length ?? 0;
  const hasAuthority = state?.hasFinancialAuthority ?? false;

  return (
    <StudioPage
      segment="overview"
      live
      title={agent.name.toUpperCase()}
      subtitle={summary.data?.summary.goal ?? agent.objective}
      badges={
        <>
          {/* never "LIVE" on its own */}
          <Badge tone={hasAuthority ? 'pass' : 'sim'} large>
            {state?.label.headline ?? `TESTNET LAB · ${deployment.state.replace(/_/g, ' ')}`}
          </Badge>
          <Badge tone="sim">Execution: {project.environment.executionNetwork}</Badge>
          <Badge tone="data">Reality: {project.environment.realitySource} · READ ONLY</Badge>
          <Badge tone="sim">CRE: Official CLI Simulator</Badge>
          <Badge tone="deny">Production-chain execution: DISABLED</Badge>
        </>
      }
      actions={
        <>
          <button type="button" className="cl-btn" onClick={() => go('activity')}><ActivityIcon size={13} aria-hidden />Open Activity</button>
          <button type="button" className="cl-btn" onClick={() => go('simulation')}><Play size={13} aria-hidden />Run Simulation</button>
          <button type="button" className="cl-btn" onClick={() => go('attacks')}><Swords size={13} aria-hidden />Attack Test</button>
          {runtimeStatus === 'PAUSED' ? (
            <button type="button" className="cl-btn" onClick={() => void issue('RESUME_RUNTIME')} disabled={command.isPending}><Play size={13} aria-hidden />Resume Runtime</button>
          ) : (
            <button type="button" className="cl-btn" onClick={() => void issue('PAUSE_RUNTIME')} disabled={command.isPending || runtimeStatus === 'STOPPED'} title="Stops the agent process. Does NOT remove financial authority."><Pause size={13} aria-hidden />Pause Runtime</button>
          )}
          <button type="button" className="cl-btn cl-btn-danger" onClick={() => setDisableOpen(true)} disabled={policyStatus !== 'ENABLED'} title={policyStatus !== 'ENABLED' ? 'Financial authority is not enabled' : undefined}><ShieldOff size={13} aria-hidden />Disable Policy</button>
          <button type="button" className="cl-btn cl-btn-emergency" onClick={() => setEmergencyOpen(true)} disabled={state?.state === 'EMERGENCY_LOCKED'} title={state?.state === 'EMERGENCY_LOCKED' ? 'An emergency lock is already engaged' : undefined}><ShieldAlert size={13} aria-hidden />{state?.state === 'EMERGENCY_LOCKED' ? 'Emergency Locked' : 'Emergency Lock'}</button>
        </>
      }
      banners={
        <>
          {error ? <BlockerBanner tone="deny" title="The control plane refused">{error}</BlockerBanner> : null}
          {state?.state === 'READY_TO_ACTIVATE' ? (
            <BlockerBanner tone="warn" title="Deployed, not activated" actions={<button type="button" className="cl-btn cl-btn-sm cl-btn-primary" onClick={() => go('deploy')}>Activate on the Deploy page</button>}>
              The policy reads DISABLED on the fork. The runtime observes and proposes, and every proposal is denied until you activate — {state.because}
            </BlockerBanner>
          ) : null}
          {state?.state === 'PAUSED' ? <BlockerBanner tone="warn" title="Runtime paused — financial authority is still ENABLED">{state.label.detail}</BlockerBanner> : null}
          {(position?.pending.length ?? 0) > 0 ? (
            <BlockerBanner tone="warn" title={`${position!.pending.length} escalation${position!.pending.length === 1 ? '' : 's'} waiting for a human`}>
              The agent proposed an action inside the escalation band. It has a capability and an ESCALATE authorization, and will not execute without an approval signature. Decide below.
            </BlockerBanner>
          ) : null}
          {openAlerts.length > 0 ? (
            <BlockerBanner tone={overview!.alerts.critical > 0 ? 'deny' : 'warn'} title={`${openAlerts.length} open alert${openAlerts.length === 1 ? '' : 's'}`} actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => go('control-plane')}>Open Control Plane</button>}>
              {openAlerts.slice(0, 3).map((a) => `${a.rule}: ${a.reason}`).join(' · ')}
            </BlockerBanner>
          ) : null}
        </>
      }
    >
      <Section label="Status" actions={<span className="cl-meta">{overview?.note}</span>}>
        <div className="cl-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
          <Tile label="Policy" value={<StatusBadge status={policyStatus} large />} freshness={policyFresh} onClick={() => go('policies')} />
          <Tile label="Runtime" value={<StatusBadge status={runtimeStatus} large />} freshness={runtimeFresh} onClick={() => go('runtime')} />
          <Tile label="CRE" value={<Badge tone="sim" large>SIMULATED</Badge>} freshness={creFresh} onClick={() => go('cre')} />
          <Tile label="ENS identity" value={<StatusBadge status={overview?.panels.identity?.value ? (overview.panels.identity.value.revoked ? 'REVOKED' : 'ACTIVE') : 'UNKNOWN'} large />} freshness={identityFresh} onClick={() => go('identity')} />
          <Tile label="Required adapters" value={<Badge tone={adaptersTotal > 0 && adaptersHealthy === adaptersTotal ? 'pass' : 'warn'} large>{adaptersHealthy} of {adaptersTotal} healthy</Badge>} freshness={runtimeFresh} onClick={() => go('integrations')} />
        </div>
        <p className="cl-meta" style={{ marginTop: 10 }}>
          The deployed revision is Blueprint r{deployment.blueprintRevision}.{' '}
          {(project.revisions.blueprint ?? 0) > deployment.blueprintRevision ? `Blueprint r${project.revisions.blueprint} exists but is not what is running — a newer revision never replaces the observed live one here. ` : ''}
          {state ? `${state.label.detail} ` : ''}
          {overview?.notLiveBecause.length ? `Not live because: ${overview.notLiveBecause.join('; ')}.` : ''}
        </p>
      </Section>

      {(position?.pending.length ?? 0) > 0 && position ? (
        <Section label="Waiting for a human">
          <EscalationPanel deploymentId={deployment.deploymentId} position={position} agentName={agent.ensName ?? agent.name} onChanged={() => void invalidate()} />
        </Section>
      ) : null}

      <Section label="Authority usage">
        <div className="cl-grid cl-grid-2">
          <Card>
            <KeyValue
              rows={[
                { label: 'Autonomous limit', value: summary.data?.summary.autonomous ?? (position ? `up to $${position.policy.autoLimitUsd.toLocaleString()} per action` : '—') },
                { label: 'Escalation band', value: summary.data?.summary.humanApproval ?? (position ? `$${position.policy.autoLimitUsd.toLocaleString()} – $${position.policy.escalationLimitUsd.toLocaleString()} · human approval required` : '—') },
                { label: 'Hard deny ceiling', value: <Badge tone="deny">{summary.data?.summary.hardDeny ?? (position ? `Above $${position.policy.escalationLimitUsd.toLocaleString()} — never permitted` : '—')}</Badge> },
                { label: 'Decisions so far', value: position ? `${position.decisions.length} · ${position.executions.length} executed · ${position.decisions.filter((d) => d.verdict === 'DENY').length} denied` : '—' },
                { label: 'Health floor / restore', value: position ? `${(position.policy.minHealthFactorBps / 10_000).toFixed(2)} / ${(position.policy.restoreHealthFactorBps / 10_000).toFixed(2)}` : '—' },
              ]}
            />
          </Card>
          <Card title="Market context" actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => void forkApi.tick(deployment.deploymentId).then(() => invalidate())}><RefreshCw size={11} aria-hidden />Observe now</button>}>
            <KeyValue
              rows={[
                { label: 'Fork block', value: latest ? `${latest.blockNumber} · ${new Date(latest.blockTimestampMs).toLocaleTimeString()}` : '—', mono: true },
                { label: 'ETH/USD (Chainlink feed on the fork)', value: latest ? `$${latest.ethUsd.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—', mono: true },
                { label: 'Vault', value: position ? `${position.vault.usdc?.toLocaleString(undefined, { maximumFractionDigits: 2 }) ?? '—'} USDC · ${position.vault.eth?.toFixed(4) ?? '—'} ETH` : '—' },
                { label: 'Snapshot', value: deployment.record.snapshot ? <span className="cl-row" style={{ gap: 6 }}>anchor {deployment.record.snapshot.anchorBlock} <BlockchainRef value={deployment.record.snapshot.snapshotHash} kind="hash" /></span> : 'not sealed' },
                { label: 'Access', value: <Badge tone="data">MAINNET · READ ONLY · forked locally</Badge> },
              ]}
            />
            <div style={{ marginTop: 12 }}><FreshnessBadge freshness={runtimeFresh} /></div>
          </Card>
        </div>
      </Section>

      {position && position.scenarios.length > 0 ? (
        <Section label="Positions the agent guards" actions={<span className="cl-meta">Stress controls are operator actions and are logged as such</span>}>
          <div className="cl-grid cl-grid-3">
            {position.scenarios.map((sc) => {
              const obs = latest?.protocols.find((p) => p.driverId === sc.driverId);
              return (
                <Card key={sc.driverId} title={sc.protocol} actions={obs?.healthBps != null ? <Badge tone={obs.healthBps < position.policy.minHealthFactorBps ? 'deny' : obs.healthBps < position.policy.targetHealthFactorBps ? 'warn' : 'pass'}>HF {(obs.healthBps / 10_000).toFixed(3)}</Badge> : <Badge tone="neutral">{sc.actionKind}</Badge>}>
                  <p className="cl-meta" style={{ whiteSpace: 'normal' }}>{obs?.detail ?? sc.detail}</p>
                  {obs ? <dl className="cl-kv" style={{ marginTop: 8 }}>{Object.entries(obs.metrics).slice(0, 4).map(([k, v]) => <div key={k} style={{ display: 'contents' }}><dt>{k}</dt><dd className="cl-mono">{typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 4 }) : String(v)}</dd></div>)}</dl> : null}
                  {sc.stressOptions.length > 0 ? (
                    <div className="cl-row cl-row-wrap" style={{ gap: 6, marginTop: 10 }}>
                      {sc.stressOptions.map((o) => (
                        <button key={o.id} type="button" className="cl-btn cl-btn-sm" disabled={stressing === sc.driverId} onClick={() => void stress(sc.driverId, o.id, o.kind === 'health-target' ? 13_000 : 1)} title={o.kind === 'health-target' ? 'Borrow more until the health factor reaches 1.30 — below the floor, so the agent should act' : 'Move one unit into the position'}>
                          <Zap size={11} aria-hidden />
                          {stressing === sc.driverId ? 'Stressing…' : o.label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </Card>
              );
            })}
          </div>
          {position.unexercisedActionKinds.length ? <p className="cl-meta" style={{ marginTop: 8 }}>No fork scenario yet for: {position.unexercisedActionKinds.join(', ')} — stated, not hidden.</p> : null}
        </Section>
      ) : null}

      <Section label="Live architecture" actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => go('architecture')}>Open Architecture</button>}>
        <Card>
          <div className="cl-row cl-row-wrap" style={{ gap: 6 }}>
            {[
              { label: 'Runtime', status: runtimeStatus },
              { label: 'Data', status: adaptersTotal > 0 && adaptersHealthy === adaptersTotal ? 'HEALTHY' : adaptersTotal > 0 ? 'DEGRADED' : 'UNKNOWN' },
              { label: 'CRE', status: 'SIMULATED' },
              { label: 'Policy', status: policyStatus },
              { label: 'Capability', status: policyStatus === 'ENABLED' ? 'READY' : 'NOT_ISSUED' },
              { label: 'Executor', status: policyStatus === 'ENABLED' ? 'READY' : 'BLOCKED' },
              ...(position?.scenarios.map((s) => ({ label: s.protocol, status: (latest?.protocols.find((p) => p.driverId === s.driverId) ? 'HEALTHY' : 'UNKNOWN') as Status })) ?? []),
            ].map((node, i, all) => (
              <span key={node.label} className="cl-row" style={{ gap: 6 }}>
                <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, padding: '8px 11px', border: '1px solid var(--cl-line)', background: 'var(--cl-panel-2)', minWidth: 0 }}>
                  <span className="cl-strong" style={{ fontSize: 12 }}>{node.label}</span>
                  <StatusBadge status={node.status} icon={false} />
                </span>
                {i < all.length - 1 ? <span className="cl-dim">→</span> : null}
              </span>
            ))}
          </div>
          <p className="cl-meta" style={{ marginTop: 10 }}>
            Observed state on the deployed path. {policyStatus !== 'ENABLED' ? 'With the policy disabled no capability can be executed, so nothing downstream of it can run.' : 'The policy is enabled: an ALLOW verdict executes on its own; an ESCALATE waits for a human; a DENY has no path.'}
          </p>
        </Card>
      </Section>

      <Section label="Recent decisions" actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => go('activity')}>Open Activity</button>}>
        <Card flush>
          <div className="cl-table-scroll">
            <table className="cl-table">
              <thead><tr><th style={{ width: 110 }}>Time</th><th style={{ width: 110 }}>Verdict</th><th>Action</th><th style={{ width: 110 }}>Amount</th><th style={{ width: 220 }}>Reason</th><th style={{ width: 130 }}>Execution</th></tr></thead>
              <tbody>
                {decisions.length === 0 ? <tr><td colSpan={6} className="cl-meta">No decisions yet. The runtime observes every few seconds and proposes only when a position needs it{policyStatus !== 'ENABLED' ? ' — and with the policy disabled every proposal is denied' : ''}.</td></tr> : null}
                {decisions.map((d) => (
                  <tr key={d.id} data-clickable="true" onClick={() => { setSelection({ kind: 'decision', id: d.id, label: d.action }); go('activity', `&correlation=${encodeURIComponent(d.correlationId)}`); }}>
                    <td className="cl-meta"><TimeAgo iso={d.at} /></td>
                    <td><VerdictBadge verdict={d.verdict} /></td>
                    <td>{d.action}</td>
                    <td className="cl-mono">{d.amount}</td>
                    <td>{d.reasonCode ? <ReasonCode code={d.reasonCode} verdict={d.verdict} onOpenPolicy={() => go('policies')} /> : d.reason}</td>
                    <td><StatusBadge status={d.executionResult} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <SecurityConfirmation
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        onConfirm={() => { setDisableOpen(false); void issue('DISABLE_POLICY'); }}
        action="Disable financial authority"
        currentState={<StatusBadge status={policyStatus} />}
        requestedState={<StatusBadge status="DISABLED" />}
        network={project.environment.executionNetwork}
        resource={deployment.record.contracts ? <BlockchainRef label="Policy Registry" value={deployment.record.contracts.ContextLockPolicyRegistry ?? ''} local /> : 'Policy Registry'}
        extraRows={[
          { label: 'Signer', value: 'the deployment’s deployer role (policy admin), held by the Studio server for this fork' },
          { label: 'Verification', value: 'isPolicyEnabled is read back from the fork before the state is shown as DISABLED' },
        ]}
        consequence="No capability can be executed once the policy reads DISABLED. The runtime keeps observing; every proposal is denied. This is the financial kill switch — pausing the runtime is not."
        actionLabel="Disable Financial Authority"
        busy={pending === 'DISABLING'}
      />

      <EmergencyConfirmation
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onConfirm={() => void emergency()}
        steps={EMERGENCY_STEPS}
        revokeEns={revokeEns}
        onRevokeEnsChange={setRevokeEns}
        busy={command.isPending}
      />
    </StudioPage>
  );
}

function Tile({ label, value, freshness, onClick }: { label: string; value: React.ReactNode; freshness: Freshness; onClick: () => void }) {
  return (
    <button type="button" className="cl-card" style={{ textAlign: 'left', padding: 0, cursor: 'pointer' }} onClick={onClick}>
      <div className="cl-card-body">
        <div className="cl-label" style={{ marginBottom: 8 }}>{label}</div>
        {value}
        <div style={{ marginTop: 10 }}><FreshnessBadge freshness={freshness} compact /></div>
      </div>
    </button>
  );
}
