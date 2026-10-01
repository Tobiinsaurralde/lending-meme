// Serves an Arc fork on :8545 with a live pool and one past-due loan per venue,
// so the site's /cron/keeper can be run against it.
//
//   node contracts/test/keeper-fork.mjs
//   ARC_RPC_URL=http://127.0.0.1:8545 NEXT_PUBLIC_LENDING_POOL=<printed> \
//   KEEPER_PRIVATE_KEY=<printed> CRON_SECRET=test npx next dev
import { readFileSync } from 'node:fs';
import ganache from 'ganache';
import { createPublicClient, createWalletClient, custom, defineChain, http, parseAbi, parseUnits } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

const load = (name) => JSON.parse(readFileSync(new URL(`../out/${name}.json`, import.meta.url), 'utf8'));
const pool = load('LendingPool');
const mock = load('MockToken');
const MNEMONIC = 'myth like bonus scare over problem client lizard pioneer submit female collect';
const [owner, treasury, borrower, keeper] = [0, 1, 2, 3].map((i) => mnemonicToAccount(MNEMONIC, { addressIndex: i }));
const ARC = 'https://rpc.mainnet.arc.io';
const USDC = '0x3600000000000000000000000000000000000000';
const COOL = { token: '0xeb64987643db71c76b2a2be7e723decc995e5b37', market: '0x40732e01ba7a829dea44f51a10e7c58cd9f37765', venue: 1, fee: 0 };
const ARCAT = { token: '0x07704b06981ea962b87296362a1281484d160000', market: '0xcf924acee7eb1f169a922bf19b0a732810971985', venue: 2, fee: 30 };
const erc20 = parseAbi(['function balanceOf(address) view returns (uint256)', 'function transfer(address,uint256) returns (bool)', 'function approve(address,uint256) returns (bool)', 'function mint(address,uint256)']);

const live = createPublicClient({ transport: http(ARC) });
const block = await live.getBlockNumber();
const held = {};
for (const m of [COOL, ARCAT]) held[m.market] = await live.readContract({ address: USDC, abi: erc20, functionName: 'balanceOf', args: [m.market], blockNumber: block });

const server = ganache.server({
  logging: { quiet: true },
  fork: { url: ARC, blockNumber: Number(block) },
  chain: { chainId: 5042, hardfork: 'shanghai' },
  wallet: { deterministic: true, totalAccounts: 4, unlockedAccounts: [COOL.market, ARCAT.market] },
});
await server.listen(8545);
const provider = server.provider;
const chain = defineChain({ id: 5042, name: 'arc', nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 }, rpcUrls: { default: { http: ['http://127.0.0.1:8545'] } } });
const pub = createPublicClient({ chain, transport: custom(provider) });
const wallet = createWalletClient({ chain, transport: custom(provider) });
const rpc = (m, p = []) => provider.request({ method: m, params: p });
const send = async (account, address, abi, functionName, args = []) => {
  const r = await pub.waitForTransactionReceipt({ hash: await wallet.writeContract({ account, address, abi, functionName, args, gas: 8_000_000n }) });
  if (r.status !== 'success') throw new Error(`${functionName} reverted`);
};
const travel = async (s) => {
  await rpc('evm_increaseTime', [s]);
  await rpc('evm_mine', []);
};

const stand = (await pub.waitForTransactionReceipt({ hash: await wallet.deployContract({ account: owner, abi: mock.abi, bytecode: mock.bytecode, args: ['USD Coin', 'USDC', 6, 0n] }) })).contractAddress;
await rpc('evm_setAccountCode', [USDC, await pub.getCode({ address: stand })]);
for (const m of [COOL, ARCAT]) {
  await send(owner, USDC, mock.abi, 'mint', [m.market, held[m.market]]);
  await rpc('evm_setAccountBalance', [m.market, '0x3635C9ADC5DEA00000']);
}
await send(owner, USDC, mock.abi, 'mint', [keeper.address, parseUnits('1', 6)]);

const lp = (await pub.waitForTransactionReceipt({ hash: await wallet.deployContract({ account: owner, abi: pool.abi, bytecode: pool.bytecode, args: [USDC, treasury.address] }) })).contractAddress;
for (const m of [COOL, ARCAT]) await send(owner, lp, pool.abi, 'setCollateral', [m.token, m.market, m.venue, m.fee, 1500, 1800, 0, true]);
await travel(1801);
await send(owner, lp, pool.abi, 'poke', [ARCAT.token]);
await send(owner, USDC, mock.abi, 'mint', [owner.address, parseUnits('1000', 6)]);
await send(owner, USDC, erc20, 'approve', [lp, parseUnits('1000', 6)]);
await send(owner, lp, pool.abi, 'supply', [parseUnits('1000', 6)]);

for (const m of [COOL, ARCAT]) {
  const [, spot] = await pub.readContract({ address: lp, abi: pool.abi, functionName: 'priceOf', args: [m.token] });
  const amount = (parseUnits('30', 6) * 10n ** 18n) / spot;
  await pub.waitForTransactionReceipt({ hash: await wallet.writeContract({ account: m.market, address: m.token, abi: erc20, functionName: 'transfer', args: [borrower.address, amount], gas: 500_000n }) });
  if (m.venue === 2) await send(owner, m.market, parseAbi(['function sync()']), 'sync');
  await send(borrower, m.token, erc20, 'approve', [lp, amount]);
  await send(borrower, lp, pool.abi, 'borrow', [m.token, amount, 0]);
}
for (let i = 0; i < 4; i += 1) {
  await travel(12 * 3600);
  await send(owner, lp, pool.abi, 'poke', [ARCAT.token]);
}
await travel(3600);

console.log(`POOL=${lp}`);
console.log(`KEEPER=${keeper.address}`);
console.log(`KEEPER_KEY=0x${Buffer.from(keeper.getHdKey().privateKey).toString('hex')}`);
console.log('ready');
