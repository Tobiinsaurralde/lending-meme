'use client';

/**
 * Bottom panel (spec §3.4) — belongs to the center workspace so the product
 * stays a three-segment IDE.
 *
 * Tabs: Problems · Output · Tests · Events · Terminal (developer mode only —
 * and never a privileged host shell).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownToLine, Copy, Eraser, Maximize2, Minimize2, PlayCircle, X } from 'lucide-react';
import { LogMessage, StatusBadge, SeverityBadge, Timestamp } from '../primitives';
import { useWorkbench } from '@/lib/studio/workbench';
import { useStudioProject } from '@/lib/studio/api/project-context';
import { logAsText } from '@/lib/studio/log';
import type { BottomPanelTab, RuntimeEvent } from '@/lib/studio/types';

export function BottomPanel({ projectId, events }: { projectId: string; events: RuntimeEvent[] }) {
  const router = useRouter();
  const { bottomTab, setBottomTab, toggleBottom, bottomMaximized, toggleBottomMaximized, developerMode, pushToast } =
    useWorkbench();
  const { problems: PROBLEMS, tests: TEST_RESULTS, buildLog: OUTPUT_LOG } = useStudioProject();
  const [follow, setFollow] = useState(true);
  const [cleared, setCleared] = useState<Partial<Record<BottomPanelTab, boolean>>>({});
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const tabs: { id: BottomPanelTab; label: string; count?: number }[] = useMemo(() => {
    const base: { id: BottomPanelTab; label: string; count?: number }[] = [
      { id: 'problems', label: 'Problems', count: PROBLEMS.length },
      { id: 'output', label: 'Output' },
      { id: 'tests', label: 'Tests', count: TEST_RESULTS.filter((t) => t.status === 'FAIL').length || undefined },
      { id: 'events', label: 'Events', count: events.length },
    ];
    if (developerMode) base.push({ id: 'terminal', label: 'Terminal' });
    return base;
  }, [events.length, developerMode, PROBLEMS.length, TEST_RESULTS]);

  useEffect(() => {
    if (follow && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [follow, bottomTab]);

  const copySelected = () => {
    const selection = window.getSelection()?.toString();
    navigator.clipboard?.writeText(selection || '');
    pushToast(selection ? 'Copied selection' : 'Nothing selected');
  };

  const downloadLog = () => {
    // The build event stream carries public build metadata only; the server never emits a secret
    // into it (the redaction scanner runs on every public surface).
    const body = logAsText(OUTPUT_LOG);
    const blob = new Blob([body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contextlock-${bottomTab}-sanitized.log`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Sanitized log downloaded');
  };

  return (
    /* The console area runs dark in any theme — the token swap carries tables,
       badges and logs with it, so nothing inside needs its own dark styling. */
    <section className="cl-bottom cl-theme-dark cl-console" aria-label="Panel">
      <div className="cl-bottom-head">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className="cl-bottom-tab"
            data-active={bottomTab === tab.id}
            onClick={() => setBottomTab(tab.id)}
            role="tab"
            aria-selected={bottomTab === tab.id}
          >
            {tab.label}
            {tab.count ? (
              <span className="cl-badge" data-tone="neutral" style={{ height: 15, padding: '0 5px', fontSize: 9 }}>
                {tab.count}
              </span>
            ) : null}
          </button>
        ))}

        <span className="cl-spacer" />

        <button
          type="button"
          className="cl-btn cl-btn-ghost cl-btn-sm"
          onClick={() => setFollow((v) => !v)}
          title="Follow Output"
          aria-pressed={follow}
        >
          <PlayCircle size={12} aria-hidden />
          Follow
        </button>
        <button type="button" className="cl-btn cl-btn-ghost cl-btn-sm" onClick={copySelected} title="Copy Selected">
          <Copy size={12} aria-hidden />
          Copy
        </button>
        <button type="button" className="cl-btn cl-btn-ghost cl-btn-sm" onClick={downloadLog} title="Download Sanitized Log">
          <ArrowDownToLine size={12} aria-hidden />
          Log
        </button>
        <button
          type="button"
          className="cl-btn cl-btn-ghost cl-btn-sm"
          onClick={() => setCleared((c) => ({ ...c, [bottomTab]: true }))}
          title="Clear"
          disabled={bottomTab === 'problems' || bottomTab === 'tests'}
        >
          <Eraser size={12} aria-hidden />
          Clear
        </button>
        <button
          type="button"
          className="cl-btn cl-btn-ghost cl-btn-sm"
          onClick={toggleBottomMaximized}
          title="Maximize Panel"
          aria-label="Maximize panel"
        >
          {bottomMaximized ? <Minimize2 size={12} aria-hidden /> : <Maximize2 size={12} aria-hidden />}
        </button>
        <button
          type="button"
          className="cl-btn cl-btn-ghost cl-btn-sm"
          onClick={toggleBottom}
          title="Toggle Panel"
          aria-label="Close panel"
        >
          <X size={12} aria-hidden />
        </button>
      </div>

      <div className="cl-bottom-body" ref={scrollRef} data-lenis-prevent>
        {bottomTab === 'problems' ? (
          PROBLEMS.length === 0 ? (
            <p className="cl-meta">No validation problems, blockers or stale artifacts.</p>
          ) : (
            <table className="cl-table">
              <thead>
                <tr>
                  <th style={{ width: 90 }}>Severity</th>
                  <th>Problem</th>
                  <th style={{ width: 200 }}>Resource</th>
                </tr>
              </thead>
              <tbody>
                {PROBLEMS.map((p) => (
                  <tr
                    key={p.id}
                    data-clickable="true"
                    onClick={() => p.href && router.push(`/projects/${projectId}${p.href}`)}
                  >
                    <td>
                      <SeverityBadge severity={p.severity} />
                    </td>
                    <td>
                      <div className="cl-strong">{p.message}</div>
                      <div className="cl-meta">{p.detail}</div>
                    </td>
                    <td className="cl-mono">{p.resource}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : null}

        {bottomTab === 'output' ? (
          <div className="cl-log">
            {cleared.output
              ? null
              : OUTPUT_LOG.map((line, i) => (
                  <div className="cl-log-line" data-level={line.level} key={`${line.time}-${i}`}>
                    <span className="cl-log-time">{line.time}</span>
                    <span className="cl-log-scope">{line.scope}</span>
                    <span className="cl-log-msg">
                      <LogMessage text={line.message} />
                    </span>
                  </div>
                ))}
          </div>
        ) : null}

        {bottomTab === 'tests' ? (
          <table className="cl-table">
            <thead>
              <tr>
                <th style={{ width: 90 }}>Result</th>
                <th style={{ width: 110 }}>Suite</th>
                <th>Test</th>
                <th style={{ width: 80 }}>Duration</th>
              </tr>
            </thead>
            <tbody>
              {TEST_RESULTS.map((t) => (
                <tr key={t.id}>
                  <td>
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="cl-mono">{t.suite}</td>
                  <td>
                    <div>{t.name}</div>
                    {t.failure ? (
                      <div className="cl-meta" style={{ color: 'var(--cl-deny)' }}>
                        {t.failure}
                      </div>
                    ) : null}
                  </td>
                  <td className="cl-mono">{t.durationMs}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}

        {bottomTab === 'events' ? (
          cleared.events ? (
            <p className="cl-meta">Event view cleared. New RuntimeEvents will continue to stream in.</p>
          ) : (
            <table className="cl-table">
              <thead>
                <tr>
                  <th style={{ width: 170 }}>Time</th>
                  <th style={{ width: 90 }}>Source</th>
                  <th style={{ width: 110 }}>Status</th>
                  <th>Event</th>
                </tr>
              </thead>
              <tbody>
                {events.slice(0, 40).map((e) => (
                  <tr
                    key={e.id}
                    data-clickable="true"
                    onClick={() => router.push(`/projects/${projectId}/activity?event=${e.id}`)}
                  >
                    <td>
                      <Timestamp iso={e.at} />
                    </td>
                    <td className="cl-mono">{e.source}</td>
                    <td>
                      <StatusBadge status={e.status} />
                    </td>
                    <td>
                      <span className="cl-mono" style={{ marginRight: 8 }}>
                        {e.type}
                      </span>
                      {e.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : null}

        {bottomTab === 'terminal' ? (
          <div className="cl-terminal">
            <div className="cl-banner" data-tone="sim">
              <div className="cl-banner-main">
                <div className="cl-banner-title">Constrained developer terminal</div>
                <div className="cl-banner-body">
                  This terminal is restricted to sandbox project commands. It is not attached to a privileged host shell
                  and is not a security boundary.
                </div>
              </div>
            </div>
            <div style={{ whiteSpace: 'pre-wrap' }}>
              <div>
                <span className="cl-terminal-prompt">contextlock@sandbox</span>
                <span>:</span>
                <span className="cl-terminal-path">~/project</span>
                <span>$ ls</span>
              </div>
              <div>agent/&nbsp; contextlock/&nbsp; adapters/&nbsp; tests/&nbsp; cre/&nbsp; deployment/&nbsp; config/</div>
              <div>
                <span className="cl-terminal-prompt">contextlock@sandbox</span>
                <span>:</span>
                <span className="cl-terminal-path">~/project</span>
                <span>$ </span>
                <span className="cl-terminal-caret cl-pulse" aria-hidden />
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
