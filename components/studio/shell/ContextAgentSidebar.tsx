'use client';

/**
 * Context Agent sidebar (spec §6).
 *
 * A product primitive, not a generic chatbot: it is page-aware, selection-aware,
 * renders structured response cards, and can never itself execute a privileged
 * control. Control suggestions only open the native deterministic dialog.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AtSign,
  Check,
  CornerDownLeft,
  History,
  PanelRightClose,
  Paperclip,
  Plus,
  Send,
  Square,
  TriangleAlert,
} from 'lucide-react';
import { Popover, MenuItem, MenuLabel } from './Popover';
import { Badge } from '../primitives';
import { useWorkbench } from '@/lib/studio/workbench';
import { respond, streamText } from '@/lib/studio/agent-engine';
import { searchMentions, type MentionEntity } from '@/lib/studio/mentions';
import { useMentionSource } from '@/lib/studio/api/mention-source';
import { metaForSegment, segmentForPageKind } from '@/lib/studio/nav';
import { useStudioProject } from '@/lib/studio/api/project-context';
import type {
  Agent,
  AgentCitation,
  AgentMessage,
  AgentPageContext,
  AgentResponseCard,
  AgentThread,
  ControlCommand,
  PageKind,
  RevisionSet,
} from '@/lib/studio/types';

/**
 * Finds the @mention token the caret is sitting in, if any.
 *
 * Only an @ that starts a word counts, so an email address or a decorative @
 * mid-word does not open the picker.
 */
function mentionTokenAt(text: string, caret: number): { start: number; query: string } | null {
  const upToCaret = text.slice(0, caret);
  const at = upToCaret.lastIndexOf('@');
  if (at === -1) return null;
  if (at > 0 && !/\s/.test(upToCaret[at - 1])) return null;

  const query = upToCaret.slice(at + 1);
  /* Whitespace ends a mention — once the user types a space they are writing
     prose again, not still choosing an entity. */
  if (/\s/.test(query)) return null;
  return { start: at, query };
}

/** Authority tier labels (spec §6.4), shown so the gate is legible. */
const TIER_LABEL: Record<string, string> = {
  read: 'Read',
  navigate: 'Navigate',
  draft: 'Draft',
  'safe-computation': 'Safe computation',
  'project-mutation': 'Needs explicit Apply',
  'deployment-mutation': 'Native confirmation',
  'financial-authority': 'Typed control only',
  emergency: 'Critical modal only',
};

export function ContextAgentSidebar({
  projectId,
  agent,
  segment,
  revisions,
  onControlRequest,
}: {
  projectId: string;
  agent: Agent;
  segment: string;
  revisions: RevisionSet;
  /** Opens the page's native deterministic dialog for a suggested control. */
  onControlRequest: (control: ControlCommand) => void;
}) {
  const router = useRouter();
  const {
    selection,
    pageKind,
    agentDraft,
    setAgentDraft,
    registerAgentInput,
    toggleAgent,
    agentDrawer,
    pushToast,
  } = useWorkbench();

  const meta = metaForSegment(segment);
  /* The initial thread carries no timestamp: a clock read during the first
     render produces different values on the server and the client. Threads the
     user creates are stamped in the handler, where that is safe. */
  const [threads, setThreads] = useState<AgentThread[]>([
    { id: 'thr_1', title: 'Current thread', createdAt: '', messages: [] },
  ]);
  const [activeThreadId, setActiveThreadId] = useState('thr_1');
  const [streaming, setStreaming] = useState(false);
  /* The picker is driven by what is under the caret, not by a toggle, so it
     opens as the user types @ and closes when the token stops being one. */
  const [mentionToken, setMentionToken] = useState<{ start: number; query: string } | null>(null);
  const [mentionIndexSel, setMentionIndexSel] = useState(0);
  const [attachments, setAttachments] = useState<string[]>([]);
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const thread = threads.find((t) => t.id === activeThreadId) ?? threads[0];
  const messages = thread?.messages ?? [];

  const mentionSource = useMentionSource();
  const mentionMatches = useMemo(
    () => (mentionToken ? searchMentions(mentionToken.query, mentionSource) : []),
    [mentionToken, mentionSource],
  );

  /* Highest severity first, so "attach the error" attaches the one that
     matters rather than whichever happens to be first in the list. */
  const { problems } = useStudioProject();
  const currentProblem = useMemo(() => {
    const rank: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
    return [...problems].sort((a, b) => (rank[a.severity] ?? 9) - (rank[b.severity] ?? 9))[0] ?? null;
  }, [problems]);

  /** Replaces the token under the caret with a resolved entity. */
  const insertMention = useCallback(
    (entity: MentionEntity) => {
      if (!mentionToken) return;
      const el = inputRef.current;
      const caret = el?.selectionStart ?? agentDraft.length;
      const next = `${agentDraft.slice(0, mentionToken.start)}@${entity.token} ${agentDraft.slice(caret)}`;
      setAgentDraft(next);
      setMentionToken(null);
      setMentionIndexSel(0);
      window.setTimeout(() => {
        el?.focus();
        const pos = mentionToken.start + entity.token.length + 2;
        el?.setSelectionRange(pos, pos);
      }, 0);
    },
    [mentionToken, agentDraft, setAgentDraft],
  );

  const context = useMemo<AgentPageContext>(
    () => ({
      projectId,
      agentId: agent.id,
      route: `/projects/${projectId}/${segment}`,
      pageKind: pageKind as PageKind,
      blueprintRevision: revisions.blueprint ?? undefined,
      strategyRevision: revisions.strategy ?? undefined,
      buildRevision: revisions.build ?? undefined,
      deploymentRevision: revisions.deployment ?? undefined,
      runtimeRevision: revisions.runtime ?? undefined,
      selectedEntity: selection ? { kind: selection.kind, id: selection.id, label: selection.label } : undefined,
      // Only safe references travel with the turn — never secrets or the whole project.
      safeContextRefs: [
        `project:${projectId}`,
        `agent:${agent.id}`,
        `blueprint:r${revisions.blueprint ?? 0}`,
        ...(selection ? [`${selection.kind}:${selection.id}`] : []),
        ...attachments,
      ],
    }),
    [projectId, agent.id, segment, pageKind, revisions, selection, attachments],
  );

  useEffect(() => {
    registerAgentInput(inputRef.current);
  }, [registerAgentInput]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, streaming]);

  const updateThread = useCallback(
    (fn: (messages: AgentMessage[]) => AgentMessage[]) => {
      setThreads((prev) => prev.map((t) => (t.id === activeThreadId ? { ...t, messages: fn(t.messages) } : t)));
    },
    [activeThreadId],
  );

  const submit = useCallback(
    (raw?: string) => {
      const prompt = (raw ?? agentDraft).trim();
      if (!prompt || streaming) return;

      const userMessage: AgentMessage = {
        id: `m_${Date.now()}`,
        role: 'user',
        at: new Date().toISOString(),
        text: prompt,
        context,
      };
      const agentMessageId = `m_${Date.now()}_a`;
      updateThread((prev) => [
        ...prev,
        userMessage,
        { id: agentMessageId, role: 'agent', at: new Date().toISOString(), text: '', streaming: true },
      ]);
      setAgentDraft('');
      setAttachments([]);
      setStreaming(true);

      const cards = respond({ prompt, context, selectionLabel: selection?.label ?? null, mentions: mentionSource });
      const first = cards[0];
      const leadText = first?.kind === 'explanation' ? first.text : '';
      const rest = first?.kind === 'explanation' ? cards.slice(1) : cards;

      cancelRef.current = { cancelled: false };
      const signal = cancelRef.current;

      streamText(
        leadText || ' ',
        (soFar) => {
          updateThread((prev) => prev.map((m) => (m.id === agentMessageId ? { ...m, text: soFar } : m)));
        },
        () => {
          updateThread((prev) =>
            prev.map((m) => (m.id === agentMessageId ? { ...m, streaming: false, cards: rest } : m)),
          );
          setStreaming(false);
        },
        signal,
      );
    },
    [agentDraft, streaming, context, selection, setAgentDraft, updateThread],
  );

  const stop = () => {
    cancelRef.current.cancelled = true;
    setStreaming(false);
  };

  const newThread = () => {
    const id = `thr_${Date.now()}`;
    setThreads((prev) => [...prev, { id, title: `Thread ${prev.length + 1}`, createdAt: new Date().toISOString(), messages: [] }]);
    setActiveThreadId(id);
  };

  return (
    <aside className={`cl-agent${agentDrawer ? ' cl-agent-drawer' : ''}`} aria-label="Context Agent">
      {/* header (spec §6.1) */}
      <div className="cl-agent-head">
        <div className="cl-agent-head-row">
          <span className="cl-agent-title">Context Agent</span>
          <Popover
            align="right"
            width={220}
            label="Conversation history"
            trigger={({ toggle }) => (
              <button type="button" className="cl-btn cl-btn-ghost cl-btn-sm" onClick={toggle} aria-label="Conversation history">
                <History size={13} aria-hidden />
              </button>
            )}
          >
            {({ close }) => (
              <>
                <MenuLabel>Threads</MenuLabel>
                {threads.map((t) => (
                  <MenuItem
                    key={t.id}
                    onClick={() => {
                      setActiveThreadId(t.id);
                      close();
                    }}
                    hint={t.id === activeThreadId ? <Check size={12} aria-hidden /> : `${t.messages.length}`}
                  >
                    {t.title}
                  </MenuItem>
                ))}
              </>
            )}
          </Popover>
          <button type="button" className="cl-btn cl-btn-ghost cl-btn-sm" onClick={newThread} aria-label="New thread" title="New thread">
            <Plus size={13} aria-hidden />
          </button>
          <button
            type="button"
            className="cl-btn cl-btn-ghost cl-btn-sm"
            onClick={toggleAgent}
            aria-label="Collapse agent sidebar"
            title="Collapse (⌘⇧A)"
          >
            <PanelRightClose size={13} aria-hidden />
          </button>
        </div>
        <div className="cl-agent-chips">
          <Badge tone="neutral" title="Page context">
            {meta.tabTitle}
          </Badge>
          <Badge tone="neutral" title="Current agent">
            {agent.name}
          </Badge>
          {selection ? (
            <Badge tone="sim" title={`Selected ${selection.kind}`}>
              Selected: {selection.label}
            </Badge>
          ) : null}
        </div>
      </div>

      {/* conversation */}
      <div className="cl-agent-scroll" ref={scrollRef} data-lenis-prevent>
        {messages.length === 0 ? (
          <div>
            <p className="cl-meta" style={{ marginBottom: 10 }}>
              Ask about this page. I can explain, trace and propose — security controls stay on their own typed
              confirmations.
            </p>
            <div className="cl-col" style={{ gap: 6 }}>
              {meta.quickPrompts.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="cl-btn cl-btn-block"
                  style={{ fontFamily: 'var(--sans)' }}
                  onClick={() => submit(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => <MessageView key={message.id} message={message} projectId={projectId} onControlRequest={onControlRequest} />)
        )}
      </div>

      {/* composer (spec §6.2) */}
      <div className="cl-agent-composer">
        {attachments.length > 0 ? (
          <div className="cl-row cl-row-wrap" style={{ marginBottom: 6, gap: 5 }}>
            {attachments.map((a) => (
              <Badge key={a} tone="neutral">
                {a}
              </Badge>
            ))}
          </div>
        ) : null}

        {mentionToken ? (
          <div className="cl-mention-picker" role="listbox" id="cl-mention-list" aria-label="Project entities">
            {mentionMatches.length === 0 ? (
              <div className="cl-meta" style={{ padding: '8px 10px' }}>
                Nothing in this project matches “{mentionToken.query}”.
              </div>
            ) : (
              mentionMatches.map((entity, i) => (
                <button
                  key={`${entity.kind}:${entity.id}`}
                  id={`cl-mention-${i}`}
                  type="button"
                  role="option"
                  aria-selected={i === mentionIndexSel}
                  className="cl-mention-item"
                  data-active={i === mentionIndexSel}
                  onMouseEnter={() => setMentionIndexSel(i)}
                  onClick={() => insertMention(entity)}
                >
                  <span className="cl-mention-item-main">
                    <span className="cl-mono cl-mention-token">@{entity.token}</span>
                    {/* Human label always present — never only an opaque id (§6.7). */}
                    <span className="cl-mention-label">{entity.label}</span>
                  </span>
                  {entity.detail ? <span className="cl-mention-detail">{entity.detail}</span> : null}
                </button>
              ))
            )}
          </div>
        ) : null}

        <textarea
          ref={(el) => {
            inputRef.current = el;
            registerAgentInput(el);
          }}
          className="cl-agent-input"
          value={agentDraft}
          placeholder="Ask about this page…  @ to mention an entity"
          onChange={(e) => {
            setAgentDraft(e.target.value);
            setMentionToken(mentionTokenAt(e.target.value, e.target.selectionStart ?? 0));
            setMentionIndexSel(0);
          }}
          onClick={(e) => {
            const el = e.currentTarget;
            setMentionToken(mentionTokenAt(el.value, el.selectionStart ?? 0));
          }}
          onKeyDown={(e) => {
            /* While the picker is open it owns the arrow keys, Enter and Escape —
               otherwise Enter would send a message containing a half-typed
               mention the frontend could not resolve. */
            if (mentionToken && mentionMatches.length > 0) {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndexSel((i) => (i + 1) % mentionMatches.length);
                return;
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndexSel((i) => (i - 1 + mentionMatches.length) % mentionMatches.length);
                return;
              }
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(mentionMatches[mentionIndexSel]);
                return;
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setMentionToken(null);
                return;
              }
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          aria-label="Message the Context Agent"
          role="combobox"
          aria-expanded={Boolean(mentionToken && mentionMatches.length > 0)}
          aria-controls={mentionToken ? 'cl-mention-list' : undefined}
          aria-activedescendant={
            mentionToken && mentionMatches.length > 0 ? `cl-mention-${mentionIndexSel}` : undefined
          }
          aria-autocomplete="list"
        />

        <div className="cl-agent-composer-row">
          <button
            type="button"
            className="cl-btn cl-btn-ghost cl-btn-sm"
            onClick={() => {
              const el = inputRef.current;
              const next = agentDraft.endsWith(' ') || !agentDraft ? `${agentDraft}@` : `${agentDraft} @`;
              setAgentDraft(next);
              setMentionToken({ start: next.length - 1, query: '' });
              setMentionIndexSel(0);
              window.setTimeout(() => el?.focus(), 0);
            }}
            title="Mention a project entity"
            aria-label="Mention"
          >
            <AtSign size={13} aria-hidden />
          </button>
          <button
            type="button"
            className="cl-btn cl-btn-ghost cl-btn-sm"
            disabled={!selection}
            title={selection ? `Attach ${selection.label}` : 'Select something on the page first'}
            onClick={() => {
              if (!selection) return;
              setAttachments((prev) => [...new Set([...prev, `${selection.kind}:${selection.id}`])]);
              pushToast('Selection attached to context');
            }}
          >
            <Paperclip size={13} aria-hidden />
            Selection
          </button>
          {/* The highest-severity open problem, not a placeholder id: attaching
              something that does not exist would put a phantom reference into
              the turn. Disabled outright when there is nothing wrong. */}
          <button
            type="button"
            className="cl-btn cl-btn-ghost cl-btn-sm"
            disabled={!currentProblem}
            title={currentProblem ? `Attach “${currentProblem.message}”` : 'No open problems to attach'}
            onClick={() => {
              if (!currentProblem) return;
              setAttachments((prev) => [...new Set([...prev, `problem:${currentProblem.id}`])]);
              pushToast(`Attached: ${currentProblem.message}`);
            }}
          >
            <TriangleAlert size={13} aria-hidden />
            Error
          </button>

          <span className="cl-spacer" />

          {streaming ? (
            <button type="button" className="cl-btn cl-btn-sm" onClick={stop}>
              <Square size={11} aria-hidden />
              Stop
            </button>
          ) : (
            <button
              type="button"
              className="cl-btn cl-btn-primary cl-btn-sm"
              onClick={() => submit()}
              disabled={!agentDraft.trim()}
              title="Send (⌘↵)"
            >
              <Send size={12} aria-hidden />
              Send
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------ message views */

function MessageView({
  message,
  projectId,
  onControlRequest,
}: {
  message: AgentMessage;
  projectId: string;
  onControlRequest: (control: ControlCommand) => void;
}) {
  if (message.role === 'user') {
    return (
      <div
        style={{
          alignSelf: 'flex-end',
          maxWidth: '92%',
          background: 'rgba(0, 66, 175, 0.09)',
          border: '1px solid var(--cl-line)',
          padding: '7px 10px',
          fontSize: 12.5,
          lineHeight: 1.5,
        }}
      >
        {message.text}
      </div>
    );
  }

  return (
    <div className="cl-col" style={{ gap: 8 }}>
      {message.text?.trim() ? (
        <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
          {message.text}
          {message.streaming ? <span className="cl-pulse">▍</span> : null}
        </div>
      ) : null}
      {message.cards?.map((card, i) => (
        <ResponseCard key={i} card={card} projectId={projectId} onControlRequest={onControlRequest} />
      ))}
    </div>
  );
}

/**
 * Citation chips (spec §6.7).
 *
 * Each chip shows the human label and opens the artifact. The id travels in the
 * envelope but is never what the user has to read.
 */
function Citations({ citations, projectId }: { citations: AgentCitation[]; projectId: string }) {
  const router = useRouter();
  if (citations.length === 0) return null;

  return (
    <div className="cl-citations">
      {citations.map((citation) => (
        <button
          key={`${citation.kind}:${citation.id}`}
          type="button"
          className="cl-citation"
          title={`${citation.kind} · ${citation.id}`}
          disabled={!citation.href}
          onClick={() => citation.href && router.push(`/projects/${projectId}/${citation.href}`)}
        >
          <span className="cl-citation-kind">{citation.kind}</span>
          {citation.label}
        </button>
      ))}
    </div>
  );
}

function ResponseCard({
  card,
  projectId,
  onControlRequest,
}: {
  card: AgentResponseCard;
  projectId: string;
  onControlRequest: (control: ControlCommand) => void;
}) {
  const router = useRouter();
  const { pushToast, proposePatch } = useWorkbench();
  const [resolved, setResolved] = useState<'applied' | 'rejected' | null>(null);

  switch (card.kind) {
    case 'explanation':
      return (
        <div style={{ fontSize: 12.5, lineHeight: 1.6 }}>
          {card.text}
          {card.citations?.length ? <Citations citations={card.citations} projectId={projectId} /> : null}
        </div>
      );

    /* §30 prohibited shortcut. Styled as a statement, not an error: the agent
       is working correctly when this appears. */
    case 'refusal':
      return (
        <div className="cl-card cl-refusal">
          <div className="cl-card-head">
            <div className="cl-card-title">{card.title}</div>
            <Badge tone="warn">Not mine to do</Badge>
          </div>
          <div className="cl-card-body">
            <p className="cl-refusal-ask">{card.text}</p>
            <p className="cl-refusal-why">{card.because}</p>
            {card.alternative ? (
              <button
                type="button"
                className="cl-btn cl-btn-sm"
                style={{ marginTop: 10 }}
                onClick={() =>
                  card.alternative?.href
                    ? router.push(`/projects/${projectId}/${card.alternative.href}`)
                    : undefined
                }
              >
                {card.alternative.label}
                <CornerDownLeft size={12} aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      );

    case 'reference':
      return (
        <div className="cl-card" style={{ padding: 10 }}>
          <div style={{ fontSize: 12.5, marginBottom: 8 }}>{card.text}</div>
          <div className="cl-row cl-row-wrap" style={{ gap: 5 }}>
            {card.refs.map((ref) => (
              <button
                key={ref.id}
                type="button"
                className="cl-badge"
                data-tone="neutral"
                style={{ cursor: 'pointer' }}
                onClick={() => ref.href && router.push(`/projects/${projectId}/${ref.href}`)}
              >
                {ref.label}
              </button>
            ))}
          </div>
        </div>
      );

    case 'proposed-patch':
      return (
        <div className="cl-card">
          <div className="cl-card-head">
            <div className="cl-card-title">{card.title}</div>
            <Badge tone="sim" title="Authority tier (spec §6.4)">
              {TIER_LABEL['project-mutation']}
            </Badge>
          </div>
          <div className="cl-card-body">
            <div className="cl-meta" style={{ marginBottom: 8 }}>
              Target: {card.target}
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 }}>{card.summary}</p>
            <div className="cl-path">
              {card.diff.map((d) => (
                <div className="cl-path-step" key={d.field} style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 3 }}>
                  <span className="cl-mono" style={{ fontSize: 11 }}>
                    {d.field}
                  </span>
                  <span style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--cl-deny)', textDecoration: 'line-through' }}>{d.before}</span>
                    {'  →  '}
                    <span style={{ color: 'var(--cl-pass)' }}>{d.after}</span>
                  </span>
                  {d.authorityExpansion ? <Badge tone="warn">Authority expansion</Badge> : null}
                </div>
              ))}
            </div>
            {resolved ? (
              <div className="cl-meta" style={{ marginTop: 10 }}>
                {resolved === 'applied'
                  ? 'Sent to the draft. Review it on the target page — nothing is a revision until you publish one.'
                  : 'Proposal rejected. Nothing was changed.'}
              </div>
            ) : (
              <div className="cl-row cl-row-wrap" style={{ marginTop: 10, gap: 6 }}>
                <button
                  type="button"
                  className="cl-btn cl-btn-sm"
                  onClick={() => router.push(`/projects/${projectId}/${segmentForPageKind(card.targetPage)}`)}
                >
                  Review change
                </button>
                <button
                  type="button"
                  className="cl-btn cl-btn-sm cl-btn-primary"
                  onClick={() => {
                    /* Explicit Apply is the project-mutation gate (§6.4). Even
                       then the agent does not write: it hands the proposal to
                       the page that owns the artifact, and the user reviews it
                       there. */
                    proposePatch({
                      targetPage: card.targetPage,
                      title: card.title,
                      target: card.target,
                      summary: card.summary,
                      diff: card.diff,
                    });
                    setResolved('applied');
                    pushToast(`Sent to ${card.target} as a pending draft change`);
                  }}
                >
                  Apply to draft
                </button>
                <button type="button" className="cl-btn cl-btn-sm" onClick={() => setResolved('rejected')}>
                  Reject
                </button>
              </div>
            )}
          </div>
        </div>
      );

    case 'suggested-simulation':
      return (
        <div className="cl-card" style={{ padding: 10 }}>
          <div className="cl-strong" style={{ fontSize: 12.5 }}>
            {card.title}
          </div>
          <p className="cl-meta" style={{ margin: '4px 0 9px', whiteSpace: 'normal' }}>
            {card.rationale}
          </p>
          <div className="cl-row" style={{ gap: 6 }}>
            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => router.push(`/projects/${projectId}/simulation?scenario=${card.scenarioId}`)}
            >
              Open scenario
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-sm cl-btn-primary"
              onClick={() => router.push(`/projects/${projectId}/simulation?scenario=${card.scenarioId}&run=1`)}
            >
              Run
            </button>
          </div>
        </div>
      );

    case 'navigation':
      return (
        <button
          type="button"
          className="cl-btn cl-btn-block"
          style={{ justifyContent: 'space-between' }}
          onClick={() => router.push(`/projects/${projectId}/${card.href}`)}
        >
          {card.label}
          <CornerDownLeft size={12} aria-hidden />
        </button>
      );

    case 'control-suggestion':
      return (
        <div className="cl-card" style={{ borderColor: 'var(--cl-deny)' }}>
          <div className="cl-card-head" style={{ background: 'var(--cl-deny-bg)' }}>
            <div className="cl-card-title" style={{ color: 'var(--cl-deny)' }}>
              {card.title}
            </div>
            <Badge tone="deny" title="Authority tier (spec §6.4)">
              {TIER_LABEL[card.tier] ?? 'Needs your confirmation'}
            </Badge>
          </div>
          <div className="cl-card-body">
            <p style={{ fontSize: 12.5, lineHeight: 1.55 }}>{card.rationale}</p>
            <button
              type="button"
              className="cl-btn cl-btn-danger cl-btn-sm"
              style={{ marginTop: 10 }}
              onClick={() => onControlRequest(card.control)}
            >
              {card.buttonLabel}
            </button>
          </div>
        </div>
      );

    default:
      return null;
  }
}
