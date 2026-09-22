'use client';

/**
 * Chainlink CRE (spec §26).
 *
 * Makes simulator, user-simulated and real-DON state completely explicit.
 *
 * Rules encoded here:
 *  - Four truth labels are stated separately and only ever set by evidence:
 *    official simulation, real DON, DON consensus, hardware TEE.
 *  - A simulator never renders a DON badge.
 *  - The connect flow never asks for a password or an OTP: authentication
 *    happens in the official CRE login, and ContextLock receives only a
 *    sanitized connection status.
 *  - Promotion moves the exact approved artifact. It never silently rebuilds.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExternalLink, Play, Plug, RefreshCw, RotateCcw, Square, Upload } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockchainRef,
  BlockerBanner,
  Card,
  FreshnessBadge,
  KeyValue,
  Section,
  StatusBadge,
  TimeAgo,
} from '@/components/studio/primitives';
import { Modal, SecurityConfirmation } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { toCreModeOptions, toCreRuns, toCreState } from '@/lib/studio/api/adapters/operate';
import { useCre, useCreConnect, useCreParity, useCreSimulations, useInvalidateAll } from '@/lib/studio/api/queries';
import { lab as labApi } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import { EmptyState } from '@/components/studio/primitives';
import type { Status } from '@/lib/studio/types';

export default function CrePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast, selection, setSelection } = useWorkbench();

  const { agent, agentSlug, ctx } = useStudioPage('cre');
  const invalidate = useInvalidateAll();
  const creQ = useCre(ctx.dataProjectId);
  const connectQ = useCreConnect(ctx.dataProjectId);
  const parityQ = useCreParity(ctx.dataProjectId);
  const [running, setRunning] = useState(false);
  const runsQ = useCreSimulations(ctx.dataProjectId, running);
  const runs = useMemo(() => runsQ.data ?? [], [runsQ.data]);
  useEffect(() => { if (!runs.some((r) => r.status === 'RUNNING')) setRunning(false); }, [runs]);

  const CRE = useMemo(() => toCreState(creQ.data ?? null, runs, parityQ.data ?? null), [creQ.data, runs, parityQ.data]);
  const CRE_MODE_OPTIONS = useMemo(() => toCreModeOptions(creQ.data ?? null, connectQ.data ?? null), [creQ.data, connectQ.data]);
  const CRE_RUNS = useMemo(() => toCreRuns(runs), [runs]);
  const status: Status = CRE.status;
  const [connectOpen, setConnectOpen] = useState(false);
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canPromote = CRE.deployAccess && CRE.approvedWasmHash === CRE.wasmHash && CRE.paritySuite === 'PASS';

  const runOnce = async () => {
    if (!ctx.dataProjectId) return;
    setError(null);
    setRunning(true);
    pushToast('Official CRE simulation started — compiling the workflow and running the Chainlink CLI');
    try {
      const r = await labApi.creSimulate(ctx.dataProjectId);
      if (r.note) pushToast(r.note);
      await invalidate();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : (e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  if (!ctx.dataProjectId || (!ctx.buildView && !ctx.loading)) {
    return (
      <StudioPage segment="cre" title="Chainlink CRE" subtitle="Mode: OFFICIAL CLI SIMULATION">
        <EmptyState title="No agent to simulate yet" body="The CRE workflow evaluates a built agent's policy. Describe the agent first." action={<button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/build`)}>Build Agent</button>} />
      </StudioPage>
    );
  }

  return (
    <StudioPage
      segment="cre"
      title="Chainlink CRE"
      subtitle="Mode: OFFICIAL CLI SIMULATION"
      banners={error ? <BlockerBanner tone="deny" title="The Studio API refused">{error}</BlockerBanner> : null}
      badges={
        <>
          <Badge tone="neutral">{agent.name}</Badge>
          <StatusBadge status={status} large />
          {/* A simulator never renders a DON badge. */}
          <Badge tone="sim" large>
            SIMULATED
          </Badge>
          <FreshnessBadge freshness={CRE.freshness} />
        </>
      }
      actions={
        <>
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => void runOnce()} disabled={running || status === 'RUNNING'}>
            <Play size={12} aria-hidden />
            {running || status === 'RUNNING' ? 'Simulation running…' : 'Run Once'}
          </button>
          <button type="button" className="cl-btn" disabled title="The simulator is not a long-running process here: each run invokes the official CLI once and records the result.">
            <RotateCcw size={13} aria-hidden />
            Restart Simulator
          </button>
          <button type="button" className="cl-btn" onClick={() => { void parityQ.refetch(); pushToast(parityQ.data?.note ?? 'Parity compares the simulator against a deployed workflow; none is deployed'); }}>
            Run Parity Suite
          </button>
          <button type="button" className="cl-btn" onClick={() => setConnectOpen(true)}>
            <Plug size={13} aria-hidden />
            Connect My CRE
          </button>
          <button
            type="button"
            className="cl-btn cl-btn-primary"
            onClick={() => setPromoteOpen(true)}
            disabled={!canPromote}
            title={canPromote ? undefined : 'Requires CRE Deploy Access, an approved artifact and a passing parity suite'}
          >
            <Upload size={13} aria-hidden />
            Promote to CRE
          </button>
        </>
      }
    >
      {/* truth labels — the heart of this page */}
      <Section label="What is actually true">
        <Card>
          <div className="cl-path">
            <TruthRow label="Official CRE simulation" value={CRE.truth.officialSimulation} detail="The official CRE CLI simulator ran this workflow." />
            <TruthRow label="Real DON" value={CRE.truth.realDon} detail="No workflow is deployed to a decentralized oracle network." />
            <TruthRow label="Real DON consensus" value={CRE.truth.realDonConsensus} detail="With no DON deployment there is no consensus to observe." />
            <TruthRow label="Hardware TEE" value={CRE.truth.hardwareTee} detail="No attestation evidence exists for this execution." />
          </div>
          <p className="cl-meta" style={{ marginTop: 12 }}>
            These four are stated separately because they are different claims. A simulator run is a real simulation of
            the workflow; it is not DON execution, and it produces no trusted-execution evidence. Each becomes YES only
            when evidence supports it.
          </p>
        </Card>
      </Section>

      {/* status card */}
      <Section label="Status">
        <Card>
          <KeyValue
            rows={[
              { label: 'Mode', value: 'ContextLock Simulator · official CLI' },
              { label: 'CRE CLI version', value: CRE.cliVersion, mono: true },
              { label: 'Account mode', value: CRE.accountMode },
              { label: 'Organization', value: CRE.organization ?? 'not connected' },
              {
                label: 'Deploy Access',
                value: <StatusBadge status={CRE.deployAccess ? 'PASS' : 'BLOCKED'} label={CRE.deployAccess ? 'granted' : 'not granted'} />,
              },
              { label: 'Registry', value: CRE.registry },
              {
                label: 'Simulation ID',
                value: (
                  <span className="cl-row cl-row-wrap" style={{ gap: 7 }}>
                    <span className="cl-mono">{CRE.simulationId}</span>
                    {/* A fixture simulation id must never read as a workflow id. */}
                    <Badge tone="sim">simulation, not a workflow id</Badge>
                  </span>
                ),
              },
              { label: 'Workflow ID', value: CRE.workflowId ?? 'none — no workflow is deployed' },
              { label: 'Workflow WASM hash', value: <BlockchainRef value={CRE.wasmHash} kind="hash" /> },
              { label: 'Config hash', value: <BlockchainRef value={CRE.configHash} kind="hash" /> },
              { label: 'Production limits', value: CRE.productionLimits },
              { label: 'Last run', value: CRE.lastRun ? <TimeAgo iso={CRE.lastRun} /> : 'never' },
              { label: 'DON deployment', value: <StatusBadge status={CRE.donDeployment ? 'PASS' : 'BLOCKED'} label={CRE.donDeployment ? 'deployed' : 'none'} /> },
              {
                label: 'Hardware TEE evidence',
                value: <StatusBadge status={CRE.hardwareTeeEvidence ? 'PASS' : 'BLOCKED'} label={CRE.hardwareTeeEvidence ? 'present' : 'none'} />,
              },
            ]}
          />
        </Card>
      </Section>

      {/* mode selector */}
      <Section label="CRE mode">
        <div className="cl-grid cl-grid-3">
          {CRE_MODE_OPTIONS.map((option) => (
            <Card
              key={option.mode}
              title={option.title}
              actions={<StatusBadge status={option.available ? 'READY' : 'BLOCKED'} />}
            >
              <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>
                {option.description}
              </p>
              <ul className="cl-col" style={{ gap: 5 }}>
                {option.bullets.map((bullet) => (
                  <li key={bullet} className="cl-row" style={{ gap: 7, fontSize: 12.5 }}>
                    <span className="cl-dim">·</span>
                    {bullet}
                  </li>
                ))}
              </ul>
              {option.blockerReason ? (
                <p style={{ marginTop: 10, fontSize: 12.5, color: 'var(--cl-blocked)' }}>{option.blockerReason}</p>
              ) : null}
              <button
                type="button"
                className={`cl-btn cl-btn-sm ${CRE.mode === option.mode ? 'cl-btn-primary' : ''}`}
                style={{ marginTop: 12 }}
                disabled={!option.available}
                onClick={() => (option.mode === 'MY_CRE_SIMULATOR' ? setConnectOpen(true) : undefined)}
              >
                {CRE.mode === option.mode ? 'Current mode' : option.available ? 'Use this mode' : 'Unavailable'}
              </button>
            </Card>
          ))}
        </div>
      </Section>

      {/* history */}
      <Section label="Simulation history">
        <Card flush>
          <div className="cl-table-scroll">
            <table className="cl-table" style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={{ width: 130 }}>Time</th>
                  <th style={{ minWidth: 200 }}>Trigger</th>
                  <th style={{ width: 110 }}>Result</th>
                  <th style={{ minWidth: 190 }}>Reason</th>
                  <th style={{ width: 130 }}>Config hash</th>
                  <th style={{ width: 130 }}>Binary hash</th>
                  <th style={{ width: 170 }}>Production limits</th>
                  <th style={{ width: 140 }}>Broadcast</th>
                </tr>
              </thead>
              <tbody>
                {CRE_RUNS.map((run) => (
                  <tr
                    key={run.id}
                    data-clickable="true"
                    data-selected={selection?.id === run.id}
                    onClick={() => setSelection({ kind: 'cre-run', id: run.id, label: `CRE run ${run.id}` })}
                  >
                    <td className="cl-meta">
                      <TimeAgo iso={run.at} />
                    </td>
                    <td>{run.trigger}</td>
                    <td>
                      <StatusBadge status={run.result} />
                    </td>
                    <td className="cl-mono" style={{ fontSize: 11.5, color: run.reason ? 'var(--cl-deny)' : undefined }}>
                      {run.reason ?? '—'}
                    </td>
                    <td className="cl-mono" style={{ fontSize: 11 }}>
                      {run.configHash}
                    </td>
                    <td className="cl-mono" style={{ fontSize: 11 }}>
                      {run.binaryHash}
                    </td>
                    <td className="cl-meta">{run.productionLimitMode}</td>
                    <td>
                      <Badge tone={run.broadcast === 'DRY_RUN' ? 'sim' : 'data'}>{run.broadcast.replace('_', ' ')}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </Section>

      {/* connect flow — never asks for credentials */}
      <Modal
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        title="Connect Chainlink CRE"
        subtitle="ContextLock never sees your Chainlink password or one-time code."
        wide
        footer={
          <>
            <button type="button" className="cl-btn" onClick={() => setConnectOpen(false)}>
              Cancel
            </button>
            <button type="button" className="cl-btn" onClick={() => { void creQ.refetch(); void connectQ.refetch(); pushToast(connectQ.data?.account.connected === 'YES' ? `CRE CLI ${connectQ.data.account.cliVersion} · Deploy Access ${connectQ.data.account.deployAccess}` : 'No CRE CLI session detected on the Studio server'); }}>
              Check CRE Status
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-primary"
              onClick={() => {
                setConnectOpen(false);
                pushToast('The Local Bridge is not shipped yet: run `cre login` on the machine that runs the Studio API, then Check CRE Status');
              }}
            >
              <ExternalLink size={13} aria-hidden />
              Launch / Connect Bridge
            </button>
          </>
        }
      >
        <ol className="cl-steps">
          {[
            'Launch ContextLock Bridge on this machine.',
            'The Bridge runs the official CRE login locally if you are not already authenticated.',
            'Chainlink browser authentication opens. You authenticate with Chainlink directly.',
            'ContextLock receives only a sanitized connection status — never a credential.',
          ].map((step, i) => (
            <li className="cl-step" key={step} style={{ cursor: 'default' }}>
              <span className="cl-step-index">{i + 1}</span>
              <span style={{ flex: '1 1 auto', fontSize: 13 }}>{step}</span>
            </li>
          ))}
        </ol>
        <BlockerBanner tone="neutral" title="No password or one-time code is ever requested">
          If any screen in this flow asks ContextLock for your Chainlink password or OTP, it is not this flow.
        </BlockerBanner>
      </Modal>

      {/* promotion */}
      <SecurityConfirmation
        open={promoteOpen}
        onClose={() => setPromoteOpen(false)}
        onConfirm={() => {
          setPromoteOpen(false);
          pushToast('Promotion is blocked: Deploy Access is not enabled (BLK-V2-CRE-DEPLOY)');
        }}
        action="Promote exact workflow artifact"
        currentState={<Badge tone="sim">Simulator only</Badge>}
        requestedState={<Badge tone="pass">Deployed to your private registry</Badge>}
        network="Execution remains testnet-only"
        resource={<BlockchainRef label="workflow.wasm" value={CRE.wasmHash} kind="hash" />}
        extraRows={[
          { label: 'Approved WASM hash', value: CRE.approvedWasmHash ?? 'none approved' },
          { label: 'Current WASM hash', value: CRE.wasmHash },
          { label: 'Config hash', value: CRE.configHash },
          { label: 'Deploy Access', value: CRE.deployAccess ? 'granted' : 'not granted' },
          { label: 'Registry', value: CRE.registry },
          { label: 'Parity suite', value: CRE.paritySuite ?? 'not run' },
        ]}
        consequence="The exact artifact above is promoted. Nothing is rebuilt during promotion, so what runs is byte-identical to what was approved. Execution still targets the testnet only."
        actionLabel="Promote Exact Workflow Artifact"
      />
    </StudioPage>
  );
}

function TruthRow({ label, value, detail }: { label: string; value: boolean; detail: string }) {
  return (
    <div className="cl-path-step">
      <span className="cl-path-step-name">{label}</span>
      <span className="cl-step-status">
        <Badge tone={value ? 'pass' : 'blocked'} large>
          {value ? 'YES' : 'NO'}
        </Badge>
      </span>
      <span className="cl-path-step-detail">{detail}</span>
    </div>
  );
}
