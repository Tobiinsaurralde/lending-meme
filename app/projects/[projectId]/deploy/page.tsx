'use client';

/**
 * Deploy / Preflight (spec §20).
 *
 * Turns a verified build into a Testnet Lab deployment while making costs, artifacts, networks and
 * blockers explicit. The operable target today is the local mainnet fork: the backend forks mainnet
 * at an exact block, deploys the ContextLock core, registers the policy DISABLED, opens the agent's
 * positions and starts the runtime. Sepolia is shown as the target it is — BLOCKED, with the reason.
 *
 * Rules encoded here:
 *  - Every gate is re-checked server-side when Deploy is pressed; the screen only shows them.
 *  - Costs stay in separate sections and are never added into one number.
 *  - Policy is deployed DISABLED, always. Activation is a separate decision, made on this page only
 *    after the deployment has been verified and read back from the fork.
 *  - The connected wallet becomes the escalation approver. Without one, a stand-in key signs and
 *    every surface says so.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fingerprint, Play, RefreshCw, Rocket, ScrollText, Square, Wallet } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import { Badge, BlockchainRef, BlockerBanner, Card, EmptyState, KeyValue, Section, StatusBadge, TimeAgo } from '@/components/studio/primitives';
import { Modal } from '@/components/studio/dialogs';
import { DeployWalletPanel } from '@/components/studio/wallet/DeployWalletPanel';
import { LedgerApproverPicker } from '@/components/studio/wallet/LedgerApproverPicker';
import { useWorkbench } from '@/lib/studio/workbench';
import { fork as forkApi, lab as labApi } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import { useActivation, useControlCommand, useCre, useCreSimulations, useForkReadiness, useInvalidateAll, useLabSummary, useSessionUser, useTokenRequirements } from '@/lib/studio/api/queries';
import { ANONYMOUS_USER } from '@/lib/studio/api/session';
import type { PreflightStep, Status } from '@/lib/studio/types';
import type { ForkPhase } from '@/lib/studio/api/types';

type Target = 'LOCAL_MAINNET_FORK' | 'ETHEREUM_SEPOLIA';

const gateStatus = (s: 'PASS' | 'FAIL' | 'BLOCKED' | 'NOT_RUN'): Status => (s === 'PASS' ? 'PASS' : s === 'FAIL' ? 'FAIL' : s === 'BLOCKED' ? 'BLOCKED' : 'PENDING');
const phaseStatus = (s: ForkPhase['status']): Status => (s === 'DONE' ? 'PASS' : s === 'RUNNING' ? 'RUNNING' : s === 'FAILED' ? 'FAIL' : 'PENDING');

export default function DeployPage() {
  const router = useRouter();
  const { setSelection, openBottom, pushToast } = useWorkbench();
  const { agent, agentSlug, project, ctx } = useStudioPage('deploy');
  const invalidate = useInvalidateAll();
  const user = useSessionUser();
  const sessionWallet = user === ANONYMOUS_USER ? null : user;
  /* A Ledger read over USB may stand in for the browser wallet as the approver. Either way the
     address is fixed at deployment; the choice is which device signs escalations later. */
  const [ledgerApprover, setLedgerApprover] = useState<string | null>(null);
  const walletAddress = ledgerApprover ?? sessionWallet;
  const approverKind = ledgerApprover ? 'Ledger (USB)' : 'connected wallet';

  const readiness = useForkReadiness(ctx.dataProjectId);
  const summary = useLabSummary(ctx.dataProjectId);
  const cre = useCre(ctx.dataProjectId);
  const [creRunning, setCreRunning] = useState(false);
  const creRuns = useCreSimulations(ctx.dataProjectId, creRunning);
  const tokens = useTokenRequirements(ctx.dataProjectId);
  const activation = useActivation(ctx.dataProjectId);
  const activate = useControlCommand(ctx.deploymentId, ctx.dataProjectId ?? undefined);

  const deployment = ctx.deployment;
  const live = deployment && (deployment.state === 'DEPLOYING' || deployment.state === 'READY_TO_ACTIVATE');
  const [target, setTarget] = useState<Target>('LOCAL_MAINNET_FORK');
  const [wallet, setWallet] = useState({ connected: false, sufficient: false, onExecutionChain: false });
  const [planOpen, setPlanOpen] = useState(false);
  const [hashesOpen, setHashesOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const latestCre = useMemo(() => creRuns.data?.[0] ?? null, [creRuns.data]);
  useEffect(() => {
    if (latestCre?.status !== 'RUNNING') setCreRunning(false);
  }, [latestCre?.status]);

  const view = ctx.buildView;
  const built = view?.build.status === 'COMPLETED';

  /* ── preflight: the backend's gates, plus the wallet's role ───────────── */
  const steps = useMemo<PreflightStep[]>(() => {
    const gates = readiness.data?.gates ?? [];
    const rows: PreflightStep[] = gates.map((g, i) => ({
      index: i + 1,
      id: `gate-${g.label.toLowerCase().replace(/\s+/g, '-')}`,
      name: g.label,
      status: gateStatus(g.status),
      detail: g.detail,
      blockerId: g.blocker ?? undefined,
    }));
    rows.push({
      index: rows.length + 1,
      id: 'pf_wallet',
      name: 'Approver wallet',
      status: walletAddress ? 'PASS' : 'WARN',
      detail: walletAddress
        ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)} (${approverKind}) will be the approval registry's approver: escalations need its EIP-712 signature${ledgerApprover ? ', reviewed and signed on the device' : ''}. The ContextLock Key Ring is not attached (BLK-002).`
        : 'No wallet connected. A stand-in key generated for the fork will sign escalations, and every surface will say so. Connect a wallet to sign them yourself.',
    });
    rows.push({
      index: rows.length + 1,
      id: 'pf_approval',
      name: 'Approval',
      status: live ? 'PASS' : 'REQUIRED',
      detail: live ? `Deployment ${deployment!.deploymentId} exists.` : 'Review the summary and deploy. The policy starts DISABLED.',
    });
    return rows;
  }, [readiness.data, walletAddress, live, deployment]);

  const blockingSteps = steps.filter((s) => s.status === 'FAIL' || s.status === 'BLOCKED');
  const canDeploy = target === 'LOCAL_MAINNET_FORK' && (readiness.data?.canDeploy ?? false) && built && !live;

  const deploy = async () => {
    if (!ctx.dataProjectId) return;
    setError(null);
    setConfirmOpen(false);
    setBusy('Starting the deployment…');
    try {
      await forkApi.deploy(ctx.dataProjectId, { buildId: ctx.buildId, approverAddress: walletAddress });
      openBottom('events');
      await invalidate();
      pushToast('Deployment started — forking mainnet at the head block');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const stop = async () => {
    if (!deployment) return;
    setError(null);
    setBusy('Stopping…');
    try {
      await forkApi.stop(deployment.deploymentId, 'stopped from the Deploy page');
      await invalidate();
      pushToast('Deployment stopped and its fork destroyed');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const runCre = async () => {
    if (!ctx.dataProjectId) return;
    setError(null);
    setCreRunning(true);
    pushToast('Official CRE simulation started — it compiles the workflow and runs the Chainlink CLI; a few minutes');
    try {
      const r = await labApi.creSimulate(ctx.dataProjectId);
      if (r.note) pushToast(r.note);
      await invalidate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setCreRunning(false);
    }
  };

  const doActivate = async () => {
    if (!deployment || !ctx.deploymentId) return;
    setError(null);
    setBusy('Enabling the policy on the fork and reading it back…');
    try {
      const r = await activate.mutateAsync({ operation: 'ENABLE_POLICY', expectedRevision: deployment.revision, reason: 'activated from the Deploy page' });
      if (r.ok === false) throw new Error(r.detail ?? 'the control plane refused');
      pushToast('TESTNET LAB ACTIVE — the policy reads ENABLED on the fork');
      router.push(`/projects/${ctx.routeProjectId}/overview?agent=${agentSlug}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (!view) {
    return (
      <StudioPage segment="deploy">
        <EmptyState
          title={ctx.loading ? 'Loading…' : 'Nothing to deploy yet'}
          body={ctx.loading ? '' : 'Deployment preflight runs against a completed build. Describe the agent, approve its design and let it build first.'}
          action={ctx.loading ? undefined : <button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/build`)}>Open Composer</button>}
        />
      </StudioPage>
    );
  }

  const record = deployment?.record ?? null;
  const usage = view.usage;
  const creStatus = cre.data?.status ?? null;
  const targetName = target === 'LOCAL_MAINNET_FORK' ? 'Local Anvil fork of Ethereum mainnet · chain 31337' : 'Ethereum Sepolia · chain 11155111';

  return (
    <StudioPage
      segment="deploy"
      badges={
        <>
          <Badge tone="neutral">{agent.name}</Badge>
          <Badge tone="sim">{live ? project.environment.executionNetwork : targetName}</Badge>
          <Badge tone="deny">Production-chain execution: DISABLED</Badge>
          {live ? <Badge tone={deployment!.state === 'READY_TO_ACTIVATE' ? 'pass' : 'sim'}>{deployment!.state.replace(/_/g, ' ')}</Badge> : canDeploy ? <Badge tone="pass">Ready to deploy</Badge> : <Badge tone="blocked">Blocked</Badge>}
        </>
      }
      actions={
        <>
          <button type="button" className="cl-btn" onClick={() => { void readiness.refetch(); void activation.refetch(); pushToast('Preflight re-read from the server'); }}>
            <Play size={13} aria-hidden />
            Run Preflight
          </button>
          <button type="button" className="cl-btn" onClick={() => void runCre()} disabled={creRunning || latestCre?.status === 'RUNNING'}>
            {creRunning || latestCre?.status === 'RUNNING' ? 'CRE simulation running…' : 'Run CRE Simulation'}
          </button>
          <button type="button" className="cl-btn" onClick={() => setHashesOpen(true)}>
            <Fingerprint size={13} aria-hidden />
            View artifact hashes
          </button>
          <button type="button" className="cl-btn" onClick={() => setPlanOpen(true)}>
            <ScrollText size={13} aria-hidden />
            Review Deployment Plan
          </button>
          {live ? (
            <button type="button" className="cl-btn cl-btn-danger" onClick={() => void stop()} disabled={!!busy}>
              <Square size={12} aria-hidden />
              Stop Deployment
            </button>
          ) : (
            <button
              type="button"
              className="cl-btn cl-btn-primary"
              onClick={() => setConfirmOpen(true)}
              disabled={!canDeploy || !!busy}
              title={canDeploy ? undefined : `Blocked: ${target === 'ETHEREUM_SEPOLIA' ? 'Sepolia deployment is not offered from this screen' : (readiness.data?.blockedBy.join(', ') || (built ? 'preflight not read' : 'the build is not complete'))}`}
            >
              <Rocket size={13} aria-hidden />
              {busy ?? 'Deploy to Testnet Lab'}
            </button>
          )}
        </>
      }
      banners={
        <>
          {error ? <BlockerBanner tone="deny" title="The Studio API refused">{error}</BlockerBanner> : null}
          {!built ? (
            <BlockerBanner tone="warn" title="The build is not complete" actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => router.push(`/projects/${ctx.routeProjectId}/build`)}>Open Composer</button>}>
              Deployment needs a completed build: generated code, passing tests and a passing mandatory simulation pass. This build is at {view.build.stage.toLowerCase().replace(/_/g, ' ')} · {view.build.status.toLowerCase().replace(/_/g, ' ')}.
            </BlockerBanner>
          ) : null}
          {readiness.data?.blockedBy.map((b) => (
            <BlockerBanner key={b} tone="warn" title={b}>
              {readiness.data?.gates.find((g) => g.label === b)?.detail ?? 'See the preflight row.'}
            </BlockerBanner>
          ))}
          {deployment?.state === 'FAILED' ? <BlockerBanner tone="deny" title="The last deployment failed">{deployment.record.failure ?? 'See the phases below.'} Its fork was destroyed; you can deploy again.</BlockerBanner> : null}
        </>
      }
    >
      {/* target */}
      <Section label="Execution target">
        <div className="cl-grid cl-grid-2">
          {([
            { id: 'LOCAL_MAINNET_FORK' as Target, title: 'Local mainnet fork', availability: 'AVAILABLE', body: 'Forks Ethereum mainnet at the head block into a local Anvil chain, deploys the ContextLock core there and lets the agent act on real protocol state. Nothing reaches a public chain.' },
            { id: 'ETHEREUM_SEPOLIA' as Target, title: 'Ethereum Sepolia', availability: 'BLOCKED', body: 'A wallet-signed Sepolia deployment is not offered by the Studio API yet. The testnet orchestrator runs from the operator’s machine (npm run studio:deploy:testnet) with a disposable deployer key; its console is the same one this workbench reads.' },
          ]).map((opt) => {
            const selectable = opt.availability === 'AVAILABLE';
            const active = target === opt.id;
            return (
              <button key={opt.id} type="button" className="cl-card" onClick={() => setTarget(opt.id)} style={{ textAlign: 'left', padding: 0, cursor: 'pointer', borderColor: active ? 'var(--cl-ink)' : 'var(--cl-line)', background: active ? 'rgba(0, 66, 175, 0.06)' : 'var(--cl-panel)', opacity: selectable ? 1 : 0.8 }}>
                <div className="cl-card-head"><div className="cl-card-title">{opt.title}</div><StatusBadge status={selectable ? 'READY' : 'BLOCKED'} label={opt.availability} /></div>
                <div className="cl-card-body"><p className="cl-meta" style={{ whiteSpace: 'normal' }}>{opt.body}</p></div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* preflight steps */}
      <Section label="Preflight" actions={readiness.isFetching ? <span className="cl-meta">reading…</span> : null}>
        <div className="cl-steps">
          {steps.map((step) => (
            <button key={step.id} type="button" className="cl-step" style={{ width: '100%', textAlign: 'left' }} onClick={() => setSelection({ kind: 'preflight-step', id: step.id, label: step.name })}>
              <span className="cl-step-index">{step.index}</span>
              <span className="cl-step-name">{step.name}</span>
              <span className="cl-step-status"><StatusBadge status={step.status} /></span>
              <span className="cl-step-detail">{step.detail}{step.blockerId ? ` · ${step.blockerId}` : ''}</span>
            </button>
          ))}
          {steps.length === 0 ? <div className="cl-step" style={{ cursor: 'default' }}><span className="cl-step-detail">{readiness.isLoading ? 'Reading the gates…' : 'The preflight gates could not be read.'}</span></div> : null}
        </div>
      </Section>

      {/* CRE */}
      <Section label="Chainlink CRE" actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => router.push(`/projects/${ctx.routeProjectId}/cre?agent=${agentSlug}`)}>Open CRE page</button>}>
        <Card>
          <KeyValue
            rows={[
              { label: 'Mode', value: creStatus ? `${creStatus.mode} · ${creStatus.executionMode}` : 'reading…' },
              { label: 'Official CLI simulation', value: latestCre ? <span className="cl-row" style={{ gap: 8 }}><StatusBadge status={latestCre.status === 'RUNNING' ? 'RUNNING' : latestCre.status === 'PASSED' ? 'PASS' : 'FAIL'} /><span className="cl-meta">{latestCre.result.verdict ?? ''}{latestCre.result.productionLimits ? ' · production limits' : ''} · <TimeAgo iso={latestCre.startedAt} /></span></span> : <span className="cl-meta">not run for this project — required before deploying</span> },
              { label: 'Workflow binary', value: creStatus?.workflowBinary ? <BlockchainRef value={creStatus.workflowBinary} kind="hash" /> : '—' },
              { label: 'Real DON', value: <Badge tone="blocked">NO</Badge> },
              { label: 'Hardware TEE', value: <Badge tone="blocked">NO</Badge> },
              { label: 'Deploy Access', value: creStatus?.deployAccess ?? '—' },
            ]}
          />
          {latestCre?.status === 'FAILED' ? <div style={{ marginTop: 10 }}><BlockerBanner tone="deny" title="The last CRE simulation failed">{latestCre.result.failure ?? latestCre.result.outputTail?.slice(-3).join(' · ') ?? ''}</BlockerBanner></div> : null}
        </Card>
      </Section>

      {/* deployment summary */}
      <Section label="Deployment summary">
        <Card>
          <KeyValue
            rows={[
              { label: 'Execution target', value: targetName },
              { label: 'Market source', value: `${summary.data?.networks.marketSource.name ?? project.environment.realitySource} · READ ONLY` },
              { label: 'Production-chain writes', value: <Badge tone="deny">PROHIBITED</Badge> },
              { label: 'Blueprint revision', value: `r${view.blueprint?.revision ?? view.build.blueprintRevision ?? '—'}` },
              { label: 'Build revision', value: `r${view.build.buildRevision}` },
              { label: 'Protocols', value: summary.data?.summary.protocols.join(' · ') ?? '—' },
              { label: 'Autonomous / approval / deny', value: summary.data ? `${summary.data.summary.autonomous} · ${summary.data.summary.humanApproval} · ${summary.data.summary.hardDeny}` : '—' },
              { label: 'Contracts', value: 'ContextLock core deployed fresh on the fork from contracts/out (executor, policy registry, authorization registry, approval registry, identity verifier, CRE consumer)' },
              { label: 'Runtime', value: 'in-process fork runtime started by the Studio server · no container image' },
              { label: 'CRE mode', value: 'Official CLI simulator · no DON, no TEE evidence' },
              { label: 'Escalation approver', value: walletAddress ? <span>{approverKind} <span className="cl-mono">{walletAddress}</span> — Key Ring not attached (BLK-002)</span> : 'stand-in key generated for the fork — not a Ledger device (BLK-002)' },
              { label: 'Security status', value: <StatusBadge status={ctx.labState?.computedFrom.deterministicSimulationsPassed ? 'PASS' : 'FAIL'} label={ctx.labState?.computedFrom.deterministicSimulationsPassed ? 'mandatory simulations passed' : 'mandatory simulations not passing'} /> },
              { label: 'Policy at deployment', value: <Badge tone="blocked">DISABLED</Badge> },
            ]}
          />
        </Card>
      </Section>

      {/* wallet */}
      <Section label="Approver wallet">
        <Card>
          <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>
            On the fork the wallet pays no gas — every role is a fresh key funded by Anvil. What the wallet does is sign ESCALATE approvals: its address becomes the approval registry's approver at deployment, and the executor only runs an escalated action once its EIP-712 signature is on record.
          </p>
          {ledgerApprover ? null : <DeployWalletPanel recommendedEth={0} onStateChange={setWallet} role="approver" />}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--cl-line)' }}>
            <LedgerApproverPicker chosen={ledgerApprover} onChoose={setLedgerApprover} />
          </div>
          {wallet.connected && !wallet.onExecutionChain ? <p className="cl-meta" style={{ marginTop: 8, whiteSpace: 'normal' }}>The network the wallet is on does not matter for signing approvals on the fork; it matters for a Sepolia deployment, which is not offered here.</p> : null}
        </Card>
      </Section>

      {/* cost — deliberately not one total */}
      <Section label="Cost estimate" actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => { void tokens.refetch(); pushToast('Re-read'); }}><RefreshCw size={11} aria-hidden />Refresh Estimate</button>}>
        <div className="cl-grid cl-grid-2">
          <Card title="One-time deployment gas">
            <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>{target === 'LOCAL_MAINNET_FORK' ? 'The fork funds its own roles with anvil_setBalance. Nothing is paid by you.' : 'Paid by the deployer wallet on Sepolia in test ETH, which has no real-world value.'}</p>
            <dl className="cl-kv">
              <div style={{ display: 'contents' }}><dt>Paid by you</dt><dd>{target === 'LOCAL_MAINNET_FORK' ? <Badge tone="pass">nothing</Badge> : <Badge tone="warn">test ETH · not offered here</Badge>}</dd></div>
              {record?.setupTransactions.length ? <div style={{ display: 'contents' }}><dt>Gas used on the fork</dt><dd className="cl-mono">{record.setupTransactions.reduce((n, t) => n + Number(t.gasUsed), 0).toLocaleString()} across {record.setupTransactions.length} tx</dd></div> : null}
            </dl>
          </Card>
          <Card title="Expected execution costs">
            <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>Per action, paid by the relayer role. On the fork this is Anvil-funded; on a testnet it would be test ETH.</p>
            <dl className="cl-kv">
              {(tokens.data?.requirements ?? []).map((t) => (
                <div key={t.symbol + t.purpose} style={{ display: 'contents' }}><dt>{t.symbol}</dt><dd>{t.purpose} · {t.source} · real-world value {t.realWorldValue}</dd></div>
              ))}
            </dl>
            {tokens.data ? <p className="cl-meta" style={{ marginTop: 8, whiteSpace: 'normal' }}>{tokens.data.note}</p> : null}
          </Card>
          <Card title="Model usage">
            <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>Billed separately, not paid in any chain asset. Measured by the SDK's own accounting, never estimated from text.</p>
            <dl className="cl-kv">
              <div style={{ display: 'contents' }}><dt>This build</dt><dd>{usage.requests} calls · {(usage.inputTokens + usage.outputTokens).toLocaleString()} tokens{usage.estimatedCostUsd !== null ? ` · ~$${usage.estimatedCostUsd.toFixed(3)} (estimate)` : ''}</dd></div>
              <div style={{ display: 'contents' }}><dt>Runtime</dt><dd>the fork runtime uses no model calls — decisions come from the deterministic policy engine</dd></div>
            </dl>
          </Card>
          <Card title="Hosting and CRE">
            <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>The official CRE simulator runs locally and costs no gas and no credits. No container is hosted.</p>
            <dl className="cl-kv">
              <div style={{ display: 'contents' }}><dt>CRE</dt><dd>official CLI simulator · private registry not used (no Deploy Access)</dd></div>
              <div style={{ display: 'contents' }}><dt>Runtime hosting</dt><dd>none — the runtime lives in the Studio server process for the fork's lifetime</dd></div>
            </dl>
          </Card>
        </div>
        <p className="cl-meta" style={{ marginTop: 10 }}>
          These are not added together. They are paid in different currencies, at different times, by different parties — a single combined figure would not correspond to anything you actually pay.
        </p>
      </Section>

      {/* progress */}
      {deployment ? (
        <Section label={`Deployment ${deployment.deploymentId}`} actions={<span className="cl-meta">{deployment.state.replace(/_/g, ' ')} · updated <TimeAgo iso={deployment.updatedAt} /></span>}>
          <div className="cl-steps">
            {deployment.record.phases.map((phase, i) => (
              <div className="cl-step" key={phase.key} style={{ cursor: 'default' }}>
                <span className="cl-step-index">{i + 1}</span>
                <span className="cl-step-name">{(readiness.data?.phases.find((p) => p.key === phase.key)?.label ?? phase.key).replace(/_/g, ' ')}</span>
                <span className="cl-step-status"><StatusBadge status={phaseStatus(phase.status)} /></span>
                <span className="cl-step-detail">{phase.detail ?? ''} {phase.finishedAtMs ? <TimeAgo iso={new Date(phase.finishedAtMs).toISOString()} /> : null}</span>
              </div>
            ))}
          </div>
          {deployment.state === 'STOPPED' ? <p className="cl-meta" style={{ marginTop: 8 }}>{deployment.record.stoppedReason ?? 'Stopped.'}</p> : null}

          {deployment.state === 'READY_TO_ACTIVATE' ? (
            <div style={{ marginTop: 12 }}>
              <Card title="Activation" actions={<Badge tone="warn">policy DISABLED</Badge>}>
                <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>
                  {activation.data?.readiness.consequence ?? 'Enabling the policy gives the agent financial authority on the fork. Every check below must pass first, and the result is read back from the chain before it is believed.'}
                </p>
                <div className="cl-steps">
                  {(activation.data?.readiness.rows ?? []).map((row) => (
                    <div className="cl-step" key={row.label} style={{ cursor: 'default' }}>
                      <span className="cl-step-name">{row.label}</span>
                      <span className="cl-step-status"><StatusBadge status={row.status === 'READY' ? 'PASS' : row.status === 'NOT_READY' ? 'FAIL' : 'READY'} label={row.value} /></span>
                      <span className="cl-step-detail">{row.detail}</span>
                    </div>
                  ))}
                </div>
                <div className="cl-row" style={{ marginTop: 12, gap: 8 }}>
                  <button type="button" className="cl-btn cl-btn-primary" onClick={() => void doActivate()} disabled={!!busy || !(activation.data?.readiness.canActivate ?? false)} title={activation.data?.readiness.blockedBy.join(', ') || undefined}>
                    {busy ?? (activation.data?.readiness.buttonLabel ?? 'ACTIVATE TESTNET AGENT')}
                  </button>
                  <button type="button" className="cl-btn" onClick={() => router.push(`/projects/${ctx.routeProjectId}/overview?agent=${agentSlug}`)}>Open Overview without activating</button>
                </div>
              </Card>
            </div>
          ) : null}
        </Section>
      ) : null}

      {/* deployment plan */}
      <Modal open={planOpen} onClose={() => setPlanOpen(false)} title="Deployment plan" subtitle="Exactly which contracts are deployed and which are reused." wide footer={<button type="button" className="cl-btn cl-btn-primary" onClick={() => setPlanOpen(false)}>Close</button>}>
        <table className="cl-table">
          <thead><tr><th>Contract</th><th style={{ width: 110 }}>Action</th><th style={{ width: 240 }}>Address</th></tr></thead>
          <tbody>
            {(record?.contracts ? Object.entries(record.contracts) : ['ContextLockExecutor', 'ContextLockPolicyRegistry', 'ContextLockAuthorizationRegistry', 'ContextLockApprovalRegistry', 'LocalAgentIdentityVerifier', 'ContextLockCreConsumer'].map((n) => [n, null] as [string, string | null])).map(([name, address]) => (
              <tr key={name}>
                <td className="cl-strong">{name}</td>
                <td><Badge tone="sim">DEPLOY</Badge></td>
                <td>{address ? <BlockchainRef value={address} network="local fork" local /> : <span className="cl-meta">created by this deployment</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cl-meta" style={{ marginTop: 12 }}>
          On a fork nothing is reused: the whole ContextLock core is deployed from the compiled artifacts in contracts/out so the fork is self-contained. A Sepolia deployment reuses the verified core instead.
        </p>
      </Modal>

      {/* artifact hashes */}
      <Modal open={hashesOpen} onClose={() => setHashesOpen(false)} title="Artifact hashes" subtitle="What exactly is being deployed." wide footer={<button type="button" className="cl-btn cl-btn-primary" onClick={() => setHashesOpen(false)}>Close</button>}>
        <div className="cl-col" style={{ gap: 8 }}>
          {[
            { label: 'CRE workflow binary', value: creStatus?.workflowBinary ?? null },
            { label: 'Policy hash', value: record?.policyHash ?? null },
            { label: 'Agent identity hash', value: record?.agentIdentityHash ?? null },
            { label: 'ENS node', value: record?.ensNode ?? null },
            { label: 'Market snapshot', value: record?.snapshot?.snapshotHash ?? null },
            { label: 'Fork block hash', value: record?.fork?.forkBlockHash ?? null },
          ].map((a) => (
            <div key={a.label} className="cl-row" style={{ gap: 10, justifyContent: 'space-between' }}>
              <span className="cl-strong" style={{ fontSize: 12.5 }}>{a.label}</span>
              {a.value ? <BlockchainRef value={a.value} kind="hash" /> : <span className="cl-meta">not yet — produced by the deployment</span>}
            </div>
          ))}
        </div>
      </Modal>

      {/* deployment confirmation (spec §20) */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Deploy testnet agent" subtitle="Review exactly what this deployment does before it is submitted." wide danger footer={<><button type="button" className="cl-btn" onClick={() => setConfirmOpen(false)}>Cancel</button><button type="button" className="cl-btn cl-btn-primary" onClick={() => void deploy()}>Deploy to Local Mainnet Fork</button></>}>
        <dl className="cl-statechange">
          <div className="cl-statechange-row"><dt>Network</dt><dd>{targetName}</dd></div>
          <div className="cl-statechange-row"><dt>Transactions</dt><dd>core deployment, policy registration (DISABLED), identity binding, and one opened position per protocol — all on the fork</dd></div>
          <div className="cl-statechange-row"><dt>Balance required</dt><dd>none from you — the fork funds its roles</dd></div>
          <div className="cl-statechange-row"><dt>Blueprint / build</dt><dd>r{view.blueprint?.revision ?? '—'} / r{view.build.buildRevision}</dd></div>
          <div className="cl-statechange-row"><dt>Policy on deployment</dt><dd><Badge tone="blocked">DISABLED</Badge> — activation is a separate decision</dd></div>
          <div className="cl-statechange-row"><dt>CRE mode</dt><dd>Official CLI simulator · no DON, no TEE evidence</dd></div>
          <div className="cl-statechange-row"><dt>Escalation approver</dt><dd className="cl-mono">{walletAddress ? `${walletAddress} (${approverKind})` : 'stand-in key (no wallet connected)'}</dd></div>
          <div className="cl-statechange-row"><dt>Production-chain execution</dt><dd><Badge tone="deny">DISABLED</Badge></dd></div>
        </dl>
        {!walletAddress ? <p className="cl-meta" style={{ marginTop: 10, whiteSpace: 'normal' }}><Wallet size={12} aria-hidden /> Connect a wallet before deploying to sign escalations yourself; the approver cannot be changed after deployment.</p> : null}
      </Modal>
    </StudioPage>
  );
}
