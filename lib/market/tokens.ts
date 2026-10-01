/**
 * Memecoins named on the landing, read from Arc mainnet.
 * Each one is priced and sold through its deepest USDC market on Arc.
 */
export const VENUE_V3 = 1;
export const VENUE_V2 = 2;

export interface ArcToken {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  /** Uniswap V3 pool or V2-style pair against USDC. */
  market: `0x${string}`;
  venue: typeof VENUE_V3 | typeof VENUE_V2;
  marketName: string;
  logo: string;
  /** V2 pair swap fee. Unused for V3. */
  swapFeeBps: number;
  /** V3 observation slots to reserve so a 30-minute average always fits. */
  cardinality: number;
  /** Uniswap v4 pool id. Priced through a reader that echoes the current tick. */
  v4PoolId?: `0x${string}`;
  v4Fee?: number;
  v4TickSpacing?: number;
  v4Hooks?: `0x${string}`;
}

export const ARC_TOKENS: ArcToken[] = [
  {
    symbol: 'COOL',
    name: 'usdc is cool',
    address: '0xeb64987643db71c76b2a2be7e723decc995e5b37',
    decimals: 18,
    market: '0x40732e01ba7a829dea44f51a10e7c58cd9f37765',
    venue: VENUE_V3,
    marketName: 'Uniswap V3 1%',
    logo: '/media/arc-cool.png',
    swapFeeBps: 0,
    cardinality: 0,
  },
  {
    symbol: 'LONG',
    name: 'LONG',
    address: '0x2164bb17a2d38c1b5170e987b2c0416df1efc752',
    decimals: 18,
    market: '0xda9f3d166497ddfddf37c93cacfd8aa39b71e493',
    venue: VENUE_V3,
    marketName: 'Uniswap V3 1%',
    logo: '/media/arc-long.jpg',
    swapFeeBps: 0,
    cardinality: 120,
  },
  {
    symbol: 'ARCAT',
    name: 'ARCAT',
    address: '0x07704b06981ea962b87296362a1281484d160000',
    decimals: 18,
    market: '0xcf924acee7eb1f169a922bf19b0a732810971985',
    venue: VENUE_V2,
    marketName: 'DYORSwap',
    logo: '/media/arc-arcat.jpg',
    swapFeeBps: 30,
    cardinality: 0,
  },
  {
    symbol: 'ARCANINE',
    name: 'Arcanine',
    address: '0xf3715bf5c2de299f08b81180ffb739a8372a175f',
    decimals: 18,
    market: '0x6d8db35396b5eb98dee495e32b8cca992682316d',
    venue: VENUE_V3,
    marketName: 'Uniswap V3 1%',
    logo: '/media/arc-arcanine.png',
    swapFeeBps: 0,
    cardinality: 120,
  },
  {
    symbol: 'BAGFI',
    name: 'BAGFI',
    address: '0x1f9f98b2d7b4ddcd93654a1e20221340cf1f241e',
    decimals: 18,
    // Trades on Uniswap v4. A reader contract presents that pool to the lending pool.
    market: '0x0000000000000000000000000000000000000000',
    venue: VENUE_V3,
    marketName: 'Uniswap v4',
    logo: '/media/bagfi-token.png',
    swapFeeBps: 0,
    cardinality: 0,
    v4PoolId: '0x48d71602a193a337e0af135898b6bcda17acb151ade9b74225c0fe5397f05e6f',
    v4Fee: 10000,
    v4TickSpacing: 200,
    v4Hooks: '0x7Eb112026122730bC7Bb0F2EfAAAF7fd70a82044',
  },
  {
    symbol: 'USDC',
    name: 'Up-Side-Down-Cat',
    address: '0x8e98a62a995a50eca9979bfa016f91bf36a8f9d9',
    decimals: 18,
    // The contract ticker is USDC. The name stays next to it so this is not the dollar.
    market: '0x0000000000000000000000000000000000000000',
    venue: VENUE_V3,
    marketName: 'Uniswap v4',
    logo: '/media/arc-udcat.jpg',
    swapFeeBps: 0,
    cardinality: 0,
    v4PoolId: '0x771b16f71e0086e673a5866ead7607855cc9cd4636fe789521b4cd80aa5958dc',
    v4Fee: 40000,
    v4TickSpacing: 400,
    v4Hooks: '0x0000000000000000000000000000000000000000',
  },
  {
    symbol: 'ARGUS',
    name: 'Argus',
    address: '0xece5ca8bf9220718e5727754026757512212cb3c',
    decimals: 18,
    market: '0x6a3bacaa6493734c1ac221ebf42cf530a96c1e02',
    venue: VENUE_V3,
    marketName: 'Uniswap V3 1%',
    logo: '/media/arc-argus.png',
    swapFeeBps: 0,
    cardinality: 0,
  },
  {
    symbol: 'ARCMAN',
    name: 'Arc-man',
    address: '0x5849fd68a097b3ee7d87ce88a0fcbb76857648ff',
    decimals: 18,
    market: '0x0000000000000000000000000000000000000000',
    venue: VENUE_V3,
    marketName: 'Uniswap v4',
    logo: '/media/arc-arcman.jpg',
    swapFeeBps: 0,
    cardinality: 0,
    v4PoolId: '0xa3abdb2721cd343da530ff6fd0ad73f3caa77163ea2fb8206847249f9bba57d5',
    v4Fee: 0,
    v4TickSpacing: 200,
    v4Hooks: '0x173c4Bdd5CF95A935D2B5636C573C5F4DF062044',
  },
  {
    symbol: 'FAZE',
    name: 'Faze',
    address: '0x394d38f807ee0027a182216f5e67a15ae441fa2e',
    decimals: 18,
    market: '0x0000000000000000000000000000000000000000',
    venue: VENUE_V3,
    marketName: 'Uniswap v4',
    logo: '/media/arc-faze.jpg',
    swapFeeBps: 0,
    cardinality: 0,
    // The deepest pool pairs native gas, which this contract cannot sell into.
    // This pool is the ERC-20 USDC market.
    v4PoolId: '0xcb4925117715e6983ee6e03d491d90bbc498776b761714c447a9ea80265ca846',
    v4Fee: 50000,
    v4TickSpacing: 100,
    v4Hooks: '0x0000000000000000000000000000000000000000',
  },
  {
    symbol: 'ARCT',
    name: 'ArcTools',
    address: '0x1ea1e4f9a9975f1f6e9c0a9f6e8ada7a66e6de52',
    decimals: 18,
    market: '0xf89005ccf237a59eeee1521e74b15c7d8d022ab7',
    venue: VENUE_V3,
    marketName: 'Uniswap V3 1%',
    logo: '/media/arc-arct.png',
    swapFeeBps: 0,
    cardinality: 120,
  },
  {
    symbol: 'TOLLY',
    name: 'Tolly',
    address: '0xbc43ce8dec648ea298c4275559b81d6261c90b67',
    decimals: 18,
    market: '0x162df51c504e7b8321e07387932f333d9be16a72',
    venue: VENUE_V3,
    marketName: 'Uniswap V3 1%',
    logo: '/media/arc-tolly.jpg',
    swapFeeBps: 0,
    cardinality: 0,
  },
  {
    symbol: 'AF',
    name: 'Arcflow',
    address: '0x75d658f8101fbe6dc217fbba7e20a0312af5fa2e',
    decimals: 18,
    market: '0x0000000000000000000000000000000000000000',
    venue: VENUE_V3,
    marketName: 'Uniswap v4',
    logo: '/media/arc-af.jpg',
    swapFeeBps: 0,
    cardinality: 0,
    // The pool on the chart pairs native gas, which this contract cannot sell into.
    // This pool is the ERC-20 USDC market.
    v4PoolId: '0x2fa5d745a2e5797c59748a3d2ba8328069049b9646b04390f004a74912240983',
    v4Fee: 40000,
    v4TickSpacing: 400,
    v4Hooks: '0x0000000000000000000000000000000000000000',
  },
];

/** Liquidation sale must return at least the average value minus this share. */
export const MAX_SLIPPAGE_BPS = 1_500;
export const TWAP_WINDOW_SECONDS = 1_800;
