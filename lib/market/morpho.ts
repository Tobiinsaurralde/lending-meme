import { parseAbi } from 'viem';

/**
 * Morpho Blue on Arc mainnet. Address from Morpho's deployment list, checked
 * against idToMarketParams for the cirBTC/USDC market on rpc.mainnet.arc.io.
 * Midnight, the fixed-rate book, is not listed on Arc. These are variable-rate markets.
 */
export const MORPHO = '0x34CD04070dD72b14E241112F6d83812Df5Af7fCD' as const;

const IRM = '0xF02615d094Fc02fC031C35fe705e175aA4653f20' as const;
const USDC = '0x3600000000000000000000000000000000000000' as const;
const EURC = '0xbEf5f6d51CB62b58e6A8f77868681825C6fe21c1' as const;
const CIRBTC = '0x171A4217b86A807A64eB94757Db6849fb4bDbAA0' as const;

/** Morpho share math. VIRTUAL_SHARES is 1e6 and VIRTUAL_ASSETS is 1. */
const VIRTUAL_SHARES = 1_000_000n;
const VIRTUAL_ASSETS = 1n;
export const ORACLE_PRICE_SCALE = 10n ** 36n;
export const WAD = 10n ** 18n;

export interface MorphoAsset {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  logo: string;
}

export interface MorphoMarket {
  id: `0x${string}`;
  collateral: MorphoAsset;
  loan: MorphoAsset;
  oracle: `0x${string}`;
  irm: `0x${string}`;
  lltv: bigint;
}

const usdc: MorphoAsset = {
  symbol: 'USDC',
  name: 'USDC',
  address: USDC,
  decimals: 6,
  logo: '/media/usdc.svg',
};

const eurc: MorphoAsset = {
  symbol: 'EURC',
  name: 'Euro',
  address: EURC,
  decimals: 6,
  logo: '/media/eurc.svg',
};

const cirbtc: MorphoAsset = {
  symbol: 'cirBTC',
  name: 'Bitcoin',
  address: CIRBTC,
  decimals: 8,
  logo: '/media/cirbtc.svg',
};

/** Live Arc markets with real deposits. Dust listings stay out of the desk. */
export const MORPHO_MARKETS: MorphoMarket[] = [
  {
    id: '0xc2db905f174e5defcce01d321b09f15f78856a36a21b90cc7e1abbc29225815d',
    collateral: cirbtc,
    loan: usdc,
    oracle: '0x2AA87fF48933Ce6aBA240BEE916Fc2e6Ec1e51Ab',
    irm: IRM,
    lltv: 860000000000000000n,
  },
  {
    id: '0x6ea1ea96a1cc671615f3a3bdf51481c5b79e362a8b634396e680d1070137daf4',
    collateral: cirbtc,
    loan: eurc,
    oracle: '0x6945246777DfdF4744D957323857F797Ec19Ca1e',
    irm: IRM,
    lltv: 860000000000000000n,
  },
  {
    id: '0x126759c350bb65bf782cf9fbfe09fb9cbd32c5a39d26c2194994049ddb3b7e5c',
    collateral: {
      symbol: 'sUSDai',
      name: 'sUSDai',
      address: '0x0B2b2B2076d95dda7817e785989fE353fe955ef9',
      decimals: 18,
      logo: '/media/susdai.svg',
    },
    loan: usdc,
    oracle: '0x6B585b7217E29F11A3b743A6a7bB84754cbA6727',
    irm: IRM,
    lltv: 860000000000000000n,
  },
  {
    id: '0x9bd953647610205cd0869118035ca1b021ed5d7654b8a9a013032b549d0abe12',
    collateral: {
      symbol: 'PST',
      name: 'PST',
      address: '0xa6Db07ebF438d91Aa653746fc05523e435645525',
      decimals: 6,
      logo: '/media/pst.svg',
    },
    loan: usdc,
    oracle: '0x632dE25165B997110E92764b940494eA7fF1FE87',
    irm: IRM,
    lltv: 860000000000000000n,
  },
];

export function morphoParams(market: MorphoMarket) {
  return {
    loanToken: market.loan.address,
    collateralToken: market.collateral.address,
    oracle: market.oracle,
    irm: market.irm,
    lltv: market.lltv,
  } as const;
}

export function sharesToAssets(shares: bigint, totalAssets: bigint, totalShares: bigint): bigint {
  if (shares === 0n) return 0n;
  return (shares * (totalAssets + VIRTUAL_ASSETS)) / (totalShares + VIRTUAL_SHARES);
}

/** Loan-token value of collateral, then the max borrow at the market LLTV. */
export function maxBorrowAssets(collateral: bigint, price: bigint, lltv: bigint): bigint {
  if (collateral === 0n || price === 0n || lltv === 0n) return 0n;
  const value = (collateral * price) / ORACLE_PRICE_SCALE;
  return (value * lltv) / WAD;
}

export const morphoAbi = parseAbi([
  'function market(bytes32 id) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)',
  'function position(bytes32 id, address user) view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral)',
  'function supply((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256, uint256)',
  'function withdraw((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256, uint256)',
  'function borrow((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, address receiver) returns (uint256, uint256)',
  'function repay((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, uint256 shares, address onBehalf, bytes data) returns (uint256, uint256)',
  'function supplyCollateral((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, address onBehalf, bytes data)',
  'function withdrawCollateral((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, uint256 assets, address onBehalf, address receiver)',
]);

export const oracleAbi = parseAbi(['function price() view returns (uint256)']);
