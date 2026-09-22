'use client';

/**
 * Monitoring / review mode (spec §46, below 900px).
 *
 * This is a desktop-first authoring product, and the spec is explicit that
 * three 300px panes must never be squeezed into a phone. So below 900px the
 * workbench does not shrink — it changes job.
 *
 * What stays: Overview, Activity, Alerts, Reports and a plain policy/runtime
 * status. What goes: Blueprint editing, Architecture authoring, Monaco and
 * complex deployment operations.
 *
 * An authoring page reached at this width is not hidden and is not silently
 * redirected — it says why it is unavailable and offers somewhere useful. A
 * page that vanishes reads as a broken link; a page that explains itself reads
 * as a product decision.
 */
import { useRouter } from 'next/navigation';
import { Activity, ArrowRight, FileText, Gauge, ShieldCheck } from 'lucide-react';
import { Badge, StatusBadge } from '../primitives';
import { useStudioProject } from '@/lib/studio/api/project-context';
import { policyStatusOf, runtimeStatusOf } from '@/lib/studio/api/adapters/operate';

/** Segments that remain useful and safe on a small screen. */
export const MONITOR_SEGMENTS = ['overview', 'activity', 'control-plane', 'policies', 'runtime', 'reports'] as const;

export function isMonitorSegment(segment: string): boolean {
  return (MONITOR_SEGMENTS as readonly string[]).includes(segment);
}

const NAV = [
  { segment: 'overview', label: 'Overview', icon: Gauge },
  { segment: 'activity', label: 'Activity', icon: Activity },
  { segment: 'control-plane', label: 'Alerts', icon: ShieldCheck },
  { segment: 'reports', label: 'Reports', icon: FileText },
];

export function MonitorNav({
  projectId,
  agentSlug,
  segment,
}: {
  projectId: string;
  agentSlug: string;
  segment: string;
}) {
  const router = useRouter();
  const { overview } = useStudioProject();
  const openAlerts = overview?.alerts.open ?? 0;

  return (
    <nav className="cl-monitor-nav" aria-label="Monitoring navigation">
      {NAV.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.segment}
            type="button"
            className="cl-monitor-nav-btn"
            data-active={segment === item.segment}
            aria-current={segment === item.segment ? 'page' : undefined}
            onClick={() => router.push(`/projects/${projectId}/${item.segment}?agent=${agentSlug}`)}
          >
            <Icon size={17} aria-hidden />
            <span>{item.label}</span>
            {item.segment === 'control-plane' && openAlerts > 0 ? (
              <span className="cl-monitor-nav-count">{openAlerts}</span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

/** Compact policy/runtime status — the "simple status" §46 asks for. */
export function MonitorStatus() {
  const { overview, deploymentId } = useStudioProject();
  const policyState = deploymentId ? policyStatusOf(overview) : 'UNKNOWN';
  const runtimeState = deploymentId ? runtimeStatusOf(overview?.panels.runtime.state) : 'STOPPED';
  return (
    <div className="cl-monitor-status">
      <div className="cl-monitor-status-row">
        <span className="cl-label">Policy</span>
        <StatusBadge status={policyState} />
      </div>
      <div className="cl-monitor-status-row">
        <span className="cl-label">Runtime</span>
        <StatusBadge status={runtimeState} />
      </div>
      <div className="cl-monitor-status-row">
        <span className="cl-label">Execution</span>
        <Badge tone="sim">Testnet only</Badge>
      </div>
    </div>
  );
}

/**
 * Shown in place of an authoring page at monitoring width.
 *
 * States the reason rather than the constraint — "this needs a wider screen"
 * is more useful than "unsupported viewport".
 */
export function AuthoringUnavailable({
  projectId,
  agentSlug,
  title,
}: {
  projectId: string;
  agentSlug: string;
  title: string;
}) {
  const router = useRouter();

  return (
    <div className="cl-monitor-block">
      <h2 className="cl-h2" style={{ marginBottom: 8 }}>
        {title} needs a wider screen
      </h2>
      <p style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: 6 }}>
        This is an authoring surface — a graph, an editor or a deployment plan that has to be read in full to be used
        safely. Rather than shrink it into something you could mis-click, it is available from 900px up.
      </p>
      <p className="cl-meta" style={{ marginBottom: 16 }}>
        Monitoring and review work here: live state, the event log, open alerts and generated reports.
      </p>

      <MonitorStatus />

      <div className="cl-col" style={{ gap: 7, marginTop: 16 }}>
        {NAV.map((item) => (
          <button
            key={item.segment}
            type="button"
            className="cl-btn cl-btn-block"
            style={{ justifyContent: 'space-between' }}
            onClick={() => router.push(`/projects/${projectId}/${item.segment}?agent=${agentSlug}`)}
          >
            {item.label}
            <ArrowRight size={13} aria-hidden />
          </button>
        ))}
      </div>
    </div>
  );
}
