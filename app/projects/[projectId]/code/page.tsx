'use client';

/**
 * Code (spec §18).
 *
 * The generated sandbox files behind the agent. This is the one surface that is
 * genuinely a code editor, so the workbench runs its dark theme here.
 *
 * Editing rules the page enforces:
 *  - Generated code is read-only after a successful build, so the built artifact
 *    still corresponds to the Blueprint that produced it.
 *  - Developer mode may open a draft, but a hand edit marks the file MODIFIED,
 *    invalidates artifact correspondence, and requires a rebuild before deploy.
 *    A manual edit is never invisible to Blueprint validation.
 */
import { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Columns2,
  Copy,
  Download,
  FileWarning,
  GitCompare,
  Hammer,
  Lock,
  Play,
  TriangleAlert,
} from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import { Badge, BlockerBanner, StatusBadge } from '@/components/studio/primitives';
import { StandardConfirmation } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { CODE_GROUPS, CODE_MARK_LABEL } from '@/lib/studio/content/code';
import { toCodeFiles } from '@/lib/studio/api/adapters/design';
import { useBuildFile, useInvalidateAll } from '@/lib/studio/api/queries';
import { studio } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import { EmptyState } from '@/components/studio/primitives';
import type { CodeFile } from '@/lib/studio/types';

/* Monaco is heavy and browser-only: keep it off every other route's graph. */
const CodeEditor = dynamic(() => import('@/components/studio/code/CodeEditor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
const CodeDiff = dynamic(() => import('@/components/studio/code/CodeEditor').then((m) => m.CodeDiff), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});

export default function CodePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { developerMode, openBottom, setSelection, pushToast } = useWorkbench();

  const { agentSlug, ctx } = useStudioPage('code');
  const invalidate = useInvalidateAll();
  const view = ctx.buildView;
  const blueprintRevision = view?.blueprint?.revision ?? view?.build.blueprintRevision ?? 0;
  const BUILD_REVISION = view?.build.buildRevision ?? 0;
  const buildIsStale = view?.codeStale ?? false;

  /* The live sandbox files, from the build. Contents load per file; the tree needs only paths. */
  const CODE_FILES = useMemo<CodeFile[]>(() => (view ? toCodeFiles(view.files, blueprintRevision, BUILD_REVISION) : []), [view, blueprintRevision, BUILD_REVISION]);

  const [selectedPath, setSelectedPath] = useState<string>('');
  const [mode, setMode] = useState<'edit' | 'diff'>('edit');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listed = CODE_FILES.find((f) => f.path === selectedPath) ?? CODE_FILES[0] ?? null;
  const contentQ = useBuildFile(ctx.buildId, listed?.path ?? null);
  const file: CodeFile | null = listed ? { ...listed, content: contentQ.data ?? '' } : null;
  const draft = file ? drafts[file.path] : undefined;
  const isModified = file ? hasRealEdit(drafts, file.path, file.content) : false;
  const isUnlocked = file ? unlocked.includes(file.path) : false;
  const readOnly = !file || (file.readOnly && !isUnlocked);

  const grouped = useMemo(
    () =>
      CODE_GROUPS.map((group) => ({
        ...group,
        files: CODE_FILES.filter((f) => f.group === group.id),
      })).filter((g) => g.files.length > 0),
    [CODE_FILES],
  );

  const rebuild = async () => {
    if (!ctx.buildId) return;
    setError(null);
    setBusy('Rebuilding in an isolated sandbox — this takes a few minutes');
    try {
      studio.build(ctx.buildId).catch((e) => setError(e instanceof ApiError ? e.message : String(e))).finally(() => { setBusy(null); void invalidate(); });
      pushToast(`Rebuilding from Blueprint r${blueprintRevision}`);
      router.push(`/projects/${ctx.routeProjectId}/build`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setBusy(null);
    }
  };

  const downloadProject = async () => {
    if (!ctx.buildId) return;
    setError(null);
    setBusy('Preparing the export');
    try {
      const bundle = await studio.exportBundle(ctx.buildId);
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (const f of bundle.files) zip.file(f.path, f.content);
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${ctx.dataProjectId ?? 'agent'}-r${BUILD_REVISION}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      pushToast(`${bundle.files.length} files exported — secret scan passed on the server`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const select = (next: CodeFile) => {
    setSelectedPath(next.path);
    setMode('edit');
    setSelection({ kind: 'code-file', id: next.path, label: next.name });
  };

  const marksFor = (f: CodeFile) => (isModifiedFile(f) ? [...f.marks, 'modified' as const] : f.marks);
  const isModifiedFile = (f: CodeFile) => drafts[f.path] !== undefined && f.path === file?.path && hasRealEdit(drafts, f.path, file.content);

  if (!file || !view) {
    return (
      <StudioPage segment="code">
        <EmptyState
          title={ctx.loading ? 'Loading…' : 'No generated code yet'}
          body={ctx.loading ? '' : view && view.build.stage === 'AWAITING_APPROVAL' ? 'The build stopped at the approval boundary. Approve it in the Composer and the sandbox files appear here as they are written.' : 'Code is generated in an isolated sandbox after you approve the design. Describe the agent first.'}
          action={ctx.loading ? undefined : <button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/build`)}>Open Composer</button>}
        />
      </StudioPage>
    );
  }

  return (
    <StudioPage
      segment="code"
      bleed
      stale={buildIsStale}
      banners={
        <>
          {error ? <div style={{ padding: '0 16px 12px' }}><BlockerBanner tone="deny" title="The Studio API refused">{error}</BlockerBanner></div> : null}
          <div className="cl-row cl-row-wrap" style={{ marginBottom: 12, gap: 8 }}>
            <span className="cl-page-title" style={{ fontSize: 22, marginRight: 8 }}>
              Code
            </span>
            <Badge tone="neutral">Build r{BUILD_REVISION}</Badge>
            {buildIsStale ? <Badge tone="warn">STALE · Blueprint is r{blueprintRevision}</Badge> : null}
            <Badge tone="neutral">{CODE_FILES.length} files</Badge>
            <span className="cl-spacer" />
            <div className="cl-btn-group">
              <button
                type="button"
                className="cl-btn cl-btn-sm"
                onClick={() => void rebuild()}
                disabled={!!busy || view.build.status === 'RUNNING'}
                title="Runs the build pipeline again against the current Blueprint revision: new sandbox, new tests, new mandatory simulations."
              >
                <Hammer size={11} aria-hidden />
                {busy ?? 'Rebuild from Blueprint'}
              </button>
              <button type="button" className="cl-btn cl-btn-sm" onClick={() => openBottom('tests')}>
                <Play size={11} aria-hidden />
                Run tests
              </button>
              <button type="button" className="cl-btn cl-btn-sm" onClick={() => openBottom('problems')}>
                <FileWarning size={11} aria-hidden />
                Open Problems
              </button>
              <button
                type="button"
                className="cl-btn cl-btn-sm"
                onClick={() => setMode((m) => (m === 'diff' ? 'edit' : 'diff'))}
                aria-pressed={mode === 'diff'}
                disabled={!file.previousContent}
                title={file.previousContent ? 'Compare with the previous revision' : 'No earlier revision of this file'}
              >
                <GitCompare size={11} aria-hidden />
                Compare revision
              </button>
              <button type="button" className="cl-btn cl-btn-sm cl-btn-primary" onClick={() => void downloadProject()} disabled={!!busy} title="Every generated file, the Blueprint, the simulation report and the security report — scanned for secrets on the server before it leaves.">
                <Download size={11} aria-hidden />
                Download project
              </button>
            </div>
          </div>

          {isModified ? (
            <div style={{ padding: '0 16px 12px' }}>
              <BlockerBanner
                tone="warn"
                title="Generated code has been edited by hand"
                actions={
                  <button type="button" className="cl-btn cl-btn-sm" onClick={() => void rebuild()} disabled={!!busy}>
                    Rebuild from Blueprint
                  </button>
                }
              >
                The build no longer corresponds to the Blueprint that produced it. Revalidation and a rebuild are
                required before this agent can be deployed — a manual edit is never invisible to Blueprint validation.
              </BlockerBanner>
            </div>
          ) : null}
        </>
      }
    >
      <div className="cl-split" style={{ borderTop: '1px solid var(--cl-line)' }}>
        {/* file tree */}
        <div className="cl-split-side" data-lenis-prevent style={{ flex: '0 0 268px' }}>
          {grouped.map((group) => (
            <div key={group.id}>
              <div className="cl-explorer-group" style={{ paddingTop: 12 }}>
                <span className="cl-label">{group.label}</span>
              </div>
              <ul>
                {group.files.map((f) => (
                  <li key={f.path}>
                    <button
                      type="button"
                      className="cl-nav-item"
                      data-active={f.path === selectedPath}
                      onClick={() => select(f)}
                      title={f.path}
                    >
                      <span className="cl-nav-item-label cl-mono" style={{ fontSize: 12.5 }}>
                        {f.name}
                      </span>
                      {/* Only marks that actually differ between files: LOCKED was on
                          every entry, so it told you nothing. */}
                      {marksFor(f)
                        .filter((m) => m === 'modified' || m === 'stale')
                        .map((mark) => (
                          <span
                            key={mark}
                            className="cl-badge"
                            data-tone={CODE_MARK_LABEL[mark].tone}
                            title={CODE_MARK_LABEL[mark].title}
                            style={{ height: 16, padding: '0 5px', fontSize: 9 }}
                          >
                            {CODE_MARK_LABEL[mark].label}
                          </span>
                        ))}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* editor */}
        <div className="cl-split-main" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* toolbar */}
          <div
            className="cl-row cl-row-wrap"
            style={{
              gap: 8,
              padding: '9px 14px',
              borderBottom: '1px solid var(--cl-line)',
              background: 'var(--cl-panel-2)',
              flex: '0 0 auto',
            }}
          >
            <span className="cl-mono" style={{ fontSize: 12.5 }}>
              {file.path}
            </span>
            {file.blueprintSection ? (
              <button
                type="button"
                className="cl-btn cl-btn-ghost cl-btn-sm"
                onClick={() => router.push(`/projects/${ctx.routeProjectId}/blueprint?agent=${agentSlug}`)}
                title="Open the Blueprint section that generated this file"
              >
                from Blueprint · {file.blueprintSection.replace(/-/g, ' ')}
              </button>
            ) : null}
            {/* The language is in the extension, the build revision is in the page
                header, and GENERATED repeats the tree group — so none of them
                earn a badge here. What is left is what varies per file. */}
            {readOnly ? (
              <Badge tone="blocked" title="Generated code is read-only after a successful build">
                Read-only
              </Badge>
            ) : (
              <Badge tone="warn">Draft · editable</Badge>
            )}
            {isModified ? <Badge tone="warn">Modified</Badge> : null}
            {file.marks.includes('stale') ? (
              <Badge tone="warn" title={CODE_MARK_LABEL.stale.title}>
                STALE
              </Badge>
            ) : null}

            <span className="cl-spacer" />

            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => setMode((m) => (m === 'diff' ? 'edit' : 'diff'))}
              aria-pressed={mode === 'diff'}
              disabled={!file.previousContent}
            >
              <Columns2 size={11} aria-hidden />
              Diff
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(draft ?? file.content);
                pushToast('File contents copied');
              }}
            >
              <Copy size={11} aria-hidden />
              Copy
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => {
                navigator.clipboard?.writeText(file.path);
                pushToast('File path copied');
              }}
            >
              Copy path
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => {
                const blob = new Blob([draft ?? file.content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                a.click();
                URL.revokeObjectURL(url);
                pushToast(`${file.name} downloaded`);
              }}
            >
              <Download size={11} aria-hidden />
              Download
            </button>
            {file.readOnly && !isUnlocked ? (
              <button
                type="button"
                className="cl-btn cl-btn-sm"
                onClick={() => setUnlockOpen(true)}
                disabled={!developerMode}
                title={
                  developerMode
                    ? 'Open a draft of this generated file'
                    : 'Editing generated code requires developer mode'
                }
              >
                <Lock size={11} aria-hidden />
                Edit draft
              </button>
            ) : null}
          </div>


          {/* editor surface */}
          <div className="cl-editor-well" style={{ flex: '1 1 auto', minHeight: 0 }} data-lenis-prevent>
            {mode === 'diff' && file.previousContent ? (
              <CodeDiff original={file.previousContent} modified={draft ?? file.content} language={file.language} />
            ) : (
              <CodeEditor
                value={draft ?? file.content}
                language={file.language}
                readOnly={readOnly}
                /* A read-only editor must never record a draft: Monaco emits a
                   change when it loads a model, which would mark files the user
                   never touched as MODIFIED. */
                onChange={(next) =>
                  readOnly ? undefined : setDrafts((prev) => ({ ...prev, [file.path]: next }))
                }
              />
            )}
          </div>

          {/* status strip */}
          <div
            className="cl-row"
            style={{
              gap: 10,
              padding: '6px 14px',
              borderTop: '1px solid var(--cl-line)',
              flex: '0 0 auto',
              fontSize: 12,
            }}
          >
            {readOnly ? (
              <span className="cl-meta">
                Generated code is locked after a successful build so the artifact still matches its Blueprint.
              </span>
            ) : (
              <span className="cl-row" style={{ gap: 7, color: 'var(--cl-warn)' }}>
                <TriangleAlert size={12} aria-hidden />
                Draft open. Saving invalidates artifact correspondence and requires a rebuild before deployment.
              </span>
            )}
            <span className="cl-spacer" />
            {file.coveredByTest ? (
              <span className="cl-meta">Covered by {file.coveredByTest}</span>
            ) : null}
          </div>
        </div>
      </div>

      {/* unlock generated file */}
      <StandardConfirmation
        open={unlockOpen}
        onClose={() => setUnlockOpen(false)}
        onConfirm={() => {
          setUnlocked((prev) => [...prev, file.path]);
          setUnlockOpen(false);
          pushToast(`${file.name} opened as a draft`);
        }}
        title="Edit generated code"
        consequence="This file was generated from the Blueprint. Editing it by hand breaks the correspondence between the build and the Blueprint that produced it, so the agent cannot be deployed until it has been revalidated and rebuilt. The edit is recorded and shown in Problems — it is never invisible to validation."
        resource={file.path}
        actionLabel="Open draft"
      />
    </StudioPage>
  );
}

/**
 * True only for a genuine edit. Monaco normalises line endings when it loads a
 * model, so a raw string comparison reports files as modified that were only
 * ever opened.
 */
function hasRealEdit(drafts: Record<string, string>, path: string, original: string): boolean {
  const draft = drafts[path];
  if (draft === undefined) return false;
  const normalise = (text: string) => text.replace(/\r\n/g, '\n').replace(/\s+$/, '');
  return normalise(draft) !== normalise(original);
}

function EditorSkeleton() {
  return (
    <div style={{ padding: 16 }} className="cl-col">
      {[92, 74, 86, 60, 78, 54].map((w, i) => (
        <div key={i} className="cl-skeleton" style={{ height: 12, width: `${w}%` }} />
      ))}
    </div>
  );
}
