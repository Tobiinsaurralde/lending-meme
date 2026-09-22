'use client';

/**
 * The persistent three-column workbench (spec §3).
 *
 *   TitleBar
 *   ├ ActivityRail + ProjectExplorer  │ CenterWorkspace (tabs + page + panel) │ ContextAgent
 *   StatusBar
 *
 * Resize handles are pointer- and keyboard-operable, sizes persist per user, and
 * double-clicking a handle restores the default (spec §3.2, §45).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import { TitleBar, RevisionDrawerBody } from './TitleBar';
import { ActivityRail, ProjectExplorer, type NavBadge } from './LeftWorkbench';
import { EditorTabBar } from './EditorTabBar';
import { BottomPanel } from './BottomPanel';
import { StatusBar } from './StatusBar';
import { ContextAgentSidebar } from './ContextAgentSidebar';
import { AuthoringUnavailable, MonitorNav, isMonitorSegment } from './MonitoringMode';
import { CommandPalette } from './CommandPalette';
import { Modal } from '../dialogs';
import { SmoothScroll } from '../SmoothScroll';
import { PANEL_LIMITS, useWorkbench } from '@/lib/studio/workbench';
import { useControlBridge } from '@/lib/studio/control-bridge';
import { SEGMENT_TO_RAIL, metaForSegment } from '@/lib/studio/nav';
import type { Agent, Freshness, Project, ProjectSummary, RuntimeEvent, Status } from '@/lib/studio/types';

/* Ground colours either side of the theme change, used to paint the sweep. */
const LIGHT_CANVAS = '#fef1d0';
const DARK_CANVAS = '#090909';

export interface WorkbenchLiveState {
  policyState: Status;
  policyFreshness: Freshness;
  runtimeState: Status;
  creStatus: Status;
  syncSeconds: number;
  buildStatus: { label: string; status: string };
  navBadges: Record<string, NavBadge[]>;
  events: RuntimeEvent[];
  problemCount: number;
}

export function Workbench({
  project,
  projects,
  live,
  children,
}: {
  project: Project;
  projects: ProjectSummary[];
  live: WorkbenchLiveState;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const {
    sizes,
    setPanelSize,
    resetPanelSize,
    explorerOpen,
    toggleExplorer,
    agentOpen,
    toggleAgent,
    agentDrawer,
    bottomOpen,
    bottomMaximized,
    toggleBottom,
    setPaletteOpen,
    setRail,
    toasts,
    focusAgentInput,
    appearance,
    viewport,
  } = useWorkbench();
  const { requestControl } = useControlBridge();

  const [revisionsOpen, setRevisionsOpen] = useState(false);
  const centerRef = useRef<HTMLDivElement | null>(null);

  const segment = pathname.split('/')[3] ?? 'overview';
  const agentSlug = searchParams.get('agent') ?? project.agents[0].slug;
  const agent = project.agents.find((a) => a.slug === agentSlug) ?? project.agents[0];

  /* keep the rail in sync with the route */
  useEffect(() => {
    const rail = SEGMENT_TO_RAIL[segment];
    if (rail) setRail(rail);
  }, [segment, setRail]);

  const selectAgent = useCallback(
    (next: Agent) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set('agent', next.slug);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  /* keyboard shortcuts (spec §44) — no single keystroke maps to a security control */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();

      if (key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (key === 'p' && !e.shiftKey) {
        e.preventDefault();
        setPaletteOpen(true);
      } else if (key === 'b') {
        e.preventDefault();
        toggleExplorer();
      } else if (key === 'j') {
        e.preventDefault();
        toggleBottom();
      } else if (key === 'a' && e.shiftKey) {
        e.preventDefault();
        toggleAgent();
      } else if (key === 's' && e.shiftKey) {
        e.preventDefault();
        router.push(`/projects/${project.id}/simulation?agent=${agentSlug}&run=selected`);
      } else if (key === 't' && e.shiftKey) {
        e.preventDefault();
        router.push(`/projects/${project.id}/code?agent=${agentSlug}`);
      } else if (key === 'd' && e.shiftKey) {
        e.preventDefault();
        router.push(`/projects/${project.id}/deploy?agent=${agentSlug}`);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setPaletteOpen, toggleExplorer, toggleBottom, toggleAgent, router, project.id, agentSlug]);

  const showAgentDocked = agentOpen && !agentDrawer;

  /* Code is the one surface that genuinely is an editor, so the whole workbench
     flips dark there — rail, explorer, chrome and all. Darkening only the centre
     pane leaves the shell looking half-broken.

     `auto` is that behaviour; an explicit choice in Settings overrides it. */
  const darkSurface = appearance.theme === 'auto' ? segment === 'code' : appearance.theme === 'dark';

  const monitorMode = viewport === 'monitor';

  /*
   * Swapping every token at once snaps, so the shell cross-fades instead. The
   * enabling class has to be applied in the SAME commit as the theme change:
   * setting it from an effect runs after the browser has already painted the
   * new theme, leaving nothing to animate. So the change is detected during
   * render and only the clean-up is deferred.
   *
   * The transition is not left on permanently because it animates the same
   * properties hover does, which would make every button feel sluggish.
   */
  const previousDark = useRef(darkSurface);
  const shiftingRef = useRef(false);
  const [, bumpShift] = useState(0);

  if (previousDark.current !== darkSurface) {
    previousDark.current = darkSurface;
    shiftingRef.current = true;
  }
  const themeShifting = shiftingRef.current;

  useEffect(() => {
    if (!shiftingRef.current) return;
    const handle = window.setTimeout(() => {
      shiftingRef.current = false;
      bumpShift((n) => n + 1);
    }, 760);
    return () => window.clearTimeout(handle);
  }, [darkSurface]);

  return (
    <div
      className={`cl-studio cl-shell${darkSurface ? ' cl-theme-dark' : ''}${themeShifting ? ' cl-theme-shift' : ''}`}
      data-density={appearance.density}
      style={{ ['--cl-editor-font' as string]: `${appearance.editorFontSize}px` }}
    >
      {/*
        A sheet painted in the colour being left behind, sliding off to the
        right. The shell beneath has already switched, so the new theme appears
        to wash across the screen from the left.
      */}
      {themeShifting ? (
        <div
          className="cl-theme-wave"
          aria-hidden
          style={{
            background: darkSurface ? LIGHT_CANVAS : DARK_CANVAS,
            color: darkSurface ? LIGHT_CANVAS : DARK_CANVAS,
          }}
        />
      ) : null}
      <TitleBar
        project={project}
        projects={projects}
        agent={agent}
        onSelectAgent={selectAgent}
        buildStatus={live.buildStatus}
        onOpenRevisions={() => setRevisionsOpen(true)}
      />

      {/* §46 monitoring mode: a compact nav replaces the rail and explorer,
          which are authoring furniture and have nothing to do at this width. */}
      {monitorMode ? <MonitorNav projectId={project.id} agentSlug={agentSlug} segment={segment} /> : null}

      <div className="cl-shell-body">
        {!monitorMode ? <ActivityRail projectId={project.id} badges={live.navBadges} /> : null}

        {explorerOpen && !monitorMode ? (
          <>
            <div style={{ width: sizes.explorer, flex: `0 0 ${sizes.explorer}px`, minWidth: 0, display: 'flex' }}>
              <ProjectExplorer
                projectId={project.id}
                projectName={project.name}
                agentSlug={agentSlug}
                badges={live.navBadges}
              />
            </div>
            <Resizer
              orientation="vertical"
              ariaLabel="Resize explorer"
              value={sizes.explorer}
              min={PANEL_LIMITS.explorer.min}
              max={PANEL_LIMITS.explorer.max}
              onChange={(v) => setPanelSize('explorer', v)}
              onReset={() => resetPanelSize('explorer')}
            />
          </>
        ) : monitorMode ? null : (
          <button
            type="button"
            className="cl-icon-btn"
            onClick={toggleExplorer}
            title="Open explorer (⌘B)"
            aria-label="Open explorer"
            style={{
              alignSelf: 'flex-start',
              margin: 4,
              background: 'var(--cl-panel)',
              border: '1px solid var(--cl-line)',
              color: 'var(--cl-ink)',
            }}
          >
            <PanelLeftOpen size={14} aria-hidden />
          </button>
        )}

        {/* center workspace */}
        <div className="cl-center" ref={centerRef}>
          <EditorTabBar />
          {/* §46: below 900px an authoring surface is replaced rather than
              squeezed. Monitoring pages render normally. */}
          {monitorMode && !isMonitorSegment(segment) ? (
            <SmoothScroll className="cl-page">
              <div className="cl-page-pad">
                <AuthoringUnavailable projectId={project.id} agentSlug={agentSlug} title={metaForSegment(segment).title} />
              </div>
            </SmoothScroll>
          ) : !bottomMaximized ? (
            <SmoothScroll className="cl-page">{children}</SmoothScroll>
          ) : null}
          {bottomOpen ? (
            <>
              {!bottomMaximized ? (
                <Resizer
                  orientation="horizontal"
                  ariaLabel="Resize panel"
                  value={sizes.bottom}
                  min={PANEL_LIMITS.bottom.min}
                  max={Math.max(PANEL_LIMITS.bottom.min, Math.round((centerRef.current?.clientHeight ?? 800) * 0.55))}
                  invert
                  onChange={(v) => setPanelSize('bottom', v)}
                  onReset={() => resetPanelSize('bottom')}
                />
              ) : null}
              <div
                style={{
                  height: bottomMaximized ? '100%' : sizes.bottom,
                  flex: bottomMaximized ? '1 1 auto' : `0 0 ${sizes.bottom}px`,
                  minHeight: 0,
                  display: 'flex',
                }}
              >
                <BottomPanel projectId={project.id} events={live.events} />
              </div>
            </>
          ) : null}
        </div>

        {/* right agent sidebar */}
        {showAgentDocked ? (
          <>
            <Resizer
              orientation="vertical"
              ariaLabel="Resize agent sidebar"
              value={sizes.agent}
              min={PANEL_LIMITS.agent.min}
              max={PANEL_LIMITS.agent.max}
              invert
              onChange={(v) => setPanelSize('agent', v)}
              onReset={() => resetPanelSize('agent')}
            />
            <div style={{ width: sizes.agent, flex: `0 0 ${sizes.agent}px`, minWidth: 0, display: 'flex' }}>
              <ContextAgentSidebar
                projectId={project.id}
                agent={agent}
                segment={segment}
                revisions={project.revisions}
                onControlRequest={requestControl}
              />
            </div>
          </>
        ) : agentOpen && agentDrawer ? (
          <ContextAgentSidebar
            projectId={project.id}
            agent={agent}
            segment={segment}
            revisions={project.revisions}
            onControlRequest={requestControl}
          />
        ) : (
          <button
            type="button"
            className="cl-icon-btn"
            onClick={toggleAgent}
            title="Open Context Agent (⌘⇧A)"
            aria-label="Open Context Agent"
            style={{
              alignSelf: 'flex-start',
              margin: 4,
              background: 'var(--cl-panel)',
              border: '1px solid var(--cl-line)',
              color: 'var(--cl-ink)',
            }}
          >
            <PanelRightOpen size={14} aria-hidden />
          </button>
        )}
      </div>

      <StatusBar
        projectId={project.id}
        agentSlug={agentSlug}
        environment={project.environment}
        policyState={live.policyState}
        policyFreshness={live.policyFreshness}
        runtimeState={live.runtimeState}
        creMode={project.environment.creMode}
        creStatus={live.creStatus}
        syncSeconds={live.syncSeconds}
        problemCount={live.problemCount}
      />

      <CommandPalette
        projectId={project.id}
        agentSlug={agentSlug}
        onControlRequest={requestControl}
        onCompareRevisions={() => setRevisionsOpen(true)}
      />

      <Modal
        open={revisionsOpen}
        onClose={() => setRevisionsOpen(false)}
        title="Revisions"
        subtitle="What each surface is currently built against."
        wide
      >
        <RevisionDrawerBody
          revisions={project.revisions}
          onCompare={() => {
            setRevisionsOpen(false);
            router.push(`/projects/${project.id}/blueprint?agent=${agentSlug}&compare=1`);
          }}
        />
      </Modal>

      {/* toasts — lightweight feedback only (spec §48) */}
      <div className="cl-toasts" aria-live="polite">
        {toasts.map((toast) => (
          <div className="cl-toast" key={toast.id}>
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- resizer */

function Resizer({
  orientation,
  value,
  min,
  max,
  onChange,
  onReset,
  ariaLabel,
  invert,
}: {
  orientation: 'vertical' | 'horizontal';
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onReset: () => void;
  ariaLabel: string;
  /** Panel grows when the pointer moves toward the start of the axis. */
  invert?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const startRef = useRef({ pointer: 0, value: 0 });

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startRef.current = { pointer: orientation === 'vertical' ? e.clientX : e.clientY, value };
    setDragging(true);
    document.body.classList.add(orientation === 'vertical' ? 'cl-resizing' : 'cl-resizing-v');
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    const current = orientation === 'vertical' ? e.clientX : e.clientY;
    const delta = current - startRef.current.pointer;
    onChange(clamp(startRef.current.value + (invert ? -delta : delta)));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setDragging(false);
    document.body.classList.remove('cl-resizing', 'cl-resizing-v');
  };

  return (
    <div
      role="separator"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-orientation={orientation}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      className={orientation === 'vertical' ? 'cl-resizer' : 'cl-resizer-h'}
      data-dragging={dragging}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        const step = e.shiftKey ? 24 : 8;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          onChange(clamp(value + (invert ? step : -step)));
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          onChange(clamp(value + (invert ? -step : step)));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          onReset();
        }
      }}
    />
  );
}
