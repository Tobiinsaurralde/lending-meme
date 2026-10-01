/**
 * Integer accounting for LendingPool. The Solidity contract uses these exact
 * divisions. Amounts are base units: USDC has 6 decimals, collateral uses the
 * token's own decimals.
 */

export const BPS = 10_000n;
export const PROTOCOL_FEE_BPS = 2_000n;

export interface BorrowTerms {
  value: bigint;
  principal: bigint;
  fee: bigint;
  received: bigint;
  protocolCut: bigint;
  lenderCut: bigint;
}

export function collateralValue(amount: bigint, priceUsdc: bigint, decimals: number): bigint {
  if (amount <= 0n || priceUsdc <= 0n) return 0n;
  return (amount * priceUsdc) / 10n ** BigInt(decimals);
}

export function borrowTerms(valueUsdc: bigint, ltvBps: number, feeBps: number): BorrowTerms {
  const principal = (valueUsdc * BigInt(ltvBps)) / BPS;
  const fee = (principal * BigInt(feeBps)) / BPS;
  const received = principal - fee;
  const protocolCut = (fee * PROTOCOL_FEE_BPS) / BPS;
  const lenderCut = fee - protocolCut;
  return { value: valueUsdc, principal, fee, received, protocolCut, lenderCut };
}

/** Shares minted for a USDC deposit. First deposit mints 1:1. */
export function sharesForSupply(amount: bigint, totalShares: bigint, totalAssets: bigint): bigint {
  if (amount <= 0n) return 0n;
  if (totalShares === 0n || totalAssets === 0n) return amount;
  return (amount * totalShares) / totalAssets;
}

export function assetsOut(shareAmount: bigint, totalShares: bigint, totalAssets: bigint): bigint {
  if (shareAmount <= 0n || totalShares <= 0n) return 0n;
  return (shareAmount * totalAssets) / totalShares;
}
