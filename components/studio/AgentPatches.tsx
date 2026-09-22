'use client';

/**
 * Pending agent patches for the current page (spec §6.4).
 *
 * When the user hits "Apply to draft" in the Context Agent, the proposal is
 * delivered here rather than written into the artifact. The distinction is the
 * whole point of the project-mutation tier: applying moves a proposal onto the
 * page that owns it, and a person still decides whether it becomes a revision.
 *
 * Pages render this above their content and it stays invisible until something
 * is waiting.
 */
import { Sparkles, X } from 'lucide-react';
import { Badge } from './primitives';
import { useWorkbench } from '@/lib/studio/workbench';
import type { PageKind } from '@/lib/studio/types';

export function AgentPatchInbox({ pageKind }: { pageKind: PageKind }) {
  const { pendingPatches, dismissPatch, pushToast } = useWorkbench();
  const mine = pendingPatches.filter((patch) => patch.targetPage === pageKind);

  if (mine.length === 0) return null;

  return (
    <div className="cl-col" style={{ gap: 10, marginBottom: 16 }}>
      {mine.map((patch) => (
        <div key={patch.id} className="cl-card cl-agent-patch">
          <div className="cl-card-head">
            <div className="cl-card-title">
              <Sparkles size={13} aria-hidden style={{ marginRight: 6, verticalAlign: '-2px' }} />
              {patch.title}
            </div>
            <Badge tone="sim">Proposed · not applied</Badge>
            <button
              type="button"
              className="cl-btn cl-btn-ghost cl-btn-sm"
              aria-label="Dismiss proposal"
              onClick={() => dismissPatch(patch.id)}
            >
              <X size={13} aria-hidden />
            </button>
          </div>
          <div className="cl-card-body">
            <div className="cl-meta" style={{ marginBottom: 8 }}>
              Target: {patch.target}
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.55, marginBottom: 10 }}>{patch.summary}</p>

            <div className="cl-path">
              {patch.diff.map((change) => (
                <div
                  className="cl-path-step"
                  key={change.field}
                  style={{ alignItems: 'flex-start', flexDirection: 'column', gap: 3 }}
                >
                  <span className="cl-mono" style={{ fontSize: 11 }}>
                    {change.field}
                  </span>
                  <span style={{ fontSize: 12.5 }}>
                    <span style={{ color: 'var(--cl-deny)', textDecoration: 'line-through' }}>{change.before}</span>
                    {'  →  '}
                    <span style={{ color: 'var(--cl-pass)' }}>{change.after}</span>
                  </span>
                  {/* Widening authority is called out on its own — a diff line is
                      easy to skim past, and this is the one kind of change that
                      must never be accepted by accident. */}
                  {change.authorityExpansion ? <Badge tone="warn">Authority expansion</Badge> : null}
                </div>
              ))}
            </div>

            <div className="cl-row cl-row-wrap" style={{ marginTop: 12, gap: 6 }}>
              <button
                type="button"
                className="cl-btn cl-btn-sm cl-btn-primary"
                onClick={() => {
                  dismissPatch(patch.id);
                  pushToast('Merged into the working draft. Validate before creating a revision.');
                }}
              >
                Merge into draft
              </button>
              <button type="button" className="cl-btn cl-btn-sm" onClick={() => dismissPatch(patch.id)}>
                Discard
              </button>
              <span className="cl-meta" style={{ marginLeft: 2 }}>
                Nothing is a revision until you publish one.
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
