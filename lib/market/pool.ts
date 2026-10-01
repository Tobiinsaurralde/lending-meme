import { ARC_USDC } from '@/lib/market/arc';
import { lendingPoolArtifactAbi } from '@/lib/market/lendingPoolArtifact';

/**
 * Set after the pool is deployed. Empty means the market can quote and read
 * balances, and will not send a borrow or supply transaction.
 */
const rawPool = process.env.NEXT_PUBLIC_LENDING_POOL ?? '';

export const LENDING_POOL: `0x${string}` | null = /^0x[0-9a-fA-F]{40}$/.test(rawPool)
  ? (rawPool as `0x${string}`)
  : null;

export const USDC = ARC_USDC;

export const lendingPoolAbi = lendingPoolArtifactAbi;
