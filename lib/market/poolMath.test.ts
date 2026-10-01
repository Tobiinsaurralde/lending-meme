import assert from 'node:assert/strict';
import { assetsOut, borrowTerms, collateralValue, sharesForSupply } from './poolMath.ts';

// 1,000 tokens at 2 USDC each. Quick is 25% LTV and a 2% fee.
const value = collateralValue(1_000n * 10n ** 18n, 2_000_000n, 18);
assert.equal(value, 2_000_000_000n);

const terms = borrowTerms(value, 2_500, 200);
assert.equal(terms.principal, 500_000_000n);
assert.equal(terms.fee, 10_000_000n);
assert.equal(terms.received, 490_000_000n);
assert.equal(terms.protocolCut, 2_000_000n);
assert.equal(terms.lenderCut, 8_000_000n);

// Supply 1,000 USDC, then the borrow leaves suppliers ahead by the 8 USDC lender fee.
const supplied = 1_000_000_000n;
const shares = sharesForSupply(supplied, 0n, 0n);
assert.equal(shares, supplied);
const cashAfterBorrow = supplied - terms.received - terms.protocolCut;
const borrowed = terms.principal;
const totalAssets = cashAfterBorrow + borrowed;
assert.equal(totalAssets, supplied + terms.lenderCut);

// The cash left cannot cover every share. Half of the shares can leave.
const half = assetsOut(shares / 2n, shares, totalAssets);
assert.equal(half <= cashAfterBorrow, true);
assert.equal(assetsOut(shares, shares, totalAssets) > cashAfterBorrow, true);

console.log('poolMath ok');
