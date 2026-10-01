'use client';

import { useEffect, useState } from 'react';
import { erc20Abi, formatUnits, isAddress, parseUnits } from 'viem';
import { useAccount, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { WalletChip } from '@/components/studio/wallet/WalletChip';
import { arc } from '@/lib/market/arc';
import { flashHelperAbi, isolatedMarketAbi, leverageRouterAbi, marketFactoryAbi, poolBuyerAbi } from '@/lib/market/isolatedArtifact';
import { EXTRAS_KEY, ISOLATED_KEY, LIVE_ISOLATED, type ExtrasDeployment, type IsolatedDeployment } from '@/lib/market/isolated';
import { USDC } from '@/lib/market/pool';
import { formatUsd } from '@/lib/market/quote';
import { BrandMark, MarketNav } from '@/components/market/MarketChrome';
import { Onboarding } from '@/components/market/Onboarding';
import { TokenSelect } from '@/components/market/TokenSelect';
import { ARC_TOKENS } from '@/lib/market/tokens';
import { useWalletSession } from '@/lib/studio/wallet-session';

type Hex = `0x${string}`;

const OWNER = '0xA4d36d0D15E0B36544Ad536DcA518e1Ff0Df0d96';

function money(units: bigint | undefined): string {
  if (units === undefined) return '—';
  return formatUsd(Number(formatUnits(units, 6)));
}

export function IsolatedDesk({ embedded = false }: { embedded?: boolean }) {
  const { activated, requestConnect } = useWalletSession();
  const [deployment, setDeployment] = useState<IsolatedDeployment | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(ISOLATED_KEY);
    if (!raw) {
      setDeployment(LIVE_ISOLATED);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as IsolatedDeployment;
      setDeployment(isAddress(parsed.factory) && isAddress(parsed.quote) ? parsed : LIVE_ISOLATED);
    } catch {
      setDeployment(LIVE_ISOLATED);
    }
  }, []);

  const body = (
    <>
      <div id="isolated">
        {embedded ? null : <p className="lm-kicker">Isolated markets · Arc · chain {arc.id}</p>}
        {embedded ? <h2>One pool of USDC per token.</h2> : <h1>One pool of USDC per token.</h1>}
        <p className="lm-lead">
          Each collateral has its own liquidity. The borrow rate rises as more of that pool is lent. The
          contract is unaudited. Start with small amounts.
        </p>
      </div>
      {!deployment ? (
        <section className="lm-panel" data-tour="isolated">
          <div className="lm-panel-copy">
            <h2>Loading markets</h2>
            <p>The isolated markets are on Arc. This page is reading them.</p>
          </div>
        </section>
      ) : activated ? (
        <IsolatedLive deployment={deployment} />
      ) : (
        <section className="lm-panel" data-tour="isolated">
          <div className="lm-panel-copy">
            <h2>Connect</h2>
            <div className="lm-actions">
              <button type="button" className="lm-btn" onClick={requestConnect}>
                Connect wallet
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );

  if (embedded) return body;

  return (
    <div className="cl-studio lm-market">
      <header className="lm-bar">
        <BrandMark />
        <MarketNav current="markets" />
        <span data-tour="wallet">
          <WalletChip />
        </span>
      </header>
      <Onboarding />
      <main className="lm-main">{body}</main>
    </div>
  );
}

function IsolatedLive({ deployment }: { deployment: IsolatedDeployment }) {
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const client = usePublicClient({ chainId: arc.id });
  const [symbol, setSymbol] = useState(ARC_TOKENS[0].symbol);
  const [amount, setAmount] = useState('1');
  const [borrower, setBorrower] = useState('');
  const [extras, setExtras] = useState<ExtrasDeployment | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [markets, setMarkets] = useState<Record<string, Hex>>({});

  const token = ARC_TOKENS.find((item) => item.symbol === symbol) ?? ARC_TOKENS[0];
  const market = markets[token.symbol];

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const next: Record<string, Hex> = {};
      for (const item of ARC_TOKENS) {
        const found = (await client?.readContract({
          address: deployment.factory,
          abi: marketFactoryAbi,
          functionName: 'marketOf',
          args: [item.address],
        })) as Hex | undefined;
        if (found && found !== '0x0000000000000000000000000000000000000000') next[item.symbol] = found;
      }
      if (!cancelled) setMarkets(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [client, deployment.factory]);

  useEffect(() => {
    const raw = window.localStorage.getItem(EXTRAS_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ExtrasDeployment;
      if (isAddress(parsed.flash) && isAddress(parsed.buyer)) setExtras(parsed);
    } catch {
      setExtras(null);
    }
  }, []);

  const onMarket = {
    address: market,
    abi: isolatedMarketAbi,
    chainId: arc.id,
    query: { enabled: Boolean(market) },
  } as const;
  const cash = useReadContract({ ...onMarket, functionName: 'cash' });
  const rate = useReadContract({ ...onMarket, functionName: 'borrowRateBps' });
  const debt = useReadContract({ ...onMarket, functionName: 'debtOf', args: [address ?? '0x0000000000000000000000000000000000000000'] });
  const shares = useReadContract({ ...onMarket, functionName: 'sharesOf', args: [address ?? '0x0000000000000000000000000000000000000000'] });
  const redeem = useReadContract({ ...onMarket, functionName: 'previewRedeem', args: [shares.data ?? 0n] });

  async function run(id: string, body: () => Promise<string>) {
    setBusy(id);
    setError(null);
    setNote(null);
    try {
      if (chainId !== arc.id) await switchChainAsync({ chainId: arc.id });
      setNote(await body());
      await Promise.all([cash.refetch(), rate.refetch(), debt.refetch(), shares.refetch()]);
    } catch (cause) {
      const message = cause && typeof cause === 'object' && 'shortMessage' in cause ? String(cause.shortMessage) : 'The transaction was not sent.';
      setError(message);
    } finally {
      setBusy(null);
    }
  }

  async function confirm(hash: Hex) {
    const receipt = await client!.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('The transaction reverted on Arc.');
  }

  const parsed = Number(amount);
  const usdcRaw = Number.isFinite(parsed) && parsed > 0 ? parseUnits(amount, 6) : 0n;
  const tokenRaw = Number.isFinite(parsed) && parsed > 0 ? parseUnits(amount, token.decimals) : 0n;
  const canSend = isConnected && busy === null && Boolean(market);

  return (
    <section className="lm-panel lm-iso" data-tour="isolated">
      <div className="lm-panel-copy">
        <h2>{token.symbol}</h2>
        <p>
          {market
            ? `This pool only lends against ${token.symbol === 'USDC' ? token.name : token.symbol}.`
            : `No isolated market for ${token.symbol === 'USDC' ? token.name : token.symbol} yet. The other tokens keep their own pools.`}
        </p>
        {market ? <p className="lm-meta">Market {`${market.slice(0, 6)}…${market.slice(-4)}`}</p> : null}
        {!market && address?.toLowerCase() === OWNER.toLowerCase() ? (
          <div className="lm-actions">
            <button
              type="button"
              className="lm-btn"
              disabled={!isConnected || busy !== null}
              onClick={() =>
                void run('create', async () => {
                  await confirm(
                    await writeContractAsync({
                      address: deployment.factory,
                      abi: marketFactoryAbi,
                      functionName: 'create',
                      args: [token.address, deployment.quote, address!, 3000, 5000, 500, 8000, 1000, 4000, 2000],
                      chainId: arc.id,
                    }),
                  );
                  const created = (await client!.readContract({
                    address: deployment.factory,
                    abi: marketFactoryAbi,
                    functionName: 'marketOf',
                    args: [token.address],
                  })) as Hex;
                  setMarkets((current) => ({ ...current, [token.symbol]: created }));
                  return `${token.symbol} market created. It starts empty, so a borrow needs a USDC deposit first.`;
                })
              }
            >
              {busy === 'create' ? 'Creating…' : `Create ${token.symbol} market`}
            </button>
          </div>
        ) : null}
        {!market && address && address.toLowerCase() !== OWNER.toLowerCase() ? (
          <p className="lm-meta">Connect the owner wallet to create this market.</p>
        ) : null}
        {error ? <p className="lm-error">{error}</p> : null}
        {note ? <p className="lm-meta">{note}</p> : null}
        <label className="lm-field">
          Collateral
          <TokenSelect value={symbol} onChange={setSymbol} />
        </label>
        <label className="lm-field">
          Amount
          <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="decimal" />
        </label>
        <div className="lm-actions">
          <button
            type="button"
            className="lm-btn"
            disabled={!canSend || usdcRaw === 0n}
            onClick={() =>
              void run('supply', async () => {
                const allowance = (await client!.readContract({
                  address: USDC,
                  abi: erc20Abi,
                  functionName: 'allowance',
                  args: [address!, market!],
                })) as bigint;
                if (allowance < usdcRaw) {
                  await confirm(await writeContractAsync({ address: USDC, abi: erc20Abi, functionName: 'approve', args: [market!, usdcRaw], chainId: arc.id }));
                }
                await confirm(await writeContractAsync({ address: market!, abi: isolatedMarketAbi, functionName: 'supply', args: [usdcRaw], chainId: arc.id }));
                return `Supplied ${amount} USDC to ${token.symbol}.`;
              })
            }
          >
            {busy === 'supply' ? 'Supplying…' : 'Supply USDC'}
          </button>
          <button
            type="button"
            className="lm-btn lm-btn-secondary"
            disabled={!canSend || !shares.data || shares.data === 0n}
            onClick={() =>
              void run('withdraw', async () => {
                await confirm(
                  await writeContractAsync({
                    address: market!,
                    abi: isolatedMarketAbi,
                    functionName: 'withdraw',
                    args: [shares.data!],
                    chainId: arc.id,
                  }),
                );
                return 'Withdrew your supply.';
              })
            }
          >
            {busy === 'withdraw' ? 'Withdrawing…' : 'Withdraw'}
          </button>
        </div>
        <div className="lm-actions">
          <button
            type="button"
            className="lm-btn"
            disabled={!canSend || tokenRaw === 0n}
            onClick={() =>
              void run('borrow', async () => {
                const allowance = (await client!.readContract({
                  address: token.address,
                  abi: erc20Abi,
                  functionName: 'allowance',
                  args: [address!, market!],
                })) as bigint;
                if (allowance < tokenRaw) {
                  await confirm(
                    await writeContractAsync({
                      address: token.address,
                      abi: erc20Abi,
                      functionName: 'approve',
                      args: [market!, tokenRaw],
                      chainId: arc.id,
                    }),
                  );
                }
                await confirm(
                  await writeContractAsync({
                    address: market!,
                    abi: isolatedMarketAbi,
                    functionName: 'borrow',
                    args: [tokenRaw],
                    chainId: arc.id,
                  }),
                );
                return `Borrowed against ${amount} ${token.symbol}.`;
              })
            }
          >
            {busy === 'borrow' ? 'Borrowing…' : 'Borrow'}
          </button>
          <button
            type="button"
            className="lm-btn lm-btn-secondary"
            disabled={!canSend || !debt.data || debt.data === 0n}
            onClick={() =>
              void run('repay', async () => {
                const allowance = (await client!.readContract({
                  address: USDC,
                  abi: erc20Abi,
                  functionName: 'allowance',
                  args: [address!, market!],
                })) as bigint;
                if (allowance < debt.data!) {
                  await confirm(
                    await writeContractAsync({
                      address: USDC,
                      abi: erc20Abi,
                      functionName: 'approve',
                      args: [market!, debt.data!],
                      chainId: arc.id,
                    }),
                  );
                }
                await confirm(
                  await writeContractAsync({
                    address: market!,
                    abi: isolatedMarketAbi,
                    functionName: 'repay',
                    args: [debt.data!],
                    chainId: arc.id,
                  }),
                );
                return 'Repaid. Your collateral is back in your wallet if the debt is cleared.';
              })
            }
          >
            {busy === 'repay' ? 'Repaying…' : 'Repay'}
          </button>
        </div>
      </div>
      <dl className="lm-iso-stats">
        <div>
          <dt>Pool USDC</dt>
          <dd>{money(cash.data)}</dd>
        </div>
        <div>
          <dt>Borrow APR</dt>
          <dd>{rate.data === undefined ? '—' : `${(Number(rate.data) / 100).toFixed(2)}%`}</dd>
        </div>
        <div>
          <dt>Your debt</dt>
          <dd>{money(debt.data)}</dd>
        </div>
        <div>
          <dt>Your deposit</dt>
          <dd>{money(redeem.data)}</dd>
        </div>
      </dl>
      <div className="lm-iso-more">
        <label className="lm-field">
          Liquidate borrower
          <input value={borrower} onChange={(event) => setBorrower(event.target.value.trim())} placeholder="0x…" spellCheck={false} />
        </label>
        <div className="lm-actions">
          <button
            type="button"
            className="lm-btn lm-btn-secondary"
            disabled={!canSend || !isAddress(borrower)}
            onClick={() =>
              void run('liquidate', async () => {
                const target = borrower as Hex;
                const debt = (await client!.readContract({
                  address: market!,
                  abi: isolatedMarketAbi,
                  functionName: 'debtOf',
                  args: [target],
                })) as bigint;
                if (debt === 0n) throw new Error('That address has no debt in this market.');
                const allowance = (await client!.readContract({
                  address: USDC,
                  abi: erc20Abi,
                  functionName: 'allowance',
                  args: [address!, market!],
                })) as bigint;
                if (allowance < debt) {
                  await confirm(
                    await writeContractAsync({
                      address: USDC,
                      abi: erc20Abi,
                      functionName: 'approve',
                      args: [market!, debt],
                      chainId: arc.id,
                    }),
                  );
                }
                await confirm(
                  await writeContractAsync({
                    address: market!,
                    abi: isolatedMarketAbi,
                    functionName: 'liquidate',
                    args: [target, debt],
                    chainId: arc.id,
                  }),
                );
                return 'Liquidated. You paid the debt and received the collateral.';
              })
            }
          >
            {busy === 'liquidate' ? 'Liquidating…' : 'Liquidate'}
          </button>
        </div>
        <div className="lm-actions">
          <button
            type="button"
            className="lm-btn"
            disabled={!canSend || !extras || usdcRaw === 0n}
            onClick={() =>
              void run('flash', async () => {
                await confirm(
                  await writeContractAsync({
                    address: extras!.flash,
                    abi: flashHelperAbi,
                    functionName: 'go',
                    args: [market!, usdcRaw],
                    chainId: arc.id,
                  }),
                );
                return `Flash loan of ${amount} USDC was borrowed and repaid in the same transaction.`;
              })
            }
          >
            {busy === 'flash' ? 'Flashing…' : 'Flash loan'}
          </button>
          <button
            type="button"
            className="lm-btn"
            disabled={!canSend || !extras || tokenRaw === 0n || token.symbol !== 'COOL'}
            onClick={() =>
              void run('leverage', async () => {
                const allowance = (await client!.readContract({
                  address: token.address,
                  abi: erc20Abi,
                  functionName: 'allowance',
                  args: [address!, deployment.router],
                })) as bigint;
                if (allowance < tokenRaw) {
                  await confirm(
                    await writeContractAsync({
                      address: token.address,
                      abi: erc20Abi,
                      functionName: 'approve',
                      args: [deployment.router, tokenRaw],
                      chainId: arc.id,
                    }),
                  );
                }
                const markedToken0 = (await client!.readContract({
                  address: extras!.buyer,
                  abi: poolBuyerAbi,
                  functionName: 'tokenIsToken0',
                  args: [token.address],
                })) as boolean;
                const poolToken0 = (await client!.readContract({
                  address: token.market,
                  abi: [{ type: 'function', name: 'token0', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] }] as const,
                  functionName: 'token0',
                })) as Hex;
                const isToken0 = poolToken0.toLowerCase() === token.address.toLowerCase();
                if (markedToken0 !== isToken0) {
                  await confirm(
                    await writeContractAsync({
                      address: extras!.buyer,
                      abi: poolBuyerAbi,
                      functionName: 'setPool',
                      args: [token.address, token.market, isToken0],
                      chainId: arc.id,
                    }),
                  );
                }
                await confirm(
                  await writeContractAsync({
                    address: deployment.router,
                    abi: leverageRouterAbi,
                    functionName: 'open',
                    args: [market!, tokenRaw, extras!.buyer],
                    chainId: arc.id,
                  }),
                );
                return 'Leverage loop opened. The router holds the COOL and the debt.';
              })
            }
          >
            {busy === 'leverage' ? 'Opening…' : 'Leverage'}
          </button>
        </div>
        <p className="lm-meta">
          {extras
            ? 'Flash borrows USDC and repays it immediately. Leverage locks COOL, borrows, buys more COOL, and borrows again. Liquidate only succeeds when the debt is more than half the collateral.'
            : 'Flash loan and leverage need the helper contracts. Deploy them from the admin page, then reload this one.'}
        </p>
      </div>
    </section>
  );
}
