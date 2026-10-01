'use client';

import { useEffect, useState } from 'react';
import { createPublicClient, formatUnits, http, parseAbi } from 'viem';
import { arc } from '@/lib/market/arc';
import { LENDING_POOL, USDC, lendingPoolAbi } from '@/lib/market/pool';
import { TIERS } from '@/lib/market/quote';
import { ARC_TOKENS } from '@/lib/market/tokens';

interface Board {
  liquidationLtvBps: number;
  prices: (bigint | null)[];
  /** Spot prices for tokens the lending pool cannot quote. Not borrowable. */
  display: Record<string, bigint>;
}

export const poolClient = createPublicClient({ chain: arc, transport: http() });
const client = poolClient;

async function readBoard(pool: `0x${string}`): Promise<Board> {
  const [stats, prices, display] = await Promise.all([
    client.multicall({
      contracts: [{ address: pool, abi: lendingPoolAbi, functionName: 'LIQUIDATION_LTV_BPS' }],
    }),
    client
      .multicall({
        allowFailure: true,
        contracts: ARC_TOKENS.map((token) => ({
          address: pool,
          abi: lendingPoolAbi,
          functionName: 'priceOf' as const,
          args: [token.address] as const,
        })),
      })
      .catch(() => []),
    v4Spots().catch(() => ({})),
  ]);
  const [liquidation] = stats;
  return {
    liquidationLtvBps: Number(liquidation.result ?? 5000n),
    prices: prices.map((entry) => {
      const pair = entry.result as readonly [bigint, bigint] | undefined;
      if (!pair) return null;
      return pair[0] < pair[1] ? pair[0] : pair[1];
    }),
    display,
  };
}

const STATE_VIEW = '0xF3334192D15450CdD385c8B70e03f9A6bD9E673b' as const;
const slotAbi = parseAbi([
  'function getSlot0(bytes32 poolId) view returns (uint160 sqrtPriceX96, int24 tick, uint24 protocolFee, uint24 lpFee)',
]);

/** USDC per whole token, 6 decimals. The v4 price is the current tick, not an average. */
async function v4Spots(): Promise<Record<string, bigint>> {
  const display: Record<string, bigint> = {};
  const q192 = 2n ** 192n;
  await Promise.all(
    ARC_TOKENS.filter((token) => token.v4PoolId).map(async (token) => {
      const slot = await client.readContract({
        address: STATE_VIEW,
        abi: slotAbi,
        functionName: 'getSlot0',
        args: [token.v4PoolId!],
      });
      const sqrt = slot[0];
      const squared = sqrt * sqrt;
      const scale = 10n ** BigInt(token.decimals);
      const tokenIsCurrency0 = token.address.toLowerCase() < USDC.toLowerCase();
      display[token.symbol] = tokenIsCurrency0 ? (squared * scale) / q192 : (scale * q192) / squared;
    }),
  );
  return display;
}

export function MarketsBoard({
  selected,
  onBorrow,
}: {
  selected: string;
  onBorrow: (symbol: string) => void;
}) {
  const [board, setBoard] = useState<Board | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!LENDING_POOL) return;
    const pool = LENDING_POOL;
    let live = true;
    const load = () =>
      readBoard(pool)
        .then((next) => {
          if (!live) return;
          setBoard(next);
          setFailed(false);
        })
        .catch(() => live && setFailed(true));
    void load();
    const timer = window.setInterval(load, 30_000);
    return () => {
      live = false;
      window.clearInterval(timer);
    };
  }, []);

  const bestLtv = Math.max(...TIERS.map((tier) => tier.ltvBps)) / 100;

  return (
    <>
      <section id="markets" className="lm-panel lm-loans" data-tour="markets">
        <div>
          <h2>Markets</h2>
          <p>
            Every collateral is priced from its own pool on Arc and sold there on liquidation.
            {failed ? ' Live prices are unavailable right now.' : ''}
          </p>
          <div className="lm-table" role="table" aria-label="Collateral markets">
            <div className="lm-row lm-row-head" role="row">
              <span role="columnheader">Collateral</span>
              <span role="columnheader">Price</span>
              <span role="columnheader">Borrow up to</span>
              <span role="columnheader">Liquidates at</span>
              <span role="columnheader"> </span>
            </div>
            {ARC_TOKENS.map((token, index) => {
              const price = board?.prices[index] ?? board?.display[token.symbol];
              const live = Boolean(board?.prices[index]);
              return (
                <div className={token.symbol === selected ? 'lm-row is-selected' : 'lm-row'} role="row" key={token.symbol} data-tour={token.symbol === 'BAGFI' ? 'bagfi' : undefined}>
                  <span role="cell" className="lm-asset">
                    <img src={token.logo} alt="" width={32} height={32} />
                    <span>
                      <strong>{token.symbol}</strong>
                      <small>{token.symbol === 'USDC' ? token.name : token.marketName}</small>
                    </span>
                  </span>
                  <span role="cell" className="lm-num">
                    {price ? `${Number(formatUnits(price, 6)).toPrecision(3)} USDC` : '—'}
                  </span>
                  <span role="cell">{bestLtv}%</span>
                  <span role="cell">{board ? `${board.liquidationLtvBps / 100}%` : '—'}</span>
                  <span role="cell">
                    <button type="button" className="lm-btn" disabled={!live} onClick={() => onBorrow(token.symbol)}>
                      Borrow
                    </button>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
