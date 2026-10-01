import { createPublicClient, createWalletClient, formatUnits, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arc, ARC_USDC } from '@/lib/market/arc';
import { isolatedMarketAbi, marketFactoryAbi } from '@/lib/market/isolatedArtifact';
import { LIVE_ISOLATED } from '@/lib/market/isolated';
import { LENDING_POOL, lendingPoolAbi } from '@/lib/market/pool';
import { ARC_TOKENS, TWAP_WINDOW_SECONDS, VENUE_V2 } from '@/lib/market/tokens';

const erc20BalanceAbi = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export interface KeeperStatus {
  pool: Hex | null;
  keeper: Hex | null;
  keeperUsdc: string | null;
  openLoans: number | null;
}

export interface KeeperRun extends KeeperStatus {
  poked: string[];
  liquidated: { loanId: string; hash: Hex }[];
  skipped: { loanId: string; reason: string }[];
}

function keeperAccount() {
  const key = process.env.KEEPER_PRIVATE_KEY?.trim();
  if (!key || !/^0x[0-9a-fA-F]{64}$/.test(key)) return null;
  return privateKeyToAccount(key as Hex);
}

const transport = () => http(process.env.ARC_RPC_URL || undefined);
const publicClient = () => createPublicClient({ chain: arc, transport: transport() });

export async function keeperStatus(): Promise<KeeperStatus> {
  const account = keeperAccount();
  const client = publicClient();
  const [balance, open] = await Promise.all([
    account
      ? client.readContract({ address: ARC_USDC, abi: erc20BalanceAbi, functionName: 'balanceOf', args: [account.address] })
      : null,
    LENDING_POOL
      ? client.readContract({ address: LENDING_POOL, abi: lendingPoolAbi, functionName: 'openLoanIds' }).catch(() => null)
      : null,
  ]);
  return {
    pool: LENDING_POOL,
    keeper: account?.address ?? null,
    keeperUsdc: balance === null ? null : formatUnits(balance, 6),
    openLoans: open === null ? null : open.length,
  };
}

function reason(error: unknown): string {
  if (error && typeof error === 'object' && 'shortMessage' in error && typeof error.shortMessage === 'string') {
    return error.shortMessage;
  }
  return error instanceof Error ? error.message : 'unknown';
}

/**
 * One keeper pass: keep each V2 price average recent, then liquidate every
 * loan the pool reports as liquidatable. Each liquidation is simulated first,
 * so a loan that would revert costs no gas.
 */
export async function runKeeper(): Promise<KeeperRun> {
  const account = keeperAccount();
  const status = await keeperStatus();
  const result: KeeperRun = { ...status, poked: [], liquidated: [], skipped: [] };
  if (!account || !LENDING_POOL) return result;

  const pool = LENDING_POOL;
  const client = publicClient();
  const wallet = createWalletClient({ account, chain: arc, transport: transport() });
  const now = Math.floor(Date.now() / 1000);

  for (const token of ARC_TOKENS) {
    if (token.venue !== VENUE_V2) continue;
    const last = await client.readContract({ address: pool, abi: lendingPoolAbi, functionName: 'lastPoke', args: [token.address] });
    if (last === 0 || now - last < TWAP_WINDOW_SECONDS) continue;
    try {
      const hash = await wallet.writeContract({ address: pool, abi: lendingPoolAbi, functionName: 'poke', args: [token.address] });
      await client.waitForTransactionReceipt({ hash });
      result.poked.push(token.symbol);
    } catch (error) {
      result.skipped.push({ loanId: `poke ${token.symbol}`, reason: reason(error) });
    }
  }

  const open = await client.readContract({ address: pool, abi: lendingPoolAbi, functionName: 'openLoanIds' });

  const health = await client.multicall({
    contracts: open.map((id) => ({ address: pool, abi: lendingPoolAbi, functionName: 'health' as const, args: [id] as const })),
    allowFailure: true,
  });

  for (const [index, id] of open.entries()) {
    const row = health[index];
    if (row.status !== 'success' || !row.result[4]) continue;
    try {
      const { request } = await client.simulateContract({
        account,
        address: pool,
        abi: lendingPoolAbi,
        functionName: 'liquidate',
        args: [id],
      });
      const hash = await wallet.writeContract(request);
      const receipt = await client.waitForTransactionReceipt({ hash });
      if (receipt.status === 'success') result.liquidated.push({ loanId: id.toString(), hash });
      else result.skipped.push({ loanId: id.toString(), reason: 'reverted' });
    } catch (error) {
      result.skipped.push({ loanId: id.toString(), reason: reason(error) });
    }
  }

  await liquidateIsolated(client, wallet, account.address, result);
  return result;
}

const quoteAbi = [
  { type: 'function', name: 'quote', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'uint256' }] },
] as const;
const approveAbi = [
  { type: 'function', name: 'approve', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
] as const;

async function liquidateIsolated(
  client: ReturnType<typeof publicClient>,
  wallet: ReturnType<typeof createWalletClient>,
  keeper: Hex,
  result: KeeperRun,
) {
  const factory = LIVE_ISOLATED.factory;
  let count = 0n;
  try {
    count = await client.readContract({ address: factory, abi: marketFactoryAbi, functionName: 'marketCount' });
  } catch (error) {
    result.skipped.push({ loanId: 'isolated', reason: reason(error) });
    return;
  }
  const fromBlock = 22_500_000n;
  for (let index = 0n; index < count; index++) {
    const market = await client.readContract({ address: factory, abi: marketFactoryAbi, functionName: 'markets', args: [index] });
    const logs = await client.getLogs({
      address: market,
      event: isolatedMarketAbi.find((item) => item.type === 'event' && item.name === 'Borrowed') as never,
      fromBlock,
      toBlock: 'latest',
    }).catch(() => []);
    const borrowers = [...new Set(logs.map((log) => (log as { args: { account: Hex } }).args.account))];
    for (const borrower of borrowers) {
      try {
        const [debt, collateralAmount, token, lltv] = await Promise.all([
          client.readContract({ address: market, abi: isolatedMarketAbi, functionName: 'debtOf', args: [borrower] }),
          client.readContract({ address: market, abi: isolatedMarketAbi, functionName: 'collateralOf', args: [borrower] }),
          client.readContract({ address: market, abi: isolatedMarketAbi, functionName: 'collateral' }),
          client.readContract({ address: market, abi: isolatedMarketAbi, functionName: 'lltvBps' }),
        ]);
        if (debt === 0n || collateralAmount === 0n) continue;
        const value = await client.readContract({
          address: LIVE_ISOLATED.quote,
          abi: quoteAbi,
          functionName: 'quote',
          args: [token, collateralAmount],
        });
        if (debt * 10_000n <= value * BigInt(lltv)) continue;
        const { request: approval } = await client.simulateContract({
          account: keeper,
          address: ARC_USDC,
          abi: approveAbi,
          functionName: 'approve',
          args: [market, debt],
        });
        await wallet.writeContract(approval);
        const { request } = await client.simulateContract({
          account: keeper,
          address: market,
          abi: isolatedMarketAbi,
          functionName: 'liquidate',
          args: [borrower, debt],
        });
        const hash = await wallet.writeContract(request);
        const receipt = await client.waitForTransactionReceipt({ hash });
        if (receipt.status === 'success') result.liquidated.push({ loanId: `${market}:${borrower}`, hash });
      } catch (error) {
        result.skipped.push({ loanId: `${market}:${borrower}`, reason: reason(error) });
      }
    }
  }
}
