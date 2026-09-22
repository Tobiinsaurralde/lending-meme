'use client';

/**
 * Policies (spec §23).
 *
 * View and safely revise the current ContextLock financial authority state.
 *
 * Rules encoded here:
 *  - The header reports the *observed* chain state with its freshness. A
 *    successful submission is never treated as proof of on-chain state.
 *  - After a disable is submitted the UI reads DISABLING until a fresh chain
 *    read proves the new state.
 *  - Enable is stricter than disable: every precondition must pass, and the
 *    dialog lists them with their real status.
 */
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GitCompare, Play, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockchainRef,
  BlockerBanner,
  Card,
  FreshnessBadge,
  KeyValue,
  Section,
  SeverityBadge,
  StatusBadge,
  VerdictBadge,
} from '@/components/studio/primitives';
import { Modal, SecurityConfirmation } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { useControlRequest } from '@/lib/studio/control-bridge';
import { toPolicyState } from '@/lib/studio/api/adapters/operate';
import { useActivation, useControlCommand, useInvalidateAll } from '@/lib/studio/api/queries';
import { ApiError } from '@/lib/studio/api/client';
import { EmptyState } from '@/components/studio/primitives';
import type { Status } from '@/lib/studio/types';

export default function PoliciesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast, selection, setSelection } = useWorkbench();

  const { agent, agentSlug, project, ctx } = useStudioPage('policies');
  const invalidate = useInvalidateAll();
  const activation = useActivation(ctx.dataProjectId);
  const command = useControlCommand(ctx.deploymentId, ctx.dataProjectId ?? undefined);

  const [transitional, setTransitional] = useState<'ENABLING' | 'DISABLING' | null>(null);
  const [disableOpen, setDisableOpen] = useState(false);
  const [enableOpen, setEnableOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* The observed state comes from the control plane's fresh read of the fork's registry — every render. */
  const POLICY = useMemo(
    () => toPolicyState({ overview: ctx.overview, deployment: ctx.deployment, bp: ctx.buildView?.blueprint ?? null, state: ctx.labState, activation: activation.data ?? null, network: project.environment.executionNetwork, pending: transitional }),
    [ctx.overview, ctx.deployment, ctx.buildView?.blueprint, ctx.labState, activation.data, project.environment.executionNetwork, transitional],
  );
  const observed: Status = POLICY.observed;

  useControlRequest('DISABLE_POLICY', () => setDisableOpen(true));
  useControlRequest('ACTIVATE_TESTNET_POLICY', () => setEnableOpen(true));

  const failingPreconditions = POLICY.enablePreconditions.filter((p) => p.status !== 'PASS');
  const canEnable = failingPreconditions.length === 0 && !!ctx.deploymentId && observed !== 'ENABLED';
  const drifted = POLICY.drift.filter((d) => d.drifted);

  const refreshChainState = async () => {
    setRefreshing(true);
    await invalidate();
    setRefreshing(false);
    pushToast('Chain state re-read from the fork');
  };

  /**
   * Issue the command and wait for the fresh read. The backend enables or disables the policy with the
   * deployer role, then reads `isPolicyEnabled` back before it answers — so the state the page shows
   * after this is a chain read, not the submission.
   */
  const setPolicy = async (op: 'ENABLE_POLICY' | 'DISABLE_POLICY') => {
    if (!ctx.deployment) return;
    setError(null);
    setTransitional(op === 'ENABLE_POLICY' ? 'ENABLING' : 'DISABLING');
    try {
      const r = await command.mutateAsync({ operation: op, expectedRevision: ctx.deployment.revision, reason: `${op} from the Policies page` });
      if (r.ok === false) throw new Error(r.detail ?? 'the control plane refused');
      pushToast(`${r.detail ?? 'applied'} — ${(r.result as { verification?: string } | undefined)?.verification ?? 'read back from the fork'}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setTransitional(null);
    }
  };

  if (!ctx.deploymentId) {
    return (
      <StudioPage segment="policies" title="ContextLock Policy" subtitle="The deterministic financial authority boundary for this agent.">
        <EmptyState
          title={ctx.loading ? 'Loading…' : 'No policy is registered on chain yet'}
          body={ctx.loading ? '' : 'The policy is registered — DISABLED — when the agent is deployed. Until then the authority model lives in the Blueprint and is reviewed on the Permissions page.'}
          action={ctx.loading ? undefined : <div className="cl-row" style={{ gap: 8 }}><button type="button" className="cl-btn" onClick={() => router.push(`/projects/${ctx.routeProjectId}/security?agent=${agentSlug}`)}>Open Permissions</button><button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/deploy?agent=${agentSlug}`)}>Run Deployment Preflight</button></div>}
        />
      </StudioPage>
    );
  }

  return (
    <StudioPage
      segment="policies"
      live
      title="ContextLock Policy"
      subtitle="The deterministic financial authority boundary for this agent."
      badges={
        <>
          <Badge tone="neutral">{agent.name}</Badge>
          <span className="cl-row" style={{ gap: 7 }}>
            <span className="cl-meta">Observed:</span>
            <StatusBadge status={transitional ?? observed} large />
          </span>
          <FreshnessBadge freshness={POLICY.onChain.freshness} />
          <Badge tone="neutral">Policy version {POLICY.version}</Badge>
          <Badge tone="sim">{POLICY.network}</Badge>
        </>
      }
      actions={
        <>
          <button type="button" className="cl-btn" onClick={() => void refreshChainState()} disabled={refreshing}>
            <RefreshCw size={13} aria-hidden />
            {refreshing ? 'Reading…' : 'Refresh Chain State'}
          </button>
          <button
            type="button"
            className="cl-btn"
            onClick={() => router.push(`/projects/${ctx.routeProjectId}/blueprint?agent=${agentSlug}`)}
          >
            Create Policy Revision
          </button>
          <button type="button" className="cl-btn" onClick={() => setCompareOpen(true)}>
            <GitCompare size={13} aria-hidden />
            Compare Policy
          </button>
          <button
            type="button"
            className="cl-btn"
            onClick={() => router.push(`/projects/${ctx.routeProjectId}/simulation?agent=${agentSlug}&group=policy-boundaries`)}
          >
            <Play size={13} aria-hidden />
            Run Policy Simulations
          </button>
          {observed === 'ENABLED' ? (
            <button type="button" className="cl-btn cl-btn-danger" onClick={() => setDisableOpen(true)}>
              <ShieldOff size={13} aria-hidden />
              Disable Policy
            </button>
          ) : (
            <button
              type="button"
              className="cl-btn cl-btn-primary"
              onClick={() => setEnableOpen(true)}
              disabled={!canEnable || transitional !== null}
              title={
                canEnable
                  ? undefined
                  : `Blocked: ${failingPreconditions.map((p) => p.label).join(', ')}`
              }
            >
              <ShieldCheck size={13} aria-hidden />
              Enable Policy
            </button>
          )}
        </>
      }
      banners={
        <>
          {error ? <BlockerBanner tone="deny" title="The control plane refused">{error}</BlockerBanner> : null}
          {transitional ? (
            <BlockerBanner
              tone="warn"
              title={`${transitional} — awaiting confirmation`}
              actions={
                <button type="button" className="cl-btn cl-btn-sm" onClick={refreshChainState} disabled={refreshing}>
                  Refresh Chain State
                </button>
              }
            >
              The transaction was submitted. This still reads {transitional} rather than the requested state, because a
              successful submission is not proof of on-chain state — only a fresh chain read is.
            </BlockerBanner>
          ) : null}

          {!canEnable && observed !== 'ENABLED' ? (
            <BlockerBanner tone="blocked" title="Enable Policy is unavailable">
              {failingPreconditions.length} precondition
              {failingPreconditions.length === 1 ? '' : 's'} not met:{' '}
              {failingPreconditions.map((p) => p.label).join(', ')}. Financial authority is not enabled while any of
              them fails.
            </BlockerBanner>
          ) : null}

          {drifted.length > 0 ? (
            <BlockerBanner
              tone="warn"
              title={`${drifted.length} field has drifted from the deployment's expectation`}
              actions={
                <button
                  type="button"
                  className="cl-btn cl-btn-sm"
                  onClick={() => router.push(`/projects/${ctx.routeProjectId}/control-plane?agent=${agentSlug}`)}
                >
                  Open Control Plane
                </button>
              }
            >
              {drifted.map((d) => `${d.field}: expected ${d.expected}, observed ${d.observed}`).join(' · ')}
            </BlockerBanner>
          ) : null}
        </>
      }
    >
      {/* authority matrix */}
      <Section label="Current authority matrix">
        <Card flush>
          <div className="cl-table-scroll">
            <table className="cl-table" style={{ minWidth: 1040 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 190 }}>Action</th>
                  <th style={{ width: 160 }}>Limit</th>
                  <th style={{ width: 180 }}>Recipients</th>
                  <th style={{ width: 140 }}>Targets</th>
                  <th style={{ width: 180 }}>Trust / freshness</th>
                  <th style={{ width: 190 }}>Expiry / nonce</th>
                  <th style={{ width: 170 }}>Escalation</th>
                  <th style={{ width: 120 }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {POLICY.matrix.map((row, i) => (
                  <tr
                    key={`${row.action}-${i}`}
                    data-clickable="true"
                    data-selected={selection?.id === `${row.action}-${i}`}
                    onClick={() =>
                      setSelection({ kind: 'policy-rule', id: `${row.action}-${i}`, label: row.action })
                    }
                  >
                    <td className="cl-strong">{row.action}</td>
                    <td>{row.limit}</td>
                    <td className="cl-meta">{row.recipients}</td>
                    <td className="cl-mono" style={{ fontSize: 11.5 }}>
                      {row.targets}
                    </td>
                    <td className="cl-meta">{row.trustFreshness}</td>
                    <td className="cl-meta">{row.expiryNonce}</td>
                    <td className="cl-meta">{row.escalation}</td>
                    <td>
                      <VerdictBadge verdict={row.verdict} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      <div className="cl-grid cl-grid-2">
        {/* on-chain state */}
        <Section label="On-chain state">
          <Card>
            <KeyValue
              rows={[
                { label: 'Enabled', value: <StatusBadge status={transitional ?? observed} /> },
                { label: 'Policy hash', value: <BlockchainRef value={POLICY.onChain.policyHash} kind="hash" /> },
                {
                  label: 'Admin',
                  value: <BlockchainRef value={POLICY.onChain.admin} network={POLICY.network} />,
                },
                ...POLICY.onChain.contracts.map((contract) => ({
                  label: contract.label,
                  value: <BlockchainRef value={contract.address} network={POLICY.network} />,
                })),
                { label: 'Last verified block', value: POLICY.onChain.lastVerifiedBlock.toLocaleString('en-US'), mono: true },
              ]}
            />
            <div style={{ marginTop: 12 }}>
              <FreshnessBadge freshness={POLICY.onChain.freshness} />
            </div>
          </Card>
        </Section>

        {/* drift */}
        <Section label="Drift">
          <Card flush>
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th style={{ width: 150 }}>Expected</th>
                  <th style={{ width: 170 }}>Observed</th>
                  <th style={{ width: 100 }}>Drift</th>
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
              </tbody>
            </table>
          </Card>
        </Section>
      </div>

      {/* preconditions */}
      <Section label="Enable preconditions">
        <div className="cl-path">
          {POLICY.enablePreconditions.map((precondition) => (
            <div className="cl-path-step" key={precondition.id}>
              <span className="cl-path-step-name">{precondition.label}</span>
              <StatusBadge status={precondition.status} />
              <span className="cl-path-step-detail">{precondition.detail}</span>
            </div>
          ))}
        </div>
        <p className="cl-meta" style={{ marginTop: 10 }}>
          Enabling financial authority is stricter than disabling it. Every precondition must pass; disabling has no
          preconditions at all, because reducing authority is always permitted.
        </p>
      </Section>

      {/* disable */}
      <SecurityConfirmation
        open={disableOpen}
        onClose={() => setDisableOpen(false)}
        onConfirm={() => {
          setDisableOpen(false);
          void setPolicy('DISABLE_POLICY');
        }}
        action="Disable financial authority"
        currentState={<StatusBadge status={observed} />}
        requestedState={<StatusBadge status="DISABLED" />}
        network={POLICY.network}
        resource={<BlockchainRef label="Policy Registry" value={POLICY.onChain.contracts.find((c) => c.label === 'ContextLockPolicyRegistry')?.address ?? ''} network={POLICY.network} local />}
        extraRows={[
          { label: 'Signer', value: <BlockchainRef value={POLICY.onChain.admin} network={POLICY.network} /> },
          { label: 'Estimated gas', value: '~48,200 · ~0.00007 SepoliaETH' },
        ]}
        consequence="No new capability can be issued, so no new execution can be authorized. Capabilities already issued remain valid until they expire."
        actionLabel="Disable Financial Authority"
      />

      {/* enable — stricter */}
      <SecurityConfirmation
        open={enableOpen}
        onClose={() => setEnableOpen(false)}
        onConfirm={() => {
          setEnableOpen(false);
          void setPolicy('ENABLE_POLICY');
        }}
        action="Enable testnet financial authority"
        currentState={<StatusBadge status={observed} />}
        requestedState={<StatusBadge status="ENABLED" />}
        network={POLICY.network}
        resource={<BlockchainRef label="Policy Registry" value={POLICY.onChain.contracts.find((c) => c.label === 'ContextLockPolicyRegistry')?.address ?? ''} network={POLICY.network} local />}
        extraRows={[
          { label: 'Signer', value: <BlockchainRef value={POLICY.onChain.admin} network={POLICY.network} /> },
          { label: 'Policy version', value: String(POLICY.version) },
        ]}
        preconditions={POLICY.enablePreconditions}
        consequence="The agent becomes able to obtain capabilities and execute within the authority matrix above, on the testnet only."
        actionLabel="Enable Testnet Financial Authority"
        disabled={!canEnable}
        disabledReason={canEnable ? undefined : 'One or more preconditions are not met.'}
      />

      {/* compare */}
      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Compare policy revisions"
        wide
        footer={
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => setCompareOpen(false)}>
            Close
          </button>
        }
      >
        <table className="cl-table">
          <thead>
            <tr>
              <th>Field</th>
              <th style={{ width: 170 }}>Version 7</th>
              <th style={{ width: 190 }}>Version 8 · current</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="cl-strong">Autonomous limit</td>
              <td className="cl-mono">$750</td>
              <td className="cl-mono" style={{ color: 'var(--cl-warn)' }}>
                $1,000
              </td>
            </tr>
            <tr>
              <td className="cl-strong">Escalation band</td>
              <td className="cl-mono">$750 – $5,000</td>
              <td className="cl-mono">$1,000 – $5,000</td>
            </tr>
            <tr>
              <td className="cl-strong">Hard ceiling</td>
              <td className="cl-mono">$5,000</td>
              <td className="cl-mono">$5,000</td>
            </tr>
            <tr>
              <td className="cl-strong">Max price age</td>
              <td className="cl-mono">90s</td>
              <td className="cl-mono" style={{ color: 'var(--cl-pass)' }}>
                60s
              </td>
            </tr>
          </tbody>
        </table>
        <p className="cl-meta" style={{ marginTop: 12 }}>
          Version 8 widened the autonomous limit and tightened the freshness requirement. A widening change is the one
          that needs scrutiny: it increases what happens without a human.
        </p>
      </Modal>
    </StudioPage>
  );
}
