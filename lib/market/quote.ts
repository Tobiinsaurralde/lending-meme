export type TierId = 'express' | 'quick' | 'standard';

export interface Tier {
  id: TierId;
  name: string;
  /** Basis points. 3000 = 30%. Matches LendingPool.tiers. */
  ltvBps: number;
  /** Basis points of principal. 300 = 3%. */
  feeBps: number;
  days: number;
  note: string;
}

export const TIERS: Tier[] = [
  { id: 'express', name: 'Express', ltvBps: 3_000, feeBps: 300, days: 2, note: 'More USDC, less time' },
  { id: 'quick', name: 'Quick', ltvBps: 2_500, feeBps: 200, days: 3, note: 'The middle ground' },
  { id: 'standard', name: 'Standard', ltvBps: 2_000, feeBps: 150, days: 7, note: 'Lowest fee, most room' },
];

export interface Quote {
  collateralUsd: number;
  principal: number;
  feeUsd: number;
  received: number;
  repay: number;
}

export function quoteLoan(collateralUsd: number, tier: Tier): Quote {
  const principal = collateralUsd * (tier.ltvBps / 10_000);
  const feeUsd = principal * (tier.feeBps / 10_000);
  return {
    collateralUsd,
    principal,
    feeUsd,
    received: principal - feeUsd,
    repay: principal,
  };
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value > 0 && value < 0.01) {
    const digits = Math.min(8, Math.ceil(-Math.log10(value)) + 1);
    return `$${value.toFixed(digits)}`;
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  });
}
