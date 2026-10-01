'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const SEEN = 'bagfi.guide.v2';
const ACTIVE = 'bagfi.guide.step';
const OPEN = 'bagfi-guide';

type Step = {
  kicker: string;
  title: string;
  body: string;
  path?: string;
  target?: string;
};

const STEPS: Step[] = [
  {
    kicker: 'Start',
    title: 'Keep the token. Borrow USDC.',
    body: 'This tour moves across the app and points at each control. You lock a memecoin as collateral and the pool sends you USDC. You do not sell the token.',
  },
  {
    kicker: 'Navigation',
    title: 'Each desk is its own page.',
    body: 'Markets, Supply, Positions, NFTs, Bitcoin, euros & more and Developers. Borrowing sits on Markets. NFT loans are a separate desk. The loan book and liquidations sit on Positions.',
    target: 'nav',
  },
  {
    kicker: 'Wallet',
    title: 'Connect on Arc.',
    body: 'Deposits, loans and repayments are signed here. The pool lives on Arc mainnet, chain 5042. Gas is paid in USDC.',
    target: 'wallet',
  },
  {
    kicker: 'Markets',
    title: 'Every bag has a live price.',
    body: 'COOL, LONG and ARCANINE are priced on Uniswap V3. ARCAT is priced on DYORSwap. Borrow stays off until the pool can read a price. The most you can draw is 30% of the collateral value.',
    path: '/market',
    target: 'markets',
  },
  {
    kicker: 'BAGFI',
    title: 'BAGFI borrows from the same pool.',
    body: 'Lock BAGFI and receive USDC. The price is read from the existing Uniswap v4 pool. You do not create or fund a new pair.',
    path: '/market',
    target: 'bagfi',
  },
  {
    kicker: 'Pricing',
    title: 'The price that sizes the loan.',
    body: 'COOL, LONG, ARCAT and ARCANINE use the lower of the 30-minute average and the current price, so a brief spike cannot inflate a loan. BAGFI is read from its Uniswap v4 pool.',
    path: '/market',
    target: 'pricing',
  },
  {
    kicker: 'Risk',
    title: 'Two ways a loan can be closed.',
    body: 'Miss the due date, or let the collateral fall below twice the debt, and anyone can liquidate it. The pool sells the token. The liquidator keeps 1%. You keep the USDC you received and lose the collateral.',
    path: '/market',
    target: 'risk',
  },
  {
    kicker: 'Borrow',
    title: 'Pick the bag and the amount.',
    body: 'Choose the token you are locking and how much of it. The quote updates from the pool before you sign. One click approves the token and then opens the loan.',
    path: '/market',
    target: 'borrow',
  },
  {
    kicker: 'Term',
    title: 'Three fixed terms.',
    body: 'Express is 2 days, 3% fee, 30% LTV. Quick is 3 days, 2% fee, 25% LTV. Standard is 7 days, 1.5% fee, 20% LTV. The fee is taken up front. You repay only the principal.',
    path: '/market',
    target: 'tiers',
  },
  {
    kicker: 'Quote',
    title: 'What you receive, and what you owe.',
    body: 'You receive the principal minus the fee. You repay the principal before the due date. The price shown is the one the pool is using for this token.',
    path: '/market',
    target: 'quote',
  },
  {
    kicker: 'Supply',
    title: 'USDC in the pool is what gets lent.',
    body: 'Suppliers deposit USDC and keep 80% of every fee. The other 20% goes to the protocol. Withdraw sends back whatever is not currently lent out.',
    path: '/supply',
    target: 'supply',
  },
  {
    kicker: 'Positions',
    title: 'What you put in, and what you owe.',
    body: 'Supplied is your USDC still in the pool. You owe is open principal. Collateral is the value of tokens locked against those loans. Repay from the loan card. The collateral comes back in the same click.',
    path: '/positions',
    target: 'positions',
  },
  {
    kicker: 'Loans',
    title: 'Yours, and everyone else’s.',
    body: 'Your loans is where you repay. All loans lists every open position in the pool, with the borrower, the debt and the due date. Only the borrower can repay.',
    path: '/positions',
    target: 'loans',
  },
  {
    kicker: 'Liquidations',
    title: 'Past due, or below the minimum.',
    body: 'A keeper checks the pool about every 15 seconds. Anyone can close a loan that is past due or under the minimum collateral and keep 1% of the sale. Healthy loans are not listed here.',
    path: '/positions',
    target: 'liquidations',
  },
  {
    kicker: 'NFTs',
    title: 'Lock the NFT. Take the USDC.',
    body: 'An offer names a collection, and a token unless any piece of that collection is accepted. You lock that NFT and receive the USDC. Repay before the date and it comes back. This desk does not use the meme pool.',
    path: '/nfts',
    target: 'nfts',
  },
  {
    kicker: 'Done',
    title: 'That is the whole desk.',
    body: 'Borrow against a bag, supply USDC, watch the position, and repay before the date.',
  },
];

type Box = { top: number; left: number; width: number; height: number };
type Place = { top: number; left: number; side: 'above' | 'below' | 'center' };

export function openGuide() {
  window.sessionStorage.setItem(ACTIVE, '0');
  window.dispatchEvent(new Event(OPEN));
}

function readStep(): number {
  const raw = window.sessionStorage.getItem(ACTIVE);
  const index = raw === null ? 0 : Number(raw);
  return Number.isInteger(index) && index >= 0 && index < STEPS.length ? index : 0;
}

export function Onboarding() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [place, setPlace] = useState<Place | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrolled = useRef(-1);

  const router = useRouter();

  const close = useCallback(() => {
    window.localStorage.setItem(SEEN, '1');
    window.sessionStorage.removeItem(ACTIVE);
    setOpen(false);
  }, []);

  const showStep = useCallback((index: number) => {
    const next = STEPS[index];
    if (!next) return;
    window.sessionStorage.setItem(ACTIVE, String(index));
    if (next.path && window.location.pathname !== next.path) {
      router.push(next.path);
      return;
    }
    setStep(index);
    setOpen(true);
  }, [router]);

  useEffect(() => {
    const pending = window.sessionStorage.getItem(ACTIVE);
    if (pending !== null) {
      const index = readStep();
      const saved = STEPS[index];
      if (saved?.path && window.location.pathname !== saved.path) {
        const here = STEPS.findIndex((item) => item.path === window.location.pathname);
        showStep(here >= 0 ? here : 0);
      } else showStep(index);
    } else if (!window.localStorage.getItem(SEEN)) showStep(0);
    const onOpen = () => showStep(0);
    window.addEventListener(OPEN, onOpen);
    return () => window.removeEventListener(OPEN, onOpen);
  }, [showStep]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (step < STEPS.length - 1) showStep(step + 1);
        else close();
      }
      if (event.key === 'ArrowLeft' && step > 0) {
        event.preventDefault();
        showStep(step - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, close, showStep]);

  useLayoutEffect(() => {
    if (!open) return;
    const current = STEPS[step];
    let frame = 0;
    const measure = () => {
      const card = cardRef.current;
      const cardW = card?.offsetWidth ?? 380;
      const cardH = card?.offsetHeight ?? 260;
      const target = current.target ? document.querySelector<HTMLElement>(`[data-tour="${current.target}"]`) : null;
      if (!target) {
        setBox(null);
        setPlace({
          top: Math.max(16, (window.innerHeight - cardH) / 2),
          left: Math.max(16, (window.innerWidth - cardW) / 2),
          side: 'center',
        });
        return;
      }
      const rect = target.getBoundingClientRect();
      const hidden = rect.top < 72 || rect.bottom > window.innerHeight - 24 || rect.height > window.innerHeight * 0.72;
      if (scrolled.current !== step && hidden) {
        scrolled.current = step;
        target.scrollIntoView({ block: rect.height > window.innerHeight * 0.6 ? 'start' : 'center', behavior: 'smooth' });
      }
      const pad = 8;
      const nextBox = {
        top: rect.top - pad,
        left: rect.left - pad,
        width: Math.max(rect.width + pad * 2, 12),
        height: Math.max(rect.height + pad * 2, 12),
      };
      setBox((prev) =>
        prev &&
        Math.abs(prev.top - nextBox.top) < 1 &&
        Math.abs(prev.left - nextBox.left) < 1 &&
        Math.abs(prev.width - nextBox.width) < 1 &&
        Math.abs(prev.height - nextBox.height) < 1
          ? prev
          : nextBox,
      );
      const gap = 16;
      const mobile = window.innerWidth < 800;
      let top = rect.bottom + pad + gap;
      let left = Math.min(Math.max(16, rect.left), window.innerWidth - cardW - 16);
      let side: Place['side'] = 'below';
      if (mobile) {
        top = window.innerHeight - cardH - 12;
        left = 12;
        side = 'below';
      } else if (top + cardH > window.innerHeight - 12) {
        const above = rect.top - pad - gap - cardH;
        if (above >= 12) {
          top = above;
          side = 'above';
        } else {
          top = Math.max(12, Math.min(rect.top, window.innerHeight - cardH - 12));
          const right = rect.right + pad + gap;
          if (right + cardW <= window.innerWidth - 12) left = right;
          else left = Math.max(12, rect.left - gap - cardW);
          side = 'below';
        }
      }
      setPlace((prev) =>
        prev && prev.side === side && Math.abs(prev.top - top) < 1 && Math.abs(prev.left - left) < 1
          ? prev
          : { top, left, side },
      );
    };
    measure();
    const onMove = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', onMove, true);
    window.addEventListener('resize', onMove);
    const timer = window.setInterval(measure, 200);
    const stop = window.setTimeout(() => window.clearInterval(timer), 2400);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onMove, true);
      window.removeEventListener('resize', onMove);
      window.clearInterval(timer);
      window.clearTimeout(stop);
    };
  }, [open, step]);

  useEffect(() => {
    if (!open) return;
    cardRef.current?.querySelector<HTMLButtonElement>('[data-guide="next"]')?.focus();
  }, [open, step]);

  if (!open) return null;
  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const spot = box ?? {
    top: window.innerHeight / 2,
    left: window.innerWidth / 2,
    width: 0,
    height: 0,
  };

  return (
    <div className="lm-guide">
      <div className="lm-guide-catch" />
      <div
        className={box ? 'lm-guide-spot' : 'lm-guide-spot is-hidden'}
        style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
      />
      <div
        ref={cardRef}
        className={`lm-guide-card is-${place?.side ?? 'center'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lm-guide-title"
        style={place ? { top: place.top, left: place.left } : undefined}
      >
        <div className="lm-guide-progress" aria-hidden="true">
          <span style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <div className="lm-guide-top">
          <p className="lm-kicker">
            {current.kicker} · {step + 1} / {STEPS.length}
          </p>
          <button type="button" className="lm-guide-skip" onClick={close}>
            Skip tutorial
          </button>
        </div>
        <h2 id="lm-guide-title">{current.title}</h2>
        <p>{current.body}</p>
        <div className="lm-actions">
          {step > 0 ? (
            <button type="button" className="lm-btn lm-btn-secondary" onClick={() => showStep(step - 1)}>
              Back
            </button>
          ) : null}
          <button
            type="button"
            className="lm-btn"
            data-guide="next"
            onClick={() => (last ? close() : showStep(step + 1))}
          >
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
