'use client';

/**
 * Composer / Build (spec §10).
 *
 * The starting surface for natural-language agent creation. The backend pipeline runs
 * requirements → Blueprint → security review and STOPS at the approval boundary; nothing is generated
 * until the person reviewing the authority says so here. Everything on this page is the persisted
 * build re-read from the server — the event stream is only the reason to re-read it.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FileInput, Lightbulb, Play, Sparkles, Square } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import { AgentPatchInbox } from '@/components/studio/AgentPatches';
import { RequirementInterview } from '@/components/studio/RequirementInterview';
import { Badge, BlockerBanner, Card, Section, StatusBadge, TimeAgo } from '@/components/studio/primitives';
import { Modal } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { COMPOSER_EXAMPLES, COMPOSER_SLASH_HELPERS, questionsFor, type BuildStage } from '@/lib/studio/content/composer';
import { detectedRequirements, usd, type RequirementsEvent } from '@/lib/studio/api/adapters/design';
import { studio } from '@/lib/studio/api/endpoints';
import { ApiError } from '@/lib/studio/api/client';
import { known } from '@/lib/studio/api/types';
import { useInvalidateAll } from '@/lib/studio/api/queries';
import type { Status } from '@/lib/studio/types';

const DRAFT_KEY = 'ctxlock.composer.draft';

const STAGES: Array<{ id: string; name: string; panel: 'output' | 'tests' | 'problems'; stages: string[] }> = [
  { id: 'REQUIREMENTS', name: 'Requirements', panel: 'output', stages: ['REQUIREMENTS'] },
  { id: 'BLUEPRINT', name: 'Blueprint', panel: 'output', stages: ['BLUEPRINT'] },
  { id: 'SECURITY_REVIEW', name: 'Security Review', panel: 'problems', stages: ['SECURITY_REVIEW'] },
  { id: 'AWAITING_APPROVAL', name: 'User Review', panel: 'output', stages: ['AWAITING_APPROVAL'] },
  { id: 'BUILD', name: 'Build', panel: 'output', stages: ['BUILD', 'REPAIR'] },
  { id: 'TEST', name: 'Tests & simulations', panel: 'tests', stages: ['TEST', 'SIMULATE', 'FINAL_VERIFY', 'EXPORT_READY'] },
];
const ORDER = ['INTAKE', 'REQUIREMENTS', 'BLUEPRINT', 'SECURITY_REVIEW', 'AWAITING_APPROVAL', 'BUILD', 'TEST', 'SIMULATE', 'REPAIR', 'FINAL_VERIFY', 'EXPORT_READY'];

export default function ComposerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openBottom, setSelection, pushToast } = useWorkbench();
  const { project, ctx } = useStudioPage('build');
  const invalidate = useInvalidateAll();

  const view = ctx.buildView;
  const build = view?.build ?? null;
  const bp = view?.blueprint ?? null;
  const isDraft = ctx.isDraft;

  /* ── the description ─────────────────────────────────────────────────── */
  const [text, setText] = useState('');
  const [name, setName] = useState('');
  const [ens, setEns] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isDraft) {
      if (ctx.row && text === '') setText(ctx.row.prompt);
      return;
    }
    setName(searchParams.get('name') ?? '');
    setEns(searchParams.get('ens') ?? '');
    const seed = searchParams.get('seed');
    if (seed) { setText(seed); return; }
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) setText(saved);
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDraft, ctx.row?.id]);

  /* autosave the draft description — UI-local only */
  useEffect(() => {
    if (!isDraft) return;
    const handle = window.setTimeout(() => {
      if (!text) return;
      try { window.localStorage.setItem(DRAFT_KEY, text); setSavedAt(new Date().toISOString()); } catch { /* ignore */ }
    }, 700);
    return () => window.clearTimeout(handle);
  }, [text, isDraft]);

  /* ── the pipeline ────────────────────────────────────────────────────── */
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const designStarted = useRef(false);

  /* A freshly created build (from the modal) arrives with ?start=1 and is designed once. */
  useEffect(() => {
    if (designStarted.current || !ctx.buildId || !build) return;
    if (searchParams.get('start') !== '1' || build.stage !== 'INTAKE' || build.status !== 'RUNNING') return;
    designStarted.current = true;
    router.replace(`/projects/${ctx.routeProjectId}/build`);
    void runDesign(ctx.buildId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx.buildId, build?.stage, build?.status]);

  const runDesign = async (buildId: string) => {
    setError(null);
    setBusy('Understanding the request, designing permissions, reviewing security…');
    try {
      await studio.design(buildId);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(null);
      await invalidate();
    }
  };

  const generate = async () => {
    setError(null);
    if (text.trim().length < 10) { setError('Describe the agent in at least a sentence.'); return; }
    setBusy('Creating the project…');
    try {
      /* A build already designed for this project is superseded: let it go so the concurrency slot is free. */
      if (build && build.status !== 'COMPLETED' && build.status !== 'ABANDONED') {
        await studio.abandon(build.id, 'superseded by a regenerated design').catch(() => undefined);
      }
      const created = await studio.createBuild({
        prompt: text.trim(),
        ...(isDraft ? { name: name.trim() || undefined, ...(ens.trim() ? { ensName: ens.trim() } : {}) } : { name: project.name }),
        idempotencyKey: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      });
      try { window.localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      await invalidate();
      if (created.projectId !== ctx.routeProjectId) {
        router.replace(`/projects/${created.projectId}/build?start=1`);
        return;
      }
      await runDesign(created.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setBusy(null);
    }
  };

  const cancelBuild = async () => {
    if (!build) return;
    setBusy('Letting go of this build…');
    try {
      await studio.abandon(build.id, 'cancelled by the operator');
      pushToast('Build abandoned. Persisted artifacts were kept.');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(null);
      await invalidate();
    }
  };

  const approveAndBuild = async () => {
    if (!build || !view) return;
    setError(null);
    const modelCriticals = view.findings.filter((f) => f.severity === 'CRITICAL' && f.source === 'security-architect').map((f) => f.code);
    try {
      setBusy('Approving…');
      await studio.approve(build.id, modelCriticals);
      await invalidate();
      setBusy('Generating code in an isolated sandbox — this takes a few minutes. You can leave this page.');
      // The build runs server-side; the promise resolves when it finishes. Progress arrives on the event stream.
      studio.build(build.id).catch((e) => setError(e instanceof ApiError ? e.message : String(e))).finally(() => { setBusy(null); void invalidate(); });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
      setBusy(null);
    }
  };

  /* ── derived views ───────────────────────────────────────────────────── */
  const requirementsEvent = useMemo<RequirementsEvent | null>(() => {
    const ev = [...ctx.buildEvents].reverse().find((e) => e.type === 'requirements.completed');
    return ev ? (ev.payload as RequirementsEvent) : null;
  }, [ctx.buildEvents]);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const requirements = useMemo(() => detectedRequirements(bp, requirementsEvent).map((r) => (answers[r.id] ? { ...r, value: answers[r.id]!, status: 'PASS' as Status, note: 'Answered here — regenerate to apply it to the design.' } : r)), [bp, requirementsEvent, answers]);
  const openQuestions = useMemo(() => questionsFor(requirements), [requirements]);
  const missingRequired = requirements.filter((r) => r.status === 'REQUIRED');

  const running = build?.status === 'RUNNING';
  const awaiting = build?.stage === 'AWAITING_APPROVAL' && build.status === 'AWAITING_APPROVAL';
  const complete = build?.status === 'COMPLETED';
  const needsReview = build?.status === 'BUILD_NEEDS_USER_REVIEW';
  const failed = build?.status === 'FAILED';
  const abandoned = build?.status === 'ABANDONED';
  const paused = build?.status === 'BUILD_PAUSED_UPSTREAM_LIMIT' || build?.status === 'BUILD_LIMIT_REACHED';

  const stages: BuildStage[] = useMemo(() => {
    if (!build) return [];
    const idx = ORDER.indexOf(build.stage);
    return STAGES.map((s) => {
      const first = ORDER.indexOf(s.stages[0]!);
      const last = ORDER.indexOf(s.stages[s.stages.length - 1]!);
      let status: Status = 'PENDING';
      if (idx > last) status = s.id === 'SECURITY_REVIEW' && (view?.findings.some((f) => f.severity === 'CRITICAL') ?? false) ? 'WARN' : 'PASS';
      else if (idx >= first && idx <= last) {
        status = running ? 'RUNNING' : awaiting && s.id === 'AWAITING_APPROVAL' ? 'REQUIRED' : complete ? 'PASS' : failed || needsReview ? 'FAIL' : abandoned ? 'STOPPED' : paused ? 'PAUSED' : 'PENDING';
      }
      const detail =
        s.id === 'REQUIREMENTS' ? (requirementsEvent?.objective ?? (bp ? bp.objective : '')) :
        s.id === 'BLUEPRINT' ? (bp ? `Blueprint r${bp.revision} · ${bp.actions.length} action(s) · ${bp.adapters.length} adapter(s)` : '') :
        s.id === 'SECURITY_REVIEW' ? (view ? `${view.findings.length} finding(s) · ${view.findings.filter((f) => f.severity === 'CRITICAL').length} critical` : '') :
        s.id === 'AWAITING_APPROVAL' ? (build.approvedAt ? `approved ${new Date(build.approvedAt).toLocaleString()}` : awaiting ? 'Review the authority below and decide.' : '') :
        s.id === 'BUILD' ? (view?.files.length ? `${view.files.length} file(s) in the sandbox${build.repairCycles ? ` · ${build.repairCycles} repair cycle(s)` : ''}` : '') :
        (view?.simulations.length ? `${view.simulations.filter((x) => x.passed).length}/${view.simulations.length} scenarios passed · ${view.tests.length} suite(s)` : '');
      return { id: s.id, name: s.name, status, detail: detail || (status === 'PENDING' ? 'Not started' : ''), panel: s.panel };
    });
  }, [build, view, bp, requirementsEvent, running, awaiting, complete, failed, needsReview, abandoned, paused]);

  const usage = view?.usage;
  const nearQuota = !!usage && usage.peakFraction >= 0.8;

  const statusLine =
    isDraft ? 'Draft · Blueprint not generated'
    : !build ? 'No build yet'
    : running ? `Running · ${build.stage.toLowerCase().replace(/_/g, ' ')}`
    : awaiting ? 'Awaiting your review'
    : complete ? `Complete · Blueprint r${bp?.revision ?? build.blueprintRevision} · build r${build.buildRevision}`
    : needsReview ? 'Build needs your review'
    : failed ? 'Build failed'
    : abandoned ? 'Abandoned'
    : paused ? 'Paused by a limit'
    : build.status.toLowerCase().replace(/_/g, ' ');

  const insertHelper = (insert: string) => {
    setText((prev) => `${prev}${prev.endsWith('\n') || !prev ? '' : '\n'}${insert}\n`);
    setSlashOpen(false);
    textareaRef.current?.focus();
  };
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [slashOpen, setSlashOpen] = useState(false);

  const canGenerate = text.trim().length >= 10 && !busy && !running;

  return (
    <StudioPage
      segment="build"
      subtitle="Describe what this agent should do and the boundaries it must obey."
      badges={
        <>
          <Badge tone={complete ? 'pass' : running || busy ? 'sim' : awaiting ? 'warn' : failed || needsReview ? 'deny' : 'neutral'}>{busy ?? statusLine}</Badge>
          {savedAt ? <span className="cl-meta">Draft autosaved <TimeAgo iso={savedAt} /></span> : null}
          {usage ? <span className="cl-meta" title="Model usage for this build, from the SDK's own accounting">{usage.requests} calls · {(usage.inputTokens + usage.outputTokens).toLocaleString()} tokens{usage.estimatedCostUsd !== null ? ` · ~$${usage.estimatedCostUsd.toFixed(3)} est.` : ''}</span> : null}
        </>
      }
      actions={
        <>
          <button type="button" className="cl-btn" onClick={() => setExamplesOpen(true)}><Lightbulb size={13} aria-hidden />Examples</button>
          <button type="button" className="cl-btn" onClick={() => setImportOpen(true)}><FileInput size={13} aria-hidden />Import Requirements</button>
          {running || busy ? (
            <button type="button" className="cl-btn cl-btn-danger" onClick={() => void cancelBuild()} disabled={!build}><Square size={12} aria-hidden />Cancel Build</button>
          ) : paused ? (
            <button type="button" className="cl-btn cl-btn-primary" onClick={() => void generate()} disabled={!canGenerate}><Play size={12} aria-hidden />Regenerate</button>
          ) : (
            <button type="button" className="cl-btn cl-btn-primary" onClick={() => void generate()} disabled={!canGenerate} title={!text.trim() ? 'Describe the agent first' : undefined}>
              <Sparkles size={13} aria-hidden />
              {build && !abandoned ? 'Regenerate Blueprint' : 'Generate Blueprint'}
            </button>
          )}
        </>
      }
      banners={
        <>
          {error ? <BlockerBanner tone="deny" title="The Studio API refused">{error}</BlockerBanner> : null}
          {ctx.error ? <BlockerBanner tone="deny" title="Could not load this project">{ctx.error}</BlockerBanner> : null}
          {missingRequired.length > 0 && !running ? (
            <BlockerBanner tone="warn" title="Requirements incomplete" actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => setSlashOpen(true)}>Insert /limits</button>}>
              {missingRequired.map((r) => r.label).join(', ')} {missingRequired.length === 1 ? 'is' : 'are'} not established. A financial ceiling is never inferred from the other limits — state it and regenerate.
            </BlockerBanner>
          ) : null}
          {needsReview || failed ? (
            <BlockerBanner tone="deny" title={failed ? 'Build failed' : 'Build needs your review'}>
              {build?.failureReason ?? 'The pipeline stopped. The Output panel has the reason.'} Regenerating starts a new build from the description.
            </BlockerBanner>
          ) : null}
          {paused ? <BlockerBanner tone="warn" title="Build paused by a limit">{build?.failureReason ?? 'A model or usage limit was reached.'} Already persisted artifacts are kept.</BlockerBanner> : null}
          {nearQuota ? <BlockerBanner tone="warn" title="Approaching the build's model budget">{Math.round((usage?.peakFraction ?? 0) * 100)}% of this build’s allowance used. At 100% the build checkpoints safely.</BlockerBanner> : null}
        </>
      }
    >
      <AgentPatchInbox pageKind="composer" />

      {isDraft ? (
        <Section label="Project">
          <div className="cl-grid cl-grid-2">
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="cmp-name">Project name</label>
              <input id="cmp-name" className="cl-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Treasury Guardian" />
            </div>
            <div className="cl-field">
              <label className="cl-field-label" htmlFor="cmp-ens">ENS name <span className="cl-dim">(optional)</span></label>
              <input id="cmp-ens" className="cl-input" value={ens} onChange={(e) => setEns(e.target.value.toLowerCase())} placeholder="guardian.acme.eth" spellCheck={false} />
            </div>
          </div>
        </Section>
      ) : null}

      <Section label="Agent description" actions={<button type="button" className="cl-btn cl-btn-sm" onClick={() => setSlashOpen((v) => !v)}>Snippets</button>}>
        {slashOpen ? (
          <div className="cl-card" style={{ marginBottom: 10 }}>
            <div className="cl-card-body">
              <div className="cl-label" style={{ marginBottom: 8 }}>Structured prompt helpers</div>
              <div className="cl-col" style={{ gap: 6 }}>
                {COMPOSER_SLASH_HELPERS.map((helper) => (
                  <button key={helper.command} type="button" className="cl-btn cl-btn-block" style={{ fontFamily: 'var(--sans)' }} onClick={() => insertHelper(helper.insert)}>
                    <span className="cl-mono" style={{ marginRight: 8 }}>{helper.command}</span>
                    <span className="cl-meta">{helper.description}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}
        <textarea
          ref={textareaRef}
          className="cl-textarea"
          style={{ minHeight: 210, fontSize: 14, lineHeight: 1.6 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={'"Build an Aave guardian that repays my USDC debt when the health factor falls below 1.25…"'}
          aria-label="Agent description"
          disabled={running || !!busy}
        />
        <p className="cl-field-hint" style={{ marginTop: 6 }}>
          {build && !isDraft ? 'Editing the description and regenerating starts a new build; the previous one is kept in its final state. ' : ''}
          Do not paste secrets, private keys or API credentials.
        </p>
      </Section>

      {openQuestions.length > 0 && !running ? (
        <Section label="Clarify">
          <RequirementInterview
            questions={openQuestions}
            answers={answers}
            onAnswer={(id, value) => {
              setAnswers((prev) => ({ ...prev, [id]: value }));
              const q = openQuestions.find((x) => x.requirementId === id);
              setText((prev) => `${prev.trimEnd()}\n${q ? q.question.replace(/\?$/, ':') : id} ${value}`);
            }}
            onSkip={() => undefined}
          />
        </Section>
      ) : null}

      <Section label="Detected requirements" actions={<Badge tone={bp ? 'pass' : requirementsEvent ? 'warn' : 'neutral'}>{bp ? `From Blueprint r${bp.revision}` : requirementsEvent ? 'Requirements stage output' : 'Nothing generated yet'}</Badge>}>
        {requirements.length === 0 ? (
          <Card><p className="cl-meta">Nothing parsed yet. Generate the Blueprint and the pipeline’s own requirements appear here — the parser is the backend, not this page.</p></Card>
        ) : (
          <Card flush>
            <div className="cl-table-scroll">
              <table className="cl-table">
                <thead><tr><th style={{ width: 210 }}>Requirement</th><th>Value</th><th style={{ width: 130 }}>Status</th></tr></thead>
                <tbody>
                  {requirements.map((r) => (
                    <tr key={r.id} data-clickable="true" onClick={() => setSelection({ kind: 'requirement', id: r.id, label: r.label })}>
                      <td className="cl-strong">{r.label}</td>
                      <td><div style={{ whiteSpace: 'normal' }}>{r.value}</div>{r.note ? <div className="cl-meta" style={{ whiteSpace: 'normal' }}>{r.note}</div> : null}</td>
                      <td><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </Section>

      {stages.length > 0 ? (
        <Section label="Build timeline" actions={<span className="cl-meta">Click a stage to open its detail below</span>}>
          <div className="cl-steps">
            {stages.map((stage, i) => (
              <button key={stage.id} type="button" className="cl-step" style={{ width: '100%', textAlign: 'left' }} onClick={() => { openBottom(stage.panel); setSelection({ kind: 'build-stage', id: stage.id, label: stage.name }); }}>
                <span className="cl-step-index">{i + 1}</span>
                <span className="cl-step-name">{stage.name}</span>
                <StatusBadge status={stage.status} />
                <span className="cl-spacer" />
                <span className="cl-step-detail">{stage.detail}</span>
              </button>
            ))}
          </div>

          {awaiting && bp && view ? (
            <ApprovalPanel
              autonomous={known(bp.autonomousPolicy.maxValueUsdCents)}
              escMin={known(bp.escalationPolicy.minValueUsdCents)}
              escMax={known(bp.escalationPolicy.maxValueUsdCents)}
              mechanism={bp.escalationPolicy.mechanism}
              denied={bp.permissions.denied.map((d) => d.statement)}
              criticals={view.findings.filter((f) => f.severity === 'CRITICAL')}
              onApprove={() => void approveAndBuild()}
              onAbandon={() => void cancelBuild()}
              busy={busy}
              onInspect={() => router.push(`/projects/${ctx.routeProjectId}/security`)}
            />
          ) : null}

          {complete ? (
            <div className="cl-row" style={{ marginTop: 12, justifyContent: 'flex-end', gap: 8 }}>
              <button type="button" className="cl-btn" onClick={() => router.push(`/projects/${ctx.routeProjectId}/security`)}>Inspect authority</button>
              <button type="button" className="cl-btn" onClick={() => router.push(`/projects/${ctx.routeProjectId}/code`)}>Open Code</button>
              <button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/deploy`)}>Run deployment preflight</button>
            </div>
          ) : null}
        </Section>
      ) : null}

      <Modal open={examplesOpen} onClose={() => setExamplesOpen(false)} title="Examples" subtitle="Each example states its own limits explicitly." wide>
        <div className="cl-col" style={{ gap: 10 }}>
          {COMPOSER_EXAMPLES.map((example) => (
            <div className="cl-card" key={example.id}>
              <div className="cl-card-head">
                <div className="cl-card-title">{example.title}</div>
                <button type="button" className="cl-btn cl-btn-sm" onClick={() => { setText(example.body); setExamplesOpen(false); }}>Use this</button>
              </div>
              <div className="cl-card-body"><p style={{ fontSize: 12.5, lineHeight: 1.6 }}>{example.body}</p></div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        title="Import requirements"
        subtitle="Accepts a validated requirements JSON document."
        footer={<><button type="button" className="cl-btn" onClick={() => setImportOpen(false)}>Cancel</button><button type="button" className="cl-btn cl-btn-primary" disabled>Import</button></>}
      >
        <div className="cl-field">
          <label className="cl-field-label" htmlFor="req-file">Requirements document</label>
          <input id="req-file" type="file" accept=".json" className="cl-input" style={{ paddingTop: 4 }} disabled />
          <span className="cl-field-hint">The Studio API does not accept a requirements document yet; the description is the input. This control will validate the document before it replaces the draft.</span>
        </div>
      </Modal>
    </StudioPage>
  );
}

function ApprovalPanel({ autonomous, escMin, escMax, mechanism, denied, criticals, onApprove, onAbandon, busy, onInspect }: {
  autonomous: number | null; escMin: number | null; escMax: number | null; mechanism: string; denied: string[];
  criticals: Array<{ code: string; message: string; source: string }>; onApprove: () => void; onAbandon: () => void; busy: string | null; onInspect: () => void;
}) {
  const modelCriticals = criticals.filter((c) => c.source === 'security-architect');
  const deterministicCriticals = criticals.filter((c) => c.source !== 'security-architect');
  return (
    <div className="cl-card" style={{ marginTop: 12 }}>
      <div className="cl-card-head"><div className="cl-card-title">Review before building</div><Badge tone="warn">No code has been generated</Badge></div>
      <div className="cl-card-body">
        <div className="cl-grid cl-grid-3" style={{ marginBottom: 12 }}>
          <div><div className="cl-label">Autonomous</div><div className="cl-strong">{autonomous === null ? 'UNRESOLVED' : `up to ${usd(autonomous)} per action`}</div></div>
          <div><div className="cl-label">Human approval</div><div className="cl-strong">{escMin !== null && escMax !== null ? `${usd(escMin)} – ${usd(escMax)}` : 'UNRESOLVED'}</div><div className="cl-meta">mechanism: {mechanism} — no physical device evidence (BLK-002)</div></div>
          <div><div className="cl-label">Above that</div><div className="cl-strong">DENY — no path to execution</div></div>
        </div>
        <div className="cl-label" style={{ marginBottom: 6 }}>Never permitted</div>
        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, lineHeight: 1.6 }}>
          {denied.map((d) => <li key={d} style={d.startsWith('UNRESOLVED') ? { color: 'var(--cl-warn)' } : undefined}>{d}</li>)}
        </ul>
        {deterministicCriticals.length > 0 ? (
          <BlockerBanner tone="deny" title={`${deterministicCriticals.length} CRITICAL finding(s) from the deterministic validator`}>
            These block the build until the Blueprint changes. {deterministicCriticals.map((c) => c.code).join(', ')}.
          </BlockerBanner>
        ) : null}
        {modelCriticals.length > 0 ? (
          <BlockerBanner tone="warn" title={`${modelCriticals.length} CRITICAL finding(s) from the security review`}>
            Raised by the reviewing model, not by the deterministic validator. Approving acknowledges them by code: {modelCriticals.map((c) => c.code).join(', ')}.
          </BlockerBanner>
        ) : null}
        <div className="cl-row" style={{ marginTop: 12, gap: 8 }}>
          <button type="button" className="cl-btn cl-btn-primary" onClick={onApprove} disabled={!!busy || deterministicCriticals.length > 0}>{busy ?? 'Build this agent'}</button>
          <button type="button" className="cl-btn" onClick={onAbandon} disabled={!!busy}>Don’t build this</button>
          <span className="cl-spacer" />
          <button type="button" className="cl-btn" onClick={onInspect}>Inspect full authority</button>
        </div>
        <p className="cl-meta" style={{ marginTop: 8, whiteSpace: 'normal' }}>
          No sandbox has been created and no code generated yet. Declining keeps the design and the review, and frees the slot for another agent.
        </p>
      </div>
    </div>
  );
}
