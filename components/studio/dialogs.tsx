'use client';

/**
 * Modal + confirmation patterns (spec §31).
 *
 * Four shapes, deliberately distinct:
 *   Modal                 — plain container with focus trap + Esc.
 *   StandardConfirmation  — non-financial project mutations.
 *   SecurityConfirmation  — policy enable/disable, ENS revoke, CRE promotion.
 *                           Always current state → requested state → network →
 *                           resource → consequence, and an action-specific label.
 *   EmergencyConfirmation — Emergency Lock only. Ordered steps, optional ENS
 *                           revoke, deliberate typed confirmation, no countdown.
 *   DestructiveConfirmation — irreversible deletion, requires the resource name.
 *
 * No dialog here is reachable from free-text chat: the Context Agent can only
 * request that one be opened.
 */
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { StatusBadge } from './primitives';
import type { Status } from '@/lib/studio/types';

function useFocusTrap(active: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;
    restoreRef.current = document.activeElement as HTMLElement | null;

    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);

    window.setTimeout(() => {
      const first = focusables()[0];
      first?.focus();
    }, 20);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      restoreRef.current?.focus?.();
    };
  }, [active, onClose]);

  return ref;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  wide,
  danger,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  danger?: boolean;
  icon?: ReactNode;
}) {
  const ref = useFocusTrap(open, onClose);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={`cl-modal-backdrop${danger ? ' cl-modal-danger' : ''}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`cl-modal${wide ? ' cl-modal-wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={ref}
      >
        <div className="cl-modal-head">
          {icon ?? (danger ? <ShieldAlert size={18} aria-hidden style={{ marginTop: 2 }} /> : null)}
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <h2 className="cl-modal-title" id={titleId}>
              {title}
            </h2>
            {subtitle ? (
              <p className="cl-meta" style={{ marginTop: 4 }}>
                {subtitle}
              </p>
            ) : null}
          </div>
          <button type="button" className="cl-btn cl-btn-ghost cl-btn-sm" onClick={onClose} aria-label="Close dialog">
            <X size={14} aria-hidden />
          </button>
        </div>
        <div className="cl-modal-body">{children}</div>
        {footer ? <div className="cl-modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------ standard confirmation */

export function StandardConfirmation({
  open,
  onClose,
  onConfirm,
  title,
  consequence,
  resource,
  actionLabel,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  consequence: string;
  resource: string;
  actionLabel: string;
  busy?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cl-btn cl-btn-primary" onClick={onConfirm} disabled={busy}>
            {busy ? 'Working…' : actionLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, lineHeight: 1.55 }}>{consequence}</p>
      <dl className="cl-statechange" style={{ marginTop: 14 }}>
        <div className="cl-statechange-row">
          <dt>Affected resource</dt>
          <dd>{resource}</dd>
        </div>
      </dl>
    </Modal>
  );
}

/* ------------------------------------------------------ security confirmation */

export interface SecurityConfirmationRow {
  label: string;
  value: ReactNode;
}

export function SecurityConfirmation({
  open,
  onClose,
  onConfirm,
  action,
  currentState,
  requestedState,
  network,
  resource,
  consequence,
  extraRows,
  actionLabel,
  preconditions,
  busy,
  disabled,
  disabledReason,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  action: string;
  currentState: ReactNode;
  requestedState: ReactNode;
  network: string;
  resource: ReactNode;
  consequence: string;
  extraRows?: SecurityConfirmationRow[];
  actionLabel: string;
  preconditions?: { id: string; label: string; status: Status; detail: string }[];
  busy?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  children?: ReactNode;
}) {
  const blocked = preconditions?.some((p) => p.status !== 'PASS' && p.status !== 'HEALTHY' && p.status !== 'ACTIVE');
  const cannotProceed = disabled || blocked || busy;

  return (
    <Modal open={open} onClose={onClose} title={action} danger wide>
      <dl className="cl-statechange">
        <div className="cl-statechange-row">
          <dt>Current state</dt>
          <dd>{currentState}</dd>
        </div>
        <div className="cl-statechange-row">
          <dt>Requested state</dt>
          <dd>{requestedState}</dd>
        </div>
        <div className="cl-statechange-row">
          <dt>Network</dt>
          <dd>{network}</dd>
        </div>
        <div className="cl-statechange-row">
          <dt>Resource</dt>
          <dd>{resource}</dd>
        </div>
        {extraRows?.map((row) => (
          <div className="cl-statechange-row" key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        <div className="cl-statechange-row">
          <dt>Expected consequence</dt>
          <dd>{consequence}</dd>
        </div>
      </dl>

      {preconditions?.length ? (
        <div style={{ marginTop: 16 }}>
          <div className="cl-label" style={{ marginBottom: 8 }}>
            Preconditions
          </div>
          <div className="cl-path">
            {preconditions.map((p) => (
              <div className="cl-path-step" key={p.id}>
                <span className="cl-path-step-name">{p.label}</span>
                <StatusBadge status={p.status} />
                <span className="cl-path-step-detail">{p.detail}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}

      <div className="cl-modal-foot" style={{ margin: '18px -16px -14px', borderBottom: 'none' }}>
        {disabledReason && cannotProceed ? (
          <span className="cl-meta" style={{ marginRight: 'auto' }}>
            {disabledReason}
          </span>
        ) : null}
        <button type="button" className="cl-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="cl-btn cl-btn-danger" onClick={onConfirm} disabled={cannotProceed}>
          {busy ? 'Submitting…' : actionLabel}
        </button>
      </div>
    </Modal>
  );
}

/* ----------------------------------------------------- emergency confirmation */

export function EmergencyConfirmation({
  open,
  onClose,
  onConfirm,
  steps,
  revokeEns,
  onRevokeEnsChange,
  busy,
  confirmPhrase = 'EMERGENCY LOCK',
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  steps: string[];
  revokeEns: boolean;
  onRevokeEnsChange: (value: boolean) => void;
  busy?: boolean;
  confirmPhrase?: string;
}) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);

  const ready = typed.trim().toUpperCase() === confirmPhrase;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Emergency Lock"
      subtitle="The financial policy is attempted first. Every step reports its own result."
      danger
      wide
      icon={<AlertTriangle size={18} aria-hidden style={{ marginTop: 2 }} />}
    >
      <p style={{ fontSize: 13, lineHeight: 1.55 }}>This will attempt, in order:</p>
      <ol className="cl-steps" style={{ marginTop: 10 }}>
        {steps.map((step, i) => (
          <li className="cl-step" key={step} style={{ cursor: 'default' }}>
            <span className="cl-step-index">{i + 1}</span>
            <span className="cl-step-name">{step}</span>
          </li>
        ))}
      </ol>

      <label className="cl-checkbox" style={{ marginTop: 16 }}>
        <input type="checkbox" checked={revokeEns} onChange={(e) => onRevokeEnsChange(e.target.checked)} />
        <span>
          Also revoke ENS identity
          <span className="cl-meta" style={{ display: 'block' }}>
            Optional. Revocation prevents previously issued capabilities from being honoured.
          </span>
        </span>
      </label>

      <div className="cl-field" style={{ marginTop: 16 }}>
        <label className="cl-field-label" htmlFor="cl-emergency-confirm">
          Type <span className="cl-mono">{confirmPhrase}</span> to confirm
        </label>
        <input
          id="cl-emergency-confirm"
          className="cl-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder={confirmPhrase}
        />
      </div>

      <div className="cl-modal-foot" style={{ margin: '18px -16px -14px', borderBottom: 'none' }}>
        <button type="button" className="cl-btn" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="cl-btn cl-btn-emergency" onClick={onConfirm} disabled={!ready || busy}>
          {busy ? 'Executing…' : 'Emergency Lock Testnet Agent'}
        </button>
      </div>
    </Modal>
  );
}

/* --------------------------------------------------- destructive confirmation */

export function DestructiveConfirmation({
  open,
  onClose,
  onConfirm,
  title,
  resourceName,
  consequence,
  actionLabel,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  resourceName: string;
  consequence: string;
  actionLabel: string;
  busy?: boolean;
}) {
  const [typed, setTyped] = useState('');
  useEffect(() => {
    if (!open) setTyped('');
  }, [open]);
  const ready = typed.trim() === resourceName;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      danger
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cl-btn cl-btn-danger" onClick={onConfirm} disabled={!ready || busy}>
            {busy ? 'Working…' : actionLabel}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 13, lineHeight: 1.55 }}>{consequence}</p>
      <div className="cl-field" style={{ marginTop: 14 }}>
        <label className="cl-field-label" htmlFor="cl-destructive-confirm">
          Type <span className="cl-mono">{resourceName}</span> to confirm
        </label>
        <input
          id="cl-destructive-confirm"
          className="cl-input"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------- control dialog hook */

/**
 * Small helper for pages that own several dialogs: tracks which control dialog
 * is open plus a busy flag, so the Context Agent's "open this control" requests
 * and the page's own buttons share one deterministic path.
 */
export function useControlDialog<T extends string>() {
  const [openDialog, setOpenDialog] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);

  const close = useCallback(() => {
    setOpenDialog(null);
    setBusy(false);
  }, []);

  const run = useCallback(
    async (fn: () => void | Promise<void>) => {
      setBusy(true);
      try {
        await fn();
      } finally {
        setBusy(false);
        setOpenDialog(null);
      }
    },
    [],
  );

  return { openDialog, setOpenDialog, close, busy, setBusy, run };
}
