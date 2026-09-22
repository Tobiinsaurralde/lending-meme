'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/** Lightweight anchored popover used by the title bar and status bar menus. */
export function Popover({
  trigger,
  children,
  align = 'left',
  width = 260,
  label,
}: {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (props: { close: () => void }) => ReactNode;
  align?: 'left' | 'right';
  width?: number;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open ? (
        <div
          role="menu"
          aria-label={label}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align]: 0,
            width,
            maxHeight: '70vh',
            overflowY: 'auto',
            zIndex: 320,
            background: 'var(--cl-panel)',
            /* The popover often renders inside a chrome bar, which carries
               inverted ink. Re-assert panel ink so descendants inherit it. */
            color: 'var(--cl-ink)',
            border: '1px solid var(--cl-ink)',
            boxShadow: '0 16px 40px rgba(1, 13, 110, 0.24)',
            padding: 4,
            animation: 'cl-rise 0.12s cubic-bezier(0.16,1,0.3,1)',
          } as React.CSSProperties}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      ) : null}
    </div>
  );
}

export function MenuItem({
  children,
  onClick,
  hint,
  disabled,
  tone,
}: {
  children: ReactNode;
  onClick?: () => void;
  hint?: ReactNode;
  disabled?: boolean;
  tone?: 'danger';
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className="cl-palette-item"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%',
        textAlign: 'left',
        color: tone === 'danger' ? 'var(--cl-deny)' : undefined,
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {children}
      {hint ? <span className="cl-palette-item-hint">{hint}</span> : null}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return (
    <div className="cl-label" style={{ padding: '8px 12px 4px' }}>
      {children}
    </div>
  );
}

export function MenuSeparator() {
  return <div style={{ height: 1, background: 'var(--cl-line)', margin: '4px 0' }} />;
}
