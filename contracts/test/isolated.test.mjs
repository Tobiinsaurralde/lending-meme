// Isolated markets: own liquidity, utilization rate, flash loan, leverage.
//   node contracts/build.mjs && node contracts/test/isolated.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ganache from 'ganache';
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
  encodeFunctionData,
  parseUnits,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

const here = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(here, `../out/${name}.json`), 'utf8'));
const marketA = load('IsolatedMarket');
const factoryA = load('MarketFactory');
const routerA = load('LeverageRouter');
const tokenA = load('MockToken');
const oracleA = load('MockOracle');
const swapA = load('MockSwap');
const flashA = load('MockFlash');

const MNEMONIC = 'myth like bonus scare over problem client lizard pioneer submit female collect';
const [deployer, supplier, borrower, liquidator] = Array.from({ length: 4 }, (_, i) =>
  mnemonicToAccount(MNEMONIC, { addressIndex: i }),
);
const USDC = (n) => parseUnits(String(n), 6);
const TOK = (n) => parseUnits(String(n), 18);

const provider = ganache.provider({
  logging: { quiet: true },
  wallet: { deterministic: true, totalAccounts: 4 },
  chain: { hardfork: 'shanghai' },
});
const chain = defineChain({
  id: 1337,
  name: 'test',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: ['http://localhost'] } },
});
const transport = custom(provider);
const pub = createPublicClient({ chain, transport });
const wallet = createWalletClient({ chain, transport });

const send = async (account, address, abi, functionName, args = []) => {
  const hash = await wallet.writeContract({ account, address, abi, functionName, args, gas: 8_000_000n });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success', functionName);
  return receipt;
};
const read = (address, abi, functionName, args = []) => pub.readContract({ address, abi, functionName, args });
const deploy = async (account, artifact, args) => {
  const hash = await wallet.deployContract({ account, abi: artifact.abi, bytecode: artifact.bytecode, args });
  const receipt = await pub.waitForTransactionReceipt({ hash });
  assert.equal(receipt.status, 'success', 'deploy');
  return receipt.contractAddress;
};

const usdc = await deploy(deployer, tokenA, ['USDC', 'USDC', 6, 0]);
const cool = await deploy(deployer, tokenA, ['COOL', 'COOL', 18, 0]);
const oracle = await deploy(deployer, oracleA, []);
await send(deployer, oracle, oracleA.abi, 'set', [cool, USDC(2)]);

const factory = await deploy(deployer, factoryA, [usdc, deployer.address]);
const createData = encodeFunctionData({
  abi: factoryA.abi,
  functionName: 'create',
  args: [cool, oracle, deployer.address, 3000, 5000, 500, 8000, 1000, 4000, 2000],
});
const createHash = await wallet.sendTransaction({ account: deployer, to: factory, data: createData, gas: 8_000_000n });
const createReceipt = await pub.waitForTransactionReceipt({ hash: createHash });
const market = `0x${createReceipt.logs[0].topics[2].slice(26)}`;

await send(deployer, usdc, tokenA.abi, 'mint', [supplier.address, USDC(1000)]);
await send(deployer, cool, tokenA.abi, 'mint', [borrower.address, TOK(100)]);
await send(supplier, usdc, tokenA.abi, 'approve', [market, USDC(1000)]);
await send(supplier, market, marketA.abi, 'supply', [USDC(1000)]);

const supplied = await read(market, marketA.abi, 'totalAssets');
assert.equal(supplied, USDC(1000));

await send(borrower, cool, tokenA.abi, 'approve', [market, TOK(100)]);
await send(borrower, market, marketA.abi, 'borrow', [TOK(100)]);
const debt = await read(market, marketA.abi, 'debtOf', [borrower.address]);
assert.equal(debt, USDC(60), '30% of 100 tokens at $2');

const rate = await read(market, marketA.abi, 'borrowRateBps');
assert.ok(rate > 0n, 'utilization sets a borrow rate');

await provider.request({ method: 'evm_increaseTime', params: [365 * 24 * 3600] });
await provider.request({ method: 'evm_mine', params: [] });
await send(borrower, market, marketA.abi, 'accrue', []);
const later = await read(market, marketA.abi, 'debtOf', [borrower.address]);
assert.ok(later > debt, 'debt grows with time');

const supplierShares = await read(market, marketA.abi, 'sharesOf', [supplier.address]);
const preview = await read(market, marketA.abi, 'previewRedeem', [supplierShares]);
assert.ok(preview > USDC(1000), 'suppliers earn the interest');

await send(deployer, oracle, oracleA.abi, 'set', [cool, USDC(1)]);
await send(deployer, usdc, tokenA.abi, 'mint', [liquidator.address, USDC(200)]);
await send(liquidator, usdc, tokenA.abi, 'approve', [market, USDC(200)]);
const beforeCol = await read(cool, tokenA.abi, 'balanceOf', [liquidator.address]);
await send(liquidator, market, marketA.abi, 'liquidate', [borrower.address, later]);
const seized = (await read(cool, tokenA.abi, 'balanceOf', [liquidator.address])) - beforeCol;
assert.ok(seized > 0n, 'liquidator receives collateral');

const router = await deploy(deployer, routerA, [usdc]);
const swap = await deploy(deployer, swapA, [usdc, TOK(1)]);
await send(deployer, cool, tokenA.abi, 'mint', [deployer.address, TOK(10)]);
await send(deployer, cool, tokenA.abi, 'approve', [router, TOK(10)]);
await send(supplier, usdc, tokenA.abi, 'approve', [market, USDC(500)]);
await send(deployer, usdc, tokenA.abi, 'mint', [supplier.address, USDC(500)]);
await send(supplier, market, marketA.abi, 'supply', [USDC(500)]);
await send(deployer, router, routerA.abi, 'open', [market, TOK(10), swap]);
const flash = await deploy(deployer, flashA, []);
await send(deployer, flash, flashA.abi, 'go', [market, USDC(5)]);
const loopDebt = await read(market, marketA.abi, 'debtOf', [router]);
assert.ok(loopDebt > 0n, 'leverage leaves a borrow');

const other = await deploy(deployer, factoryA, [usdc, supplier.address]);
const denied = encodeFunctionData({
  abi: factoryA.abi,
  functionName: 'create',
  args: [cool, oracle, deployer.address, 3000, 5000, 500, 8000, 1000, 4000, 2000],
});
await assert.rejects(pub.call({ account: deployer.address, to: other, data: denied }));

console.log('isolated markets ok');
