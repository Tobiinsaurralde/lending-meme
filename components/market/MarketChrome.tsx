'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const LINKS = [
  { id: 'markets', href: '/market', label: 'Markets' },
  { id: 'supply', href: '/supply', label: 'Supply' },
  { id: 'positions', href: '/positions', label: 'Positions' },
  { id: 'nfts', href: '/nfts', label: 'NFTs' },
  { id: 'morpho', href: '/morpho', label: 'Bitcoin, euros & more' },
] as const;

export type NavCurrent = (typeof LINKS)[number]['id'] | 'developers';

export function BrandMark({ href = '/' }: { href?: string }) {
  return (
    <a className="lm-mark" href={href}>
      <span className="lm-mark-badge">
        <img src="/media/bagfi-token.png" alt="" width={48} height={48} />
      </span>
      <span>BagFi</span>
    </a>
  );
}

export function MarketNav({ current }: { current: NavCurrent }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPointer);
    };
  }, [open]);

  return (
    <nav className={open ? 'lm-nav is-open' : 'lm-nav'} aria-label="Market" data-tour="nav" ref={root}>
      <button
        type="button"
        className="lm-menu"
        aria-expanded={open}
        aria-controls="lm-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="lm-menu-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        Menu
      </button>
      <div className="lm-menu-panel" id="lm-menu-panel">
        {LINKS.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={current === item.id ? 'is-on' : undefined}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}
        <Link href="/developers" className={current === 'developers' ? 'is-on' : undefined} onClick={() => setOpen(false)}>
          Developers
        </Link>
      </div>
    </nav>
  );
}
