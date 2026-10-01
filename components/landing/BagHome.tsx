'use client';

import { useEffect, useState } from 'react';
import { erc20Abi, formatUnits } from 'viem';
import { poolClient } from '@/components/market/MarketsBoard';
import { arc } from '@/lib/market/arc';
import { LENDING_POOL, USDC, lendingPoolAbi } from '@/lib/market/pool';
import { TIERS, formatUsd } from '@/lib/market/quote';
import { ARC_TOKENS } from '@/lib/market/tokens';

interface HomeStats {
  cash: bigint;
  borrowed: bigint;
  prices: (string | null)[];
}

async function readHome(pool: `0x${string}`): Promise<HomeStats> {
  const [[cash, borrowed], prices] = await Promise.all([
    poolClient.multicall({
      contracts: [
        { address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [pool] },
        { address: pool, abi: lendingPoolAbi, functionName: 'borrowed' },
      ],
    }),
    poolClient.multicall({
      contracts: ARC_TOKENS.map((token) => ({
        address: pool,
        abi: lendingPoolAbi,
        functionName: 'priceOf' as const,
        args: [token.address] as const,
      })),
    }),
  ]);
  return {
    cash: cash.result ?? 0n,
    borrowed: borrowed.result ?? 0n,
    prices: prices.map((entry) => {
      const pair = entry.result as readonly [bigint, bigint] | undefined;
      if (!pair) return null;
      const price = pair[0] < pair[1] ? pair[0] : pair[1];
      return Number(formatUnits(price, 6)).toPrecision(3);
    }),
  };
}

function useCount(target: number | null): string {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (target === null) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 700);
      setShown(target * (1 - (1 - t) ** 3));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);
  if (target === null) return '—';
  return formatUsd(shown);
}

const SURFACES = [
  {
    n: '01',
    title: 'Supply USDC',
    body: 'Deposit into one pool and earn 80% of every fee, plus whatever liquidations leave behind. Withdraw what is not lent out.',
    href: '/supply',
    label: 'Start supplying',
  },
  {
    n: '02',
    title: 'Borrow against a memecoin',
    body: 'Lock COOL, LONG, ARCAT or ARCANINE. You receive USDC minus a fee of 1.5% to 3%, and the tokens come back when you repay.',
    href: '/market#borrow',
    label: 'Borrow',
  },
  {
    n: '03',
    title: 'A price from the market itself',
    body: 'Each token is priced on its own Arc pool, Uniswap V3 or DYORSwap. Loans use the lower of the 30-minute average and the spot price.',
    href: '/market',
    label: 'See markets',
  },
  {
    n: '04',
    title: 'Liquidations, watched',
    body: 'Past due, or collateral below twice the debt, and anyone can liquidate. A keeper checks every 15 seconds and keeps 1% of the sale.',
    href: '/positions#liquidations',
    label: 'Liquidations',
  },
];

const WHY = [
  {
    title: 'The contracts are the disclosure',
    body: 'Every loan, price and parameter is on Arc. The pool address is public. There is no off-chain balance sheet.',
  },
  {
    title: 'A fee you can see first',
    body: 'The fee is charged up front, from 1.5% to 3% depending on the term. It does not float with utilization.',
  },
  {
    title: 'Priced where it trades',
    body: 'Collateral is valued on the same market it is sold into. A one-second spike cannot size a loan.',
  },
  {
    title: 'Built for Arc',
    body: 'USDC is the gas token. Borrowing, supplying and liquidating all settle in USDC on chain 5042.',
  },
];

export function BagHome() {
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [banner, setBanner] = useState(true);
  const maxLtv = Math.max(...TIERS.map((tier) => tier.ltvBps)) / 100;
  const cash = stats ? Number(formatUnits(stats.cash, 6)) : null;
  const lent = stats ? Number(formatUnits(stats.borrowed, 6)) : null;
  const cashLabel = useCount(cash);
  const lentLabel = useCount(lent);
  const poolLabel = useCount(cash !== null && lent !== null ? cash + lent : null);
  const utilized =
    stats && stats.cash + stats.borrowed > 0n
      ? Math.round(Number((stats.borrowed * 10000n) / (stats.cash + stats.borrowed)) / 100)
      : null;

  useEffect(() => {
    if (!LENDING_POOL) return;
    const pool = LENDING_POOL;
    let live = true;
    const load = () =>
      readHome(pool)
        .then((next) => live && setStats(next))
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  const ticker = [...ARC_TOKENS, ...ARC_TOKENS, ...ARC_TOKENS, ...ARC_TOKENS];

  return (
    <div className="bf-home">
      {banner ? (
        <div className="bf-announce">
          <a href="/market">COOL, LONG, ARCAT and ARCANINE are live as collateral on Arc.</a>
          <button type="button" aria-label="Dismiss announcement" onClick={() => setBanner(false)}>
            ×
          </button>
        </div>
      ) : null}

      <header className="bf-nav">
        <a className="bf-logo" href="/">
          BagFi
        </a>
        <nav>
          <a href="/supply">Supply</a>
          <a href="/market">Markets</a>
          <a href="/developers">Developers</a>
          <a href="/positions">Positions</a>
        </nav>
        <a className="bf-launch" href="/market">
          Open BagFi
        </a>
      </header>

      <main>
        <section className="bf-hero">
          <p className="bf-kicker">USDC lending on Arc</p>
          <h1>Credit against the bag you already hold.</h1>
          <p className="bf-lede">
            Supply USDC and earn from borrowers. Borrow USDC against COOL, LONG, ARCAT and ARCANINE.
            The fee is charged up front, and the tokens come back when you repay.
          </p>
          <div className="bf-cta">
            <a className="bf-btn" href="/supply">
              Supply USDC
            </a>
            <a className="bf-btn bf-btn-ghost" href="/market#borrow">
              Borrow
            </a>
          </div>
          <p className="bf-accepted">Collateral accepted</p>
          <ul className="bf-chips">
            {ARC_TOKENS.map((token) => (
              <li key={token.symbol}>{token.symbol}</li>
            ))}
          </ul>
          <div className="bf-hero-stat">
            <span>In the pool</span>
            <strong>{poolLabel}</strong>
            <small>Built on Arc · chain {arc.id}</small>
          </div>
        </section>

        <div className="bf-marquee" aria-hidden="true">
          <div>
            {ticker.map((token, index) => (
              <span key={`${token.symbol}-${index}`}>{token.symbol}</span>
            ))}
          </div>
        </div>

        <section className="bf-earn">
          <div className="bf-earn-copy">
            <p className="bf-kicker">Earn</p>
            <h2>Suppliers keep 80% of every fee.</h2>
            <p>
              One USDC pool on Arc. Withdraw whatever is not lent out. The other 20% goes to the
              protocol treasury.
            </p>
            <a className="bf-btn" href="/supply">
              Start supplying
            </a>
          </div>
          <dl className="bf-stats">
            <div>
              <dt>Available to borrow</dt>
              <dd>{cashLabel}</dd>
            </div>
            <div>
              <dt>Lent out</dt>
              <dd>{lentLabel}</dd>
            </div>
            <div>
              <dt>Utilization</dt>
              <dd>{utilized === null ? '—' : `${utilized}%`}</dd>
            </div>
            <div>
              <dt>Live markets</dt>
              <dd>{ARC_TOKENS.length}</dd>
            </div>
          </dl>
        </section>

        <section className="bf-block">
          <h2>One pool, four markets.</h2>
          <p className="bf-sub">
            Borrow up to {maxLtv}% of the collateral. A loan liquidates at 50%, or when it falls past
            due. Chain {arc.id}. Gas is paid in USDC.
          </p>
          <ol className="bf-steps">
            {SURFACES.map((step) => (
              <li key={step.n}>
                <a href={step.href}>
                  <span>{step.n}</span>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                  <em>{step.label}</em>
                </a>
              </li>
            ))}
          </ol>
        </section>

        <section className="bf-block">
          <h2>Markets</h2>
          <div className="bf-table">
            <div className="bf-thead">
              <span>Collateral</span>
              <span>Price</span>
              <span>Borrow up to</span>
              <span>Term</span>
              <span />
            </div>
            {ARC_TOKENS.map((token, index) => (
              <a className="bf-trow" href={`/market?token=${token.symbol}#borrow`} key={token.symbol}>
                <span>
                  <strong>{token.symbol}</strong>
                  <small>{token.name}</small>
                </span>
                <span>{stats?.prices[index] ? `${stats.prices[index]} USDC` : '—'}</span>
                <span>{maxLtv}%</span>
                <span>2–7 days</span>
                <span className="bf-pill">Borrow</span>
              </a>
            ))}
          </div>
        </section>

        <section className="bf-metrics">
          <div>
            <h3>Lent out</h3>
            <strong>{lentLabel}</strong>
          </div>
          <div>
            <h3>Available</h3>
            <strong>{cashLabel}</strong>
          </div>
          <div>
            <h3>Live markets</h3>
            <strong>{ARC_TOKENS.length}</strong>
          </div>
          <div>
            <h3>Longest term</h3>
            <strong>7 days</strong>
          </div>
        </section>

        <section className="bf-block bf-built">
          <div>
            <p className="bf-kicker">Built to last</p>
            <h2>What the pool actually does.</h2>
            <ul>
              <li>One USDC pool, four collateral markets</li>
              <li>Price from Uniswap V3 and DYORSwap, averaged 30 minutes</li>
              <li>Fixed fee, charged up front, 80% to suppliers</li>
              <li>A keeper liquidates past-due and undercollateralized loans</li>
            </ul>
          </div>
          <div className="bf-hold">
            <h3>You can read it</h3>
            <p>
              The pool is one contract on Arc. It is not audited. The source and the balances are on
              the explorer. Start with small amounts.
            </p>
            {LENDING_POOL ? (
              <a className="bf-btn" href={`https://explorer.arc.io/address/${LENDING_POOL}`}>
                View the pool
              </a>
            ) : null}
          </div>
        </section>

        <section className="bf-block" id="faq">
          <h2>Before you deposit</h2>
          <div className="bf-faq">
            <details open>
              <summary>Where does a supplier&apos;s return come from?</summary>
              <p>From fees paid up front by borrowers, 80% of each one, and from collateral sales that leave more than the debt.</p>
            </details>
            <details>
              <summary>When can I withdraw?</summary>
              <p>Whenever the pool still holds USDC that is not lent out. A withdrawal cannot pull funds that are inside an open loan.</p>
            </details>
            <details>
              <summary>When does a loan get liquidated?</summary>
              <p>When it passes its due date, or when the collateral is worth less than twice the debt. The keeper checks every 15 seconds. Anyone can do it first and keep 1%.</p>
            </details>
            <details>
              <summary>Is the contract audited?</summary>
              <p>No. It is verified on the Arc explorer and you can read it. Treat the first deposits as a test, not as a treasury.</p>
            </details>
          </div>
        </section>

        <section className="bf-block">
          <h2>Why BagFi</h2>
          <div className="bf-why">
            {WHY.map((item) => (
              <article key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="bf-foot">
        <div>
          <strong>BagFi</strong>
          <p>Fixed-term USDC loans on Arc. The contract is unaudited. Start with small amounts.</p>
        </div>
        <div>
          <p>Product</p>
          <a href="/supply">Supply</a>
          <a href="/market">Markets</a>
          <a href="/developers">Developers</a>
          <a href="/positions">Positions</a>
        </div>
        <div>
          <p>Read</p>
          <a href="#faq">FAQ</a>
          <a href="/market">App</a>
          {LENDING_POOL ? <a href={`https://explorer.arc.io/address/${LENDING_POOL}`}>Pool on Arc</a> : null}
        </div>
      </footer>
    </div>
  );
}
