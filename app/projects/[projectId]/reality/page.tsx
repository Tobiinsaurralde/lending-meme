'use client';

/**
 * Reality Lab (spec §16).
 *
 * Real mainnet read-only context, local forks, snapshots and synthetic
 * overlays — without ever blurring execution authority.
 *
 * Rules encoded here:
 *  - MARKET SOURCE and EXECUTION TARGET are shown as two separate fields and
 *    are never merged into one "network" statement.
 *  - A blocked or limited mode says exactly what is missing.
 *  - A fork transaction is labelled LOCAL FORK TRANSACTION and never receives a
 *    public explorer link.
 *  - The base snapshot is immutable; an overlay is applied on top of it.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Play, Plus, RotateCcw, Save, Trash2, Undo2 } from 'lucide-react';
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
  TrustClassBadge,
} from '@/components/studio/primitives';
import { Modal, StandardConfirmation } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { useReality, useScenarios, useInvalidateAll } from '@/lib/studio/api/queries';
import { toLocalFork, toOverlays, toRealityModes, toSnapshot } from '@/lib/studio/api/adapters/test';
import { fork as forkApi } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import type { RealityMode, RealityModeOption, RealitySource } from '@/lib/studio/types';

export default function RealityLabPage() {
  const router = useRouter();
  const { setSelection, developerMode, pushToast } = useWorkbench();
  const { agent, project, ctx } = useStudioPage('reality');
  const invalidate = useInvalidateAll();
  const realityQ = useReality();
  const scenariosQ = useScenarios(ctx.dataProjectId);

  const modes = useMemo<RealityModeOption[]>(() => (realityQ.data ? toRealityModes(realityQ.data) : []), [realityQ.data]);
  const deployment = ctx.deployment;
  const snapshot = useMemo(() => (deployment ? toSnapshot(deployment, scenariosQ.data ?? null) : null), [deployment, scenariosQ.data]);
  const localFork = useMemo(() => (deployment ? toLocalFork(deployment) : null), [deployment]);
  const overlays = useMemo(() => toOverlays(scenariosQ.data ?? null), [scenariosQ.data]);
  const forkLive = !!deployment?.live.fork;

  const [mode, setMode] = useState<RealityMode>(deployment?.live.fork ? 'LOCAL_MAINNET_FORK' : 'LIVE_MAINNET_MIRROR');
  const [provenanceOf, setProvenanceOf] = useState<RealitySource | null>(null);
  const [appliedOverlay, setAppliedOverlay] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [destroyOpen, setDestroyOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const overlay = overlays.find((o) => o.id === appliedOverlay) ?? null;
  const graphSource = realityQ.data?.sources.find((src) => src.sourceId.startsWith('thegraph')) ?? null;

  const destroyFork = async () => {
    if (!deployment) return;
    setError(null);
    try {
      await forkApi.stop(deployment.deploymentId, 'fork destroyed from the Reality Lab');
      await invalidate();
      pushToast('Fork destroyed — the deployment is STOPPED');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  };
  const tickFork = async () => {
    if (!deployment) return;
    setError(null);
    try {
      const r = await forkApi.tick(deployment.deploymentId);
      await invalidate();
      pushToast(r.sample ? `Observed fork block ${r.sample.blockNumber} · ${r.sample.action}${r.sample.verdict ? ` ${r.sample.verdict}` : ''}` : 'No observation — the runtime is not running');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  };

  return (
    <StudioPage
      segment="reality"
      badges={<Badge tone="neutral">{agent.name}</Badge>}
      banners={error ? <BlockerBanner tone="deny" title="The Studio API refused">{error}</BlockerBanner> : null}
    >
      {/* Market source and execution target are deliberately two fields. */}
      <Section label="Environment">
        <div className="cl-grid cl-grid-2">
          <Card>
            <div className="cl-label" style={{ marginBottom: 8 }}>
              Market source
            </div>
            <div className="cl-display-s" style={{ marginBottom: 8 }}>
              {project.environment.realitySource}
            </div>
            <div className="cl-row cl-row-wrap" style={{ gap: 6 }}>
              <Badge tone="data" large>
                READ ONLY
              </Badge>
              <span className="cl-meta">Used for context. No write path exists to this chain.</span>
            </div>
          </Card>

          <Card>
            <div className="cl-label" style={{ marginBottom: 8 }}>
              Execution target
            </div>
            <div className="cl-display-s" style={{ marginBottom: 8 }}>
              {project.environment.executionNetwork}
            </div>
            <div className="cl-row cl-row-wrap" style={{ gap: 6 }}>
              <Badge tone="sim" large>
                {project.environment.realityMode === 'LOCAL_MAINNET_FORK' ? 'LOCAL FORK' : 'TESTNET'}
              </Badge>
              <span className="cl-meta">Chain id {project.environment.executionChainId}. Every transaction lands here.</span>
            </div>
          </Card>
        </div>
      </Section>

      {/* mode selector */}
      <Section label="Reality mode">
        <div className="cl-grid cl-grid-2">
          {modes.map((option) => {
            const selectable = option.availability !== 'BLOCKED';
            const active = mode === option.mode;
            return (
              <button
                key={option.mode}
                type="button"
                className="cl-card"
                disabled={!selectable}
                onClick={() => selectable && setMode(option.mode)}
                style={{
                  textAlign: 'left',
                  padding: 0,
                  cursor: selectable ? 'pointer' : 'not-allowed',
                  borderColor: active ? 'var(--cl-ink)' : 'var(--cl-line)',
                  background: active ? 'rgba(0, 66, 175, 0.06)' : 'var(--cl-panel)',
                  opacity: selectable ? 1 : 0.72,
                }}
              >
                <div className="cl-card-head">
                  <div className="cl-card-title">{option.label}</div>
                  <StatusBadge
                    status={
                      option.availability === 'AVAILABLE'
                        ? 'READY'
                        : option.availability === 'LIMITED'
                          ? 'LIMITED'
                          : 'BLOCKED'
                    }
                  />
                </div>
                <div className="cl-card-body">
                  <p className="cl-meta" style={{ whiteSpace: 'normal' }}>
                    {option.description}
                  </p>
                  {option.blockerReason ? (
                    <p style={{ marginTop: 8, fontSize: 12.5, color: 'var(--cl-warn)' }}>{option.blockerReason}</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </Section>

      {/* live mirror */}
      {mode === 'LIVE_MAINNET_MIRROR' || mode === 'HISTORICAL_REPLAY' || mode === 'SYNTHETIC' ? (
        <>
          {!snapshot ? (
            <Section label="Snapshot">
              <Card>
                <p className="cl-meta" style={{ whiteSpace: 'normal' }}>
                  No market snapshot has been sealed for this agent. A snapshot is taken from the fork's own reads when the agent is deployed to the local mainnet fork, and every decision after that is valued against it.
                </p>
              </Card>
            </Section>
          ) : (
          <Section
            label="Snapshot"
            actions={<Badge tone={overlay ? 'sim' : 'neutral'}>{overlay ? `Overlay: ${overlay.label}` : 'Base snapshot'}</Badge>}
          >
            <Card>
              <KeyValue
                rows={[
                  { label: 'Snapshot ID', value: snapshot.id, mono: true },
                  {
                    label: 'Mainnet anchor block',
                    value: <BlockchainRef label={snapshot.anchorBlock.toLocaleString('en-US')} value={snapshot.anchorHash} kind="hash" />,
                  },
                  { label: 'Created', value: <TimeAgo iso={snapshot.createdAt} /> },
                  { label: 'Age', value: `${snapshot.ageSeconds}s` },
                  { label: 'Coherence', value: snapshot.coherence },
                  { label: 'Snapshot hash', value: snapshot.hash, mono: true },
                ]}
              />
              {overlay ? (
                <div style={{ marginTop: 14 }}>
                  <BlockerBanner tone="sim" title={`Synthetic overlay applied · ${overlay.label}`}>
                    The base snapshot is unchanged underneath. Overlay effects:{' '}
                    {overlay.effects.map((e) => `${e.key} ${e.value}`).join(' · ')}
                  </BlockerBanner>
                </div>
              ) : null}
            </Card>
          </Section>

          )}
          <Section label="Sources" actions={<span className="cl-meta">Click a row for full provenance</span>}>
            <Card flush>
              <div className="cl-table-scroll">
                <table className="cl-table" style={{ minWidth: 860 }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 150 }}>Provider</th>
                      <th style={{ minWidth: 140 }}>Data</th>
                      <th style={{ minWidth: 150 }}>Value</th>
                      <th style={{ width: 150 }}>Trust class</th>
                      <th style={{ width: 110 }}>Source block</th>
                      <th style={{ width: 190 }}>Freshness</th>
                      <th style={{ width: 130 }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(snapshot?.sources ?? []).map((source) => (
                      <tr
                        key={source.id}
                        data-clickable="true"
                        onClick={() => {
                          setProvenanceOf(source);
                          setSelection({ kind: 'reality-source', id: source.id, label: source.provider });
                        }}
                      >
                        <td className="cl-strong">{source.provider}</td>
                        <td>{source.dataType}</td>
                        <td className="cl-mono">{source.value}</td>
                        <td>
                          <TrustClassBadge trust={source.trustClass} />
                        </td>
                        <td className="cl-mono">{source.sourceBlock?.toLocaleString('en-US') ?? '—'}</td>
                        <td>
                          <FreshnessBadge freshness={source.freshness} compact />
                        </td>
                        <td>
                          <StatusBadge status={source.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>
        </>
      ) : null}

      {/* synthetic overlays */}
      {mode === 'SYNTHETIC' ? (
        <Section
          label="Synthetic overlays"
          actions={
            <div className="cl-row" style={{ gap: 6 }}>
              <button type="button" className="cl-btn cl-btn-sm" onClick={() => setCompareOpen(true)} disabled={!overlay}>
                Compare with Base
              </button>
              <button
                type="button"
                className="cl-btn cl-btn-sm"
                onClick={() => {
                  setAppliedOverlay(null);
                  pushToast('Overlay cleared');
                }}
                disabled={!overlay}
              >
                <Undo2 size={11} aria-hidden />
                Clear Overlay
              </button>
            </div>
          }
        >
          <div className="cl-grid cl-grid-3">
            {overlays.length === 0 ? <p className="cl-meta">Synthetic overlays apply to a sealed snapshot; deploy to the fork first.</p> : null}
            {overlays.map((preset) => (
              <Card key={preset.id} title={preset.label}>
                <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 10 }}>
                  {preset.description}
                </p>
                <dl className="cl-kv" style={{ gridTemplateColumns: 'minmax(0, 110px) minmax(0, 1fr)' }}>
                  {preset.effects.map((e) => (
                    <div key={e.key} style={{ display: 'contents' }}>
                      <dt>{e.key}</dt>
                      <dd className="cl-mono">{e.value}</dd>
                    </div>
                  ))}
                </dl>
                <button
                  type="button"
                  className={`cl-btn cl-btn-sm ${appliedOverlay === preset.id ? 'cl-btn-primary' : ''}`}
                  style={{ marginTop: 10 }}
                  onClick={() => {
                    setAppliedOverlay(preset.id);
                    pushToast(`${preset.label} applied over the base snapshot`);
                  }}
                >
                  <Layers size={11} aria-hidden />
                  {appliedOverlay === preset.id ? 'Applied' : 'Apply Overlay'}
                </button>
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {/* local fork */}
      {mode === 'LOCAL_MAINNET_FORK' ? (
        <>
          <Section label="Local fork">
            {!localFork || !forkLive ? (
              <Card>
                <p className="cl-meta" style={{ whiteSpace: 'normal' }}>
                  {localFork ? `The fork ${localFork.id} is ${localFork.state}${deployment?.record.stoppedReason ? ` — ${deployment.record.stoppedReason}` : ''}.` : 'No fork exists.'}{' '}
                  A fork is created by deploying the agent: it forks mainnet at an exact block, deploys the ContextLock core and opens the positions the agent guards.
                </p>
                <button type="button" className="cl-btn cl-btn-primary" style={{ marginTop: 12 }} onClick={() => router.push(`/projects/${ctx.routeProjectId}/deploy`)}>
                  <Plus size={12} aria-hidden />
                  Create Fork (deploy)
                </button>
              </Card>
            ) : (
              <Card>
                <KeyValue
                  rows={[
                    { label: 'Fork ID', value: localFork.id, mono: true },
                    { label: 'Source chain', value: localFork.sourceChain },
                    {
                      label: 'Forked at block',
                      value: (
                        <BlockchainRef
                          label={localFork.blockNumber.toLocaleString('en-US')}
                          value={localFork.blockHash}
                          kind="hash"
                          local
                        />
                      ),
                    },
                    { label: 'Anvil version', value: localFork.anvilVersion, mono: true },
                    { label: 'State', value: <StatusBadge status={localFork.state} /> },
                    {
                      label: 'Resource lifetime',
                      value: `${Math.round(localFork.lifetimeSeconds / 60)} minutes remaining · dies with the Studio server`,
                    },
                    ...(developerMode
                      ? [{ label: 'Local endpoint', value: localFork.endpoint, mono: true }]
                      : []),
                  ]}
                />

                <div className="cl-btn-group" style={{ marginTop: 14 }}>
                  <button type="button" className="cl-btn cl-btn-sm" disabled title="The fork lab does not expose reset; stop the deployment and deploy again to fork afresh.">
                    <RotateCcw size={11} aria-hidden />
                    Reset Fork
                  </button>
                  <button type="button" className="cl-btn cl-btn-sm" disabled title="Not offered by the fork lab.">
                    <Save size={11} aria-hidden />
                    Snapshot Fork
                  </button>
                  <button type="button" className="cl-btn cl-btn-sm" disabled title="Not offered by the fork lab.">
                    <Undo2 size={11} aria-hidden />
                    Restore
                  </button>
                  <button type="button" className="cl-btn cl-btn-sm cl-btn-primary" onClick={() => void tickFork()}>
                    <Play size={11} aria-hidden />
                    Observe now
                  </button>
                  <span className="cl-spacer" />
                  <button type="button" className="cl-btn cl-btn-sm cl-btn-danger" onClick={() => setDestroyOpen(true)}>
                    <Trash2 size={11} aria-hidden />
                    Destroy Fork
                  </button>
                </div>
              </Card>
            )}
          </Section>

          {localFork && deployment ? (
            <Section label="Fork transactions">
              <Card flush>
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th style={{ width: 170 }}>Kind</th>
                      <th>Transaction</th>
                      <th style={{ width: 130 }}>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deployment.record.setupTransactions.map((tx) => (
                      <tr key={tx.hash}>
                        <td><Badge tone="sim">LOCAL FORK TRANSACTION</Badge></td>
                        <td>
                          <div className="cl-meta">{tx.label} · block {tx.blockNumber} · {tx.gasUsed} gas</div>
                          {/* local=true: a fork transaction never gets a public explorer link */}
                          <BlockchainRef value={tx.hash} kind="tx" local />
                        </td>
                        <td><StatusBadge status={tx.status === 'success' ? 'PASS' : 'FAIL'} /></td>
                      </tr>
                    ))}
                    {deployment.record.setupTransactions.length === 0 ? <tr><td colSpan={3} className="cl-meta">No transactions yet.</td></tr> : null}
                  </tbody>
                </table>
              </Card>
              <p className="cl-meta" style={{ marginTop: 8 }}>
                Fork transactions exist only on your local node. They are never given a public explorer link, because
                there is nothing public to link to. The agent's own executions are on the Activity page.
              </p>
            </Section>
          ) : null}
        </>
      ) : null}

      {/* historical replay limits */}
      {mode === 'HISTORICAL_REPLAY' ? (
        <BlockerBanner tone="warn" title={`Historical Replay is ${modes.find((m) => m.mode === 'HISTORICAL_REPLAY')?.availability ?? 'LIMITED'}`}>
          {modes.find((m) => m.mode === 'HISTORICAL_REPLAY')?.blockerReason ?? 'No archive RPC is registered. Anything older than the recent-state window is unavailable — it is not approximated from another source.'}
        </BlockerBanner>
      ) : null}

      {/* provenance drawer */}
      <Modal
        open={provenanceOf !== null}
        onClose={() => setProvenanceOf(null)}
        title={provenanceOf ? `${provenanceOf.provider} · provenance` : ''}
        wide
        footer={
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => setProvenanceOf(null)}>
            Close
          </button>
        }
      >
        {provenanceOf ? (
          <>
            <div className="cl-row cl-row-wrap" style={{ gap: 6, marginBottom: 14 }}>
              <TrustClassBadge trust={provenanceOf.trustClass} />
              <StatusBadge status={provenanceOf.status} />
              <FreshnessBadge freshness={provenanceOf.freshness} />
            </div>
            <KeyValue
              rows={[
                { label: 'Data type', value: provenanceOf.dataType },
                { label: 'Value', value: provenanceOf.value, mono: true },
                { label: 'Source block', value: provenanceOf.sourceBlock?.toLocaleString('en-US') ?? '—' },
                { label: 'Source time', value: provenanceOf.sourceTime ? <TimeAgo iso={provenanceOf.sourceTime} /> : '—' },
                { label: 'Lifecycle', value: provenanceOf.lifecycle },
                ...provenanceOf.provenance.map((p) => ({ label: p.key, value: p.value, mono: p.mono })),
              ]}
            />
          </>
        ) : null}
      </Modal>

      {/* compare with base */}
      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Overlay compared with base snapshot"
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
              <th style={{ width: 200 }}>Base</th>
              <th style={{ width: 220 }}>With {overlay?.label}</th>
            </tr>
          </thead>
          <tbody>
            {(overlay?.effects ?? []).map((e) => (
              <tr key={e.key}>
                <td className="cl-strong">{e.key}</td>
                <td className="cl-mono">{e.value.split('→')[0]?.trim() ?? '—'}</td>
                <td className="cl-mono" style={{ color: 'var(--cl-sim)' }}>
                  {e.value.split('→')[1]?.trim() ?? e.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cl-meta" style={{ marginTop: 12 }}>
          The base snapshot {snapshot?.id ?? ''} is immutable. An overlay is a view on top of it and can be cleared without
          re-reading the chain.
        </p>
      </Modal>

      {/* destroy fork */}
      <StandardConfirmation
        open={destroyOpen}
        onClose={() => setDestroyOpen(false)}
        onConfirm={() => {
          setDestroyOpen(false);
          void destroyFork();
        }}
        title="Destroy fork"
        consequence="The local node and all state produced on it are discarded. Nothing on a public chain is affected, because a fork never touches one."
        resource={localFork?.id ?? 'fork'}
        actionLabel="Destroy Fork"
      />
    </StudioPage>
  );
}
