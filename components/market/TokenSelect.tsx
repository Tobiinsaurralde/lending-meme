'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ARC_TOKENS, type ArcToken } from '@/lib/market/tokens';

export function TokenSelect({
  value,
  onChange,
  tokens = ARC_TOKENS,
}: {
  value: string;
  onChange: (symbol: string) => void;
  tokens?: ArcToken[];
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = tokens.find((item) => item.symbol === value) ?? tokens[0];

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="lm-token" ref={root}>
      <button
        type="button"
        className="lm-token-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((next) => !next)}
      >
        <img src={current.logo} alt="" width={28} height={28} />
        <span>
          <strong>{current.symbol}</strong>
          <small>{current.name}</small>
        </span>
        <svg viewBox="0 0 12 8" aria-hidden="true">
          <path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>
      {open ? (
        <ul className="lm-token-menu" id={listId} role="listbox">
          {tokens.map((item) => (
            <li key={item.symbol}>
              <button
                type="button"
                role="option"
                aria-selected={item.symbol === current.symbol}
                className={item.symbol === current.symbol ? 'lm-token-option is-on' : 'lm-token-option'}
                onClick={() => {
                  onChange(item.symbol);
                  setOpen(false);
                }}
              >
                <img src={item.logo} alt="" width={28} height={28} />
                <span>
                  <strong>{item.symbol}</strong>
                  <small>{item.name}</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
