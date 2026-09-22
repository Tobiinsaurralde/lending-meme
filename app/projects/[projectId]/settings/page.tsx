'use client';

/**
 * Settings (spec §29).
 *
 * Configures non-secret project and workspace behaviour, and *inspects* the
 * settings that are enforced elsewhere.
 *
 * Two rules from the spec shape this page:
 *
 *  - Simulation limits are read-only. They are server policy, and a frontend
 *    control that appeared to raise them would be lying — the server would
 *    refuse anyway, so the limit is displayed and explained, never edited.
 *  - Developer mode reveals, it never disables. Raw IDs, raw JSON, a
 *    constrained terminal and verbose events are all presentation. No toggle
 *    on this page can switch off a security check, and the page says so.
 */
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Archive, Download, RotateCcw, Save } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockerBanner,
  Card,
  KeyValue,
  Section,
  TabStrip,
  formatNumber,
} from '@/components/studio/primitives';
import { StandardConfirmation } from '@/components/studio/dialogs';
import { AgentPatchInbox } from '@/components/studio/AgentPatches';
import { useWorkbench, PANEL_LIMITS } from '@/lib/studio/workbench';
import { useHealth, useInvalidateAll } from '@/lib/studio/api/queries';
import { studio } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import type { StudioSettings } from '@/lib/studio/types';

type Tab = 'project' | 'appearance' | 'limits' | 'runtime' | 'notifications' | 'developer';

export default function SettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    pushToast,
    developerMode,
    setDeveloperMode,
    appearance,
    setAppearance,
    resetAppearance,
    resetPanelSize,
  } = useWorkbench();

  const { agentSlug, project: PROJECT, ctx } = useStudioPage('settings');
  const health = useHealth();
  const invalidate = useInvalidateAll();
  const [error, setError] = useState<string | null>(null);

  /* Workspace preferences are local; project data is the server's; quotas are the server's policy. */
  const SETTINGS: StudioSettings = {
    project: { name: PROJECT.name, description: PROJECT.description, organization: PROJECT.organization ?? '', defaultAgentId: PROJECT.agents[0]?.id ?? '' },
    appearance: { theme: 'light', density: 'comfortable', editorFontSize: 13 },
    simulationLimits: {
      userRunsPerDay: Number(health.data?.limits.userRequestedSimulationsPerBuild ?? 0),
      userRunsUsed: ctx.buildView?.usage.userSimulations ?? 0,
      mandatoryRegressionRuns: ctx.buildView?.usage.mandatorySimulations ?? ctx.buildView?.blueprint?.simulationScenarios.length ?? 0,
      serverEnforced: true,
    },
    runtime: { autoRestart: false, restartBackoffSeconds: 0, logRetentionDays: 0 },
    notifications: { criticalAlerts: true, deploymentEvents: true, simulationFailures: true, weeklyDigest: false },
    developerMode: { enabled: developerMode, showRawIds: developerMode, showRawJson: developerMode, constrainedTerminal: false, verboseEvents: developerMode },
  };

  const [tab, setTab] = useState<Tab>('project');
  const [dirty, setDirty] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  /* Local drafts for the fields that are project data rather than workspace
     preference — those only take effect on Save. */
  const [project, setProject] = useState(SETTINGS.project);
  useEffect(() => { setProject((p) => (p.name === '' || p.name === 'Loading…' ? SETTINGS.project : p)); // eslint-disable-line react-hooks/exhaustive-deps
  }, [PROJECT.name]);
  const [runtime, setRuntime] = useState(SETTINGS.runtime);
  const [notifications, setNotifications] = useState(SETTINGS.notifications);
  const [devDetail, setDevDetail] = useState(SETTINGS.developerMode);

  const limits = SETTINGS.simulationLimits;
  /* The unlimited policy reports a very large ceiling; show it as what it is. */
  const unlimited = limits.userRunsPerDay >= 1_000_000;
  const remaining = limits.userRunsPerDay - limits.userRunsUsed;

  const edit = <T,>(setter: (value: T) => void) => (value: T) => {
    setter(value);
    setDirty(true);
  };

  return (
    <StudioPage
      segment="settings"
      banners={error ? <BlockerBanner tone="deny" title="The Studio API refused">{error}</BlockerBanner> : null}
      badges={
        <>
          <Badge tone="neutral">{PROJECT.name}</Badge>
          {dirty ? <Badge tone="warn">UNSAVED CHANGES</Badge> : <Badge tone="pass">SAVED</Badge>}
          {developerMode ? <Badge tone="sim">DEVELOPER MODE</Badge> : null}
        </>
      }
      actions={
        <>
          <button
            type="button"
            className="cl-btn cl-btn-primary"
            disabled={!dirty}
            onClick={() => {
              setError(null);
              const target = ctx.dataProjectId;
              if (target && project.name.trim() && project.name !== PROJECT.name) {
                void studio.renameProject(target, project.name.trim())
                  .then(async () => { await invalidate(); setDirty(false); pushToast('Project renamed on the server; workspace preferences are kept in this browser'); })
                  .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
              } else {
                setDirty(false);
                pushToast('Workspace preferences saved in this browser. Runtime and notification preferences are not offered by the Studio API yet.');
              }
            }}
          >
            <Save size={13} aria-hidden />
            Save Settings
          </button>
          <button
            type="button"
            className="cl-btn"
            onClick={() => {
              resetAppearance();
              (['explorer', 'agent', 'bottom'] as const).forEach(resetPanelSize);
              pushToast('Layout and appearance restored to defaults');
            }}
          >
            <RotateCcw size={13} aria-hidden />
            Reset Layout
          </button>
          <button type="button" className="cl-btn" onClick={() => setExportOpen(true)}>
            <Download size={13} aria-hidden />
            Export Project
          </button>
          <button type="button" className="cl-btn cl-btn-danger" onClick={() => setArchiveOpen(true)}>
            <Archive size={13} aria-hidden />
            Archive Project
          </button>
        </>
      }
    >
      <AgentPatchInbox pageKind="settings" />

      <TabStrip<Tab>
        tabs={[
          { id: 'project', label: 'Project' },
          { id: 'appearance', label: 'Appearance' },
          { id: 'limits', label: 'Simulation limits' },
          { id: 'runtime', label: 'Runtime' },
          { id: 'notifications', label: 'Notifications' },
          { id: 'developer', label: 'Developer mode' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ------------------------------------------------------------ project */}
      {tab === 'project' ? (
        <Section label="Project">
          <Card>
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-name">
                Name
              </label>
              <input
                id="set-name"
                className="cl-input"
                value={project.name}
                onChange={(e) => edit(setProject)({ ...project, name: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-desc">
                Description
              </label>
              <textarea
                id="set-desc"
                className="cl-input"
                style={{ minHeight: 72, resize: 'vertical' }}
                value={project.description}
                onChange={(e) => edit(setProject)({ ...project, description: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-org">
                Organization
              </label>
              <input
                id="set-org"
                className="cl-input"
                value={project.organization}
                onChange={(e) => edit(setProject)({ ...project, organization: e.target.value })}
              />
            </div>
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-agent">
                Default agent
              </label>
              <select
                id="set-agent"
                className="cl-select"
                value={project.defaultAgentId}
                onChange={(e) => edit(setProject)({ ...project, defaultAgentId: e.target.value })}
              >
                {PROJECT.agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.role}
                  </option>
                ))}
              </select>
              <span className="cl-field-hint">
                Which agent a page opens with when no agent is named in the URL. It grants nothing — authority stays
                per-principal.
              </span>
            </div>
          </Card>
        </Section>
      ) : null}

      {/* --------------------------------------------------------- appearance */}
      {tab === 'appearance' ? (
        <Section label="Appearance">
          <Card>
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-theme">
                Theme
              </label>
              <select
                id="set-theme"
                className="cl-select"
                value={appearance.theme}
                onChange={(e) => setAppearance({ theme: e.target.value as typeof appearance.theme })}
              >
                <option value="auto">Automatic — dark on the Code editor only</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
              <span className="cl-field-hint">
                Applies immediately. Verdict colours keep the same meanings in both themes and every badge still
                renders its text label, so colour is never the only signal.
              </span>
            </div>

            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-density">
                Density
              </label>
              <select
                id="set-density"
                className="cl-select"
                value={appearance.density}
                onChange={(e) => setAppearance({ density: e.target.value as typeof appearance.density })}
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
              <span className="cl-field-hint">
                Compact tightens padding and row height only. Type size and contrast are unchanged.
              </span>
            </div>

            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-font">
                Editor font size — {appearance.editorFontSize}px
              </label>
              <input
                id="set-font"
                type="range"
                min={11}
                max={18}
                step={1}
                value={appearance.editorFontSize}
                onChange={(e) => setAppearance({ editorFontSize: Number(e.target.value) })}
                style={{ width: '100%', maxWidth: 320 }}
              />
              <span className="cl-field-hint">Applies to the Code editor and its diff view.</span>
            </div>

            <div className="cl-btn-group" style={{ marginTop: 6 }}>
              <button
                type="button"
                className="cl-btn cl-btn-sm"
                onClick={() => {
                  resetAppearance();
                  (['explorer', 'agent', 'bottom'] as const).forEach(resetPanelSize);
                  pushToast('Layout defaults restored');
                }}
              >
                <RotateCcw size={13} aria-hidden />
                Restore Layout Defaults
              </button>
            </div>

            <p className="cl-meta" style={{ marginTop: 12 }}>
              Panels reset to {PANEL_LIMITS.explorer.default}px explorer, {PANEL_LIMITS.agent.default}px agent and{' '}
              {PANEL_LIMITS.bottom.default}px bottom panel.
            </p>
          </Card>
        </Section>
      ) : null}

      {/* ---------------------------------------------------- simulation limits */}
      {tab === 'limits' ? (
        <Section label="Simulation limits">
          <BlockerBanner tone="neutral" title="These limits are enforced by the server, not by this page">
            They are shown here so you can see what you have left. A control that appeared to raise them would be
            misleading — the server would refuse the run regardless of what the frontend had stored.
          </BlockerBanner>

          <Card>
            <KeyValue
              rows={[
                {
                  label: 'Requested runs per build',
                  value: (
                    <span className="cl-row" style={{ gap: 8 }}>
                      {unlimited ? 'No limit' : formatNumber(limits.userRunsPerDay)}
                      <Badge tone="neutral">{unlimited ? 'quotas off on this server' : 'server enforced'}</Badge>
                    </span>
                  ),
                },
                { label: 'Used on this build', value: unlimited ? `${formatNumber(limits.userRunsUsed)} — no ceiling` : `${formatNumber(limits.userRunsUsed)} — ${formatNumber(remaining)} remaining (per build, not per day)` },
                {
                  label: 'Mandatory regression',
                  value: `${limits.mandatoryRegressionRuns} scenarios, run on every build and not counted against your daily quota`,
                },
              ]}
            />

            <div style={{ marginTop: 14 }}>
              <div className="cl-label" style={{ marginBottom: 6 }}>
                Daily quota
              </div>
              <div style={{ height: 8, background: 'var(--cl-line)', overflow: 'hidden', borderRadius: 999 }}>
                <div
                  style={{
                    height: '100%',
                    width: `${limits.userRunsPerDay && !unlimited ? (limits.userRunsUsed / limits.userRunsPerDay) * 100 : 0}%`,
                    background: 'var(--cl-ink)',
                  }}
                />
              </div>
            </div>

            <p className="cl-meta" style={{ marginTop: 12 }}>
              A build that hits the limit pauses and can be resumed. Artifacts already produced are kept — hitting a
              quota never discards work, and it never skips the mandatory security regression.
            </p>
          </Card>
        </Section>
      ) : null}

      {/* ------------------------------------------------------------ runtime */}
      {tab === 'runtime' ? (
        <Section label="Runtime preferences">
          <Card>
            <Toggle
              id="set-autorestart"
              label="Restart automatically after a crash"
              hint="Restarting resumes agent processing. It does not change financial authority — the policy stays in whatever state the chain says it is in."
              checked={runtime.autoRestart}
              onChange={(v) => edit(setRuntime)({ ...runtime, autoRestart: v })}
            />
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-backoff">
                Restart backoff — {runtime.restartBackoffSeconds}s
              </label>
              <input
                id="set-backoff"
                type="range"
                min={5}
                max={120}
                step={5}
                value={runtime.restartBackoffSeconds}
                onChange={(e) => edit(setRuntime)({ ...runtime, restartBackoffSeconds: Number(e.target.value) })}
                style={{ width: '100%', maxWidth: 320 }}
              />
            </div>
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="set-retention">
                Log retention
              </label>
              <select
                id="set-retention"
                className="cl-select"
                value={runtime.logRetentionDays}
                onChange={(e) => edit(setRuntime)({ ...runtime, logRetentionDays: Number(e.target.value) })}
              >
                {[7, 14, 30, 90].map((days) => (
                  <option key={days} value={days}>
                    {days} days
                  </option>
                ))}
              </select>
              <span className="cl-field-hint">
                Events older than this are removed from the Activity log. Deployment receipts and report evidence are
                kept regardless — they are the audit trail.
              </span>
            </div>
          </Card>
        </Section>
      ) : null}

      {/* ------------------------------------------------------ notifications */}
      {tab === 'notifications' ? (
        <Section label="Notifications">
          <Card>
            <Toggle
              id="set-critical"
              label="Critical alerts"
              hint="Policy state drift, capability issuance failures and unavailable required sources."
              checked={notifications.criticalAlerts}
              onChange={(v) => edit(setNotifications)({ ...notifications, criticalAlerts: v })}
            />
            <Toggle
              id="set-deploy"
              label="Deployment events"
              checked={notifications.deploymentEvents}
              onChange={(v) => edit(setNotifications)({ ...notifications, deploymentEvents: v })}
            />
            <Toggle
              id="set-simfail"
              label="Simulation failures"
              checked={notifications.simulationFailures}
              onChange={(v) => edit(setNotifications)({ ...notifications, simulationFailures: v })}
            />
            <Toggle
              id="set-digest"
              label="Weekly digest"
              checked={notifications.weeklyDigest}
              onChange={(v) => edit(setNotifications)({ ...notifications, weeklyDigest: v })}
            />
            <p className="cl-meta" style={{ marginTop: 10 }}>
              Turning a notification off changes what you are told, never what is enforced. An alert that stops being
              delivered still appears on the Control Plane.
            </p>
          </Card>
        </Section>
      ) : null}

      {/* ---------------------------------------------------------- developer */}
      {tab === 'developer' ? (
        <Section label="Developer mode">
          <BlockerBanner tone="neutral" title="Developer mode reveals detail. It never disables a security check.">
            Nothing on this tab can switch off validation, skip the mandatory security regression, bypass a typed
            confirmation or widen financial authority. The terminal it enables is a constrained sandbox shell, never a
            privileged host shell.
          </BlockerBanner>

          <Card>
            <Toggle
              id="set-dev"
              label="Enable developer mode"
              hint="Master switch for the options below."
              checked={developerMode}
              onChange={(v) => {
                setDeveloperMode(v);
                pushToast(v ? 'Developer mode on' : 'Developer mode off');
              }}
            />

            <div style={{ opacity: developerMode ? 1 : 0.55, pointerEvents: developerMode ? 'auto' : 'none' }}>
              <Toggle
                id="set-rawids"
                label="Show raw IDs and hashes"
                hint="Displays the full identifier next to the human label rather than only on hover."
                checked={devDetail.showRawIds}
                onChange={(v) => edit(setDevDetail)({ ...devDetail, showRawIds: v })}
              />
              <Toggle
                id="set-rawjson"
                label="Show raw JSON"
                hint="Adds a raw view to the Blueprint and to event drawers."
                checked={devDetail.showRawJson}
                onChange={(v) => edit(setDevDetail)({ ...devDetail, showRawJson: v })}
              />
              <Toggle
                id="set-terminal"
                label="Enable the constrained Terminal tab"
                hint="A sandboxed shell in the bottom panel. It cannot reach the host, and it is not a way around any control on this page."
                checked={devDetail.constrainedTerminal}
                onChange={(v) => edit(setDevDetail)({ ...devDetail, constrainedTerminal: v })}
              />
              <Toggle
                id="set-verbose"
                label="Verbose events"
                hint="Includes routine lifecycle events in Activity. Confidential payloads stay hidden regardless."
                checked={devDetail.verboseEvents}
                onChange={(v) => edit(setDevDetail)({ ...devDetail, verboseEvents: v })}
              />
            </div>
          </Card>
        </Section>
      ) : null}

      {/* export */}
      <StandardConfirmation
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        onConfirm={() => {
          setExportOpen(false);
          router.push(`/projects/${ctx.routeProjectId}/code?agent=${agentSlug}`);
          pushToast('Use Download project on the Code page — the server scans the bundle for secrets before it leaves');
        }}
        title="Export project"
        consequence="Exports the Blueprint, architecture, policy definition, simulation and attack results and deployment receipts. Credentials and any stored secret are excluded — the export passes the same secret scan a report does."
        resource={PROJECT.name}
        actionLabel="Export Project"
      />

      {/* archive */}
      <StandardConfirmation
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => {
          setArchiveOpen(false);
          pushToast('Archiving is not offered by the Studio API yet; nothing was changed');
        }}
        title="Archive project"
        consequence="The project becomes read-only and stops appearing in the active list. Archiving does not stop a deployed agent and does not disable financial authority — if the policy is enabled it stays enabled, and the runtime keeps whatever state it is in."
        resource={PROJECT.name}
        actionLabel="Archive Project"
      />
    </StudioPage>
  );
}

/** Labelled switch with an optional explanation underneath. */
function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="cl-field">
      <label className="cl-row" style={{ gap: 9, cursor: 'pointer' }} htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{ width: 15, height: 15, flex: '0 0 auto', accentColor: 'var(--cl-ink)' }}
        />
        <span style={{ fontSize: 13 }}>{label}</span>
      </label>
      {hint ? (
        <span className="cl-field-hint" style={{ marginLeft: 24 }}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}
