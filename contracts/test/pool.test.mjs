// End-to-end tests for LendingPool on an in-process EVM.
//
//   node contracts/build.mjs && node contracts/test/pool.test.mjs [--local]
//
// The local suite prices a mock token through a Uniswap V2-style pair and runs
// the whole cycle, including a price crash and liquidations. The Arc suite
// forks mainnet and runs borrow and liquidation against the real COOL, LONG
// and ARCANINE Uniswap V3 pools and the ARCAT DYORSwap pair. Arc's USDC calls
// native precompiles that a fork cannot run, so on the fork its code is
// swapped for a plain ERC-20 holding the same balances.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ganache from 'ganache';
import {
  createPublicClient,
  createWalletClient,
  custom,
  decodeErrorResult,
  defineChain,
  encodeFunctionData,
  formatUnits,
  http,
  parseAbi,
  parseUnits,
} from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

const here = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(here, `../out/${name}.json`), 'utf8'));
const pool = load('LendingPool');
const mock = load('MockToken');
const pairArtifact = load('MockV2Pair');

// ganache's `deterministic: true` wallet. Signing locally avoids
// wallet_sendTransaction, which ganache does not implement.
const MNEMONIC = 'myth like bonus scare over problem client lizard pioneer submit female collect';
const signers = (n) => Array.from({ length: n }, (_, i) => mnemonicToAccount(MNEMONIC, { addressIndex: i }));

const USDC = (n) => parseUnits(String(n), 6);
const TOKENS = (n) => parseUnits(String(n), 18);
const HOUR = 3_600;
const DAY = 86_400;
const V3 = 1;
const V2 = 2;

function chainFor(provider, id) {
  const chain = defineChain({
    id,
    name: 'test',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: ['http://localhost'] } },
  });
  const transport = custom(provider);
  return {
    chain,
    pub: createPublicClient({ chain, transport }),
    wallet: createWalletClient({ chain, transport }),
    rpc: (method, params = []) => provider.request({ method, params }),
  };
}

const norm = (args) => args.map((x) => x?.address ?? x);

function helpers({ pub, wallet, rpc }) {
  const send = async (account, address, abi, functionName, args = []) => {
    const hash = await wallet.writeContract({ account, address, abi, functionName, args: norm(args), gas: 8_000_000n });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    assert.equal(receipt.status, 'success', `${functionName} failed`);
    return receipt;
  };
  const read = (address, abi, functionName, args = []) =>
    pub.readContract({ address, abi, functionName, args: norm(args) });
  const deploy = async (account, artifact, args) => {
    const hash = await wallet.deployContract({ account, abi: artifact.abi, bytecode: artifact.bytecode, args: norm(args) });
    const receipt = await pub.waitForTransactionReceipt({ hash });
    assert.equal(receipt.status, 'success', 'deploy failed');
    return receipt.contractAddress;
  };
  const reverts = async (account, address, abi, functionName, args, errorName) => {
    const data = encodeFunctionData({ abi, functionName, args: norm(args) });
    try {
      await rpc('eth_call', [{ from: account.address, to: address, data, gas: '0x7a1200' }, 'latest']);
    } catch (e) {
      const raw = e?.data?.result ?? e?.data;
      let name = String(e?.message);
      try {
        name = decodeErrorResult({ abi, data: raw }).errorName;
      } catch {}
      assert.equal(name, errorName, `${functionName} reverted with the wrong error`);
      return;
    }
    assert.fail(`${functionName} should revert with ${errorName}`);
  };
  const travel = async (seconds) => {
    await rpc('evm_increaseTime', [seconds]);
    await rpc('evm_mine', []);
  };
  return { send, read, deploy, reverts, travel };
}

const liquidatedEvent = pool.abi.find((x) => x.type === 'event' && x.name === 'Liquidated');

async function liquidation(env, receipt) {
  const { decodeEventLog } = await import('viem');
  for (const log of receipt.logs) {
    try {
      const ev = decodeEventLog({ abi: [liquidatedEvent], data: log.data, topics: log.topics });
      return ev.args;
    } catch {}
  }
  throw new Error('no Liquidated event');
}

async function localSuite() {
  const provider = ganache.provider({
    logging: { quiet: true },
    wallet: { deterministic: true, totalAccounts: 7 },
    chain: { hardfork: 'shanghai' },
  });
  const env = chainFor(provider, 1337);
  const { send, read, deploy, reverts, travel } = helpers(env);
  const [owner, treasury, lender, borrower, keeper, trader, stranger] = signers(7);
  const P = pool.abi;
  const T = mock.abi;
  const X = pairArtifact.abi;

  const usdc = await deploy(owner, mock, ['USD Coin', 'USDC', 6, 0n]);
  const cool = await deploy(owner, mock, ['usdc is cool', 'COOL', 18, 0n]);
  const other = await deploy(owner, mock, ['Other', 'OTH', 18, 0n]);
  const pair = await deploy(owner, pairArtifact, [cool, usdc, 30n]);
  const lp = await deploy(owner, pool, [usdc, treasury]);

  // Market: 1,000,000 COOL against 2,000 USDC, so 0.002 USDC per COOL.
  await send(owner, cool, T, 'mint', [pair, TOKENS(1_000_000)]);
  await send(owner, usdc, T, 'mint', [pair, USDC(2_000)]);
  await send(owner, pair, X, 'sync');

  // Owner rules.
  const config = (market, enabled = true) => [cool, market, V2, 30, 1_500, 1_800, 0, enabled];
  await reverts(stranger, lp, P, 'setCollateral', config(pair), 'NotOwner');
  const wrongPair = await deploy(owner, pairArtifact, [cool, other, 30n]);
  await reverts(owner, lp, P, 'setCollateral', config(wrongPair), 'BadInput');
  await send(owner, lp, P, 'setCollateral', config(pair));

  // The average needs a full window before anyone can borrow.
  await reverts(borrower, lp, P, 'previewBorrow', [cool, TOKENS(1), 0], 'OracleUnavailable');
  await travel(1_801);
  await send(keeper, lp, P, 'poke', [cool]);
  const [average, spot] = await read(lp, P, 'priceOf', [cool]);
  assert.ok(average >= 1_999n && average <= 2_000n, `average ${average}`);
  assert.equal(spot, 2_000n);

  // Supply. The pool keeps a virtual offset so the first deposit cannot be diluted.
  await send(owner, usdc, T, 'mint', [lender, USDC(1_000)]);
  await send(lender, usdc, T, 'approve', [lp, USDC(1_000)]);
  await send(lender, lp, P, 'supply', [USDC(1_000)]);
  const lenderShares = await read(lp, P, 'sharesOf', [lender]);
  assert.ok((await read(lp, P, 'previewRedeem', [lenderShares])) >= USDC(1_000) - 1n);

  // Quick tier on 100,000 COOL: about 200 USDC of value, 50 principal, 1 fee.
  await send(owner, cool, T, 'mint', [borrower, TOKENS(5_000_000)]);
  await send(borrower, cool, T, 'approve', [lp, TOKENS(5_000_000)]);
  await send(borrower, lp, P, 'borrow', [cool, TOKENS(100_000), 1]);
  const [, , , principal0] = await read(lp, P, 'loans', [0n]);
  assert.ok(principal0 > USDC(49.9) && principal0 <= USDC(50), `principal ${principal0}`);
  assert.deepEqual(await read(lp, P, 'openLoanIds'), [0n]);

  const [, , , , healthy] = await read(lp, P, 'health', [0n]);
  assert.equal(healthy, false);
  await reverts(keeper, lp, P, 'liquidate', [0n], 'Healthy');
  await reverts(stranger, lp, P, 'uniswapV3SwapCallback', [1n, 0n, '0x' + '00'.repeat(32)], 'BadInput');

  // Crash: 3,000,000 COOL dumped into the pair, spot falls about 94%.
  await send(owner, cool, T, 'mint', [trader, TOKENS(3_000_000)]);
  await send(trader, cool, T, 'transfer', [pair, TOKENS(3_000_000)]);
  const [r0, r1] = await read(pair, X, 'getReserves');
  const coolIs0 = cool.toLowerCase() < usdc.toLowerCase();
  const [rc, ru] = coolIs0 ? [r0, r1] : [r1, r0];
  const inFee = TOKENS(3_000_000) * 9_970n;
  const out = (inFee * ru) / (rc * 10_000n + inFee);
  await send(trader, pair, X, 'swap', coolIs0 ? [0n, out, trader, '0x'] : [out, 0n, trader, '0x']);

  // New loans price at spot right away; the average catches up over the window.
  const [avgAfterCrash, spotAfterCrash] = await read(lp, P, 'priceOf', [cool]);
  assert.ok(spotAfterCrash < 200n && avgAfterCrash > 1_900n, `avg ${avgAfterCrash} spot ${spotAfterCrash}`);
  const [quoted] = await read(lp, P, 'previewBorrow', [cool, TOKENS(100_000), 1]);
  assert.ok(quoted < USDC(20), 'borrow quote uses the lower spot price');

  await travel(1_801);
  const [, , , underwater, liquidatable] = await read(lp, P, 'health', [0n]);
  assert.equal(underwater, true);
  assert.equal(liquidatable, true);

  const cashBefore = await read(usdc, T, 'balanceOf', [lp]);
  const bad = await liquidation(env, await send(keeper, lp, P, 'liquidate', [0n]));
  assert.ok(bad.proceeds > 0n && bad.shortfall > 0n, 'underwater sale leaves a shortfall');
  assert.equal(await read(usdc, T, 'balanceOf', [keeper]), bad.reward);
  assert.equal(await read(lp, P, 'borrowed'), 0n);
  assert.deepEqual(await read(lp, P, 'openLoanIds'), []);
  assert.equal(await read(usdc, T, 'balanceOf', [lp]), cashBefore + bad.proceeds - bad.reward);
  assert.equal(await read(lp, P, 'totalAssets'), await read(usdc, T, 'balanceOf', [lp]));
  await reverts(keeper, lp, P, 'liquidate', [0n], 'NotOpen');

  // Let the average settle at the new price, then borrow and go past due.
  await travel(1_801);
  await send(keeper, lp, P, 'poke', [cool]);
  await travel(1_801);
  await send(borrower, lp, P, 'borrow', [cool, TOKENS(100_000), 0]);
  await send(borrower, lp, P, 'borrow', [cool, TOKENS(100_000), 0]);
  const [, , , owedA] = await read(lp, P, 'loans', [1n]);
  await reverts(keeper, lp, P, 'liquidate', [1n], 'Healthy');

  // The borrower repays loan 1 in time and gets the bag back.
  await send(owner, usdc, T, 'mint', [borrower, owedA]);
  await send(borrower, usdc, T, 'approve', [lp, owedA]);
  const coolBefore = await read(cool, T, 'balanceOf', [borrower]);
  await send(borrower, lp, P, 'repay', [1n]);
  assert.equal(await read(cool, T, 'balanceOf', [borrower]), coolBefore + TOKENS(100_000));
  assert.deepEqual(await read(lp, P, 'openLoanIds'), [2n]);

  // Loan 2 runs past due. The keeper pokes along the way, as the cron does.
  for (let i = 0; i < 5; i += 1) {
    await travel(12 * HOUR);
    await send(keeper, lp, P, 'poke', [cool]);
  }
  const [, debt2, pastDue2, , due2] = await read(lp, P, 'health', [2n]);
  assert.equal(pastDue2, true);
  assert.equal(due2, true);
  const borrowerUsdc = await read(usdc, T, 'balanceOf', [borrower]);
  const cashBeforeGood = await read(usdc, T, 'balanceOf', [lp]);
  const good = await liquidation(env, await send(keeper, lp, P, 'liquidate', [2n]));
  assert.equal(good.shortfall, 0n);
  assert.ok(good.proceeds - good.reward > debt2, 'the sale covers more than the debt');
  assert.equal(await read(usdc, T, 'balanceOf', [borrower]), borrowerUsdc, 'the borrower gets nothing back');
  assert.equal(await read(usdc, T, 'balanceOf', [lp]), cashBeforeGood + good.proceeds - good.reward, 'the surplus stays in the pool');

  // A sale that would lose more than the slippage limit is refused; close() is the way out.
  await send(owner, cool, T, 'mint', [borrower, TOKENS(15_000_000)]);
  await send(borrower, cool, T, 'approve', [lp, TOKENS(15_000_000)]);
  await send(borrower, lp, P, 'borrow', [cool, TOKENS(15_000_000), 0]);
  for (let i = 0; i < 5; i += 1) {
    await travel(12 * HOUR);
    await send(keeper, lp, P, 'poke', [cool]);
  }
  await reverts(keeper, lp, P, 'liquidate', [3n], 'Slippage');
  const [, , , owed3] = await read(lp, P, 'loans', [3n]);
  await send(owner, usdc, T, 'mint', [stranger, owed3]);
  await send(stranger, usdc, T, 'approve', [lp, owed3]);
  await send(stranger, lp, P, 'close', [3n]);
  assert.equal(await read(cool, T, 'balanceOf', [stranger]), TOKENS(15_000_000));

  // The lender leaves with everything the pool holds.
  const shares = await read(lp, P, 'sharesOf', [lender]);
  const expected = await read(lp, P, 'previewRedeem', [shares]);
  await send(lender, lp, P, 'withdraw', [shares]);
  assert.equal(await read(usdc, T, 'balanceOf', [lender]), expected);

  // A stale average blocks new loans until the window refills.
  await travel(4 * DAY);
  await send(keeper, lp, P, 'poke', [cool]);
  await reverts(borrower, lp, P, 'previewBorrow', [cool, TOKENS(1), 0], 'OracleUnavailable');

  console.log('local: ok (V2 average, crash, underwater and past-due liquidation, slippage guard, close, repay, withdraw)');
}

const ARC_RPC = 'https://rpc.mainnet.arc.io';
const ARC_USDC = '0x3600000000000000000000000000000000000000';
const MARKETS = {
  COOL: { token: '0xeb64987643db71c76b2a2be7e723decc995e5b37', market: '0x40732e01ba7a829dea44f51a10e7c58cd9f37765', venue: V3 },
  LONG: { token: '0x2164bb17a2d38c1b5170e987b2c0416df1efc752', market: '0xda9f3d166497ddfddf37c93cacfd8aa39b71e493', venue: V3 },
  ARCANINE: { token: '0xf3715bf5c2de299f08b81180ffb739a8372a175f', market: '0x6d8db35396b5eb98dee495e32b8cca992682316d', venue: V3 },
  ARCAT: { token: '0x07704b06981ea962b87296362a1281484d160000', market: '0xcf924acee7eb1f169a922bf19b0a732810971985', venue: V2 },
};

async function arcForkSuite() {
  const erc20 = parseAbi([
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address,uint256) returns (bool)',
    'function approve(address,uint256) returns (bool)',
  ]);
  const v2 = parseAbi([
    'function getReserves() view returns (uint112,uint112,uint32)',
    'function swap(uint256,uint256,address,bytes)',
    'function sync()',
  ]);
  const live = createPublicClient({ transport: http(ARC_RPC) });
  const block = await live.getBlockNumber();
  const usdcHeld = {};
  for (const [name, m] of Object.entries(MARKETS)) {
    usdcHeld[name] = await live.readContract({ address: ARC_USDC, abi: erc20, functionName: 'balanceOf', args: [m.market], blockNumber: block });
  }

  const provider = ganache.provider({
    logging: { quiet: true },
    fork: { url: ARC_RPC, blockNumber: Number(block) },
    wallet: { deterministic: true, totalAccounts: 4, unlockedAccounts: Object.values(MARKETS).map((m) => m.market) },
    // Several Arc tokens use PUSH0, so the fork must be at least Shanghai.
    chain: { chainId: 5042, hardfork: 'shanghai' },
  });
  const env = chainFor(provider, 5042);
  const { send, read, deploy, reverts, travel } = helpers(env);
  const [owner, treasury, borrower, keeper] = signers(4);
  const P = pool.abi;
  const T = mock.abi;

  const stand = await deploy(owner, mock, ['USD Coin', 'USDC', 6, 0n]);
  await env.rpc('evm_setAccountCode', [ARC_USDC, await env.pub.getCode({ address: stand })]);
  for (const [name, m] of Object.entries(MARKETS)) {
    await send(owner, ARC_USDC, T, 'mint', [m.market, usdcHeld[name]]);
    await env.rpc('evm_setAccountBalance', [m.market, '0x3635C9ADC5DEA00000']);
  }

  // Tokens for the tests come out of each market. A V2 pair has to sync
  // afterwards or it would read the missing balance as a negative input.
  const takeFrom = async (m, to, amount) => {
    const hash = await env.wallet.writeContract({ account: m.market, address: m.token, abi: erc20, functionName: 'transfer', args: [to, amount], gas: 500_000n });
    await env.pub.waitForTransactionReceipt({ hash });
    if (m.venue === V2) await send(owner, m.market, v2, 'sync');
  };

  // DYORSwap's fee is not published; find the lowest fee its K check accepts.
  const arcat = MARKETS.ARCAT;
  let dyorFee;
  for (const fee of [0n, 10n, 20n, 25n, 30n, 50n, 100n]) {
    const snap = await env.rpc('evm_snapshot');
    try {
      const amount = TOKENS(1_000_000);
      await takeFrom(arcat, owner.address, amount);
      const [r0, r1] = await read(arcat.market, v2, 'getReserves');
      await send(owner, arcat.token, erc20, 'transfer', [arcat.market, amount]);
      const inFee = amount * (10_000n - fee);
      const out = (inFee * r1) / (r0 * 10_000n + inFee);
      const hash = await env.wallet.writeContract({ account: owner, address: arcat.market, abi: v2, functionName: 'swap', args: [0n, out, owner.address, '0x'], gas: 500_000n });
      const r = await env.pub.waitForTransactionReceipt({ hash });
      if (r.status === 'success') dyorFee = fee;
    } catch {}
    await env.rpc('evm_revert', [snap]);
    if (dyorFee !== undefined) break;
  }
  assert.ok(dyorFee !== undefined, 'DYORSwap fee not found');
  console.log(`arc fork: DYORSwap fee ${dyorFee} bps`);

  const lp = await deploy(owner, pool, [ARC_USDC, treasury]);
  for (const [name, m] of Object.entries(MARKETS)) {
    const cardinality = name === 'ARCANINE' ? 120 : 0;
    await send(owner, lp, P, 'setCollateral', [m.token, m.market, m.venue, m.venue === V2 ? Number(dyorFee) : 0, 1_500, 1_800, cardinality, true]);
  }
  await travel(1_801);
  await send(keeper, lp, P, 'poke', [arcat.token]);

  for (const [name, m] of Object.entries(MARKETS)) {
    const [average, spot] = await read(lp, P, 'priceOf', [m.token]);
    console.log(`arc fork: ${name} average ${formatUnits(average, 6)} spot ${formatUnits(spot, 6)} USDC`);
    assert.ok(average > 0n && spot > 0n);
  }

  await send(owner, ARC_USDC, T, 'mint', [owner, USDC(5_000)]);
  await send(owner, ARC_USDC, T, 'approve', [lp, USDC(5_000)]);
  await send(owner, lp, P, 'supply', [USDC(5_000)]);

  // Borrow about 30 USDC of value against each token on the Express tier.
  let loanId = 0n;
  const ids = {};
  for (const [name, m] of Object.entries(MARKETS)) {
    const [, spot] = await read(lp, P, 'priceOf', [m.token]);
    const amount = (USDC(30) * 10n ** 18n) / spot;
    await takeFrom(m, borrower.address, amount);
    await send(borrower, m.token, erc20, 'approve', [lp, amount]);
    await send(borrower, lp, P, 'borrow', [m.token, amount, 0]);
    const [, , held, principal] = await read(lp, P, 'loans', [loanId]);
    assert.equal(held, amount, `${name} collateral arrived in full`);
    // priceOf rounds one whole token down to 6 decimals, the loan itself does not.
    assert.ok(principal > USDC(8.5) && principal <= USDC(9.1), `${name} principal ${formatUnits(principal, 6)}`);
    ids[name] = loanId;
    loanId += 1n;
  }
  await reverts(keeper, lp, P, 'liquidate', [ids.COOL], 'Healthy');

  // Two days later every Express loan is past due. The keeper keeps the ARCAT average fresh.
  for (let i = 0; i < 5; i += 1) {
    await travel(12 * HOUR);
    await send(keeper, lp, P, 'poke', [arcat.token]);
  }
  for (const [name, id] of Object.entries(ids)) {
    const [, , , , liquidatable] = await read(lp, P, 'health', [id]);
    assert.equal(liquidatable, true, `${name} liquidatable`);
    const [, , , debt] = await read(lp, P, 'loans', [id]);
    const borrowerUsdc = await read(ARC_USDC, erc20, 'balanceOf', [borrower]);
    const ev = await liquidation(env, await send(keeper, lp, P, 'liquidate', [id]));
    assert.equal(ev.shortfall, 0n, `${name} no shortfall`);
    assert.equal(await read(ARC_USDC, erc20, 'balanceOf', [borrower]), borrowerUsdc, `${name} borrower gets nothing back`);
    console.log(
      `arc fork: ${name} sold for ${formatUnits(ev.proceeds, 6)} USDC, keeper ${formatUnits(ev.reward, 6)}, pool keeps ${formatUnits(ev.proceeds - ev.reward, 6)} against ${formatUnits(debt, 6)} of debt`,
    );
  }
  assert.equal(await read(lp, P, 'borrowed'), 0n);
  assert.deepEqual(await read(lp, P, 'openLoanIds'), []);
  console.log('arc fork: ok (real Uniswap V3 and DYORSwap markets: price, borrow, liquidate)');
}

await localSuite();
if (!process.argv.includes('--local')) await arcForkSuite();
process.exit(0);
