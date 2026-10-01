'use client';

import { useEffect, useMemo, useState } from 'react';
import { BaseError, ContractFunctionRevertedError, erc20Abi, formatUnits, parseUnits } from 'viem';
import { useAccount, usePublicClient, useReadContract, useReadContracts, useSwitchChain, useWriteContract } from 'wagmi';
import { poolClient } from '@/components/market/MarketsBoard';
import { arc } from '@/lib/market/arc';
import { useWalletSession } from '@/lib/studio/wallet-session';
import {
  MORPHO,
  MORPHO_MARKETS,
  maxBorrowAssets,
  morphoAbi,
  morphoParams,
  oracleAbi,
  sharesToAssets,
  type MorphoMarket,
} from '@/lib/market/morpho';

interface Rates {
  supplyApy: number;
  borrowApy: number;
}

const MORPHO_ERRORS: Record<string, string> = {
  InsufficientCollateral: 'That borrow sits above the liquidation limit for this collateral.',
  InsufficientLiquidity: 'The market does not have that much left to lend or withdraw.',
  ZeroAssets: 'Enter an amount.',
  ZeroShares: 'Enter an amount.',
};

function shortError(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk((entry) => entry instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && MORPHO_ERRORS[name]) return MORPHO_ERRORS[name];
    }
    return error.shortMessage;
  }
  if (error instanceof Error) return error.message;
  return 'The transaction failed.';
}

function parseAmount(value: string, decimals: number): bigint {
  try {
    if (!value || Number(value) <= 0) return 0n;
    return parseUnits(value, decimals);
  } catch {
    return 0n;
  }
}

function formatAmount(units: bigint, decimals: number): string {
  const amount = Number(formatUnits(units, decimals));
  if (!Number.isFinite(amount)) return '—';
  if (amount > 0 && amount < 0.01) return amount.toPrecision(2);
  return amount.toLocaleString('en-US', { maximumFractionDigits: amount >= 1000 ? 0 : 2 });
}

function formatApy(rate: number | undefined): string {
  if (rate === undefined || !Number.isFinite(rate)) return '—';
  return `${(rate * 100).toFixed(2)}%`;
}

function asBook(result: unknown) {
  const row = result as readonly bigint[] | undefined;
  if (!row || row[0] === undefined) return null;
  return {
    totalSupplyAssets: row[0],
    totalSupplyShares: row[1],
    totalBorrowAssets: row[2],
    totalBorrowShares: row[3],
  };
}

function asPosition(result: unknown) {
  const row = result as readonly bigint[] | undefined;
  if (!row || row[0] === undefined) return null;
  return { supplyShares: row[0], borrowShares: row[1], collateral: row[2] };
}

function MorphoConnected({ initialMode }: { initialMode: 'lend' | 'borrow' }) {
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();
  const client = usePublicClient({ chainId: arc.id });
  const [selectedId, setSelectedId] = useState(MORPHO_MARKETS[0].id);
  const [mode, setMode] = useState<'lend' | 'borrow'>(initialMode);
  const [lendAmount, setLendAmount] = useState('100');
  const [collateralAmount, setCollateralAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [exitAmount, setExitAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rates, setRates] = useState<Record<string, Rates>>({});

  const market = MORPHO_MARKETS.find((item) => item.id === selectedId) ?? MORPHO_MARKETS[0];
  const onArc = chainId === arc.id;
  const params = morphoParams(market);

  useEffect(() => {
    let live = true;
    const load = () =>
      fetch('/api/morpho')
        .then((response) => response.json())
        .then((body: { rates?: Record<string, Rates> }) => {
          if (live && body.rates) setRates(body.rates);
        })
        .catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  const books = useReadContracts({
    contracts: MORPHO_MARKETS.map((item) => ({
      address: MORPHO,
      abi: morphoAbi,
      functionName: 'market' as const,
      args: [item.id] as const,
      chainId: arc.id,
    })),
    query: { refetchInterval: 30_000 },
  });

  const position = useReadContract({
    address: MORPHO,
    abi: morphoAbi,
    functionName: 'position',
    args: address ? [market.id, address] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address), refetchInterval: 30_000 },
  });

  const price = useReadContract({
    address: market.oracle,
    abi: oracleAbi,
    functionName: 'price',
    chainId: arc.id,
    query: { refetchInterval: 30_000 },
  });

  const loanBalance = useReadContract({
    address: market.loan.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address) },
  });

  const collateralBalance = useReadContract({
    address: market.collateral.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address) },
  });

  const loanAllowance = useReadContract({
    address: market.loan.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, MORPHO] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address) },
  });

  const collateralAllowance = useReadContract({
    address: market.collateral.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, MORPHO] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address) },
  });

  const book = asBook(books.data?.[MORPHO_MARKETS.findIndex((item) => item.id === market.id)]?.result);
  const held = asPosition(position.data);
  const supplied = book && held ? sharesToAssets(held.supplyShares, book.totalSupplyAssets, book.totalSupplyShares) : 0n;
  const debt = book && held ? sharesToAssets(held.borrowShares, book.totalBorrowAssets, book.totalBorrowShares) : 0n;
  const collateral = held?.collateral ?? 0n;
  const available = book && book.totalSupplyAssets > book.totalBorrowAssets ? book.totalSupplyAssets - book.totalBorrowAssets : 0n;

  const lendRaw = useMemo(() => parseAmount(lendAmount, market.loan.decimals), [lendAmount, market.loan.decimals]);
  const collateralRaw = useMemo(
    () => parseAmount(collateralAmount, market.collateral.decimals),
    [collateralAmount, market.collateral.decimals],
  );
  const borrowRaw = useMemo(() => parseAmount(borrowAmount, market.loan.decimals), [borrowAmount, market.loan.decimals]);
  const exitRaw = useMemo(() => parseAmount(exitAmount, market.loan.decimals), [exitAmount, market.loan.decimals]);
  const exitCollateralRaw = useMemo(
    () => parseAmount(exitAmount, market.collateral.decimals),
    [exitAmount, market.collateral.decimals],
  );

  const capacity = price.data ? maxBorrowAssets(collateral + collateralRaw, price.data, market.lltv) : 0n;
  const room = capacity > debt ? capacity - debt : 0n;
  const lltv = Number(market.lltv / 10n ** 16n);
  const rate = rates[market.id.toLowerCase()];
  const needsCollateralApproval = collateralRaw > 0n && (collateralAllowance.data ?? 0n) < collateralRaw;

  async function refresh() {
    await Promise.all([
      books.refetch(),
      position.refetch(),
      loanBalance.refetch(),
      collateralBalance.refetch(),
      loanAllowance.refetch(),
      collateralAllowance.refetch(),
    ]);
  }

  async function ensureArc() {
    if (chainId === arc.id) return;
    await switchChainAsync({ chainId: arc.id });
  }

  async function confirmed(hash: `0x${string}`) {
    if (!client) throw new Error('Arc is not connected.');
    const receipt = await client.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('The transaction reverted on Arc.');
  }

  async function approve(token: `0x${string}`, amount: bigint) {
    await confirmed(
      await writeContractAsync({
        address: token,
        abi: erc20Abi,
        functionName: 'approve',
        args: [MORPHO, amount],
        chainId: arc.id,
      }),
    );
  }

  async function run(action: () => Promise<string>) {
    if (!address) return;
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      await ensureArc();
      setNote(await action());
      await refresh();
    } catch (cause) {
      setError(shortError(cause));
      await Promise.all([loanAllowance.refetch(), collateralAllowance.refetch()]);
    } finally {
      setBusy(false);
    }
  }

  function openMarket(next: MorphoMarket) {
    setSelectedId(next.id);
    setError(null);
    setNote(null);
    document.getElementById('morpho-trade')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const lendLabel = !isConnected
    ? `Lend ${market.loan.symbol}`
    : lendRaw > 0n && (loanAllowance.data ?? 0n) < lendRaw
      ? `Approve ${market.loan.symbol}`
      : `Lend ${market.loan.symbol}`;
  const borrowLabel = !isConnected
    ? `Borrow ${market.loan.symbol}`
    : needsCollateralApproval
      ? `Approve ${market.collateral.symbol}`
      : `Borrow ${market.loan.symbol}`;

  return (
    <>
    <section id="morpho" className="lm-panel lm-loans" data-tour="morpho">
      <div>
        <h2>Bitcoin, euros &amp; more</h2>
        <p>
          cirBTC, euros, sUSDai and PST. These are Morpho Blue markets: the rate floats with utilization and
          the loan has no due date. Memes stay on Markets.
        </p>
        <div className="lm-table" role="table" aria-label="Morpho markets on Arc">
          <div className="lm-row lm-row-head lm-row-morpho" role="row">
            <span role="columnheader">Market</span>
            <span role="columnheader">Lend at</span>
            <span role="columnheader">Borrow at</span>
            <span role="columnheader">Available</span>
            <span role="columnheader"> </span>
          </div>
          {MORPHO_MARKETS.map((item, index) => {
            const row = asBook(books.data?.[index]?.result);
            const idle = row && row.totalSupplyAssets > row.totalBorrowAssets ? row.totalSupplyAssets - row.totalBorrowAssets : 0n;
            const apy = rates[item.id.toLowerCase()];
            return (
              <div className={item.id === market.id ? 'lm-row lm-row-morpho is-selected' : 'lm-row lm-row-morpho'} role="row" key={item.id}>
                <span role="cell" className="lm-asset">
                  <span className="lm-marks">
                    <img src={item.collateral.logo} alt="" width={36} height={36} />
                    <img src={item.loan.logo} alt="" width={36} height={36} />
                  </span>
                  <span>
                    <strong>
                      {item.collateral.symbol} / {item.loan.symbol}
                    </strong>
                    <small>{item.collateral.name}</small>
                  </span>
                </span>
                <span role="cell" className="lm-num">
                  {formatApy(apy?.supplyApy)}
                </span>
                <span role="cell" className="lm-num">
                  {formatApy(apy?.borrowApy)}
                </span>
                <span role="cell" className="lm-num">
                  {row ? `${formatAmount(idle, item.loan.decimals)} ${item.loan.symbol}` : '—'}
                </span>
                <span role="cell">
                  <button type="button" className="lm-btn" onClick={() => openMarket(item)}>
                    Open
                  </button>
                </span>
              </div>
            );
          })}
        </div>

      </div>
    </section>
    <section id="morpho-trade" className="lm-panel">
      <div>
          <h2>
            {market.collateral.symbol} / {market.loan.symbol}
          </h2>
          <p>
            Lend {market.loan.symbol}, or lock {market.collateral.symbol} and borrow {market.loan.symbol} up to {lltv}% of
            the collateral. Liquidation is permissionless on Morpho once a loan crosses that line.
          </p>
          <div className="lm-mode" role="group" aria-label="Morpho action">
            <button type="button" className={mode === 'lend' ? 'lm-btn' : 'lm-btn lm-btn-secondary'} onClick={() => setMode('lend')}>
              Lend
            </button>
            <button type="button" className={mode === 'borrow' ? 'lm-btn' : 'lm-btn lm-btn-secondary'} onClick={() => setMode('borrow')}>
              Borrow
            </button>
          </div>
          {mode === 'lend' ? (
            <label className="lm-field">
              {market.loan.symbol} to lend
              <input inputMode="decimal" value={lendAmount} onChange={(event) => setLendAmount(event.target.value)} />
            </label>
          ) : (
            <>
              <label className="lm-field">
                {market.collateral.symbol} collateral
                <input inputMode="decimal" value={collateralAmount} onChange={(event) => setCollateralAmount(event.target.value)} />
              </label>
              <label className="lm-field">
                {market.loan.symbol} to borrow
                <input inputMode="decimal" value={borrowAmount} onChange={(event) => setBorrowAmount(event.target.value)} />
              </label>
            </>
          )}
          <div className="lm-actions">
            {isConnected && !onArc ? (
              <button type="button" className="lm-btn" disabled={switching} onClick={() => void ensureArc().catch((cause) => setError(shortError(cause)))}>
                Switch to Arc
              </button>
            ) : null}
            {mode === 'lend' ? (
              <button
                type="button"
                className="lm-btn"
                disabled={!isConnected || lendRaw === 0n || (book !== null && lendRaw > available) || isPending || busy}
                onClick={() =>
                  void run(async () => {
                    if (!address) return 'Connect a wallet.';
                    if ((loanAllowance.data ?? 0n) < lendRaw) {
                      setNote(`Approve ${market.loan.symbol}. The deposit follows in this same click.`);
                      await approve(market.loan.address, lendRaw);
                    }
                    await confirmed(
                      await writeContractAsync({
                        address: MORPHO,
                        abi: morphoAbi,
                        functionName: 'supply',
                        args: [params, lendRaw, 0n, address, '0x'],
                        chainId: arc.id,
                      }),
                    );
                    return `${market.loan.symbol} lent on Morpho.`;
                  })
                }
              >
                {lendLabel}
              </button>
            ) : (
              <button
                type="button"
                className="lm-btn"
                disabled={!isConnected || borrowRaw === 0n || price.data === undefined || borrowRaw > room || isPending || busy}
                onClick={() =>
                  void run(async () => {
                    if (!address) return 'Connect a wallet.';
                    if (collateralRaw > 0n && (collateralAllowance.data ?? 0n) < collateralRaw) {
                      setNote(`Approve ${market.collateral.symbol}. The borrow follows in this same click.`);
                      await approve(market.collateral.address, collateralRaw);
                    }
                    if (collateralRaw > 0n) {
                      await confirmed(
                        await writeContractAsync({
                          address: MORPHO,
                          abi: morphoAbi,
                          functionName: 'supplyCollateral',
                          args: [params, collateralRaw, address, '0x'],
                          chainId: arc.id,
                        }),
                      );
                    }
                    await confirmed(
                      await writeContractAsync({
                        address: MORPHO,
                        abi: morphoAbi,
                        functionName: 'borrow',
                        args: [params, borrowRaw, 0n, address, address],
                        chainId: arc.id,
                      }),
                    );
                    return `${market.loan.symbol} borrowed on Morpho.`;
                  })
                }
              >
                {borrowLabel}
              </button>
            )}
          </div>
          {isConnected && (supplied > 0n || debt > 0n || collateral > 0n) ? (
            <>
              <label className="lm-field">
                Amount to withdraw or repay
                <input inputMode="decimal" value={exitAmount} onChange={(event) => setExitAmount(event.target.value)} />
              </label>
              <div className="lm-actions">
                {supplied > 0n ? (
                  <button
                    type="button"
                    className="lm-btn lm-btn-secondary"
                    disabled={exitRaw === 0n || exitRaw > supplied || isPending || busy}
                    onClick={() =>
                      void run(async () => {
                        if (!address) return 'Connect a wallet.';
                        const byShares = exitRaw >= supplied;
                        await confirmed(
                          await writeContractAsync({
                            address: MORPHO,
                            abi: morphoAbi,
                            functionName: 'withdraw',
                            args: [params, byShares ? 0n : exitRaw, byShares ? held!.supplyShares : 0n, address, address],
                            chainId: arc.id,
                          }),
                        );
                        return `${market.loan.symbol} withdrawn.`;
                      })
                    }
                  >
                    Withdraw
                  </button>
                ) : null}
                {debt > 0n ? (
                  <button
                    type="button"
                    className="lm-btn lm-btn-secondary"
                    disabled={exitRaw === 0n || isPending || busy}
                    onClick={() =>
                      void run(async () => {
                        if (!address || !held) return 'Connect a wallet.';
                        const byShares = exitRaw >= debt;
                        const repayAssets = byShares ? 0n : exitRaw;
                        const approveAssets = byShares ? debt + debt / 1000n + 1n : repayAssets;
                        if ((loanAllowance.data ?? 0n) < approveAssets) {
                          setNote(`Approve ${market.loan.symbol}. The repayment follows in this same click.`);
                          await approve(market.loan.address, approveAssets);
                        }
                        await confirmed(
                          await writeContractAsync({
                            address: MORPHO,
                            abi: morphoAbi,
                            functionName: 'repay',
                            args: [params, repayAssets, byShares ? held.borrowShares : 0n, address, '0x'],
                            chainId: arc.id,
                          }),
                        );
                        return 'Debt repaid.';
                      })
                    }
                  >
                    Repay
                  </button>
                ) : null}
                {collateral > 0n ? (
                  <button
                    type="button"
                    className="lm-btn lm-btn-secondary"
                    disabled={exitCollateralRaw === 0n || exitCollateralRaw > collateral || isPending || busy}
                    onClick={() =>
                      void run(async () => {
                        if (!address) return 'Connect a wallet.';
                        await confirmed(
                          await writeContractAsync({
                            address: MORPHO,
                            abi: morphoAbi,
                            functionName: 'withdrawCollateral',
                            args: [params, exitCollateralRaw, address, address],
                            chainId: arc.id,
                          }),
                        );
                        return `${market.collateral.symbol} withdrawn.`;
                      })
                    }
                  >
                    Withdraw collateral
                  </button>
                ) : null}
              </div>
            </>
          ) : null}
          <div aria-live="polite">
            {error ? <p className="lm-error">{error}</p> : null}
            {note ? <p className="lm-meta">{note}</p> : null}
          </div>
      </div>
      <dl className="lm-quote">
        <div>
          <dt>Lend at</dt>
          <dd>{formatApy(rate?.supplyApy)}</dd>
        </div>
        <div>
          <dt>Borrow at</dt>
          <dd>{formatApy(rate?.borrowApy)}</dd>
        </div>
        <div>
          <dt>Available</dt>
          <dd>{book ? `${formatAmount(available, market.loan.decimals)} ${market.loan.symbol}` : '—'}</dd>
        </div>
        <div>
          <dt>Borrow up to</dt>
          <dd>{price.data ? `${formatAmount(room, market.loan.decimals)} ${market.loan.symbol}` : '—'}</dd>
        </div>
        <div>
          <dt>Your supply</dt>
          <dd>{isConnected ? `${formatAmount(supplied, market.loan.decimals)} ${market.loan.symbol}` : '—'}</dd>
        </div>
        <div>
          <dt>Your debt</dt>
          <dd>{isConnected ? `${formatAmount(debt, market.loan.decimals)} ${market.loan.symbol}` : '—'}</dd>
        </div>
        <div>
          <dt>Wallet</dt>
          <dd>
            {isConnected
              ? `${formatAmount(loanBalance.data ?? 0n, market.loan.decimals)} ${market.loan.symbol}`
              : 'Not connected'}
          </dd>
        </div>
        <div>
          <dt>Collateral held</dt>
          <dd>
            {isConnected
              ? `${formatAmount(collateralBalance.data ?? 0n, market.collateral.decimals)} ${market.collateral.symbol}`
              : '—'}
          </dd>
        </div>
      </dl>
    </section>
    </>
  );
}

function MorphoPublic({ initialMode }: { initialMode: 'lend' | 'borrow' }) {
  const { requestConnect } = useWalletSession();
  const [selectedId, setSelectedId] = useState(MORPHO_MARKETS[0].id);
  const [books, setBooks] = useState<(ReturnType<typeof asBook>)[]>([]);
  const [rates, setRates] = useState<Record<string, Rates>>({});
  const market = MORPHO_MARKETS.find((item) => item.id === selectedId) ?? MORPHO_MARKETS[0];
  const rate = rates[market.id.toLowerCase()];

  useEffect(() => {
    let live = true;
    const loadRates = () =>
      fetch('/api/morpho')
        .then((response) => response.json())
        .then((body: { rates?: Record<string, Rates> }) => {
          if (live && body.rates) setRates(body.rates);
        })
        .catch(() => undefined);
    const loadBooks = () =>
      poolClient
        .multicall({
          allowFailure: true,
          contracts: MORPHO_MARKETS.map((item) => ({
            address: MORPHO,
            abi: morphoAbi,
            functionName: 'market' as const,
            args: [item.id] as const,
          })),
        })
        .then((rows) => {
          if (live) setBooks(rows.map((row) => asBook(row.result)));
        })
        .catch(() => undefined);
    void loadRates();
    void loadBooks();
    const timer = window.setInterval(() => {
      void loadRates();
      void loadBooks();
    }, 30_000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <>
      <section id="morpho" className="lm-panel lm-loans" data-tour="morpho">
        <div>
          <h2>Bitcoin, euros &amp; more</h2>
          <p>
            cirBTC, euros, sUSDai and PST. These are Morpho Blue markets: the rate floats with utilization and
            the loan has no due date. Memes stay on Markets.
          </p>
          <div className="lm-table" role="table" aria-label="Morpho markets on Arc">
            <div className="lm-row lm-row-head lm-row-morpho" role="row">
              <span role="columnheader">Market</span>
              <span role="columnheader">Lend at</span>
              <span role="columnheader">Borrow at</span>
              <span role="columnheader">Available</span>
              <span role="columnheader"> </span>
            </div>
            {MORPHO_MARKETS.map((item, index) => {
              const row = books[index];
              const idle = row && row.totalSupplyAssets > row.totalBorrowAssets ? row.totalSupplyAssets - row.totalBorrowAssets : 0n;
              const apy = rates[item.id.toLowerCase()];
              return (
                <div className={item.id === market.id ? 'lm-row lm-row-morpho is-selected' : 'lm-row lm-row-morpho'} role="row" key={item.id}>
                  <span role="cell" className="lm-asset">
                    <span className="lm-marks">
                      <img src={item.collateral.logo} alt="" width={36} height={36} />
                      <img src={item.loan.logo} alt="" width={36} height={36} />
                    </span>
                    <span>
                      <strong>
                        {item.collateral.symbol} / {item.loan.symbol}
                      </strong>
                      <small>{item.collateral.name}</small>
                    </span>
                  </span>
                  <span role="cell" className="lm-num">{formatApy(apy?.supplyApy)}</span>
                  <span role="cell" className="lm-num">{formatApy(apy?.borrowApy)}</span>
                  <span role="cell" className="lm-num">{row ? `${formatAmount(idle, item.loan.decimals)} ${item.loan.symbol}` : '—'}</span>
                  <span role="cell">
                    <button type="button" className="lm-btn" onClick={() => setSelectedId(item.id)}>
                      Open
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section id="morpho-trade" className="lm-panel">
        <div>
          <h2>
            {market.collateral.symbol} / {market.loan.symbol}
          </h2>
          <p>
            Connect a wallet on Arc to lend {market.loan.symbol}, or to lock {market.collateral.symbol} and borrow it.
          </p>
          <div className="lm-actions">
            <button type="button" className="lm-btn" onClick={() => requestConnect()}>
              {initialMode === 'borrow' ? 'Connect to borrow' : 'Connect to lend'}
            </button>
          </div>
        </div>
        <dl className="lm-quote">
          <div>
            <dt>Lend at</dt>
            <dd>{formatApy(rate?.supplyApy)}</dd>
          </div>
          <div>
            <dt>Borrow at</dt>
            <dd>{formatApy(rate?.borrowApy)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

/** Public book until the wallet runtime is mounted. Writes need that runtime. */
export function MorphoDesk({ initialMode = 'lend' }: { initialMode?: 'lend' | 'borrow' }) {
  const { activated } = useWalletSession();
  return activated ? <MorphoConnected initialMode={initialMode} /> : <MorphoPublic initialMode={initialMode} />;
}

