'use client';

/**
 * Attack Lab (spec §17).
 *
 * Turns the security model into something you can run and watch fail.
 *
 * Rules encoded here:
 *  - A result lists only the defences the run actually exercised. A layer that
 *    was never reached is not claimed as a defence.
 *  - An attack that cannot apply to this principal says so and reports no
 *    result, rather than showing a reassuring green.
 *  - The mainnet write attempt is always offered for a write-capable agent.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, GitCompare, Play, Route, ShieldCheck, Swords } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockerBanner,
  Card,
  KeyValue,
  ReasonCode,
  SecurityPath,
  Section,
  SeverityBadge,
  StatusBadge,
  TimeAgo,
} from '@/components/studio/primitives';
import { Modal } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { ATTACK_CATEGORIES } from '@/lib/studio/content/test';
import { toAttacks } from '@/lib/studio/api/adapters/test';
import { useAttacks } from '@/lib/studio/api/queries';
import { lab } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import { EmptyState } from '@/components/studio/primitives';
import type { Attack, Status } from '@/lib/studio/types';
import type { AttackRun } from '@/lib/studio/api/types';

export default function AttackLabPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelection, pushToast } = useWorkbench();

  const { agent, agentSlug, ctx } = useStudioPage('attacks');
  const catalogue = useAttacks(ctx.dataProjectId);

  /* Runs made on this page, by scenario. A run exercises the real guards on the backend. */
  const [runs, setRuns] = useState<Record<string, AttackRun | undefined>>({});
  /* Applicability is decided by the backend from the Blueprint: an agent with no execution path has
     nothing for a transaction-mutation attack to target, and the catalogue says so per scenario. */
  const attacks = useMemo(() => (catalogue.data ? toAttacks(catalogue.data, runs) : []), [catalogue.data, runs]);

  const [selectedId, setSelectedId] = useState<string>('');
  const [results, setResults] = useState<Record<string, Status | undefined>>({});
  const [running, setRunning] = useState<string[]>([]);
  const [pathOpen, setPathOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    setRuns({});
    setResults({});
  }, [ctx.dataProjectId]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const selected: Attack | null = attacks.find((a) => a.id === selectedId) ?? attacks[0] ?? null;
  const selectedResult = selected ? (results[selected.id] ?? selected.lastResult) : null;

  const grouped = useMemo(
    () =>
      ATTACK_CATEGORIES.map((category) => ({
        ...category,
        attacks: attacks.filter((a) => a.category === category.id),
      })).filter((c) => c.attacks.length > 0),
    [attacks],
  );

  const applicable = attacks.filter((a) => a.applicable);

  const run = async (ids: string[]) => {
    const runnable = ids.filter((id) => attacks.find((a) => a.id === id)?.applicable);
    if (runnable.length === 0 || !ctx.dataProjectId) {
      pushToast('Nothing to run: these attacks do not apply to this agent');
      return;
    }
    setError(null);
    setRunning(runnable);
    for (const id of runnable) {
      try {
        const r = await lab.runAttack(ctx.dataProjectId, id);
        setRuns((prev) => ({ ...prev, [id]: r }));
        setResults((prev) => ({ ...prev, [id]: r.result === 'DENIED' ? 'DENY' : r.result === 'ALLOWED' ? 'FAIL' : 'UNKNOWN' }));
      } catch (e) {
        setError(e instanceof ApiError ? e.message : String(e));
      } finally {
        setRunning((prev) => prev.filter((x) => x !== id));
      }
    }
  };

  const select = (attack: Attack) => {
    setSelectedId(attack.id);
    setSelection({ kind: 'attack', id: attack.id, label: attack.name });
  };

  if (!selected) {
    return (
      <StudioPage segment="attacks">
        <EmptyState
          title={ctx.loading || catalogue.isLoading ? 'Loading…' : 'No attacks to run yet'}
          body={ctx.loading || catalogue.isLoading ? '' : 'The attack catalogue is derived from the Blueprint. Describe the agent first and generate it.'}
          action={ctx.loading ? undefined : <button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/build`)}>Build Agent</button>}
        />
      </StudioPage>
    );
  }

  return (
    <StudioPage
      segment="attacks"
      bleed
      banners={
        <>
        {error ? <BlockerBanner tone="deny" title="The Studio API refused the run">{error}</BlockerBanner> : null}
        <div className="cl-row cl-row-wrap" style={{ marginBottom: 12, gap: 8 }}>
          <span className="cl-page-title" style={{ fontSize: 22, marginRight: 8 }}>
            Attack Lab
          </span>
          <Badge tone="neutral">{agent.name}</Badge>
          <Badge tone="neutral">
            {applicable.length} of {attacks.length} applicable
          </Badge>
          {agent.executionClass === 'REPORTING_ONLY' ? <Badge tone="blocked">EXECUTION: NONE</Badge> : null}
          <span className="cl-spacer" />
          <div className="cl-btn-group">
            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => void run([selected.id])}
              disabled={!selected.applicable || running.length > 0}
            >
              <Play size={11} aria-hidden />
              Run Attack
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-sm cl-btn-primary"
              onClick={() => void run(applicable.map((a) => a.id))}
              disabled={running.length > 0 || applicable.length === 0}
            >
              <Swords size={11} aria-hidden />
              Run All Applicable ({applicable.length})
            </button>
          </div>
        </div>
        </>
      }
    >
      {agent.executionClass === 'REPORTING_ONLY' ? (
        <div style={{ padding: '0 16px 12px' }}>
          <BlockerBanner tone="neutral" title="Most attacks do not apply to this agent">
            {agent.name} holds no execution authority, so transaction mutation, replay, cross-chain and network-boundary
            attacks have nothing to target. They are marked not applicable and report no result — an attack that was
            never run is never shown as defended.
          </BlockerBanner>
        </div>
      ) : null}

      <div className="cl-split" style={{ borderTop: '1px solid var(--cl-line)' }}>
        {/* catalog */}
        <div className="cl-split-side" data-lenis-prevent style={{ flex: '0 0 330px' }}>
          {grouped.map((category) => (
            <div key={category.id}>
              <div className="cl-explorer-group" style={{ paddingTop: 12 }}>
                <span className="cl-label">{category.label}</span>
              </div>
              <ul>
                {category.attacks.map((attack) => {
                  const result = running.includes(attack.id) ? 'RUNNING' : (results[attack.id] ?? attack.lastResult);
                  return (
                    <li key={attack.id}>
                      <div
                        className="cl-list-row"
                        data-selected={attack.id === selectedId}
                        onClick={() => select(attack)}
                        style={{ alignItems: 'flex-start', opacity: attack.applicable ? 1 : 0.62 }}
                      >
                        <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                          <span style={{ display: 'block' }}>{attack.name}</span>
                          <span className="cl-meta" style={{ display: 'block', marginTop: 3 }}>
                            {attack.applicable ? (
                              <>
                                {attack.lastRun ? <TimeAgo iso={attack.lastRun} /> : 'never run'}
                                {attack.stoppingLayer ? ` · stopped by ${attack.stoppingLayer}` : ''}
                              </>
                            ) : (
                              'Not applicable'
                            )}
                          </span>
                        </span>
                        <span className="cl-col" style={{ gap: 3, alignItems: 'flex-end' }}>
                          <SeverityBadge severity={attack.severity} />
                          {attack.applicable ? (
                            result ? (
                              <StatusBadge status={result} />
                            ) : (
                              <StatusBadge status="UNKNOWN" />
                            )
                          ) : null}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* detail */}
        <div className="cl-split-main" data-lenis-prevent>
          <div className="cl-page-pad" style={{ maxWidth: 900 }}>
            <header className="cl-page-head">
              <div className="cl-page-head-main">
                <h1 className="cl-page-title" style={{ fontSize: 24 }}>
                  {selected.name}
                </h1>
                <p className="cl-page-sub">{selected.description}</p>
                <div className="cl-row cl-row-wrap" style={{ marginTop: 10 }}>
                  <SeverityBadge severity={selected.severity} />
                  {selected.applicable ? (
                    running.includes(selected.id) ? (
                      <StatusBadge status="RUNNING" large />
                    ) : selectedResult ? (
                      <StatusBadge status={selectedResult} large />
                    ) : (
                      <StatusBadge status="UNKNOWN" large />
                    )
                  ) : (
                    <Badge tone="blocked" large>
                      Not applicable
                    </Badge>
                  )}
                </div>
              </div>
              <div className="cl-page-actions">
                <button type="button" className="cl-btn cl-btn-sm" onClick={() => setPathOpen(true)} disabled={!selected.applicable}>
                  <Route size={11} aria-hidden />
                  View Security Path
                </button>
                <button type="button" className="cl-btn cl-btn-sm" onClick={() => setCompareOpen(true)} disabled={!selected.applicable}>
                  <GitCompare size={11} aria-hidden />
                  Compare with Baseline
                </button>
                {selected.relatedPolicyRuleId ? (
                  <button
                    type="button"
                    className="cl-btn cl-btn-sm"
                    onClick={() => router.push(`/projects/${ctx.routeProjectId}/policies?agent=${agentSlug}`)}
                  >
                    <ShieldCheck size={11} aria-hidden />
                    Open Policy Rule
                  </button>
                ) : null}
                {selected.relatedSimulationId ? (
                  <button
                    type="button"
                    className="cl-btn cl-btn-sm"
                    onClick={() =>
                      router.push(
                        `/projects/${ctx.routeProjectId}/simulation?agent=${agentSlug}&scenario=${selected.relatedSimulationId}`,
                      )
                    }
                  >
                    Open Simulation
                  </button>
                ) : null}
                <button
                  type="button"
                  className="cl-btn cl-btn-sm"
                  onClick={() => pushToast('Attack result exported')}
                  disabled={!selected.applicable}
                >
                  <Download size={11} aria-hidden />
                  Export Result
                </button>
              </div>
            </header>

            {!selected.applicable ? (
              <BlockerBanner tone="blocked" title="Not applicable to this agent">
                {selected.notApplicableReason}
              </BlockerBanner>
            ) : (
              <>
                {selected.mutation ? (
                  <Section label="Mutation">
                    <Card>
                      <KeyValue
                        rows={[
                          { label: 'Field', value: selected.mutation.field, mono: true },
                          {
                            label: 'Original',
                            value: <span className="cl-mono">{selected.mutation.original}</span>,
                          },
                          {
                            label: 'Injected',
                            value: (
                              <span className="cl-mono" style={{ color: 'var(--cl-deny)' }}>
                                {selected.mutation.injected}
                              </span>
                            ),
                          },
                        ]}
                      />
                    </Card>
                  </Section>
                ) : null}

                <Section label="Result">
                  <Card>
                    <div className="cl-row cl-row-wrap" style={{ gap: 10, marginBottom: 14 }}>
                      {selectedResult ? <StatusBadge status={selectedResult} large /> : <StatusBadge status="UNKNOWN" large />}
                      {selected.reasonCode ? (
                        <ReasonCode
                          code={selected.reasonCode}
                          verdict="DENY"
                          onOpenPolicy={() => router.push(`/projects/${ctx.routeProjectId}/policies?agent=${agentSlug}`)}
                          onOpenSimulation={() =>
                            router.push(
                              `/projects/${ctx.routeProjectId}/simulation?agent=${agentSlug}&scenario=${selected.relatedSimulationId ?? ''}`,
                            )
                          }
                        />
                      ) : null}
                    </div>

                    <KeyValue
                      rows={[
                        { label: 'Stopped by', value: selected.stoppingLayer ?? '—' },
                        {
                          label: 'Capability',
                          value: runs[selected.id] ? (
                            runs[selected.id]!.capabilityIssued ? <Badge tone="deny">ISSUED</Badge> : <Badge tone="blocked">NOT ISSUED</Badge>
                          ) : (
                            '—'
                          ),
                        },
                        {
                          label: 'Transaction',
                          value: runs[selected.id] ? (
                            runs[selected.id]!.transactionSubmitted ? <Badge tone="deny">SUBMITTED</Badge> : <Badge tone="blocked">NOT SUBMITTED</Badge>
                          ) : (
                            '—'
                          ),
                        },
                        {
                          label: 'Stopped where expected',
                          value: runs[selected.id] ? <StatusBadge status={runs[selected.id]!.stoppedWhereExpected ? 'PASS' : 'WARN'} /> : '—',
                        },
                        { label: 'Last run', value: selected.lastRun ? <TimeAgo iso={selected.lastRun} /> : 'never' },
                      ]}
                    />
                  </Card>
                </Section>

                <Section
                  label="Defences exercised"
                  actions={<span className="cl-meta">Only layers this run actually reached</span>}
                >
                  <Card>
                    {selected.defencesExercised.length === 0 ? (
                      <p className="cl-meta">This attack has not been run, so no defence has been exercised.</p>
                    ) : (
                      <>
                        <div className="cl-row cl-row-wrap" style={{ gap: 6 }}>
                          {selected.defencesExercised.map((d) => (
                            <Badge key={d} tone="pass">
                              {d}
                            </Badge>
                          ))}
                        </div>
                        <p className="cl-meta" style={{ marginTop: 10, whiteSpace: 'normal' }}>
                          Layers further down the path were never reached in this run, so they are not claimed as
                          defences against this attack.
                        </p>
                      </>
                    )}
                  </Card>
                </Section>

                <Section label="Security path">
                  <SecurityPath
                    steps={selected.path}
                    onReasonCode={() => router.push(`/projects/${ctx.routeProjectId}/policies?agent=${agentSlug}`)}
                  />
                </Section>
              </>
            )}
          </div>
        </div>
      </div>

      {/* security path */}
      <Modal
        open={pathOpen}
        onClose={() => setPathOpen(false)}
        title={`${selected.name} · security path`}
        wide
        footer={
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => setPathOpen(false)}>
            Close
          </button>
        }
      >
        <SecurityPath steps={selected.path} />
      </Modal>

      {/* compare with baseline */}
      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title="Compared with the baseline run"
        subtitle="The same action without the attack applied."
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
              <th>Layer</th>
              <th style={{ width: 150 }}>Baseline</th>
              <th style={{ width: 190 }}>Under attack</th>
            </tr>
          </thead>
          <tbody>
            {selected.path.length === 0 ? <tr><td colSpan={3} className="cl-meta">Run the attack first — the path is what the guards actually did.</td></tr> : null}
            {selected.path.map((step) => (
              <tr key={step.layer}>
                <td className="cl-strong">{step.layer}</td>
                <td>
                  {/* The baseline for a layer the run reached is PASS; a layer never reached has no baseline to claim. */}
                  <StatusBadge status={step.status === 'NOT_SUBMITTED' || step.status === 'NOT_ISSUED' || step.status === 'UNKNOWN' ? 'UNKNOWN' : 'PASS'} />
                </td>
                <td>
                  <StatusBadge status={step.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="cl-meta" style={{ marginTop: 12 }}>
          The baseline is the same action with no mutation applied. The first row where the two diverge is the layer
          that stopped this attack.
        </p>
      </Modal>
    </StudioPage>
  );
}
