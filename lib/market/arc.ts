import { defineChain } from 'viem';

/**
 * Circle Arc public mainnet.
 * Gas is USDC at 18 decimals. The ERC-20 interface of the same balance is 6 decimals.
 */
export const arc = defineChain({
  id: 5042,
  name: 'Arc',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.mainnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://explorer.arc.io' },
  },
  contracts: {
    multicall3: { address: '0xcA11bde05977b3631167028862bE2a173976CA11' },
  },
});

/** ERC-20 view of native USDC on Arc. Same balance as gas, 6 decimals. Same address on testnet. */
export const ARC_USDC = '0x3600000000000000000000000000000000000000' as const;

/** Arc public testnet. Faucet USDC, not the mainnet dollar. */
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18,
  },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.io'] },
  },
  blockExplorers: {
    default: { name: 'Arc Testnet Explorer', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
});
