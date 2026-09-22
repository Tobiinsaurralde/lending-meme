'use client';

/**
 * Activity (spec §22).
 *
 * Queryable audit timeline across agent, CRE, policy, chain, adapters and
 * runtime.
 *
 * Rules encoded here:
 *  - Open transaction is offered only for a real testnet transaction. A
 *    local-fork transaction never receives a public explorer link.
 *  - A confidential event's payload is not rendered; only its public metadata.
 *  - Correlation traces the whole run back to the trigger that started it.
 */
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Copy, Download, Route, X } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockchainRef,
  Card,
  FreshnessBadge,
  KeyValue,
  ReasonCode,
  Section,
  StatusBadge,
  Timestamp,
  TimeAgo,
  VerdictBadge,
} from '@/components/studio/primitives';
import { useWorkbench } from '@/lib/studio/workbench';
import { useActivity } from '@/lib/studio/api/queries';
import { toRuntimeEvent } from '@/lib/studio/api/adapters/operate';
import { EmptyState } from '@/components/studio/primitives';
import type { EventSource, RuntimeEvent } from '@/lib/studio/types';

const SOURCES: EventSource[] = ['agent', 'cre', 'policy', 'chain', 'adapter', 'runtime', 'operator'];

export default function ActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelection, pushToast } = useWorkbench();

  const { agent, agentSlug, project, ctx } = useStudioPage('activity');
  const eventsQ = useActivity(ctx.deploymentId, { limit: '500' }, true);
  /* The persisted RuntimeEvent stream for this deployment, newest first, as the backend holds it. */
  const EVENTS = useMemo<RuntimeEvent[]>(
    () => (eventsQ.data ?? []).map((e) => toRuntimeEvent(e, agent.id, ctx.deployment?.blueprintRevision ?? null, project.environment.creMode)),
    [eventsQ.data, agent.id, ctx.deployment?.blueprintRevision, project.environment.creMode],
  );

  const [source, setSource] = useState<EventSource | 'all'>('all');
  const [verdict, setVerdict] = useState<'all' | 'ALLOW' | 'ESCALATE' | 'DENY'>('all');
  const [query, setQuery] = useState(searchParams.get('correlation') ?? '');
  const [selectedId, setSelectedId] = useState<string | null>(searchParams.get('event'));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EVENTS.filter((event) => {
      if (source !== 'all' && event.source !== source) return false;
      if (verdict !== 'all' && event.verdict !== verdict) return false;
      if (!q) return true;
      return (
        event.id.toLowerCase().includes(q) ||
        event.type.toLowerCase().includes(q) ||
        event.summary.toLowerCase().includes(q) ||
        event.correlationId.toLowerCase().includes(q) ||
        (event.txHash ?? '').toLowerCase().includes(q)
      );
    });
  }, [source, verdict, query, EVENTS]);

  const selected = EVENTS.find((e) => e.id === selectedId) ?? null;

  /* The full run behind one event, oldest first. */
  const correlated = useMemo(
    () =>
      selected
        ? EVENTS.filter((e) => e.correlationId === selected.correlationId).slice().reverse()
        : [],
    [selected, EVENTS],
  );

  const select = (event: RuntimeEvent) => {
    setSelectedId(event.id);
    setSelection({ kind: 'runtime-event', id: event.id, label: event.type });
  };

  if (!ctx.deploymentId) {
    return (
      <StudioPage segment="activity">
        <EmptyState
          title={ctx.loading ? 'Loading…' : 'No deployment to observe'}
          body={ctx.loading ? '' : 'RuntimeEvents are recorded by a deployment. This agent has none yet; deploy it to the local mainnet fork and every decision, capability and fork transaction appears here.'}
          action={ctx.loading ? undefined : <button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/deploy?agent=${agentSlug}`)}>Run Deployment Preflight</button>}
        />
      </StudioPage>
    );
  }

  return (
    <StudioPage
      segment="activity"
      bleed
      live
      banners={
        <div className="cl-row cl-row-wrap" style={{ marginBottom: 12, gap: 8 }}>
          <span className="cl-page-title" style={{ fontSize: 22, marginRight: 8 }}>
            Activity
          </span>
          <Badge tone="neutral">{agent.name}</Badge>
          <Badge tone="pass">
            {filtered.length} of {EVENTS.length} events
          </Badge>
          <span className="cl-spacer" />

          <div className="cl-row cl-row-wrap" style={{ gap: 6 }}>
            <select
              className="cl-select"
              style={{ width: 150 }}
              value={source}
              onChange={(e) => setSource(e.target.value as EventSource | 'all')}
              aria-label="Filter by source"
            >
              <option value="all">All sources</option>
              {SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              className="cl-select"
              style={{ width: 150 }}
              value={verdict}
              onChange={(e) => setVerdict(e.target.value as typeof verdict)}
              aria-label="Filter by verdict"
            >
              <option value="all">All verdicts</option>
              <option value="ALLOW">ALLOW</option>
              <option value="ESCALATE">ESCALATE</option>
              <option value="DENY">DENY</option>
            </select>
            <input
              className="cl-input"
              style={{ width: 250 }}
              placeholder="Event, type, correlation or tx"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search events"
            />
          </div>
        </div>
      }
    >
      <div className="cl-split" style={{ borderTop: '1px solid var(--cl-line)' }}>
        {/* timeline */}
        <div className="cl-split-main" data-lenis-prevent>
          <div className="cl-table-scroll">
            <table className="cl-table" style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th style={{ width: 180 }}>Timestamp</th>
                  <th style={{ width: 95 }}>Source</th>
                  <th style={{ width: 200 }}>Event</th>
                  <th style={{ width: 120 }}>Status</th>
                  <th style={{ minWidth: 260 }}>Summary</th>
                  <th style={{ width: 130 }}>Correlation</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((event) => (
                  <tr
                    key={event.id}
                    data-clickable="true"
                    data-selected={event.id === selectedId}
                    onClick={() => select(event)}
                  >
                    <td>
                      <Timestamp iso={event.at} />
                    </td>
                    <td className="cl-mono">{event.source}</td>
                    <td className="cl-mono" style={{ fontSize: 11.5 }}>
                      {event.type}
                    </td>
                    <td>
                      {event.verdict ? <VerdictBadge verdict={event.verdict} /> : <StatusBadge status={event.status} />}
                    </td>
                    <td>{event.summary}</td>
                    <td className="cl-mono" style={{ fontSize: 11 }}>
                      {event.correlationId}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <span className="cl-meta">No events match these filters.</span>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* event detail */}
        {selected ? (
          <div className="cl-drawer" style={{ flex: '0 0 380px' }} data-lenis-prevent>
            <div className="cl-drawer-head">
              <span className="cl-label" style={{ flex: '1 1 auto' }}>
                Event detail
              </span>
              <button
                type="button"
                className="cl-btn cl-btn-ghost cl-btn-sm"
                onClick={() => setSelectedId(null)}
                aria-label="Close event detail"
              >
                <X size={13} aria-hidden />
              </button>
            </div>
            <div className="cl-drawer-body">
              <div className="cl-h1" style={{ marginBottom: 4 }}>
                {selected.type}
              </div>
              <p className="cl-meta" style={{ whiteSpace: 'normal', marginBottom: 12 }}>
                {selected.summary}
              </p>

              <div className="cl-row cl-row-wrap" style={{ gap: 6, marginBottom: 14 }}>
                {selected.verdict ? <VerdictBadge verdict={selected.verdict} /> : null}
                <StatusBadge status={selected.status} />
                {selected.confidential ? <Badge tone="blocked">Confidential</Badge> : null}
              </div>

              {selected.reasonCode ? (
                <div style={{ marginBottom: 14 }}>
                  <ReasonCode
                    code={selected.reasonCode}
                    verdict={selected.verdict ?? undefined}
                    onOpenPolicy={() => router.push(`/projects/${ctx.routeProjectId}/policies?agent=${agentSlug}`)}
                  />
                </div>
              ) : null}

              <KeyValue
                rows={[
                  { label: 'Event ID', value: selected.id, mono: true },
                  { label: 'Source', value: selected.source },
                  { label: 'Time', value: <Timestamp iso={selected.at} /> },
                  { label: 'Agent', value: agent.name },
                  {
                    label: 'Deployment / Blueprint',
                    value: `r${selected.deploymentRevision ?? '—'} / r${selected.blueprintRevision ?? '—'}`,
                  },
                  { label: 'Correlation', value: selected.correlationId, mono: true },
                  ...(selected.capability
                    ? [
                        {
                          label: 'Capability',
                          value: (
                            <span className="cl-row cl-row-wrap" style={{ gap: 6 }}>
                              <span className="cl-mono">{selected.capability.id}</span>
                              <StatusBadge status={selected.capability.issued ? 'PASS' : 'NOT_ISSUED'} />
                            </span>
                          ),
                        },
                      ]
                    : []),
                  ...(selected.creExecution
                    ? [
                        {
                          label: 'CRE execution',
                          value: (
                            <span className="cl-row cl-row-wrap" style={{ gap: 6 }}>
                              <span className="cl-mono">{selected.creExecution.id}</span>
                              <Badge tone="sim">SIMULATED</Badge>
                            </span>
                          ),
                        },
                      ]
                    : []),
                  ...(selected.txHash
                    ? [
                        {
                          label: 'Transaction',
                          value: (
                            <BlockchainRef
                              value={selected.txHash}
                              kind="tx"
                              network={selected.txKind === 'TESTNET' ? project.environment.executionNetwork : undefined}
                              local={selected.txKind === 'LOCAL_FORK'}
                            />
                          ),
                        },
                      ]
                    : []),
                ]}
              />

              {selected.publicMetadata.length > 0 ? (
                <div style={{ marginTop: 16 }}>
                  <div className="cl-label" style={{ marginBottom: 8 }}>
                    Public metadata
                  </div>
                  <KeyValue
                    rows={selected.publicMetadata.map((m) => ({ label: m.key, value: m.value, mono: m.mono }))}
                  />
                  {selected.confidential ? (
                    <p className="cl-meta" style={{ marginTop: 8, whiteSpace: 'normal' }}>
                      This event also carries a confidential payload. It is not rendered here, in developer mode or
                      otherwise.
                    </p>
                  ) : null}
                </div>
              ) : null}

              {selected.sourceFreshness ? (
                <div style={{ marginTop: 16 }}>
                  <div className="cl-label" style={{ marginBottom: 8 }}>
                    Source freshness
                  </div>
                  <FreshnessBadge freshness={selected.sourceFreshness} />
                </div>
              ) : null}

              {/* correlation trace */}
              {correlated.length > 1 ? (
                <div style={{ marginTop: 18 }}>
                  <div className="cl-label" style={{ marginBottom: 8 }}>
                    Full run
                  </div>
                  <div className="cl-trace">
                    {correlated.map((event) => (
                      <div className="cl-trace-node" key={event.id}>
                        <button
                          type="button"
                          onClick={() => select(event)}
                          style={{ textAlign: 'left', cursor: 'pointer', width: '100%' }}
                        >
                          <span className="cl-trace-title" style={{ color: event.id === selected.id ? 'var(--cl-ink)' : undefined }}>
                            {event.type}
                          </span>
                          <span className="cl-trace-meta">
                            <TimeAgo iso={event.at} /> · {event.source}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* actions */}
              <div className="cl-col" style={{ gap: 6, marginTop: 18 }}>
                <button
                  type="button"
                  className="cl-btn cl-btn-block"
                  onClick={() => setQuery(selected.correlationId)}
                >
                  <Route size={12} aria-hidden />
                  Trace full run
                </button>
                {selected.txKind === 'TESTNET' && selected.txHash ? (
                  <a
                    className="cl-btn cl-btn-block"
                    href={`https://sepolia.etherscan.io/tx/${selected.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open transaction
                  </a>
                ) : null}
                {selected.verdict ? (
                  <button
                    type="button"
                    className="cl-btn cl-btn-block"
                    onClick={() => router.push(`/projects/${ctx.routeProjectId}/policies?agent=${agentSlug}`)}
                  >
                    Open decision
                  </button>
                ) : null}
                {selected.creExecution ? (
                  <button
                    type="button"
                    className="cl-btn cl-btn-block"
                    onClick={() => router.push(`/projects/${ctx.routeProjectId}/simulation?agent=${agentSlug}`)}
                  >
                    Open simulation
                  </button>
                ) : null}
                <button
                  type="button"
                  className="cl-btn cl-btn-block"
                  onClick={() => {
                    navigator.clipboard?.writeText(selected.correlationId);
                    pushToast('Correlation ID copied');
                  }}
                >
                  <Copy size={12} aria-hidden />
                  Copy correlation ID
                </button>
                <button
                  type="button"
                  className="cl-btn cl-btn-block"
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(correlated, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `trace-${selected.correlationId}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    pushToast('Trace exported — public metadata only; the backend never emits confidential fields');
                  }}
                >
                  <Download size={12} aria-hidden />
                  Export sanitized trace
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </StudioPage>
  );
}
