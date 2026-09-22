'use client';

/**
 * Page scaffold used by every workbench page.
 *
 * Registers the page with the shell (opens/focuses its editor tab, sets the
 * Context Agent page kind, clears stale selection) and renders the standard
 * page header. Pages supply their own body.
 */
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { PageHeader } from './primitives';
import { metaForSegment } from '@/lib/studio/nav';
import { usePageRegistration } from '@/lib/studio/workbench';
import { useStudioProject, type StudioProjectValue } from '@/lib/studio/api/project-context';
import type { Agent, Project } from '@/lib/studio/types';

/**
 * What every page starts from: the resolved project, the selected agent, and the backend ids the
 * page's own queries should use. `project` is never null here — a route with no project yet gets a
 * draft shell so the page can render its empty state.
 */
export function useStudioPage(segment: string): {
  agent: Agent;
  agentSlug: string;
  meta: ReturnType<typeof metaForSegment>;
  project: Project;
  searchParams: ReturnType<typeof useSearchParams>;
  ctx: StudioProjectValue;
} {
  const searchParams = useSearchParams();
  const ctx = useStudioProject();
  const meta = metaForSegment(segment);
  const project: Project = ctx.project ?? {
    id: ctx.routeProjectId, name: ctx.isDraft ? 'New agent' : 'Loading…', description: '', agentCount: 1, lifecycle: 'DRAFT', lastRevision: null,
    executionNetwork: 'Ethereum Sepolia', creMode: 'MY_CRE_SIMULATOR', updatedAt: new Date(0).toISOString(), alerts: 0, organization: null,
    agents: [], revisions: { requirements: null, blueprint: null, blueprintDraft: null, strategy: null, build: null, deployment: null, runtime: null, policy: null, creArtifactHash: null },
    environment: { executionNetwork: 'Ethereum Sepolia', executionChainId: 11155111, realitySource: 'Ethereum Mainnet', realityMode: 'LIVE_MAINNET_MIRROR', mainnetWrites: 'PROHIBITED', creMode: 'MY_CRE_SIMULATOR', label: 'TESTNET LAB' },
    blockers: [],
  };
  const agent: Agent = ctx.agent ?? {
    id: 'draft', name: project.name, slug: 'agent', role: '', objective: '', status: 'DRAFT', executionClass: 'WRITE_CAPABLE', ensName: '—', ensNode: '', address: '',
    allowedAdapters: [], budget: { autonomousPerAction: 0, windowLimit: 0, windowUsed: 0, window: 'per action' }, orgBudgetImpact: 0, policyHash: '', runtimeRevision: null, parentId: null,
    projectId: ctx.dataProjectId, buildId: ctx.buildId,
  };
  const agentSlug = searchParams.get('agent') ?? agent.slug;
  return { agent, agentSlug, meta, project, searchParams, ctx };
}

export function StudioPage({
  segment,
  title,
  subtitle,
  badges,
  actions,
  banners,
  children,
  live,
  stale,
  /** Full-bleed pages (canvas, split views) skip the padded content column. */
  bleed,
  /** Optional class on the page surface, for per-page styling variants. */
  surfaceClass,
}: {
  segment: string;
  title?: string;
  subtitle?: string;
  badges?: ReactNode;
  actions?: ReactNode;
  banners?: ReactNode;
  children: ReactNode;
  live?: boolean;
  stale?: boolean;
  bleed?: boolean;
  surfaceClass?: string;
}) {
  const { agentSlug, meta, ctx } = useStudioPage(segment);

  usePageRegistration({
    id: `${segment}:${agentSlug}`,
    title: meta.tabTitle,
    href: `/projects/${ctx.routeProjectId}/${segment}?agent=${agentSlug}`,
    pageKind: meta.pageKind,
    live,
    stale,
  });

  if (bleed) {
    return (
      /* Banners take their natural height; the body takes what is left. Using
         height: 100% here made the body a full pane tall *below* the banners,
         which overflowed and left the page unable to scroll. */
      /*
        data-lenis-prevent on the whole bleed surface: these pages scroll pane by
        pane, and Lenis — bound to the page column — was intercepting wheel
        events before they reached those panes. The left list scrolled only
        because it carried the attribute individually; the detail pane did not.
      */
      <div
        className={`cl-bleed${surfaceClass ? ` ${surfaceClass}` : ''}`}
        data-lenis-prevent
        style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}
      >
        {banners ? <div style={{ flex: '0 0 auto', padding: '12px 16px 0' }}>{banners}</div> : null}
        <div style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0 }}>{children}</div>
      </div>
    );
  }

  return (
    <div className={`cl-page-pad${surfaceClass ? ` ${surfaceClass}` : ''}`}>
      {banners}
      <PageHeader title={title ?? meta.title} subtitle={subtitle ?? meta.purpose} badges={badges} actions={actions} />
      {children}
    </div>
  );
}
