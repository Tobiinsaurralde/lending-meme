// NFT escrow, BAG staking, ballot, and the flash helper.
//   node contracts/build.mjs && node contracts/test/extras.test.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ganache from 'ganache';
import { createPublicClient, createWalletClient, custom, defineChain, parseUnits } from 'viem';
import { mnemonicToAccount } from 'viem/accounts';

const here = dirname(fileURLToPath(import.meta.url));
const load = (name) => JSON.parse(readFileSync(join(here, `../out/${name}.json`), 'utf8'));
const tokenA = load('MockToken');
const nftA = load('MockNft');
const escrowA = load('NftEscrow');
const vaultA = load('StakeVault');
const ballotA = load('Ballot');
const marketA = load('IsolatedMarket');
const oracleA = load('MockOracle');
const flashA = load('FlashHelper');

const MNEMONIC = 'myth like bonus scare over problem client lizard pioneer submit female collect';
const [deployer, lender, borrower] = [0, 1, 2].map((i) => mnemonicToAccount(MNEMONIC, { addressIndex: i }));
const USDC = (n) => parseUnits(String(n), 6);

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
const nft = await deploy(deployer, nftA, []);
await send(deployer, nft, nftA.abi, 'mint', [borrower.address, 1n]);
await send(deployer, usdc, tokenA.abi, 'mint', [lender.address, USDC(20)]);
await send(deployer, usdc, tokenA.abi, 'mint', [borrower.address, USDC(20)]);

const escrow = await deploy(deployer, escrowA, [usdc]);
const due = BigInt(Math.floor(Date.now() / 1000) + 86_400);
await send(lender, usdc, tokenA.abi, 'approve', [escrow, USDC(15)]);
await send(lender, escrow, escrowA.abi, 'offer', [nft, 1n, false, USDC(5), USDC(6), due]);
await send(borrower, nft, nftA.abi, 'setApprovalForAll', [escrow, true]);
await send(deployer, nft, nftA.abi, 'mint', [borrower.address, 2n]);
let rejected = false;
try {
  await send(borrower, escrow, escrowA.abi, 'fill', [0n, 2n]);
} catch {
  rejected = true;
}
assert.equal(rejected, true, 'a pinned offer rejects a different token');
await send(borrower, escrow, escrowA.abi, 'fill', [0n, 1n]);
assert.equal((await read(nft, nftA.abi, 'ownerOf', [1n])).toLowerCase(), escrow.toLowerCase());
await send(borrower, usdc, tokenA.abi, 'approve', [escrow, USDC(6)]);
await send(borrower, escrow, escrowA.abi, 'repay', [0n]);
assert.equal((await read(nft, nftA.abi, 'ownerOf', [1n])).toLowerCase(), borrower.address.toLowerCase());

await send(lender, escrow, escrowA.abi, 'offer', [nft, 0n, true, USDC(3), USDC(4), due]);
await send(borrower, escrow, escrowA.abi, 'fill', [1n, 2n]);
assert.equal((await read(nft, nftA.abi, 'ownerOf', [2n])).toLowerCase(), escrow.toLowerCase());
await send(lender, escrow, escrowA.abi, 'offer', [nft, 9n, false, USDC(1), USDC(1), due]);
const parked = await read(usdc, tokenA.abi, 'balanceOf', [lender.address]);
await send(lender, escrow, escrowA.abi, 'cancel', [2n]);
const returned = await read(usdc, tokenA.abi, 'balanceOf', [lender.address]);
assert.equal(returned - parked, USDC(1), 'cancel returns the unfilled principal');

const vault = await deploy(deployer, vaultA, [usdc]);
const bag = await read(vault, vaultA.abi, 'bag');
await send(deployer, vault, vaultA.abi, 'mint', [lender.address, 10n ** 18n]);
await send(lender, bag, load('BagToken').abi, 'approve', [vault, 10n ** 18n]);
await send(lender, vault, vaultA.abi, 'stake', [10n ** 18n]);
await send(deployer, usdc, tokenA.abi, 'mint', [deployer.address, USDC(4)]);
await send(deployer, usdc, tokenA.abi, 'approve', [vault, USDC(4)]);
await send(deployer, vault, vaultA.abi, 'fund', [USDC(4)]);
await send(lender, vault, vaultA.abi, 'claim', []);
const claimed = await read(usdc, tokenA.abi, 'balanceOf', [lender.address]);
assert.ok(claimed >= USDC(4), 'staker receives the funded USDC');

const ballot = await deploy(deployer, ballotA, [vault]);
await send(deployer, ballot, ballotA.abi, 'propose', ['List another collateral']);
await send(lender, ballot, ballotA.abi, 'vote', [0n, true]);
const proposal = await read(ballot, ballotA.abi, 'proposals', [0n]);
assert.equal(proposal[1], 10n ** 18n);

const cool = await deploy(deployer, tokenA, ['COOL', 'COOL', 18, 0]);
const oracle = await deploy(deployer, oracleA, []);
await send(deployer, oracle, oracleA.abi, 'set', [cool, USDC(1)]);
const market = await deploy(deployer, marketA, [usdc, cool, oracle, deployer.address, 3000, 5000, 500, 8000, 1000, 4000, 2000]);
await send(deployer, usdc, tokenA.abi, 'mint', [deployer.address, USDC(10)]);
await send(deployer, usdc, tokenA.abi, 'approve', [market, USDC(10)]);
await send(deployer, market, marketA.abi, 'supply', [USDC(10)]);
const helper = await deploy(deployer, flashA, []);
await send(deployer, helper, flashA.abi, 'go', [market, USDC(1)]);
assert.equal(await read(market, marketA.abi, 'cash'), USDC(10));

console.log('extras ok');
