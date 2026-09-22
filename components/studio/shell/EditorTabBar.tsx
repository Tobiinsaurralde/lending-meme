'use client';

/**
 * Center editor tabs (spec §3.3).
 *
 *   ·  dot         unsaved client-side edits
 *   ·  warning     stale artifact / revision
 *   ·  live dot    tab is showing observed runtime state
 *
 * Single-click navigation reuses the preview tab; double-click pins it. Tabs are
 * persisted by the workbench store so they restore after a refresh.
 */
import { useRouter, usePathname } from 'next/navigation';
import { AlertTriangle, PanelBottom, PanelRight, X } from 'lucide-react';
import { useWorkbench } from '@/lib/studio/workbench';

export function EditorTabBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { tabs, closeTab, pinTab, toggleBottom, bottomOpen, toggleAgent, agentOpen } = useWorkbench();

  /**
   * Closing the tab you are standing on has to move you somewhere — to the
   * neighbouring tab, or back to Overview when it was the last one. Otherwise
   * the tab vanishes and its page stays on screen, unselected.
   */
  const close = (id: string) => {
    const focus = closeTab(id);
    if (focus) {
      router.push(focus.href);
    } else if (tabs.length <= 1) {
      const projectId = pathname.split('/')[2];
      if (projectId) router.push(`/projects/${projectId}/overview`);
    }
  };

  return (
    <div className="cl-tabbar" role="tablist" aria-label="Open editors">
      {tabs.map((tab) => {
        const active = pathname === tab.href.split('?')[0];
        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={active}
            tabIndex={0}
            className="cl-tab"
            data-active={active}
            data-preview={tab.preview}
            onClick={() => router.push(tab.href)}
            onDoubleClick={() => pinTab(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                router.push(tab.href);
              }
            }}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                close(tab.id);
              }
            }}
            title={tab.stale ? `${tab.title} · stale artifact` : tab.title}
          >
            {tab.stale ? <AlertTriangle size={11} aria-hidden style={{ color: 'var(--cl-warn)' }} /> : null}
            {tab.live ? <span className="cl-tab-live cl-pulse" aria-label="showing live state" /> : null}
            <span>{tab.title}</span>
            {tab.dirty ? <span className="cl-tab-dot" aria-label="unsaved changes" /> : null}
            <span
              role="button"
              tabIndex={-1}
              aria-label={`Close ${tab.title}`}
              className="cl-tab-close"
              onClick={(e) => {
                e.stopPropagation();
                close(tab.id);
              }}
            >
              <X size={11} aria-hidden />
            </span>
          </div>
        );
      })}

      <span className="cl-spacer" />

      <button
        type="button"
        className="cl-tab"
        onClick={toggleBottom}
        title="Toggle panel (⌘J)"
        aria-label="Toggle bottom panel"
        style={{ borderRight: 'none', color: bottomOpen ? 'var(--cl-ink)' : undefined }}
      >
        <PanelBottom size={13} aria-hidden />
      </button>
      <button
        type="button"
        className="cl-tab"
        onClick={toggleAgent}
        title="Toggle Agent Sidebar (⌘⇧A)"
        aria-label="Toggle agent sidebar"
        style={{ borderRight: 'none', color: agentOpen ? 'var(--cl-ink)' : undefined }}
      >
        <PanelRight size={13} aria-hidden />
      </button>
    </div>
  );
}
