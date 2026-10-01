'use client';

import { useEffect, useRef, useState } from 'react';
import { ARC_TOKENS } from '@/lib/market/tokens';

/** Side marks. BagFi stays in the middle ball, so it is not in this list. */
const COINS = ARC_TOKENS.filter((token) => token.symbol !== 'BAGFI');

function swingAngle(el: Element): number {
  const transform = getComputedStyle(el).transform;
  if (!transform || transform === 'none') return 0;
  const match = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
  if (!match) return 0;
  const parts = match[1].split(',').map((part) => Number(part));
  return Math.abs(Math.atan2(parts[1], parts[0]) * (180 / Math.PI));
}

/**
 * One side ball. The mark advances only when that ball swings out and comes
 * back against the middle ball. The two sides start half a list apart.
 */
export default function PendulumSide({ slot }: { slot: 'left' | 'right' }) {
  const root = useRef<HTMLSpanElement>(null);
  const offset = slot === 'left' ? 0 : Math.ceil(COINS.length / 2);
  const [index, setIndex] = useState(offset);

  useEffect(() => {
    const ball = root.current?.closest('.encounter__pendulum__each');
    if (!ball || COINS.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let frame = 0;
    let away = false;
    const watch = () => {
      const angle = swingAngle(ball);
      if (angle > 12) away = true;
      else if (away && angle < 2) {
        away = false;
        setIndex((current) => (current + 1) % COINS.length);
      }
      frame = requestAnimationFrame(watch);
    };
    frame = requestAnimationFrame(watch);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span className="cl-pend-coins" ref={root}>
      {COINS.map((coin, i) => (
        <img
          key={coin.address}
          src={coin.logo}
          alt={i === index ? coin.symbol : ''}
          aria-hidden={i === index ? undefined : true}
          className="cl-pend-mark cl-pend-mark--coin"
          data-on={i === index ? '1' : '0'}
        />
      ))}
    </span>
  );
}
