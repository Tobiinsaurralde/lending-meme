'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BaseError, ContractFunctionRevertedError, erc20Abi, formatUnits, parseUnits } from 'viem';
import { useAccount, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from 'wagmi';
import { WalletChip } from '@/components/studio/wallet/WalletChip';
import { useWalletSession } from '@/lib/studio/wallet-session';
import { arc } from '@/lib/market/arc';
import { LENDING_POOL, USDC, lendingPoolAbi } from '@/lib/market/pool';
import { TIERS, formatUsd, type TierId } from '@/lib/market/quote';
import { TokenSelect } from '@/components/market/TokenSelect';
import { ARC_TOKENS, type ArcToken } from '@/lib/market/tokens';
import { MarketsBoard, poolClient } from '@/components/market/MarketsBoard';
import { BrandMark, MarketNav } from '@/components/market/MarketChrome';
import { Onboarding } from '@/components/market/Onboarding';

const TIER_INDEX: Record<TierId, number> = { express: 0, quick: 1, standard: 2 };

const DESK_SECTIONS = ['markets', 'supply', 'positions'] as const;
type DeskSection = (typeof DESK_SECTIONS)[number];

const DESK_COPY: Record<DeskSection, { title: string; lead: string }> = {
  markets: {
    title: 'USDC against your bag, without selling it.',
    lead: 'Fixed-term loans. The fee is charged up front: 80% goes to USDC suppliers and 20% to the protocol. Repay the principal before the due date and your tokens come back.',
  },
  supply: {
    title: 'Put USDC in the pool.',
    lead: 'That deposit is what borrowers draw. You earn 80% of every fee. Withdrawals use the USDC that is not lent out.',
  },
  positions: {
    title: 'Your positions.',
    lead: 'USDC you supplied, loans open against your collateral, every loan still in the pool, and anything ready to liquidate.',
  },
};

const HASH_PATHS: Record<string, string> = {
  markets: '/market',
  supply: '/supply',
  positions: '/positions',
  morpho: '/morpho',
};

const POOL_ERRORS: Record<string, string> = {
  NotEnabled: 'This token is not active in the pool yet.',
  OracleUnavailable: 'The average price is updating. Try again in a few minutes.',
  NoLiquidity: 'The pool does not have enough USDC for that amount.',
  Healthy: 'That loan is healthy and cannot be liquidated yet.',
  Slippage: 'The market is too thin to sell that collateral without losing more than 15%.',
  NotOpen: 'That loan is already closed.',
  NotBorrower: 'Only the borrower can repay this loan.',
  BadInput: 'Check the amount.',
};

function usdc(units: bigint | undefined): string {
  if (units === undefined) return '—';
  return formatUsd(Number(formatUnits(units, 6)));
}

function tokenPrice(units: bigint | undefined): string {
  if (units === undefined) return '—';
  return `${Number(formatUnits(units, 6)).toPrecision(3)} USDC`;
}

function poolErrorName(error: unknown): string | null {
  if (error instanceof BaseError) {
    const reverted = error.walk((e) => e instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) return reverted.data?.errorName ?? null;
  }
  return null;
}

function shortError(error: unknown): string {
  const name = poolErrorName(error);
  if (name && POOL_ERRORS[name]) return POOL_ERRORS[name];
  if (error && typeof error === 'object' && 'shortMessage' in error && typeof error.shortMessage === 'string') {
    return error.shortMessage;
  }
  if (error instanceof Error) return error.message;
  return 'The transaction was not sent.';
}

function symbolOf(address: string): ArcToken | undefined {
  return ARC_TOKENS.find((item) => item.address.toLowerCase() === address.toLowerCase());
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function dueLabel(due: bigint, pastDue: boolean): string {
  if (pastDue) return 'Past due';
  return new Date(Number(due) * 1000).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type BookRow = {
  id: bigint;
  borrower: string;
  symbol: string;
  logo?: string;
  principal: bigint;
  value: bigint;
  due: bigint;
  pastDue: boolean;
  underwater: boolean;
};

function LoanBook({ rows, you }: { rows: BookRow[] | null; you?: string }) {
  if (rows === null) return <p className="lm-meta">Loading loans.</p>;
  if (rows.length === 0) return <p className="lm-meta">No open loans.</p>;
  return (
    <div className="lm-book" role="table" aria-label="All open loans">
      <div className="lm-book-row lm-book-head" role="row">
        <span role="columnheader">Loan</span>
        <span role="columnheader">Borrower</span>
        <span role="columnheader">Debt</span>
        <span role="columnheader">Collateral</span>
        <span role="columnheader">Due</span>
        <span role="columnheader">Status</span>
      </div>
      {rows.map((row) => {
        const yours = Boolean(you && row.borrower.toLowerCase() === you.toLowerCase());
        const status = row.pastDue ? 'Past due' : row.underwater ? 'At risk' : 'Healthy';
        return (
          <div className="lm-book-row" role="row" key={row.id.toString()}>
            <span role="cell" className="lm-asset">
              {row.logo ? <img src={row.logo} alt="" width={28} height={28} /> : null}
              <span>
                <strong>{row.symbol}</strong>
                <small>#{row.id.toString()}</small>
              </span>
            </span>
            <span role="cell">
              {shortAddress(row.borrower)}
              {yours ? <em className="lm-you">You</em> : null}
            </span>
            <span role="cell">{usdc(row.principal)}</span>
            <span role="cell">{usdc(row.value)}</span>
            <span role="cell">{dueLabel(row.due, row.pastDue)}</span>
            <span role="cell">
              <span className={row.pastDue || row.underwater ? 'lm-pill' : 'lm-pill is-live'}>{status}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function MarketDesk({ section }: { section: DeskSection }) {
  const router = useRouter();
  const { activated, requestConnect } = useWalletSession();
  const [symbol, setSymbol] = useState(ARC_TOKENS[0].symbol);
  const [amount, setAmount] = useState('100');
  const [supplyAmount, setSupplyAmount] = useState('100');
  const [tierId, setTierId] = useState<TierId>('quick');

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    const next = HASH_PATHS[hash];
    if (next && next !== window.location.pathname) {
      router.replace(next + window.location.search);
      return;
    }
    const token = new URLSearchParams(window.location.search).get('token');
    if (token && ARC_TOKENS.some((item) => item.symbol === token)) setSymbol(token);
  }, [router]);

  const token = ARC_TOKENS.find((item) => item.symbol === symbol) ?? ARC_TOKENS[0];
  const copy = DESK_COPY[section];

  return (
    <div className="cl-studio lm-market">
      <header className="lm-bar">
        <BrandMark />
        <MarketNav current={section} />
        <span data-tour="wallet">
          <WalletChip />
        </span>
      </header>

      <Onboarding />
      <main className="lm-main">
        <p className="lm-kicker">Lending protocol on Arc</p>
        <h1>{copy.title}</h1>
        <p className="lm-lead">{copy.lead}</p>
        {section === 'positions' ? (
          <nav className="lm-jumps" aria-label="On this page">
            <a href="#positions">Yours</a>
            <a href="#loans">All loans</a>
            <a href="#liquidations">Liquidations</a>
          </nav>
        ) : null}

        {section === 'markets' ? (
          <MarketsBoard
            selected={symbol}
            onBorrow={(next) => {
              setSymbol(next);
              const url = new URL(window.location.href);
              url.searchParams.set('token', next);
              url.hash = 'borrow';
              window.history.replaceState(null, '', url);
              document.getElementById('borrow')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          />
        ) : null}

        {activated ? (
          <MarketLive
            section={section}
            token={token}
            amount={amount}
            supplyAmount={supplyAmount}
            tierId={tierId}
            tierIndex={TIER_INDEX[tierId]}
            onSymbol={setSymbol}
            onAmount={setAmount}
            onSupplyAmount={setSupplyAmount}
            onTier={setTierId}
          />
        ) : (
          <Preview
            section={section}
            token={token}
            amount={amount}
            supplyAmount={supplyAmount}
            tierId={tierId}
            onSymbol={setSymbol}
            onAmount={setAmount}
            onSupplyAmount={setSupplyAmount}
            onTier={setTierId}
            onConnect={requestConnect}
          />
        )}

        {section === 'markets' ? (
          <section className="lm-split">
            <div data-tour="pricing">
              <h2>Pricing</h2>
              <p>
                COOL, LONG, ARCANINE, ARGUS, ARCT and TOLLY are priced on Uniswap V3. ARCAT is priced on
                DYORSwap. Those loans use the lower of the 30-minute average and the current price.
                BAGFI, Up-Side-Down-Cat, ARCMAN, FAZE and AF are priced from Uniswap v4 pools, where the average
                equals the current price.
              </p>
            </div>
            <div data-tour="risk">
              <h2>Liquidation</h2>
              <p>
                If a loan passes its due date, or the collateral falls below twice the debt, anyone can
                liquidate it. The pool sells the token in that same market, the liquidator keeps 1% and
                the rest stays in the pool. The borrower keeps the USDC they received and loses the
                collateral.
              </p>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function TierPicker({ tierId, onTier }: { tierId: TierId; onTier: (id: TierId) => void }) {
  return (
    <div className="lm-tiers" role="radiogroup" aria-label="Loan tier" data-tour="tiers">
      {TIERS.map((item) => (
        <label key={item.id} className={item.id === tierId ? 'is-on' : undefined}>
          <input
            type="radio"
            name="tier"
            value={item.id}
            checked={item.id === tierId}
            onChange={() => onTier(item.id)}
          />
          <strong>{item.name}</strong>
          <span>{item.ltvBps / 100}% LTV</span>
          <span>
            {item.days} days · {(item.feeBps / 100).toFixed(1)}%
          </span>
        </label>
      ))}
    </div>
  );
}

interface OpenRow {
  id: bigint;
  borrower: string;
  symbol: string;
  principal: bigint;
  value: bigint;
  due: bigint;
  pastDue: boolean;
  underwater: boolean;
  liquidatable: boolean;
}

function Preview({
  section,
  token,
  amount,
  supplyAmount,
  tierId,
  onSymbol,
  onAmount,
  onSupplyAmount,
  onTier,
  onConnect,
}: {
  section: DeskSection;
  token: ArcToken;
  amount: string;
  supplyAmount: string;
  tierId: TierId;
  onSymbol: (symbol: string) => void;
  onAmount: (amount: string) => void;
  onSupplyAmount: (amount: string) => void;
  onTier: (id: TierId) => void;
  onConnect: () => void;
}) {
  const tier = TIERS[TIER_INDEX[tierId]];
  const amountRaw = useMemo(() => {
    try {
      if (!amount || Number(amount) <= 0) return 0n;
      return parseUnits(amount, token.decimals);
    } catch {
      return 0n;
    }
  }, [amount, token.decimals]);
  const [quote, setQuote] = useState<readonly [bigint, bigint, bigint, bigint, number] | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [cash, setCash] = useState<bigint | null>(null);
  const [rows, setRows] = useState<OpenRow[] | null>(null);

  useEffect(() => {
    if (!LENDING_POOL) return;
    const pool = LENDING_POOL;
    let live = true;
    const load = async () => {
      try {
        const [poolCash, ids] = await Promise.all([
          poolClient.readContract({ address: USDC, abi: erc20Abi, functionName: 'balanceOf', args: [pool] }),
          poolClient.readContract({ address: pool, abi: lendingPoolAbi, functionName: 'openLoanIds' }),
        ]);
        const details = await Promise.all(
          ids.map(async (id) => {
            const [loan, health] = await Promise.all([
              poolClient.readContract({ address: pool, abi: lendingPoolAbi, functionName: 'loans', args: [id] }),
              poolClient.readContract({ address: pool, abi: lendingPoolAbi, functionName: 'health', args: [id] }),
            ]);
            const [borrower, collateral, , principal, due] = loan;
            const [value, , pastDue, underwater, liquidatable] = health;
            return {
              id,
              borrower,
              symbol: symbolOf(collateral)?.symbol ?? 'token',
              principal,
              value,
              due,
              pastDue,
              underwater,
              liquidatable,
            };
          }),
        );
        let nextQuote: readonly [bigint, bigint, bigint, bigint, number] | null = null;
        let nextError: string | null = null;
        if (amountRaw > 0n) {
          try {
            const terms = await poolClient.readContract({
              address: pool,
              abi: lendingPoolAbi,
              functionName: 'previewBorrow',
              args: [token.address, amountRaw, TIER_INDEX[tierId]],
            });
            nextQuote = [terms[0], terms[1], terms[2], terms[3], Number(terms[4])];
          } catch (cause) {
            nextError = shortError(cause);
          }
        }
        if (!live) return;
        setCash(poolCash);
        setRows(details);
        setQuote(nextQuote);
        setQuoteError(nextError);
      } catch {
        if (!live) return;
        setRows([]);
        setQuoteError('Live data is unavailable right now.');
      }
    };
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, [token.address, amountRaw, tierId]);

  const liquidatable = (rows ?? []).filter((row) => row.liquidatable);

  return (
    <>
    {section === 'markets' ? (
    <section id="borrow" className="lm-panel">
      <div className="lm-panel-copy" data-tour="borrow">
        <h2>Borrow USDC</h2>
        <p>The quote is live from the pool. Connect your wallet on Arc to sign the loan.</p>
        <TokenFields token={token} amount={amount} onSymbol={onSymbol} onAmount={onAmount} />
        <TierPicker tierId={tierId} onTier={onTier} />
        {quoteError ? <p className="lm-error">{quoteError}</p> : null}
        <div className="lm-actions">
          <button type="button" className="lm-btn" onClick={onConnect}>
            Connect to borrow
          </button>
        </div>
      </div>
      <dl className="lm-quote" data-tour="quote">
        <div>
          <dt>You receive</dt>
          <dd>{quote ? `${usdc(quote[3])} USDC` : '—'}</dd>
        </div>
        <div>
          <dt>Fee</dt>
          <dd>{quote ? usdc(quote[2]) : '—'}</dd>
        </div>
        <div>
          <dt>You repay</dt>
          <dd>{quote ? `${usdc(quote[1])} in ${tier.days} days` : '—'}</dd>
        </div>
        <div>
          <dt>{token.symbol} price</dt>
          <dd>{quote && amountRaw > 0n ? tokenPrice((quote[0] * 10n ** BigInt(token.decimals)) / amountRaw) : '—'}</dd>
        </div>
      </dl>
    </section>
    ) : null}

    {section === 'supply' ? (
    <section id="supply" className="lm-panel" data-tour="supply">
      <div className="lm-panel-copy">
        <h2>Supply USDC</h2>
        <p>
          Suppliers earn 80% of every fee and everything liquidations leave in the pool. Connect your
          wallet on Arc to deposit.
        </p>
        <label className="lm-field">
          USDC to supply
          <input inputMode="decimal" value={supplyAmount} onChange={(event) => onSupplyAmount(event.target.value)} />
        </label>
        <div className="lm-actions">
          <button type="button" className="lm-btn" onClick={onConnect}>
            Connect to supply
          </button>
        </div>
      </div>
      <dl className="lm-quote">
        <div>
          <dt>USDC in the pool</dt>
          <dd>{cash === null ? '—' : usdc(cash)}</dd>
        </div>
      </dl>
    </section>
    ) : null}

    {section === 'positions' ? (
    <div className="lm-positions" id="positions" data-tour="positions">
      <dl className="lm-stats">
        <div>
          <dt>Supplied</dt>
          <dd>$0.00</dd>
        </div>
        <div>
          <dt>You owe</dt>
          <dd>$0.00</dd>
        </div>
        <div>
          <dt>Collateral</dt>
          <dd>$0.00</dd>
        </div>
      </dl>
      <section className="lm-loan">
        <div>
          <h2>No open borrows</h2>
          <p>Connect your wallet to see USDC you supplied and loans still open.</p>
        </div>
      </section>
    </div>
    ) : null}

    {section === 'positions' ? (
    <div className="lm-loan-board" id="loans" data-tour="loans">
      <section className="lm-book-section">
        <h2>All loans</h2>
        <p>Every loan still open in the pool, from every wallet.</p>
        <LoanBook
          rows={
            !LENDING_POOL
              ? []
              : rows === null
              ? null
              : rows.map((row) => {
                  const bag = ARC_TOKENS.find((item) => item.symbol === row.symbol);
                  return {
                    id: row.id,
                    borrower: row.borrower,
                    symbol: row.symbol,
                    logo: bag?.logo,
                    principal: row.principal,
                    value: row.value,
                    due: row.due,
                    pastDue: row.pastDue,
                    underwater: row.underwater,
                  };
                })
          }
        />
      </section>
    </div>
    ) : null}

    {section === 'positions' ? (
    <section id="liquidations" className="lm-panel lm-loans" data-tour="liquidations">
      <div>
        <h2>Liquidations</h2>
        <p>
          A keeper checks the pool every 15 seconds. Anyone can liquidate a past-due or undercollateralized
          loan and keep 1% of the sale.
        </p>
        {rows && liquidatable.length === 0 ? (
          <p className="lm-meta">
            {rows.length === 0 ? 'No open loans.' : `${rows.length} open ${rows.length === 1 ? 'loan' : 'loans'}, none to liquidate.`}
          </p>
        ) : null}
        <ul className="lm-bands">
          {liquidatable.map((row) => (
            <li key={row.id.toString()}>
              <strong>
                #{row.id.toString()} · {row.symbol}
              </strong>
              <span>
                Debt {usdc(row.principal)} · collateral {usdc(row.value)} · {row.pastDue ? 'past due' : 'below minimum'}
              </span>
            </li>
          ))}
        </ul>
        <div className="lm-actions">
          <button type="button" className="lm-btn" onClick={onConnect}>
            Connect to liquidate
          </button>
        </div>
      </div>
    </section>
    ) : null}
  </>
  );
}

function TokenFields({
  token,
  amount,
  onSymbol,
  onAmount,
}: {
  token: ArcToken;
  amount: string;
  onSymbol: (symbol: string) => void;
  onAmount: (amount: string) => void;
}) {
  return (
    <>
      <label className="lm-field">
        Token
        <TokenSelect value={token.symbol} onChange={onSymbol} />
      </label>
      <label className="lm-field">
        {token.symbol === 'USDC' ? token.name : token.symbol} amount
        <input inputMode="decimal" value={amount} onChange={(event) => onAmount(event.target.value)} />
      </label>
    </>
  );
}

function MarketLive({
  section,
  token,
  amount,
  supplyAmount,
  tierId,
  tierIndex,
  onSymbol,
  onAmount,
  onSupplyAmount,
  onTier,
}: {
  section: DeskSection;
  token: ArcToken;
  amount: string;
  supplyAmount: string;
  tierId: TierId;
  tierIndex: number;
  onSymbol: (symbol: string) => void;
  onAmount: (amount: string) => void;
  onSupplyAmount: (amount: string) => void;
  onTier: (id: TierId) => void;
}) {
  const { address, chainId, isConnected } = useAccount();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();
  const client = usePublicClient({ chainId: arc.id });
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onArc = chainId === arc.id;
  const tier = TIERS[tierIndex];
  const pool = LENDING_POOL;
  const poolMissing = pool === null;

  const amountRaw = useMemo(() => {
    try {
      if (!amount || Number(amount) <= 0) return 0n;
      return parseUnits(amount, token.decimals);
    } catch {
      return 0n;
    }
  }, [amount, token.decimals]);

  const supplyRaw = useMemo(() => {
    try {
      if (!supplyAmount || Number(supplyAmount) <= 0) return 0n;
      return parseUnits(supplyAmount, 6);
    } catch {
      return 0n;
    }
  }, [supplyAmount]);

  const onPool = { address: pool ?? undefined, abi: lendingPoolAbi, chainId: arc.id } as const;

  const { data: usdcBalance } = useReadContract({
    address: USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address) },
  });

  const { data: tokenBalance } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address) },
  });

  const { data: asset } = useReadContract({
    ...onPool,
    functionName: 'assets',
    args: [token.address],
    query: { enabled: !poolMissing },
  });
  const enabled = Boolean(asset?.[0]);

  const { data: price } = useReadContract({
    ...onPool,
    functionName: 'priceOf',
    args: [token.address],
    query: { enabled: !poolMissing && enabled, refetchInterval: 30_000 },
  });

  const preview = useReadContract({
    ...onPool,
    functionName: 'previewBorrow',
    args: [token.address, amountRaw, tierIndex],
    query: { enabled: !poolMissing && enabled && amountRaw > 0n, retry: false },
  });
  const terms = preview.data;
  const previewError = preview.error ? shortError(preview.error) : null;

  const { data: cash, refetch: refetchCash } = useReadContract({
    address: USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: pool ? [pool] : undefined,
    chainId: arc.id,
    query: { enabled: !poolMissing },
  });

  const { data: borrowed } = useReadContract({ ...onPool, functionName: 'borrowed', query: { enabled: !poolMissing } });

  const { data: myShares, refetch: refetchShares } = useReadContract({
    ...onPool,
    functionName: 'sharesOf',
    args: address ? [address] : undefined,
    query: { enabled: !poolMissing && Boolean(address) },
  });

  const { data: myValue } = useReadContract({
    ...onPool,
    functionName: 'previewRedeem',
    args: [myShares ?? 0n],
    query: { enabled: !poolMissing && Boolean(myShares && myShares > 0n) },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && pool ? [address, pool] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address && pool) },
  });

  const { data: usdcAllowance, refetch: refetchUsdcAllowance } = useReadContract({
    address: USDC,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && pool ? [address, pool] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address && pool) },
  });

  const { data: openIds, refetch: refetchOpen } = useReadContract({
    ...onPool,
    functionName: 'openLoanIds',
    query: { enabled: !poolMissing, refetchInterval: 30_000 },
  });

  const openLoans = useReadContracts({
    contracts: (openIds ?? []).flatMap((id) => [
      { address: pool!, abi: lendingPoolAbi, functionName: 'loans' as const, args: [id] as const, chainId: arc.id },
      { address: pool!, abi: lendingPoolAbi, functionName: 'health' as const, args: [id] as const, chainId: arc.id },
    ]),
    query: { enabled: !poolMissing && Boolean(openIds && openIds.length > 0), refetchInterval: 30_000 },
  });

  const rows = (openIds ?? []).flatMap((id, index) => {
    const loan = openLoans.data?.[index * 2]?.result as
      | readonly [`0x${string}`, `0x${string}`, bigint, bigint, bigint, boolean]
      | undefined;
    const health = openLoans.data?.[index * 2 + 1]?.result as
      | readonly [bigint, bigint, boolean, boolean, boolean]
      | undefined;
    if (!loan || !health) return [];
    const [borrower, collateral, collateralAmount, principal, due] = loan;
    const [value, , pastDue, underwater, liquidatable] = health;
    return [{ id, borrower, collateral, collateralAmount, principal, due, value, pastDue, underwater, liquidatable }];
  });
  const mine = rows.filter((row) => address && row.borrower.toLowerCase() === address.toLowerCase());
  const liquidatable = rows.filter((row) => row.liquidatable);

  async function ensureArc() {
    if (onArc) return;
    await switchChain({ chainId: arc.id });
  }

  async function confirmed(hash: `0x${string}`) {
    if (!client) throw new Error('Arc is not connected.');
    const receipt = await client.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('The transaction reverted on Arc.');
  }

  async function run(action: () => Promise<string | void>) {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      await ensureArc();
      const message = await action();
      if (message) setNote(message);
      await Promise.all([refetchOpen(), refetchCash(), refetchShares(), refetchAllowance(), refetchUsdcAllowance()]);
    } catch (cause) {
      setError(shortError(cause));
      await Promise.all([refetchAllowance(), refetchUsdcAllowance()]);
    } finally {
      setBusy(false);
    }
  }

  const needsTokenApproval = pool !== null && (allowance ?? 0n) < amountRaw;

  function borrowLabel() {
    if (poolMissing) return 'Pool not deployed';
    if (!enabled) return 'Token has no active market';
    if (needsTokenApproval) return `Approve ${token.symbol}`;
    return 'Borrow USDC';
  }

  return (
    <>
      <p className="lm-meta lm-balances">
            {isConnected ? (
              <>
                Your USDC on Arc: {usdc(usdcBalance)}. {token.symbol === 'USDC' ? token.name : token.symbol}:{' '}
                {tokenBalance === undefined ? '—' : Number(formatUnits(tokenBalance, token.decimals)).toLocaleString('en-US')}
                . Pool liquidity: {poolMissing ? 'pool not deployed' : usdc(cash)}
                {borrowed !== undefined ? ` · lent ${usdc(borrowed)}` : ''}.
              </>
            ) : (
              'Wallet not connected.'
            )}
          </p>
          <div aria-live="polite">
            {error ? <p className="lm-error">{error}</p> : null}
            {note ? <p className="lm-meta">{note}</p> : null}
          </div>

      {section === 'markets' ? (
      <section id="borrow" className="lm-panel">
        <div className="lm-panel-copy" data-tour="borrow">
          <h2>Borrow USDC</h2>
          <p>
            Your collateral stays in the pool until you repay the principal. You receive the principal
            minus the fee. If you miss the due date, or the token falls to half the value backing the
            debt, the pool sells it and you lose all of the collateral.
          </p>
          <TokenFields token={token} amount={amount} onSymbol={onSymbol} onAmount={onAmount} />
          <TierPicker tierId={tierId} onTier={onTier} />
          <div className="lm-actions">
            {!onArc && isConnected ? (
              <button type="button" className="lm-btn" disabled={switching} onClick={() => void ensureArc().catch((cause) => setError(shortError(cause)))}>
                Switch to Arc
              </button>
            ) : null}
            <button
              type="button"
              className="lm-btn"
              disabled={poolMissing || !enabled || amountRaw === 0n || !isConnected || isPending || busy || (!needsTokenApproval && !terms)}
              onClick={() =>
                void run(async () => {
                  if (!pool) return;
                  if ((allowance ?? 0n) < amountRaw) {
                    setNote(`Approve ${token.symbol}. The borrow follows in this same click.`);
                    await confirmed(
                      await writeContractAsync({
                        address: token.address,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [pool, amountRaw],
                        chainId: arc.id,
                      }),
                    );
                  }
                  await confirmed(
                    await writeContractAsync({
                      address: pool,
                      abi: lendingPoolAbi,
                      functionName: 'borrow',
                      args: [token.address, amountRaw, tierIndex],
                      chainId: arc.id,
                    }),
                  );
                  return 'Loan sent.';
                })
              }
            >
              {borrowLabel()}
            </button>
          </div>
          {previewError && enabled ? <p className="lm-error">{previewError}</p> : null}
        </div>
        <dl className="lm-quote" data-tour="quote">
          <div>
            <dt>You receive</dt>
            <dd>{terms ? `${usdc(terms[3])} USDC` : '—'}</dd>
          </div>
          <div>
            <dt>Fee</dt>
            <dd>{terms ? usdc(terms[2]) : '—'}</dd>
          </div>
          <div>
            <dt>You repay</dt>
            <dd>{terms ? `${usdc(terms[1])} in ${tier.days} days` : '—'}</dd>
          </div>
          <div>
            <dt>{token.symbol} price</dt>
            <dd>{price ? tokenPrice(price[0] < price[1] ? price[0] : price[1]) : enabled ? '—' : 'no market'}</dd>
          </div>
        </dl>
      </section>
      ) : null}

      {section === 'supply' ? (
      <section id="supply" className="lm-panel" data-tour="supply">
        <div className="lm-panel-copy">
          <h2>Supply USDC</h2>
          <p>
            Suppliers earn 80% of every fee and everything liquidations leave in the pool. If a sale
            does not cover the debt, suppliers absorb the difference. Withdrawals use the USDC that is
            not lent out.
          </p>
          <label className="lm-field">
            USDC to supply
            <input
              inputMode="decimal"
              value={supplyAmount}
              onChange={(event) => onSupplyAmount(event.target.value)}
            />
          </label>
          <p className="lm-meta">Your deposit is worth: {myShares && myShares > 0n ? `${usdc(myValue)} USDC` : '—'}.</p>
          <div className="lm-actions">
            <button
              type="button"
              className="lm-btn"
              disabled={poolMissing || supplyRaw === 0n || !isConnected || isPending || busy}
              onClick={() =>
                void run(async () => {
                  if (!pool) return;
                  if ((usdcAllowance ?? 0n) < supplyRaw) {
                    setNote('Approve USDC. The deposit follows in this same click.');
                    await confirmed(
                      await writeContractAsync({
                        address: USDC,
                        abi: erc20Abi,
                        functionName: 'approve',
                        args: [pool, supplyRaw],
                        chainId: arc.id,
                      }),
                    );
                  }
                  await confirmed(
                    await writeContractAsync({
                      address: pool,
                      abi: lendingPoolAbi,
                      functionName: 'supply',
                      args: [supplyRaw],
                      chainId: arc.id,
                    }),
                  );
                  return 'Deposit sent.';
                })
              }
            >
              {poolMissing ? 'Pool not deployed' : (usdcAllowance ?? 0n) < supplyRaw ? 'Approve USDC' : 'Supply'}
            </button>
            <button
              type="button"
              className="lm-btn lm-btn-secondary"
              disabled={poolMissing || !myShares || myShares === 0n || !isConnected || isPending || busy}
              onClick={() =>
                void run(async () => {
                  if (!pool || !myShares) return;
                  await writeContractAsync({
                    address: pool,
                    abi: lendingPoolAbi,
                    functionName: 'withdraw',
                    args: [myShares],
                    chainId: arc.id,
                  });
                  return 'Withdrawal sent.';
                })
              }
            >
              Withdraw all
            </button>
          </div>
        </div>
        <dl className="lm-quote">
          <div>
            <dt>USDC in the pool</dt>
            <dd>{poolMissing ? '—' : usdc(cash)}</dd>
          </div>
          <div>
            <dt>Open principal</dt>
            <dd>{poolMissing ? '—' : usdc(borrowed)}</dd>
          </div>
        </dl>
      </section>
      ) : null}

      {section === 'positions' ? (
      <div className="lm-positions" id="positions" data-tour="positions">
        <dl className="lm-stats">
          <div>
            <dt>Supplied</dt>
            <dd>
              {myShares && myShares > 0n && myValue === undefined ? '—' : usdc(myValue)}
            </dd>
          </div>
          <div>
            <dt>You owe</dt>
            <dd>{usdc(mine.reduce((sum, row) => sum + row.principal, 0n))}</dd>
          </div>
          <div>
            <dt>Collateral</dt>
            <dd>{usdc(mine.reduce((sum, row) => sum + row.value, 0n))}</dd>
          </div>
        </dl>
        <section className="lm-book-section">
          <h2>Supplied USDC</h2>
          <p>USDC you deposited in the shared pool.</p>
          {(myShares ?? 0n) === 0n ? (
            <p className="lm-meta">This wallet has not supplied USDC.</p>
          ) : null}
          {(myShares ?? 0n) > 0n ? (
            <article className="lm-loan">
              <div className="lm-loan-token">
                <img src="/media/usdc.svg" alt="" width={40} height={40} />
                <div>
                  <strong>USDC</strong>
                  <span>Shared pool</span>
                </div>
              </div>
              <dl>
                <div>
                  <dt>Supplied</dt>
                  <dd>{usdc(myValue)}</dd>
                </div>
              </dl>
              <div className="lm-loan-side">
                <button
                  type="button"
                  className="lm-btn lm-btn-secondary"
                  disabled={!pool || !myShares || isPending || busy}
                  onClick={() =>
                    void run(async () => {
                      if (!pool || !myShares) return;
                      await confirmed(
                        await writeContractAsync({
                          address: pool,
                          abi: lendingPoolAbi,
                          functionName: 'withdraw',
                          args: [myShares],
                          chainId: arc.id,
                        }),
                      );
                      return 'Withdrawal sent.';
                    })
                  }
                >
                  Withdraw
                </button>
              </div>
            </article>
          ) : null}
        </section>
        <section className="lm-book-section">
          <h2>Loans</h2>
        {mine.length === 0 ? (
          <section className="lm-loan">
            <div>
              <h2>No open borrows</h2>
              <p>When you borrow against a token, the loan shows up here with its due date.</p>
            </div>
          </section>
        ) : (
          mine.map((row) => {
            const bag = symbolOf(row.collateral);
            const status = row.pastDue ? 'Past due' : row.underwater ? 'At risk' : 'Healthy';
            return (
              <article className="lm-loan" key={row.id.toString()}>
                <div className="lm-loan-token">
                  {bag ? <img src={bag.logo} alt="" width={40} height={40} /> : null}
                  <div>
                    <strong>{bag?.symbol ?? 'Token'}</strong>
                    <span>Loan #{row.id.toString()}</span>
                  </div>
                </div>
                <dl>
                  <div>
                    <dt>Debt</dt>
                    <dd>{usdc(row.principal)}</dd>
                  </div>
                  <div>
                    <dt>Collateral</dt>
                    <dd>{usdc(row.value)}</dd>
                  </div>
                  <div>
                    <dt>Due</dt>
                    <dd>{row.pastDue ? 'Past due' : new Date(Number(row.due) * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</dd>
                  </div>
                </dl>
                <div className="lm-loan-side">
                  <span className={row.pastDue || row.underwater ? 'lm-pill' : 'lm-pill is-live'}>{status}</span>
                  <button
                    type="button"
                    className="lm-btn"
                    disabled={isPending || busy}
                    onClick={() =>
                      void run(async () => {
                        if (!pool) return;
                        if ((usdcAllowance ?? 0n) < row.principal) {
                          setNote('Approve USDC. The repayment follows in this same click.');
                          await confirmed(
                            await writeContractAsync({
                              address: USDC,
                              abi: erc20Abi,
                              functionName: 'approve',
                              args: [pool, row.principal],
                              chainId: arc.id,
                            }),
                          );
                        }
                        await confirmed(
                          await writeContractAsync({
                            address: pool,
                            abi: lendingPoolAbi,
                            functionName: 'repay',
                            args: [row.id],
                            chainId: arc.id,
                          }),
                        );
                        return 'Repayment sent. Your collateral returns to your wallet.';
                      })
                    }
                  >
                    Repay
                  </button>
                </div>
              </article>
            );
          })
        )}
        </section>
      </div>
      ) : null}

      {section === 'positions' ? (
      <div className="lm-loan-board" id="loans" data-tour="loans">
        <section className="lm-book-section">
          <h2>All loans</h2>
          <p>Every loan still open in the pool, from every wallet.</p>
          <LoanBook
            rows={
              poolMissing || openIds === undefined
                ? null
                : rows.map((row) => {
                    const bag = symbolOf(row.collateral);
                    return {
                      id: row.id,
                      borrower: row.borrower,
                      symbol: bag?.symbol ?? 'Token',
                      logo: bag?.logo,
                      principal: row.principal,
                      value: row.value,
                      due: row.due,
                      pastDue: row.pastDue,
                      underwater: row.underwater,
                    };
                  })
            }
            you={address}
          />
        </section>
      </div>
      ) : null}

      {section === 'positions' ? (
      <section id="liquidations" className="lm-panel lm-loans" data-tour="liquidations">
        <div>
          <h2>Liquidations</h2>
          <p>
            A keeper checks the pool every 15 seconds and liquidates whatever qualifies. Anyone can
            beat it from here and keep 1% of the sale.
          </p>
          {!poolMissing && liquidatable.length === 0 ? (
            <p className="lm-meta">
              {rows.length === 0 ? 'No open loans.' : `${rows.length} open loans, none to liquidate.`}
            </p>
          ) : null}
          <ul className="lm-bands">
            {liquidatable.map((row) => {
              const bag = symbolOf(row.collateral);
              return (
                <li key={row.id.toString()}>
                  <strong>
                    #{row.id.toString()} · {bag?.symbol ?? 'token'}
                  </strong>
                  <span>
                    Debt {usdc(row.principal)} · collateral {usdc(row.value)} · {row.pastDue ? 'past due' : 'below minimum'}
                  </span>
                  <button
                    type="button"
                    className="lm-btn lm-btn-secondary"
                    disabled={isPending || !isConnected}
                    onClick={() =>
                      void run(async () => {
                        if (!pool) return;
                        await writeContractAsync({
                          address: pool,
                          abi: lendingPoolAbi,
                          functionName: 'liquidate',
                          args: [row.id],
                          chainId: arc.id,
                        });
                        return `Liquidation of loan #${row.id.toString()} sent.`;
                      })
                    }
                  >
                    Liquidate
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
      ) : null}
    </>
  );
}
