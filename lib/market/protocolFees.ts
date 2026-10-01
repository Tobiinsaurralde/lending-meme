import { createPublicClient, http, parseAbi, parseAbiItem } from 'viem';
import { arc } from '@/lib/market/arc';
import { LIVE_ISOLATED } from '@/lib/market/isolated';
import { LENDING_POOL } from '@/lib/market/pool';
import { BPS, PROTOCOL_FEE_BPS } from '@/lib/market/poolMath';
import { ARC_TOKENS } from '@/lib/market/tokens';

/** Block where the live lending pool was deployed. */
const FROM_BLOCK = 22_526_254n;
const CHUNK = 10_000n;

const borrowedEvent = parseAbiItem(
  'event Borrowed(uint256 indexed loanId, address indexed borrower, address indexed collateral, uint256 collateralAmount, uint256 principal, uint256 received, uint64 due)',
);
const readAbi = parseAbi([
  'function marketOf(address) view returns (address)',
  'function reserve() view returns (uint256)',
]);

const client = createPublicClient({ chain: arc, transport: http() });

let fees = 0n;
let scannedThrough = FROM_BLOCK - 1n;
let inflight: Promise<{ fees: bigint; reserves: bigint }> | null = null;

function errorText(cause: unknown): string {
  if (!cause || typeof cause !== 'object') return String(cause ?? '');
  const record = cause as { message?: string; details?: string; shortMessage?: string; cause?: unknown };
  return `${record.shortMessage ?? ''} ${record.message ?? ''} ${record.details ?? ''} ${errorText(record.cause)}`;
}

async function logs(fromBlock: bigint, toBlock: bigint) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await client.getLogs({ address: LENDING_POOL!, event: borrowedEvent, fromBlock, toBlock });
    } catch (cause) {
      const message = errorText(cause);
      const retry = message.toLowerCase().includes('rate') || message.toLowerCase().includes('too large');
      if (!retry) throw cause;
      await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    }
  }
  throw new Error('Arc did not return the borrow log.');
}

async function sharedFees(): Promise<bigint> {
  if (!LENDING_POOL) return 0n;
  const latest = await client.getBlockNumber();
  let cursor = scannedThrough + 1n;
  while (cursor <= latest) {
    const toBlock = cursor + CHUNK - 1n > latest ? latest : cursor + CHUNK - 1n;
    const rows = await logs(cursor, toBlock);
    for (const row of rows) {
      const fee = (row.args.principal ?? 0n) - (row.args.received ?? 0n);
      if (fee > 0n) fees += (fee * PROTOCOL_FEE_BPS) / BPS;
    }
    scannedThrough = toBlock;
    cursor = toBlock + 1n;
  }
  return fees;
}

async function isolatedReserves(): Promise<bigint> {
  const found = await client.multicall({
    allowFailure: true,
    contracts: ARC_TOKENS.map((token) => ({
      address: LIVE_ISOLATED.factory,
      abi: readAbi,
      functionName: 'marketOf' as const,
      args: [token.address] as const,
    })),
  });
  const markets = found.flatMap((row) => {
    const market = row.result;
    if (!market || market === '0x0000000000000000000000000000000000000000') return [];
    return [market];
  });
  if (markets.length === 0) return 0n;
  const reserves = await client.multicall({
    allowFailure: true,
    contracts: markets.map((market) => ({
      address: market,
      abi: readAbi,
      functionName: 'reserve' as const,
    })),
  });
  return reserves.reduce((sum, row) => sum + (row.result ?? 0n), 0n);
}

/** USDC base units the protocol has earned. Shared-pool fees are already at the treasury. */
export function protocolEarnings(): Promise<{ fees: bigint; reserves: bigint }> {
  if (!inflight) {
    inflight = Promise.all([sharedFees(), isolatedReserves()])
      .then(([shared, reserves]) => ({ fees: shared, reserves }))
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}
