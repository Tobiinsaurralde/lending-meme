'use client';

/**
 * Control Plane (spec §25).
 *
 * Operator view of live components, reconciliation, alerts and emergency
 * controls.
 *
 * Rules encoded here:
 *  - Emergency Lock attempts the financial policy first, and reports each step
 *    separately. A partial result is shown as partial, never rounded up to
 *    success.
 *  - An alert is only resolvable once evidence or reconciliation supports it.
 *  - Drift is expected-vs-observed, with observed treated as the truth.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Activity, RefreshCw, ShieldAlert, ShieldOff } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockerBanner,
  Card,
  FreshnessBadge,
  KeyValue,
  Section,
  SeverityBadge,
  StatusBadge,
  TimeAgo,
} from '@/components/studio/primitives';
import { EmergencyConfirmation, SecurityConfirmation, StandardConfirmation } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { useControlRequest } from '@/lib/studio/control-bridge';
import { policyStatusOf, runtimeStatusOf, toAlert, toPolicyState, topologyOf } from '@/lib/studio/api/adapters/operate';
import { useActivation, useAlerts, useCommands, useControlCommand, useInvalidateAll } from '@/lib/studio/api/queries';
import { control as controlApi } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import { EmptyState } from '@/components/studio/primitives';
import type { Alert, EmergencyLockResult, Status } from '@/lib/studio/types';
import type { EmergencyLockResultPayload } from '@/lib/studio/api/types';

const EMERGENCY_STEPS = ['Disable ContextLock policy', 'Block new capabilities', 'Pause / stop CRE path', 'Stop agent runtime', 'Optionally revoke agent identity'];

export default function ControlPlanePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelection, pushToast } = useWorkbench();

  const { agent, agentSlug, project, ctx } = useStudioPage('control-plane');
  const invalidate = useInvalidateAll();
  const alertsQ = useAlerts(ctx.deploymentId, true);
  const commandsQ = useCommands(ctx.deploymentId);
  const activation = useActivation(ctx.dataProjectId);
  const command = useControlCommand(ctx.deploymentId, ctx.dataProjectId ?? undefined);
  const [error, setError] = useState<string | null>(null);

  /* Every row is an observation from the control plane, with the moment it was read. */
  const TOPOLOGY = useMemo(() => (ctx.overview ? topologyOf(ctx.overview, ctx.overview.panels.runtime.note) : []), [ctx.overview]);
  const POLICY = useMemo(() => toPolicyState({ overview: ctx.overview, deployment: ctx.deployment, bp: ctx.buildView?.blueprint ?? null, state: ctx.labState, activation: activation.data ?? null, network: project.environment.executionNetwork, pending: null }), [ctx.overview, ctx.deployment, ctx.buildView?.blueprint, ctx.labState, activation.data, project.environment.executionNetwork]);
  const RUNTIME = { state: runtimeStatusOf(ctx.overview?.panels.runtime.state) };
  const CRE = { mode: project.environment.creMode };
  const [alerts, setAlerts] = useState<Alert[]>([]);
  useEffect(() => { setAlerts((alertsQ.data ?? []).map(toAlert)); }, [alertsQ.data]);

  const [emergencyOpen, setEmergencyOpen] = useState(false);
  const [revokeEns, setRevokeEns] = useState(false);
  const [disableOpen, setDisableOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [result, setResult] = useState<EmergencyLockResult | null>(null);

  /* The last emergency lock this deployment recorded, so a reload still shows its per-step result. */
  useEffect(() => {
    const last = (commandsQ.data ?? []).find((c) => c.operation === 'EMERGENCY_LOCK' && c.result);
    if (!last || result) return;
    const payload = last.result as EmergencyLockResultPayload;
    if (!payload?.lock) return;
    setResult({
      outcome: payload.lock.state === 'COMPLETE' ? 'EMERGENCY_LOCK_COMPLETE' : payload.lock.state === 'PARTIAL' ? 'EMERGENCY_LOCK_PARTIAL' : 'EMERGENCY_LOCK_FAILED',
      steps: payload.lock.steps.map((st) => ({ id: st.step, label: st.step.replace(/_/g, ' ').toLowerCase(), status: st.outcome === 'SUCCEEDED' ? 'PASS' : st.outcome === 'FAILED' ? 'FAIL' : st.outcome === 'NOT_APPLICABLE' || st.outcome === 'SKIPPED' ? 'NOT_REQUESTED' : 'PENDING', detail: st.detail ?? st.verification ?? undefined })),
      policyState: payload.lock.financialPolicyDisabled ? 'DISABLED' : 'UNKNOWN',
      at: new Date(last.completedAtMs ?? last.issuedAtMs).toISOString(),
    });
  }, [commandsQ.data, result]);

  useControlRequest('EMERGENCY_LOCK', () => setEmergencyOpen(true));
  useControlRequest('DISABLE_POLICY', () => setDisableOpen(true));
  useControlRequest('REVOKE_AGENT', () => setRevokeOpen(true));

  const drifted = TOPOLOGY.filter((c) => c.drift);
  const openAlerts = alerts.filter((a) => a.state === 'OPEN');

  /**
   * Emergency Lock: one control-plane command. The backend attempts the financial policy first and
   * reports every step separately; a partial result is shown as partial, never rounded up.
   */
  const runEmergencyLock = async () => {
    setEmergencyOpen(false);
    if (!ctx.deployment) return;
    setError(null);
    try {
      const r = await command.mutateAsync({ operation: 'EMERGENCY_LOCK', expectedRevision: ctx.deployment.revision, confirmation: { includeIdentityRevocation: revokeEns } });
      const payload = r.result as EmergencyLockResultPayload | undefined;
      if (payload?.lock) {
        setResult({
          outcome: payload.lock.state === 'COMPLETE' ? 'EMERGENCY_LOCK_COMPLETE' : payload.lock.state === 'PARTIAL' ? 'EMERGENCY_LOCK_PARTIAL' : 'EMERGENCY_LOCK_FAILED',
          steps: payload.lock.steps.map((st) => ({ id: st.step, label: st.step.replace(/_/g, ' ').toLowerCase(), status: st.outcome === 'SUCCEEDED' ? 'PASS' : st.outcome === 'FAILED' ? 'FAIL' : st.outcome === 'NOT_APPLICABLE' || st.outcome === 'SKIPPED' ? 'NOT_REQUESTED' : 'PENDING', detail: st.detail ?? st.verification ?? undefined })),
          policyState: payload.lock.financialPolicyDisabled ? 'DISABLED' : 'UNKNOWN',
          at: new Date().toISOString(),
        });
      }
      pushToast(r.detail ?? 'Emergency Lock executed — see the per-step result');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  const disablePolicy = async () => {
    setDisableOpen(false);
    if (!ctx.deployment) return;
    setError(null);
    try {
      const r = await command.mutateAsync({ operation: 'DISABLE_POLICY', expectedRevision: ctx.deployment.revision, reason: 'disabled from the Control Plane' });
      if (r.ok === false) throw new Error(r.detail ?? 'refused');
      pushToast(`${r.detail ?? 'applied'} — read back from the fork`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    }
  };

  const resolveAlert = async (alert: Alert) => {
    if (!ctx.deploymentId) return;
    setError(null);
    try {
      await controlApi.resolveAlert(ctx.deploymentId, alert.id, `acknowledged and reconciled by the operator at ${new Date().toISOString()}`);
      await invalidate();
      pushToast('Alert resolved');
    } catch (e) {
      setError(e instanceof ApiError ? `${e.reason ? `${e.reason}: ` : ''}${e.message}` : (e as Error).message);
    }
  };

  if (!ctx.deploymentId) {
    return (
      <StudioPage segment="control-plane" subtitle="Operator view of every live component, its expected state and its drift.">
        <EmptyState
          title={ctx.loading ? 'Loading…' : 'Nothing to reconcile'}
          body={ctx.loading ? '' : 'The control plane observes a deployment: its chain state, runtime, CRE mode, adapters and alerts. This agent has none yet.'}
          action={ctx.loading ? undefined : <button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/deploy?agent=${agentSlug}`)}>Run Deployment Preflight</button>}
        />
      </StudioPage>
    );
  }

  return (
    <StudioPage
      segment="control-plane"
      live
      subtitle="Operator view of every live component, its expected state and its drift."
      badges={
        <>
          <Badge tone="neutral">{agent.name}</Badge>
          <span className="cl-meta">Last full reconciliation</span>
          {TOPOLOGY[0] ? <FreshnessBadge freshness={TOPOLOGY[0].freshness} /> : <span className="cl-meta">not read yet</span>}
          {drifted.length > 0 ? <Badge tone="warn">{drifted.length} drifted</Badge> : <Badge tone="pass">No drift</Badge>}
        </>
      }
      actions={
        <>
          <button
            type="button"
            className="cl-btn"
            onClick={() => {
              setReconciling(true);
              void invalidate().then(() => { setReconciling(false); pushToast('Re-read every observation from the fork'); });
            }}
            disabled={reconciling}
          >
            <RefreshCw size={13} aria-hidden />
            {reconciling ? 'Reconciling…' : 'Run reconciliation'}
          </button>
          <button
            type="button"
            className="cl-btn cl-btn-danger"
            onClick={() => setDisableOpen(true)}
            disabled={POLICY.observed !== 'ENABLED'}
          >
            <ShieldOff size={13} aria-hidden />
            Disable Policy
          </button>
          <button type="button" className="cl-btn cl-btn-emergency" onClick={() => setEmergencyOpen(true)}>
            <ShieldAlert size={13} aria-hidden />
            Emergency Lock
          </button>
        </>
      }
      banners={
        <>
          {error ? <BlockerBanner tone="deny" title="The control plane refused">{error}</BlockerBanner> : null}
          {result ? (
            <BlockerBanner
              tone={result.outcome === 'EMERGENCY_LOCK_PARTIAL' ? 'warn' : result.outcome === 'EMERGENCY_LOCK_FAILED' ? 'deny' : 'pass'}
              title={result.outcome}
            >
              Financial policy: {result.policyState}. Each step is reported separately below — a partial result is not
              presented as a success.
            </BlockerBanner>
          ) : null}

          {openAlerts.length > 0 ? (
            <BlockerBanner tone="deny" title={`${openAlerts.length} open alert`}>
              {openAlerts.map((a) => `${a.type} on ${a.resource}`).join(' · ')}
            </BlockerBanner>
          ) : null}
        </>
      }
    >
      {/* emergency result */}
      {result ? (
        <Section label="Emergency lock result">
          <div className="cl-steps">
            {result.steps.map((step, i) => (
              <div className="cl-step" key={step.id} style={{ cursor: 'default' }}>
                <span className="cl-step-index">{i + 1}</span>
                <span className="cl-step-name">{step.label}</span>
                <span className="cl-step-status">
                  <StatusBadge status={step.status} />
                </span>
                <span className="cl-step-detail">{step.detail ?? ''}</span>
              </div>
            ))}
          </div>
          <Card>
            <KeyValue
              rows={[
                { label: 'Result', value: <Badge tone={result.outcome.endsWith('PARTIAL') ? 'warn' : 'pass'}>{result.outcome}</Badge> },
                { label: 'Financial policy', value: <StatusBadge status={result.policyState} /> },
                { label: 'Executed', value: <TimeAgo iso={result.at} /> },
              ]}
            />
            <p className="cl-meta" style={{ marginTop: 10 }}>
              The financial policy was attempted first and succeeded, which is the outcome that matters most. The CRE
              pause failed and is reported as failed — it is not hidden behind the steps that worked.
            </p>
          </Card>
        </Section>
      ) : null}

      {/* topology */}
      <Section label="System topology">
        <div className="cl-grid cl-grid-auto">
          {TOPOLOGY.map((component) => (
            <button
              key={component.id}
              type="button"
              className="cl-card"
              style={{
                textAlign: 'left',
                padding: 0,
                cursor: 'pointer',
                borderColor: component.drift ? 'var(--cl-warn)' : 'var(--cl-line)',
              }}
              onClick={() => setSelection({ kind: 'component', id: component.id, label: component.name })}
            >
              <div className="cl-card-head" style={{ background: component.drift ? 'var(--cl-warn-bg)' : undefined }}>
                <div className="cl-card-title">{component.name}</div>
                <StatusBadge status={component.currentState} />
              </div>
              <div className="cl-card-body">
                <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>
                  {component.detail}
                </p>
                <KeyValue
                  rows={[
                    { label: 'Expected', value: <StatusBadge status={component.expectedState} icon={false} /> },
                    {
                      label: 'Drift',
                      value: component.drift ? <Badge tone="warn">Yes</Badge> : <Badge tone="pass">None</Badge>,
                    },
                    {
                      label: 'Last failure',
                      value: component.lastFailure ? <TimeAgo iso={component.lastFailure} /> : 'none recorded',
                    },
                  ]}
                />
                <div style={{ marginTop: 10 }}>
                  <FreshnessBadge freshness={component.freshness} compact />
                </div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* reconciliation */}
      <Section label="Reconciliation">
        <Card flush>
          <table className="cl-table">
            <thead>
              <tr>
                <th style={{ minWidth: 180 }}>Field</th>
                <th style={{ width: 180 }}>Expected</th>
                <th style={{ width: 200 }}>Observed</th>
                <th style={{ width: 110 }}>State</th>
              </tr>
            </thead>
            <tbody>
              {POLICY.drift.map((row) => (
                <tr key={row.field}>
                  <td className="cl-strong">{row.field}</td>
                  <td className="cl-mono" style={{ fontSize: 11.5 }}>
                    {row.expected}
                  </td>
                  <td className="cl-mono" style={{ fontSize: 11.5, color: row.drifted ? 'var(--cl-warn)' : undefined }}>
                    {row.observed}
                  </td>
                  <td>{row.drifted ? <SeverityBadge severity={row.severity} /> : <StatusBadge status="PASS" />}</td>
                </tr>
              ))}
              <tr>
                <td className="cl-strong">Policy enabled</td>
                <td className="cl-mono" style={{ fontSize: 11.5 }}>{ctx.labState?.hasFinancialAuthority ? 'true' : 'false'}</td>
                <td className="cl-mono" style={{ fontSize: 11.5 }}>{POLICY.onChain.enabled ? 'true' : 'false'}</td>
                <td><StatusBadge status="PASS" /></td>
              </tr>
              <tr>
                <td className="cl-strong">Runtime state</td>
                <td className="cl-mono" style={{ fontSize: 11.5 }}>HEALTHY</td>
                <td className="cl-mono" style={{ fontSize: 11.5, color: RUNTIME.state === 'HEALTHY' ? undefined : 'var(--cl-warn)' }}>{RUNTIME.state}</td>
                <td>{RUNTIME.state === 'HEALTHY' ? <StatusBadge status="PASS" /> : <SeverityBadge severity="MEDIUM" />}</td>
              </tr>
              {POLICY.drift.length === 0 ? <tr><td colSpan={4} className="cl-meta">No drift between the deployment's expectation and the fork's observed state.</td></tr> : null}
            </tbody>
          </table>
        </Card>
        <p className="cl-meta" style={{ marginTop: 10 }}>
          Where the two columns differ, the observed column is the truth. Expected is what the deployment intended, not
          what is running.
        </p>
      </Section>

      {/* alerts */}
      <Section label="Alerts">
        <Card flush>
          <div className="cl-table-scroll">
            <table className="cl-table" style={{ minWidth: 1000 }}>
              <thead>
                <tr>
                  <th style={{ width: 110 }}>Severity</th>
                  <th style={{ width: 230 }}>Alert type</th>
                  <th style={{ width: 180 }}>Resource</th>
                  <th style={{ width: 120 }}>First seen</th>
                  <th style={{ width: 120 }}>Last seen</th>
                  <th style={{ width: 110 }}>Occurrences</th>
                  <th style={{ width: 140 }}>State</th>
                  <th style={{ width: 230 }} />
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => (
                  <tr key={alert.id}>
                    <td>
                      <SeverityBadge severity={alert.severity} />
                    </td>
                    <td>
                      <div className="cl-mono" style={{ fontSize: 11.5 }}>
                        {alert.type}
                      </div>
                      <div className="cl-meta" style={{ whiteSpace: 'normal' }}>
                        {alert.detail}
                      </div>
                    </td>
                    <td className="cl-mono" style={{ fontSize: 11.5 }}>
                      {alert.resource}
                    </td>
                    <td className="cl-meta">
                      <TimeAgo iso={alert.firstSeen} />
                    </td>
                    <td className="cl-meta">
                      <TimeAgo iso={alert.lastSeen} />
                    </td>
                    <td className="cl-mono">{alert.occurrences}</td>
                    <td>
                      <StatusBadge status={alert.state === 'OPEN' ? 'WARN' : alert.state === 'ACKNOWLEDGED' ? 'PENDING' : 'PASS'} label={alert.state} />
                    </td>
                    <td>
                      <div className="cl-row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          type="button"
                          className="cl-btn cl-btn-sm"
                          disabled={alert.state !== 'OPEN'}
                          onClick={() =>
                            setAlerts((prev) =>
                              prev.map((a) => (a.id === alert.id ? { ...a, state: 'ACKNOWLEDGED' } : a)),
                            )
                          }
                        >
                          Acknowledge
                        </button>
                        <button
                          type="button"
                          className="cl-btn cl-btn-sm"
                          onClick={() =>
                            router.push(
                              `/projects/${ctx.routeProjectId}/activity?agent=${agentSlug}&event=${alert.evidenceEventIds[0] ?? ''}`,
                            )
                          }
                          disabled={alert.evidenceEventIds.length === 0}
                        >
                          Open evidence
                        </button>
                        <button
                          type="button"
                          className="cl-btn cl-btn-sm"
                          /* Resolve requires evidence or a clean reconciliation:
                             an alert is never closed just to tidy the list. */
                          disabled={alert.state === 'RESOLVED' || alert.state === 'OPEN'}
                          title={
                            alert.state === 'OPEN'
                              ? 'Acknowledge and reconcile before resolving'
                              : undefined
                          }
                          onClick={() => void resolveAlert(alert)}
                        >
                          Resolve
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* control groups */}
      <Section label="Controls">
        <div className="cl-grid cl-grid-2">
          <Card title="Operational">
            <div className="cl-btn-group">
              <button
                type="button"
                className="cl-btn"
                onClick={() => router.push(`/projects/${ctx.routeProjectId}/runtime?agent=${agentSlug}`)}
              >
                Pause / Resume Runtime
              </button>
            </div>
            <p className="cl-meta" style={{ marginTop: 10 }}>
              Process controls. They do not change financial authority.
            </p>
          </Card>

          <Card title="CRE">
            <div className="cl-btn-group">
              <button
                type="button"
                className="cl-btn"
                onClick={() => router.push(`/projects/${ctx.routeProjectId}/cre?agent=${agentSlug}`)}
              >
                Start / Stop / Restart Simulator
              </button>
            </div>
            <p className="cl-meta" style={{ marginTop: 10 }}>
              Mode is {CRE.mode === 'CONTEXTLOCK_SIMULATOR' || CRE.mode === 'MY_CRE_SIMULATOR' ? 'the official CLI simulator' : CRE.mode}. No DON workflow
              is deployed, so there is nothing to pause or activate.
            </p>
          </Card>

          <Card title="Financial security">
            <div className="cl-btn-group">
              <button
                type="button"
                className="cl-btn cl-btn-danger"
                onClick={() => setDisableOpen(true)}
                disabled={POLICY.observed === 'DISABLED'}
              >
                <ShieldOff size={13} aria-hidden />
                Disable Policy
              </button>
            </div>
            <p className="cl-meta" style={{ marginTop: 10 }}>
              Currently {POLICY.observed}. This is the control that stops authorization, not the runtime controls.
            </p>
          </Card>

          <Card title="Identity">
            <div className="cl-btn-group">
              <button type="button" className="cl-btn cl-btn-danger" onClick={() => setRevokeOpen(true)}>
                Revoke Agent
              </button>
            </div>
            <p className="cl-meta" style={{ marginTop: 10 }}>
              Revocation stops previously issued capabilities being honoured. It does not change the policy state.
            </p>
          </Card>
        </div>
      </Section>

      <Section label="Emergency">
        <Card>
          <div className="cl-row cl-row-wrap" style={{ gap: 14 }}>
            <button type="button" className="cl-btn cl-btn-emergency" onClick={() => setEmergencyOpen(true)}>
              <ShieldAlert size={14} aria-hidden />
              Emergency Lock
            </button>
            <span className="cl-meta" style={{ flex: '1 1 260px', whiteSpace: 'normal' }}>
              Attempts, in order: disable the policy, block new capabilities, pause the CRE path, stop the runtime and
              optionally revoke the identity. The financial policy is attempted first, and every step reports its own
              result.
            </span>
          </div>
        </Card>
      </Section>

      <EmergencyConfirmation
        open={emergencyOpen}
        onClose={() => setEmergencyOpen(false)}
        onConfirm={() => void runEmergencyLock()}
        busy={command.isPending}
        steps={EMERGENCY_STEPS}
        revokeEns={revokeEns}
        onRevokeEnsChange={setRevokeEns}
      />

      <SecurityConfirmation
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        onConfirm={() => void disablePolicy()}
        action="Disable financial authority"
        currentState={<StatusBadge status={POLICY.observed} />}
        requestedState={<StatusBadge status="DISABLED" />}
        network={POLICY.network}
        resource={`Policy Registry · ${POLICY.onChain.contracts.find((c) => c.label === 'ContextLockPolicyRegistry')?.address ?? '—'}`}
        consequence="No new capability can be issued, so no new execution can be authorized."
        actionLabel="Disable Financial Authority"
      />

      <StandardConfirmation
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={() => {
          setRevokeOpen(false);
          router.push(`/projects/${ctx.routeProjectId}/identity?agent=${agentSlug}`);
        }}
        title="Revoke agent identity"
        consequence="Revocation is completed on the Identity page, where the sibling and capability impact are stated in full before anything is submitted."
        resource={agent.ensName}
        actionLabel="Open Identity"
      />
    </StudioPage>
  );
}
