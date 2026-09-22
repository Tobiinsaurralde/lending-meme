'use client';

/**
 * Clarifying interview for the Composer (spec §10, §30).
 *
 * The parser finds what a description states; this asks about what it does not.
 * One question at a time, gaps first, so the user is never handed a wall of
 * empty fields and left to work out which ones matter.
 *
 * The rule that makes this different from an AI form-filler:
 *
 *   For a financial boundary the agent asks and then refuses to answer.
 *
 * It will not offer a figure, suggest a typical value, or infer one from the
 * other limits — and it says so, on the question, rather than leaving the
 * absence of a suggestion looking like an oversight. Everywhere else the agent
 * is free to propose, and does.
 *
 * Backend swap: replace `questions` with the server's list. Nothing else here
 * knows where they came from.
 */
import { useMemo, useState } from 'react';
import { ArrowRight, Check, Lock, MessageCircleQuestion, SkipForward } from 'lucide-react';
import { Badge, Card } from './primitives';
import type { ClarifyingQuestion } from '@/lib/studio/content/composer';

export function RequirementInterview({
  questions,
  answers,
  onAnswer,
  onSkip,
}: {
  questions: ClarifyingQuestion[];
  answers: Record<string, string>;
  onAnswer: (requirementId: string, value: string) => void;
  onSkip: (requirementId: string) => void;
}) {
  const [skipped, setSkipped] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  /* The interview is a queue, not a form: the first unanswered, unskipped
     question is the current one. */
  const remaining = useMemo(
    () => questions.filter((q) => !answers[q.requirementId] && !skipped.includes(q.requirementId)),
    [questions, answers, skipped],
  );

  const current = remaining[0];
  const answeredCount = questions.filter((q) => answers[q.requirementId]).length;

  if (questions.length === 0) return null;

  if (!current) {
    return (
      <Card>
        <div className="cl-row" style={{ gap: 9 }}>
          <Check size={15} aria-hidden style={{ color: 'var(--cl-pass)', flex: '0 0 auto' }} />
          <div>
            <div className="cl-strong" style={{ fontSize: 13.5 }}>
              {answeredCount === questions.length
                ? 'Every gap has an answer.'
                : `${answeredCount} of ${questions.length} answered.`}
            </div>
            <p className="cl-meta" style={{ marginTop: 3, whiteSpace: 'normal' }}>
              {skipped.length > 0
                ? 'Skipped questions stay open in the requirements below. A REQUIRED gap still blocks the build.'
                : 'The requirements below reflect your answers. Review them before generating.'}
            </p>
          </div>
          {skipped.length > 0 ? (
            <button
              type="button"
              className="cl-btn cl-btn-sm"
              style={{ marginLeft: 'auto' }}
              onClick={() => setSkipped([])}
            >
              Revisit {skipped.length} skipped
            </button>
          ) : null}
        </div>
      </Card>
    );
  }

  const submit = () => {
    const value = draft.trim();
    if (!value) return;
    onAnswer(current.requirementId, value);
    setDraft('');
  };

  return (
    <Card>
      <div className="cl-row" style={{ gap: 8, marginBottom: 12 }}>
        <MessageCircleQuestion size={14} aria-hidden style={{ color: 'var(--cl-ink-2)', flex: '0 0 auto' }} />
        <span className="cl-label">Before this can be built</span>
        <Badge tone="neutral">
          {answeredCount + skipped.length + 1} of {questions.length}
        </Badge>
        {current.userMustDecide ? (
          <Badge tone="warn">
            <Lock size={10} aria-hidden style={{ marginRight: 4, verticalAlign: '-1px' }} />
            Your decision
          </Badge>
        ) : null}
      </div>

      <h3 style={{ fontSize: 16, lineHeight: 1.4, fontFamily: 'var(--medium)', color: 'var(--cl-ink-heading)' }}>
        {current.question}
      </h3>
      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--cl-ink-2)', margin: '7px 0 0' }}>{current.why}</p>

      {/* The absence of a suggestion is deliberate and is stated, so it does
          not read as the agent failing to have an opinion. */}
      {current.userMustDecide ? (
        <div className="cl-interview-refusal">
          I will not put a number here for you. This bounds how much of your money an autonomous process can move, and
          a figure I suggested would become the figure you accepted.
        </div>
      ) : null}

      <div className="cl-row" style={{ gap: 7, marginTop: 12 }}>
        <input
          className="cl-input"
          value={draft}
          placeholder={current.placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          aria-label={current.question}
          style={{ flex: '1 1 auto', minWidth: 0 }}
        />
        <button type="button" className="cl-btn cl-btn-primary" onClick={submit} disabled={!draft.trim()}>
          <ArrowRight size={13} aria-hidden />
          Answer
        </button>
        <button
          type="button"
          className="cl-btn"
          onClick={() => {
            setSkipped((prev) => [...prev, current.requirementId]);
            onSkip(current.requirementId);
            setDraft('');
          }}
          title="Leave this open and come back to it"
        >
          <SkipForward size={13} aria-hidden />
          Skip
        </button>
      </div>

      {/* Candidates only where the agent is allowed to propose. */}
      {!current.userMustDecide && current.suggestions?.length ? (
        <div className="cl-row cl-row-wrap" style={{ gap: 6, marginTop: 9 }}>
          <span className="cl-meta">Parsed from your description:</span>
          {current.suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => {
                onAnswer(current.requirementId, suggestion);
                setDraft('');
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
    </Card>
  );
}
