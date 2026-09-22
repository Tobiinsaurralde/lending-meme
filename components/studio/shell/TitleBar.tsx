'use client';

/**
 * Global title bar (spec §4).
 *
 * Left → right: mark · project switcher · agent switcher · revision chip ·
 * TESTNET LAB badge · command field · build status · blockers · notifications ·
 * user menu. The environment badge is always visible and never conditional.
 */
import { useRouter } from 'next/navigation';
import { AlertTriangle, ArrowLeft, Bell, Check, ChevronDown, GitCompare, Plus, Search, TriangleAlert, User } from 'lucide-react';
import { Popover, MenuItem, MenuLabel, MenuSeparator } from './Popover';
import { StatusBadge } from '../primitives';
import { WalletChip } from '../wallet/WalletChip';
import { useWorkbench } from '@/lib/studio/workbench';
import type { Agent, Blocker, Project, ProjectSummary, RevisionSet } from '@/lib/studio/types';

export function TitleBar({
  project,
  projects,
  agent,
  onSelectAgent,
  buildStatus,
  onOpenRevisions,
}: {
  project: Project;
  projects: ProjectSummary[];
  agent: Agent;
  onSelectAgent: (agent: Agent) => void;
  buildStatus: { label: string; status: string };
  onOpenRevisions: () => void;
}) {
  const router = useRouter();
  const { setPaletteOpen, openBottom, developerMode, setDeveloperMode } = useWorkbench();
  const { revisions, blockers } = project;

  return (
    <header className="cl-titlebar">
      {/* The wordmark is the way out of a project. Every product puts "home"
          here, so leaving it inert stranded you inside the workbench with no
          obvious exit. */}
      <button
        type="button"
        className="cl-titlebar-mark"
        onClick={() => router.push('/projects')}
        title="All projects"
        aria-label="All projects"
      >
        ContextLock
      </button>

      {/* project switcher (spec §4.1) */}
      <Popover
        label="Switch project"
        width={330}
        trigger={({ toggle }) => (
          <button type="button" className="cl-chip" onClick={toggle} aria-haspopup="menu">
            {project.name}
            <ChevronDown size={12} aria-hidden />
          </button>
        )}
      >
        {({ close }) => (
          <>
            {/* First item, not buried: leaving the project is the thing people
                look for in the project switcher. */}
            <MenuItem
              onClick={() => {
                close();
                router.push('/projects');
              }}
              hint={<ArrowLeft size={12} aria-hidden />}
            >
              All projects
            </MenuItem>
            <MenuSeparator />
            <MenuLabel>Recent projects</MenuLabel>
            {projects.map((p) => (
              <MenuItem
                key={p.id}
                onClick={() => {
                  close();
                  router.push(`/projects/${p.id}/overview`);
                }}
                hint={p.id === project.id ? <Check size={12} aria-hidden /> : p.lifecycle}
              >
                {p.name}
              </MenuItem>
            ))}
            <MenuSeparator />
            <MenuLabel>Organizations</MenuLabel>
            <MenuItem onClick={close} hint="4 projects">
              Treasury Department
            </MenuItem>
            <MenuItem onClick={close} hint="1 project">
              Operations
            </MenuItem>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                close();
                router.push('/projects/new');
              }}
            >
              <Plus size={13} aria-hidden /> New Agent Project
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                router.push('/projects?import=1');
              }}
            >
              Import Project
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                router.push('/projects?shared=1');
              }}
            >
              Open Shared Project
            </MenuItem>
          </>
        )}
      </Popover>

      {/* agent switcher (spec §4.2) — changes context, never navigates away */}
      <Popover
        label="Switch agent"
        width={280}
        trigger={({ toggle }) => (
          <button type="button" className="cl-chip" onClick={toggle} aria-haspopup="menu">
            {agent.name}
            <ChevronDown size={12} aria-hidden />
          </button>
        )}
      >
        {({ close }) => (
          <>
            <MenuLabel>{project.organization ?? 'Agents'}</MenuLabel>
            {project.agents.map((a) => (
              <MenuItem
                key={a.id}
                onClick={() => {
                  onSelectAgent(a);
                  close();
                }}
                hint={a.id === agent.id ? <Check size={12} aria-hidden /> : a.status}
              >
                {a.name}
              </MenuItem>
            ))}
          </>
        )}
      </Popover>

      {/* revision chip (spec §4.3) */}
      <button
        type="button"
        className="cl-rev-chip"
        onClick={onOpenRevisions}
        title="Open the revision drawer"
        aria-label="Current revisions"
      >
        {revisionSegments(revisions).map((seg) => (
          <span className="cl-rev-seg" key={seg.label} data-stale={seg.stale}>
            <span className="cl-rev-seg-label">{seg.label}</span>
            <span className="cl-rev-seg-value">{seg.value}</span>
          </span>
        ))}
      </button>

      {/* environment badge (spec §4.4) — always present */}
      <span
        className="cl-env-badge"
        title="Production-chain execution is disabled. Mainnet may only be used as a read-only data source or isolated local fork."
      >
        <span>TESTNET LAB</span>
      </span>

      <span className="cl-titlebar-spacer" />

      {/* command palette trigger (spec §4.5) */}
      <button type="button" className="cl-cmd-field" onClick={() => setPaletteOpen(true)} aria-label="Open command palette">
        <Search size={13} aria-hidden />
        <span style={{ opacity: 0.8 }}>Search or run a command</span>
        <span className="cl-cmd-kbd">⌘K</span>
      </button>

      <span className="cl-titlebar-spacer" />

      {/* global build / deployment status */}
      <button
        type="button"
        className="cl-chip"
        onClick={() => openBottom('output')}
        title="Open build output"
        style={{ gap: 7 }}
      >
        <StatusBadge status={buildStatus.status} icon={false} />
        {/* Label stands down first when the bar runs short of room; the badge
            keeps the state visible. */}
        <span className="cl-titlebar-build-label">{buildStatus.label}</span>
      </button>

      {/* workspace wallet — one connection, available on every surface */}
      <WalletChip />

      {/* blockers / alerts (spec §4) */}
      <Popover
        align="right"
        width={380}
        label="Blockers and alerts"
        trigger={({ toggle }) => (
          <button
            type="button"
            className="cl-icon-btn"
            onClick={toggle}
            aria-label={`${blockers.length} blockers`}
            title="Blockers"
          >
            <TriangleAlert size={14} aria-hidden />
            {blockers.length > 0 ? <span>{blockers.length}</span> : null}
          </button>
        )}
      >
        {({ close }) => (
          <>
            <MenuLabel>Blockers</MenuLabel>
            {blockers.length === 0 ? (
              <div style={{ padding: '8px 12px', fontSize: 12 }}>No open blockers.</div>
            ) : (
              blockers.map((b: Blocker) => (
                <button
                  key={b.id}
                  type="button"
                  className="cl-palette-item"
                  style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 3, width: '100%', textAlign: 'left' }}
                  onClick={() => {
                    close();
                    if (b.actionHref) router.push(`/projects/${project.id}${b.actionHref}`);
                  }}
                >
                  <span className="cl-row" style={{ gap: 6 }}>
                    <AlertTriangle size={12} aria-hidden />
                    <span className="cl-mono" style={{ fontSize: 10.5 }}>
                      {b.id}
                    </span>
                    <span className="cl-strong">{b.title}</span>
                  </span>
                  <span className="cl-meta" style={{ whiteSpace: 'normal' }}>
                    {b.detail}
                  </span>
                  {b.actionLabel ? <span className="cl-meta cl-strong">{b.actionLabel} →</span> : null}
                </button>
              ))
            )}
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                close();
                openBottom('problems');
              }}
            >
              Open Problems panel
            </MenuItem>
          </>
        )}
      </Popover>

      {/* notifications */}
      <Popover
        align="right"
        width={320}
        label="Notifications"
        trigger={({ toggle }) => (
          <button type="button" className="cl-icon-btn" onClick={toggle} aria-label="Notifications">
            <Bell size={14} aria-hidden />
          </button>
        )}
      >
        {({ close }) => (
          <>
            <MenuLabel>Notifications</MenuLabel>
            <MenuItem onClick={close} hint="7m ago">
              Deployment 3 reached READY TO ACTIVATE
            </MenuItem>
            <MenuItem onClick={close} hint="12m ago">
              Simulation regression: 1 failure
            </MenuItem>
            <MenuItem onClick={close} hint="1h ago">
              The Graph adapter became UNAVAILABLE
            </MenuItem>
          </>
        )}
      </Popover>

      {/* user menu */}
      <Popover
        align="right"
        width={230}
        label="Account"
        trigger={({ toggle }) => (
          <button type="button" className="cl-icon-btn" onClick={toggle} aria-label="Account menu">
            <User size={14} aria-hidden />
          </button>
        )}
      >
        {({ close }) => (
          <>
            <MenuLabel>Signed in</MenuLabel>
            <div style={{ padding: '2px 12px 8px', fontSize: 12 }}>operator@treasury</div>
            <MenuSeparator />
            <MenuItem
              onClick={() => {
                close();
                router.push(`/projects/${project.id}/settings`);
              }}
            >
              Settings
            </MenuItem>
            <MenuItem
              onClick={() => {
                close();
                router.push('/projects');
              }}
            >
              All projects
            </MenuItem>
            <MenuItem onClick={close}>Help / docs</MenuItem>
            <MenuSeparator />
            {/* Also lives in Settings; surfaced here so the constrained terminal
                and raw identifiers are reachable. Developer mode never disables
                a security check (spec §29). */}
            <MenuItem
              onClick={() => {
                setDeveloperMode(!developerMode);
                close();
              }}
              hint={developerMode ? <Check size={12} aria-hidden /> : 'off'}
            >
              Developer mode
            </MenuItem>
          </>
        )}
      </Popover>
    </header>
  );
}

/**
 * The three revisions an operator checks most: what is authored, what is
 * deployed, what is running. A trailing revision is marked stale so the gap
 * between design and the live deployment is visible at a glance.
 */
export function revisionSegments(r: RevisionSet): { label: string; value: string; stale: boolean }[] {
  const rev = (n: number | null) => (n === null ? '—' : `r${n}`);
  const behind = (n: number | null) => n !== null && r.blueprint !== null && n < r.blueprint;

  return [
    { label: 'Blueprint', value: rev(r.blueprint), stale: false },
    { label: 'Deploy', value: rev(r.deployment), stale: behind(r.deployment) },
    { label: 'Runtime', value: rev(r.runtime), stale: behind(r.runtime) },
  ];
}

/** Revision drawer contents (spec §4.3). */
export function RevisionDrawerBody({
  revisions,
  onCompare,
}: {
  revisions: RevisionSet;
  onCompare: () => void;
}) {
  const rows: { label: string; value: string; stale?: boolean }[] = [
    { label: 'Requirements revision', value: revisions.requirements === null ? '—' : `r${revisions.requirements}` },
    { label: 'Blueprint revision', value: revisions.blueprint === null ? '—' : `r${revisions.blueprint}` },
    {
      label: 'Blueprint draft',
      value: revisions.blueprintDraft === null ? 'none' : `r${revisions.blueprintDraft} (draft)`,
    },
    { label: 'Strategy revision', value: revisions.strategy === null ? '—' : `r${revisions.strategy}` },
    {
      label: 'Build revision',
      value: revisions.build === null ? '—' : `r${revisions.build}`,
      stale: revisions.build !== null && revisions.blueprint !== null && revisions.build < revisions.blueprint,
    },
    {
      label: 'Deployment revision',
      value: revisions.deployment === null ? '—' : `r${revisions.deployment}`,
      stale: revisions.deployment !== null && revisions.blueprint !== null && revisions.deployment < revisions.blueprint,
    },
    { label: 'Runtime revision', value: revisions.runtime === null ? '—' : `r${revisions.runtime}` },
    { label: 'Policy revision', value: revisions.policy === null ? '—' : `r${revisions.policy}` },
  ];

  return (
    <>
      <dl className="cl-statechange">
        {rows.map((row) => (
          <div className="cl-statechange-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd className="cl-row" style={{ gap: 8 }}>
              {row.value}
              {row.stale ? <StatusBadge status="STALE" /> : null}
            </dd>
          </div>
        ))}
        <div className="cl-statechange-row">
          <dt>CRE artifact hash</dt>
          <dd className="cl-mono" style={{ fontSize: 11 }}>
            {revisions.creArtifactHash ?? '—'}
          </dd>
        </div>
      </dl>

      {rows.some((r) => r.stale) ? (
        <div className="cl-banner" data-tone="warn" style={{ marginTop: 14, marginBottom: 0 }}>
          <AlertTriangle aria-hidden />
          <div className="cl-banner-main">
            <div className="cl-banner-title">Stale dependencies</div>
            <div className="cl-banner-body">
              Build and deployment revisions trail the current Blueprint. The deployed agent continues to run the
              revision it was deployed with until a new deployment is made.
            </div>
          </div>
        </div>
      ) : null}

      <div className="cl-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        <button type="button" className="cl-btn" onClick={onCompare}>
          <GitCompare size={13} aria-hidden />
          Compare revisions
        </button>
      </div>
    </>
  );
}
