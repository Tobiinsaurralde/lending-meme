'use client';

/**
 * Projects / Home (spec §9.1).
 *
 * The one place to create or open a project before entering the IDE workbench. Projects belong to
 * the connected wallet; without one, the anonymous local session's projects are shown. Duplicate
 * copies the description into a new draft and never any authority; Archive and Import are not
 * offered by the backend yet and say so rather than pretending.
 */
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Archive, Copy, Download, FolderOpen, Plus, RefreshCw, Search, Wallet } from 'lucide-react';
import { Badge, BlockerBanner, CRE_MODE_LABEL, StatusBadge, TimeAgo } from '@/components/studio/primitives';
import { Modal } from '@/components/studio/dialogs';
import { NewProjectModal } from '@/components/studio/NewProjectModal';
import { WalletChip } from '@/components/studio/wallet/WalletChip';
import { useWalletSession } from '@/lib/studio/wallet-session';
import { PROJECT_TEMPLATES } from '@/lib/studio/content/templates';
import { useProjectsIndex, useSessionUser, useInvalidateAll } from '@/lib/studio/api/queries';
import { organizationSummaryOf, projectSummaryOf } from '@/lib/studio/api/adapters/shell';
import { studio } from '@/lib/studio/api/endpoints';
import { ANONYMOUS_USER } from '@/lib/studio/api/session';
import type { ProjectSummary } from '@/lib/studio/types';
import type { ProjectRow } from '@/lib/studio/api/types';

/**
 * Opens the wallet modal once when arriving with ?connect=1.
 *
 * The landing's Enter Studio sends people here rather than connecting on the marketing page, which
 * keeps roughly 7,000 modules of wallet stack off a page most visitors will only read. The
 * connection is made at the threshold, and everything past it runs on that one session.
 */
function ConnectOnEntry() {
  const params = useSearchParams();
  const router = useRouter();
  const { activated, requestConnect } = useWalletSession();
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current || params.get('connect') !== '1') return;
    fired.current = true;
    router.replace('/projects');
    if (!activated) requestConnect();
  }, [params, router, activated, requestConnect]);

  return null;
}

/** Where "Open" lands: the Composer while a build is still being designed, Overview otherwise. */
function entryFor(p: ProjectRow): string {
  const b = p.build;
  if (!b) return `/projects/${p.id}/build`;
  if (b.status === 'AWAITING_APPROVAL' || (b.status === 'RUNNING' && b.stage !== 'EXPORT_READY') || b.status === 'BUILD_NEEDS_USER_REVIEW' || b.status === 'FAILED') {
    return `/projects/${p.id}/build`;
  }
  if (p.deployment && p.deployment.state !== 'STOPPED' && p.deployment.state !== 'FAILED') return `/projects/${p.id}/overview`;
  return `/projects/${p.id}/security`;
}

export default function ProjectsHome() {
  const router = useRouter();
  const user = useSessionUser();
  const index = useProjectsIndex();
  const invalidate = useInvalidateAll();
  const { requestConnect } = useWalletSession();
  const [query, setQuery] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [importOpen, setImportOpen] = useState(false);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const d = index.data;
    if (!d) return [] as Array<{ summary: ProjectSummary; href: string; row: ProjectRow | null }>;
    const orgs = d.organizations.map((o) => ({ summary: organizationSummaryOf(o), href: `/projects/${o.id}/organization`, row: null }));
    const standalone = d.projects.filter((p) => !p.organization).map((p) => ({ summary: projectSummaryOf(p, null), href: entryFor(p), row: p }));
    return [...orgs, ...standalone].sort((a, b) => (a.summary.updatedAt < b.summary.updatedAt ? 1 : -1));
  }, [index.data]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.summary.name.toLowerCase().includes(q) || r.summary.description.toLowerCase().includes(q) || (r.summary.organization ?? '').toLowerCase().includes(q));
  }, [query, rows]);

  const groups = useMemo(() => {
    const m = new Map<string, typeof visible>();
    for (const r of visible) {
      const key = r.row === null ? 'Organizations' : 'Agents';
      m.set(key, [...(m.get(key) ?? []), r]);
    }
    return [...m.entries()];
  }, [visible]);

  const duplicate = async (row: ProjectRow) => {
    setError(null);
    setDuplicating(row.id);
    try {
      const build = await studio.createBuild({
        prompt: row.prompt,
        name: `${row.name} (copy)`,
        ...(row.ensName ? { ensName: row.ensName } : {}),
        idempotencyKey: `dup-${row.id}-${Date.now()}`,
      });
      await invalidate();
      router.push(`/projects/${build.projectId}/build?start=1`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDuplicating(null);
    }
  };

  const anonymous = user === ANONYMOUS_USER;

  return (
    <div className="cl-studio" style={{ minHeight: '100vh', background: 'var(--cl-canvas)' }}>
      <Suspense fallback={null}>
        <ConnectOnEntry />
      </Suspense>

      <header className="cl-row cl-chrome-bar" style={{ height: 56, padding: '0 22px', borderBottom: '1px solid var(--cl-line-chrome)', gap: 14 }}>
        <a href="/" className="cl-studio-mark" style={{ fontFamily: 'var(--serif)', fontSize: 18, letterSpacing: '-0.3px' }} title="Back to the landing page">
          ContextLock Studio
        </a>
        <span className="cl-env-badge" title="Production-chain execution is disabled across all projects.">
          <span>TESTNET LAB</span>
        </span>
        <span className="cl-spacer" />
        <WalletChip />
        <div className="cl-cmd-field" style={{ width: 300 }}>
          <Search size={14} aria-hidden />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects"
            aria-label="Search projects"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13 }}
          />
        </div>
        <button type="button" className="cl-btn cl-btn-invert" onClick={() => { setTemplateId(undefined); setNewOpen(true); }}>
          <Plus size={13} aria-hidden />
          New Agent
        </button>
      </header>

      <main style={{ maxWidth: 1320, margin: '0 auto', padding: '30px 24px 64px' }}>
        <div className="cl-row" style={{ alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 30, letterSpacing: '-0.6px', lineHeight: 1.15 }}>Your agent projects</h1>
            <p className="cl-page-sub" style={{ marginTop: 6 }}>
              Each project holds one or more financial agents, their authority model, and everything proved about them.
              {anonymous ? ' You are browsing as the anonymous local session — connect a wallet to keep projects under your address.' : ` Projects for ${user.slice(0, 6)}…${user.slice(-4)}.`}
            </p>
          </div>
          <span className="cl-spacer" />
          <button type="button" className="cl-btn" onClick={() => void index.refetch()} title="Re-read the project list">
            <RefreshCw size={13} aria-hidden />
            Refresh
          </button>
          <button type="button" className="cl-btn" onClick={() => setImportOpen(true)}>
            <Download size={13} aria-hidden />
            Import
          </button>
        </div>

        {anonymous ? (
          <BlockerBanner
            tone="warn"
            title="No wallet connected"
            actions={
              <button type="button" className="cl-btn cl-btn-sm" onClick={requestConnect}>
                <Wallet size={12} aria-hidden />
                Connect wallet
              </button>
            }
          >
            The connected wallet is your identity in the Studio: projects are kept under its address and it signs escalation approvals on the fork.
            Until one is connected you are the anonymous local operator and see that session’s projects.
          </BlockerBanner>
        ) : null}

        {index.isError ? (
          <BlockerBanner tone="deny" title="The Studio API is not reachable">
            {(index.error as Error).message}. Start it with <span className="cl-mono">npm run studio:api</span> and refresh.
          </BlockerBanner>
        ) : null}
        {error ? <BlockerBanner tone="deny" title="Could not duplicate">{error}</BlockerBanner> : null}

        {index.isLoading ? (
          <div className="cl-card"><div className="cl-card-body"><span className="cl-meta">Loading projects…</span></div></div>
        ) : null}

        {!index.isLoading && !index.isError && rows.length === 0 ? (
          <div className="cl-card">
            <div className="cl-card-body">
              <div className="cl-strong">No projects yet</div>
              <p className="cl-meta" style={{ whiteSpace: 'normal', marginTop: 6 }}>
                Describe an agent to create the first one. ContextLock designs its authority, reviews it and stops for your approval before generating any code.
              </p>
              <button type="button" className="cl-btn cl-btn-primary" style={{ marginTop: 12 }} onClick={() => { setTemplateId(undefined); setNewOpen(true); }}>
                <Plus size={13} aria-hidden />
                New Agent
              </button>
            </div>
          </div>
        ) : null}

        {groups.map(([group, items]) => (
          <section key={group} className="cl-section">
            <div className="cl-section-head">
              <span className="cl-label">{group}</span>
              <span className="cl-section-rule" />
              <span className="cl-meta">{items.length} project{items.length === 1 ? '' : 's'}</span>
            </div>

            <div className="cl-card">
              <div className="cl-table-scroll">
                <table className="cl-table" style={{ minWidth: 940 }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 230 }}>Project</th>
                      <th style={{ width: 62 }}>Agents</th>
                      <th style={{ width: 96 }}>State</th>
                      <th style={{ width: 86 }}>Revision</th>
                      <th style={{ width: 160 }}>Execution</th>
                      <th style={{ width: 128 }}>CRE mode</th>
                      <th style={{ width: 92 }}>Updated</th>
                      <th style={{ width: 216 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(({ summary: p, href, row }) => (
                      <tr key={p.id} data-clickable="true" onClick={() => router.push(href)}>
                        <td>
                          <div className="cl-strong">{p.name}</div>
                          <div className="cl-meta" style={{ whiteSpace: 'normal', maxWidth: 420 }}>
                            {p.description.length > 160 ? `${p.description.slice(0, 160)}…` : p.description}
                          </div>
                        </td>
                        <td>{p.agentCount}</td>
                        <td><StatusBadge status={p.lifecycle} /></td>
                        <td className="cl-mono">{p.lastRevision === null ? '—' : `r${p.lastRevision}`}</td>
                        <td><Badge tone="sim">{p.executionNetwork}</Badge></td>
                        <td><span className="cl-meta">{CRE_MODE_LABEL[p.creMode]}</span></td>
                        <td className="cl-meta"><TimeAgo iso={p.updatedAt} /></td>
                        <td>
                          <div className="cl-row" style={{ justifyContent: 'flex-end', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                            <button type="button" className="cl-btn cl-btn-sm" onClick={() => router.push(href)}>
                              <FolderOpen size={12} aria-hidden />
                              Open
                            </button>
                            {row ? (
                              <button
                                type="button"
                                className="cl-btn cl-btn-sm"
                                title="Starts a new build from the same description. Identity, policy and any active authority are never copied."
                                disabled={duplicating === row.id}
                                onClick={() => void duplicate(row)}
                              >
                                <Copy size={12} aria-hidden />
                                {duplicating === row.id ? 'Copying…' : 'Duplicate'}
                              </button>
                            ) : null}
                            <button type="button" className="cl-btn cl-btn-sm" disabled title="Archiving is not offered by the Studio API yet. Deployed contracts and recorded evidence are never removed.">
                              <Archive size={12} aria-hidden />
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ))}

        <section className="cl-section">
          <div className="cl-section-head">
            <span className="cl-label">Templates</span>
            <span className="cl-section-rule" />
          </div>
          <div className="cl-grid cl-grid-auto">
            {PROJECT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                className="cl-card"
                style={{ textAlign: 'left', cursor: 'pointer', padding: 0 }}
                onClick={() => { setTemplateId(t.id); setNewOpen(true); }}
              >
                <div className="cl-card-body">
                  <div className="cl-strong" style={{ fontSize: 13 }}>{t.name}</div>
                  <p className="cl-meta" style={{ margin: '6px 0 10px', whiteSpace: 'normal' }}>{t.description}</p>
                  <div className="cl-row cl-row-wrap" style={{ gap: 5 }}>
                    {t.protocols.length === 0 ? <Badge tone="neutral">No preset authority</Badge> : t.protocols.map((p) => <Badge key={p} tone="neutral">{p}</Badge>)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      <NewProjectModal open={newOpen} onClose={() => setNewOpen(false)} templateId={templateId} />

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import project"
        subtitle="Accepts a validated ContextLock project bundle."
        footer={
          <>
            <button type="button" className="cl-btn" onClick={() => setImportOpen(false)}>Cancel</button>
            <button type="button" className="cl-btn cl-btn-primary" disabled>Import Project</button>
          </>
        }
      >
        <div className="cl-field">
          <label className="cl-field-label" htmlFor="import-file">Project bundle</label>
          <input id="import-file" type="file" className="cl-input" style={{ paddingTop: 4 }} accept=".json,.ctxlock" disabled />
          <span className="cl-field-hint">
            Import is not offered by the Studio API yet. When it is, the bundle will be validated before anything is created, and an imported project will never carry active on-chain authority.
          </span>
        </div>
      </Modal>
    </div>
  );
}
