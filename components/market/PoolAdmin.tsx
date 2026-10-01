'use client';

import { useEffect, useMemo, useState } from 'react';
import { erc20Abi, formatUnits, isAddress, parseUnits } from 'viem';
import {
  useAccount,
  useDeployContract,
  usePublicClient,
  useReadContract,
  useReadContracts,
  useSwitchChain,
  useWriteContract,
} from 'wagmi';
import { BrandMark } from '@/components/market/MarketChrome';
import { WalletChip } from '@/components/studio/wallet/WalletChip';
import { useWalletSession } from '@/lib/studio/wallet-session';
import { arc } from '@/lib/market/arc';
import { lendingPoolBytecode } from '@/lib/market/lendingPoolArtifact';
import {
  leverageRouterAbi,
  leverageRouterBytecode,
  marketFactoryAbi,
  marketFactoryBytecode,
  poolQuoteAbi,
  poolQuoteBytecode,
  flashHelperAbi,
  flashHelperBytecode,
  nftEscrowAbi,
  nftEscrowBytecode,
  stakeVaultAbi,
  stakeVaultBytecode,
  ballotAbi,
  ballotBytecode,
  poolBuyerAbi,
  poolBuyerBytecode,
} from '@/lib/market/isolatedArtifact';
import { EXTRAS_KEY, ISOLATED_KEY } from '@/lib/market/isolated';
import { v4MarketAbi, v4MarketBytecode } from '@/lib/market/v4MarketArtifact';
import { LENDING_POOL, USDC, lendingPoolAbi } from '@/lib/market/pool';
import { formatUsd } from '@/lib/market/quote';
import { ARC_TOKENS, MAX_SLIPPAGE_BPS, TWAP_WINDOW_SECONDS } from '@/lib/market/tokens';

const V4_MANAGER = '0x8366a39CC670B4001A1121B8F6A443A643e40951' as const;
const V4_STATE = '0xF3334192D15450CdD385c8B70e03f9A6bD9E673b' as const;
const ADMIN = '0xA4d36d0D15E0B36544Ad536DcA518e1Ff0Df0d96';

const STORED_POOL = 'bagfi.admin.pool.v2';

type Hex = `0x${string}`;

interface KeeperStatus {
  pool: Hex | null;
  keeper: Hex | null;
  keeperUsdc: string | null;
  openLoans: number | null;
}

function usdc(units: bigint | undefined): string {
  if (units === undefined) return '—';
  return formatUsd(Number(formatUnits(units, 6)));
}

function shortError(error: unknown): string {
  if (error && typeof error === 'object' && 'shortMessage' in error && typeof error.shortMessage === 'string') {
    return error.shortMessage;
  }
  if (error instanceof Error) return error.message;
  return 'The transaction was not sent.';
}

function Closed({ connected }: { connected: boolean }) {
  return (
    <div className="cl-studio lm-market lm-admin">
      <header className="lm-bar">
        <BrandMark />
        <WalletChip />
      </header>
      <main className="lm-main">
        <h1>{connected ? 'Closed.' : 'Connect the owner wallet.'}</h1>
        {connected ? (
          <p className="lm-lead">
            <a href="/market">Back to markets</a>
          </p>
        ) : null}
      </main>
    </div>
  );
}

export function PoolAdmin() {
  const { activated, requestConnect } = useWalletSession();

  if (!activated) {
    return (
      <div className="cl-studio lm-market lm-admin">
        <header className="lm-bar">
          <BrandMark />
          <WalletChip />
        </header>
        <main className="lm-main">
          <h1>Connect the owner wallet.</h1>
          <div className="lm-actions">
            <button type="button" className="lm-btn" onClick={requestConnect}>
              Connect wallet
            </button>
          </div>
        </main>
      </div>
    );
  }

  return <OwnerAdmin />;
}

function OwnerAdmin() {
  const { address } = useAccount();
  const allowed = Boolean(address && address.toLowerCase() === ADMIN.toLowerCase());
  if (!address) return <Closed connected={false} />;
  if (!allowed) return <Closed connected />;

  return (
    <div className="cl-studio lm-market lm-admin">
      <header className="lm-bar">
        <BrandMark />
        <nav className="lm-nav" aria-label="Admin">
          <a href="#deploy">Pool</a>
          <a href="#markets">Markets</a>
          <a href="#liquidity">Liquidity</a>
          <a href="#keeper">Keeper</a>
          <a href="#isolated">Isolated</a>
        </nav>
        <WalletChip />
      </header>

      <main className="lm-main">
        <p className="lm-kicker">Admin · Arc · chain {arc.id}</p>
        <h1>Get the pool running.</h1>
        <p className="lm-lead">
          Your wallet signs every step on Arc and gas is paid in USDC. The contract is unaudited and
          holds real funds. Start with small amounts.
        </p>
        <AdminLive />
      </main>
    </div>
  );
}

function AdminLive() {
  const { address, chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { deployContractAsync } = useDeployContract();
  const client = usePublicClient({ chainId: arc.id });

  const [stored, setStored] = useState<Hex | null>(null);
  const [pasted, setPasted] = useState('');
  const [treasury, setTreasury] = useState('');
  const [supplyAmount, setSupplyAmount] = useState('1');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [keeper, setKeeper] = useState<KeeperStatus | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORED_POOL);
    if (saved && isAddress(saved)) setStored(saved);
    fetch('/cron/keeper', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((body: KeeperStatus | null) => setKeeper(body))
      .catch(() => setKeeper(null));
  }, []);

  useEffect(() => {
    if (address && !treasury) setTreasury(address);
  }, [address, treasury]);

  const pool: Hex | null = stored ?? LENDING_POOL;
  const onPool = { address: pool ?? undefined, abi: lendingPoolAbi, chainId: arc.id, query: { enabled: Boolean(pool) } } as const;

  const ownerRead = useReadContract({ ...onPool, functionName: 'owner' });
  const treasuryRead = useReadContract({ ...onPool, functionName: 'treasury' });
  const borrowedRead = useReadContract({ ...onPool, functionName: 'borrowed' });
  const totalRead = useReadContract({ ...onPool, functionName: 'totalAssets' });
  const versionRead = useReadContract({ ...onPool, functionName: 'openLoanIds' });
  const sharesRead = useReadContract({
    ...onPool,
    functionName: 'sharesOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(pool && address) },
  });
  const assetReads = useReadContracts({
    contracts: ARC_TOKENS.map((token) => ({
      address: pool!,
      abi: lendingPoolAbi,
      functionName: 'assets' as const,
      args: [token.address] as const,
      chainId: arc.id,
    })),
    query: { enabled: Boolean(pool) },
  });
  const priceReads = useReadContracts({
    contracts: ARC_TOKENS.map((token) => ({
      address: pool!,
      abi: lendingPoolAbi,
      functionName: 'priceOf' as const,
      args: [token.address] as const,
      chainId: arc.id,
    })),
    query: { enabled: Boolean(pool) },
  });

  const { data: cash, refetch: refetchCash } = useReadContract({
    address: USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: pool ? [pool] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(pool) },
  });

  const { data: myUsdc, refetch: refetchMine } = useReadContract({
    address: USDC,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address) },
  });
  const owner = ownerRead.data;
  const isOwner = Boolean(owner && address && owner.toLowerCase() === address.toLowerCase());
  const legacy = Boolean(pool) && versionRead.isError;
  const myShares = sharesRead.data ?? 0n;

  const supplyRaw = useMemo(() => {
    try {
      return supplyAmount && Number(supplyAmount) > 0 ? parseUnits(supplyAmount.replace(',', '.'), 6) : 0n;
    } catch {
      return 0n;
    }
  }, [supplyAmount]);

  async function run(label: string, action: () => Promise<string | void>) {
    if (!client) return;
    setBusy(label);
    setError(null);
    setNote(null);
    try {
      if (chainId !== arc.id) await switchChainAsync({ chainId: arc.id });
      const message = await action();
      if (message) setNote(message);
      await Promise.all([
        ownerRead.refetch(),
        treasuryRead.refetch(),
        borrowedRead.refetch(),
        totalRead.refetch(),
        versionRead.refetch(),
        sharesRead.refetch(),
        assetReads.refetch(),
        priceReads.refetch(),
        refetchCash(),
        refetchMine(),
      ]);
    } catch (cause) {
      setError(shortError(cause));
    } finally {
      setBusy(null);
    }
  }

  async function confirm(hash: Hex) {
    const receipt = await client!.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('The transaction reverted on Arc.');
    return receipt;
  }

  function remember(next: Hex) {
    setStored(next);
    window.localStorage.setItem(STORED_POOL, next);
  }

  const canSend = isConnected && busy === null;
  const siteUsesPool = Boolean(pool && LENDING_POOL && pool.toLowerCase() === LENDING_POOL.toLowerCase());

  const deployForm = (
    <>
      <label className="lm-field">
        Treasury
        <input value={treasury} onChange={(event) => setTreasury(event.target.value.trim())} spellCheck={false} />
      </label>
      <div className="lm-actions">
        <button
          type="button"
          className="lm-btn"
          disabled={!canSend || !isAddress(treasury)}
          onClick={() =>
            void run('deploy', async () => {
              const hash = await deployContractAsync({
                abi: lendingPoolAbi,
                bytecode: lendingPoolBytecode,
                args: [USDC, treasury as Hex],
                chainId: arc.id,
              });
              const receipt = await confirm(hash);
              if (!receipt.contractAddress) throw new Error('Arc did not return the contract address.');
              remember(receipt.contractAddress);
              return `Pool deployed at ${receipt.contractAddress}. Send this address to whoever runs the site.`;
            })
          }
        >
          {busy === 'deploy' ? 'Deploying…' : 'Deploy LendingPool'}
        </button>
      </div>
      <label className="lm-field">
        Already deployed? Paste the address
        <input value={pasted} onChange={(event) => setPasted(event.target.value.trim())} placeholder="0x…" spellCheck={false} />
      </label>
      <div className="lm-actions">
        <button type="button" className="lm-btn lm-btn-secondary" disabled={!isAddress(pasted)} onClick={() => remember(pasted as Hex)}>
          Use this address
        </button>
      </div>
    </>
  );

  return (
    <>
      <p className="lm-meta lm-balances">
        {isConnected ? `Your USDC on Arc: ${usdc(myUsdc)}.` : 'Wallet not connected.'}{' '}
        {chainId !== arc.id && isConnected ? 'Your wallet is not on Arc; it will switch when you sign.' : null}
      </p>
      <div aria-live="polite">
        {error ? <p className="lm-error">{error}</p> : null}
        {note ? <p className="lm-meta">{note}</p> : null}
      </div>

      <section id="deploy" className="lm-panel">
        <div className="lm-panel-copy">
          <h2>1. Pool</h2>
          {!pool ? (
            <>
              <p>
                Deploys LendingPool with Arc's USDC (<code>{USDC}</code>). The treasury receives 20% of
                every fee.
              </p>
              {deployForm}
            </>
          ) : legacy ? (
            <>
              <p>
                The site uses the previous pool version (<code>{pool}</code>), with manually set prices
                and no automatic liquidation.
              </p>
              <p className="lm-meta">
                Your deposit there: {myShares > 0n ? `${formatUnits(myShares, 6)} USDC` : 'none'}. Withdraw
                it, then deploy the new version.
              </p>
              <div className="lm-actions">
                <button
                  type="button"
                  className="lm-btn lm-btn-secondary"
                  disabled={!canSend || myShares === 0n}
                  onClick={() =>
                    void run('legacy-withdraw', async () => {
                      await confirm(
                        await writeContractAsync({
                          address: pool,
                          abi: lendingPoolAbi,
                          functionName: 'withdraw',
                          args: [myShares],
                          chainId: arc.id,
                        }),
                      );
                      return 'You withdrew your deposit from the previous pool.';
                    })
                  }
                >
                  {busy === 'legacy-withdraw' ? 'Withdrawing…' : 'Withdraw my deposit'}
                </button>
              </div>
              <h2>New version</h2>
              {deployForm}
            </>
          ) : (
            <>
              <p>
                Pool: <code>{pool}</code>
              </p>
              <p className="lm-meta">
                Owner: {owner ?? '—'} {owner ? (isOwner ? '(this wallet)' : '(another wallet)') : ''}
                <br />
                Treasury: {treasuryRead.data ?? '—'}
              </p>
              {siteUsesPool ? (
                <p className="lm-meta">The site already uses this pool.</p>
              ) : (
                <p className="lm-meta">
                  Not on the site yet: set <code>NEXT_PUBLIC_LENDING_POOL={pool}</code> in Vercel and
                  redeploy.
                </p>
              )}
              {stored ? (
                <div className="lm-actions">
                  <button
                    type="button"
                    className="lm-btn lm-btn-secondary"
                    onClick={() => {
                      window.localStorage.removeItem(STORED_POOL);
                      setStored(null);
                    }}
                  >
                    Forget this address
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
        <dl className="lm-quote">
          <div>
            <dt>USDC in the pool</dt>
            <dd>{pool ? usdc(cash) : '—'}</dd>
          </div>
          <div>
            <dt>Lent</dt>
            <dd>{pool ? usdc(borrowedRead.data) : '—'}</dd>
          </div>
          <div>
            <dt>Suppliers' total</dt>
            <dd>{pool ? usdc(totalRead.data) : '—'}</dd>
          </div>
        </dl>
      </section>

      {pool && !legacy && isOwner ? (
        <section id="isolated" className="lm-panel">
          <div className="lm-panel-copy">
            <h2>Isolated markets</h2>
            <p>
              Deploys a price reader on this pool, a factory, a leverage router, and one USDC market for
              COOL, LONG, ARCAT, ARCANINE and BAGFI. Your wallet signs each transaction. The borrow rate starts
              near 0% and can reach 40% when a market is fully lent. 20% of the interest goes to the treasury.
            </p>
            <div className="lm-actions">
              <button
                type="button"
                className="lm-btn"
                disabled={!canSend || !isAddress(treasury)}
                onClick={() =>
                  void run('isolated', async () => {
                    const quoteReceipt = await confirm(
                      await deployContractAsync({ abi: poolQuoteAbi, bytecode: poolQuoteBytecode, args: [pool], chainId: arc.id }),
                    );
                    const quote = quoteReceipt.contractAddress;
                    if (!quote) throw new Error('Arc did not return the quote address.');
                    const factoryReceipt = await confirm(
                      await deployContractAsync({
                        abi: marketFactoryAbi,
                        bytecode: marketFactoryBytecode,
                        args: [USDC, address!],
                        chainId: arc.id,
                      }),
                    );
                    const factory = factoryReceipt.contractAddress;
                    if (!factory) throw new Error('Arc did not return the factory address.');
                    const routerReceipt = await confirm(
                      await deployContractAsync({ abi: leverageRouterAbi, bytecode: leverageRouterBytecode, args: [USDC], chainId: arc.id }),
                    );
                    const router = routerReceipt.contractAddress;
                    if (!router) throw new Error('Arc did not return the router address.');
                    for (const token of ARC_TOKENS) {
                      await confirm(
                        await writeContractAsync({
                          address: factory,
                          abi: marketFactoryAbi,
                          functionName: 'create',
                          args: [token.address, quote, treasury as Hex, 3000, 5000, 500, 8000, 1000, 4000, 2000],
                          chainId: arc.id,
                        }),
                      );
                    }
                    window.localStorage.setItem(ISOLATED_KEY, JSON.stringify({ factory, quote, router }));
                    return `Isolated markets are live. Factory ${factory}.`;
                  })
                }
              >
                {busy === 'isolated' ? 'Deploying…' : 'Deploy isolated markets'}
              </button>
              <button
                type="button"
                className="lm-btn lm-btn-secondary"
                disabled={!canSend}
                onClick={() =>
                  void run('extras', async () => {
                    const flashReceipt = await confirm(
                      await deployContractAsync({ abi: flashHelperAbi, bytecode: flashHelperBytecode, args: [], chainId: arc.id }),
                    );
                    const nftReceipt = await confirm(
                      await deployContractAsync({ abi: nftEscrowAbi, bytecode: nftEscrowBytecode, args: [USDC], chainId: arc.id }),
                    );
                    const vaultReceipt = await confirm(
                      await deployContractAsync({ abi: stakeVaultAbi, bytecode: stakeVaultBytecode, args: [USDC], chainId: arc.id }),
                    );
                    const vault = vaultReceipt.contractAddress;
                    if (!flashReceipt.contractAddress || !nftReceipt.contractAddress || !vault) {
                      throw new Error('Arc did not return a contract address.');
                    }
                    const ballotReceipt = await confirm(
                      await deployContractAsync({ abi: ballotAbi, bytecode: ballotBytecode, args: [vault], chainId: arc.id }),
                    );
                    if (!ballotReceipt.contractAddress) throw new Error('Arc did not return the ballot address.');
                    const buyerReceipt = await confirm(
                      await deployContractAsync({ abi: poolBuyerAbi, bytecode: poolBuyerBytecode, args: [USDC], chainId: arc.id }),
                    );
                    const buyer = buyerReceipt.contractAddress;
                    if (!buyer) throw new Error('Arc did not return the buyer address.');
                    const cool = ARC_TOKENS[0];
                    await confirm(
                      await writeContractAsync({
                        address: buyer,
                        abi: poolBuyerAbi,
                        functionName: 'setPool',
                        args: [cool.address, cool.market, false],
                        chainId: arc.id,
                      }),
                    );
                    const extras = {
                      flash: flashReceipt.contractAddress,
                      nft: nftReceipt.contractAddress,
                      vault,
                      ballot: ballotReceipt.contractAddress,
                      buyer,
                    };
                    window.localStorage.setItem(EXTRAS_KEY, JSON.stringify(extras));
                    return `Flash helper ${extras.flash}. NFT escrow ${extras.nft}. Stake vault ${extras.vault}. Ballot ${extras.ballot}.`;
                  })
                }
              >
                {busy === 'extras' ? 'Deploying…' : 'Deploy flash, NFT, stake and vote'}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {pool && !legacy ? (
        <>
          <section id="markets" className="lm-panel lm-loans">
            <div>
              <h2>2. Markets</h2>
              <p>
                Each token takes its price from its market on Arc, averaged over 30 minutes, and is sold
                there on liquidation. Activating a market takes one signature per token.
              </p>
              {!isOwner ? <p className="lm-error">Only the pool owner can activate markets.</p> : null}
              <ul className="lm-bands">
                {ARC_TOKENS.map((token, index) => {
                  const row = assetReads.data?.[index]?.result as readonly [boolean, number, number, boolean, number, number, number, Hex] | undefined;
                  const price = priceReads.data?.[index]?.result as readonly [bigint, bigint] | undefined;
                  const active = Boolean(row?.[0]);
                  const configured = Boolean(row && row[2] !== 0);
                  const status = active
                    ? `active · ${token.marketName}${price ? ` · ${Number(formatUnits(price[0], 6)).toPrecision(3)} USDC` : ' · price pending'}`
                    : configured
                      ? 'paused'
                      : 'not active';
                  const configure = (enabled: boolean) =>
                    void run(`${enabled ? 'on' : 'off'}-${token.symbol}`, async () => {
                      await confirm(
                        await writeContractAsync({
                          address: pool,
                          abi: lendingPoolAbi,
                          functionName: 'setCollateral',
                          args: [
                            token.address,
                            token.market,
                            token.venue,
                            token.swapFeeBps,
                            MAX_SLIPPAGE_BPS,
                            TWAP_WINDOW_SECONDS,
                            enabled ? token.cardinality : 0,
                            enabled,
                          ],
                          chainId: arc.id,
                        }),
                      );
                      return enabled
                        ? `${token.symbol} active.${token.venue === 2 ? ' Its average price is ready in 30 minutes.' : ''}`
                        : `${token.symbol} paused. Open loans can still be repaid and liquidated.`;
                    });
                  return (
                    <li key={token.symbol}>
                      <strong>{token.symbol}</strong>
                      <span>{status}</span>
                      {token.v4PoolId && token.v4Fee !== undefined && token.v4TickSpacing !== undefined && token.v4Hooks && !configured ? (
                        <button
                          type="button"
                          className="lm-btn"
                          disabled={!isOwner || !canSend || !pool}
                          onClick={() =>
                            void run(`v4-${token.symbol}`, async () => {
                              const deployed = await confirm(
                                await deployContractAsync({
                                  abi: v4MarketAbi,
                                  bytecode: v4MarketBytecode,
                                  args: [token.address, USDC, V4_MANAGER, V4_STATE, token.v4PoolId!, token.v4Fee!, token.v4TickSpacing!, token.v4Hooks!],
                                  chainId: arc.id,
                                }),
                              );
                              const reader = deployed.contractAddress;
                              if (!reader) throw new Error('Arc did not return the reader address.');
                              await confirm(
                                await writeContractAsync({
                                  address: pool!,
                                  abi: lendingPoolAbi,
                                  functionName: 'setCollateral',
                                  args: [token.address, reader, 1, 0, MAX_SLIPPAGE_BPS, TWAP_WINDOW_SECONDS, 0, true],
                                  chainId: arc.id,
                                }),
                              );
                              return `${token.symbol} reads ${reader}. Borrow pays USDC from the shared pool.`;
                            })
                          }
                        >
                          {busy === `v4-${token.symbol}` ? 'Connecting…' : 'Use v4 pool'}
                        </button>
                      ) : active ? (
                        <button type="button" className="lm-btn lm-btn-secondary" disabled={!isOwner || !canSend} onClick={() => configure(false)}>
                          {busy === `off-${token.symbol}` ? 'Pausing…' : 'Pause'}
                        </button>
                      ) : (
                        <button type="button" className="lm-btn" disabled={!isOwner || !canSend} onClick={() => configure(true)}>
                          {busy === `on-${token.symbol}` ? 'Activating…' : 'Activate'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>

          <section id="liquidity" className="lm-panel">
            <div className="lm-panel-copy">
              <h2>3. Liquidity</h2>
              <p>What you supply is the most the pool can lend. Keep some in your wallet for gas.</p>
              <label className="lm-field">
                USDC to supply
                <input inputMode="decimal" value={supplyAmount} onChange={(event) => setSupplyAmount(event.target.value)} />
              </label>
              <div className="lm-actions">
                <button
                  type="button"
                  className="lm-btn"
                  disabled={!canSend || supplyRaw === 0n || (myUsdc !== undefined && myUsdc < supplyRaw)}
                  onClick={() =>
                    void run('supply', async () => {
                      const allowance = await client!.readContract({
                        address: USDC,
                        abi: erc20Abi,
                        functionName: 'allowance',
                        args: [address!, pool],
                      });
                      if (allowance < supplyRaw) {
                        await confirm(
                          await writeContractAsync({
                            address: USDC,
                            abi: erc20Abi,
                            functionName: 'approve',
                            args: [pool, supplyRaw],
                            chainId: arc.id,
                          }),
                        );
                      }
                      await confirm(
                        await writeContractAsync({
                          address: pool,
                          abi: lendingPoolAbi,
                          functionName: 'supply',
                          args: [supplyRaw],
                          chainId: arc.id,
                        }),
                      );
                      return `You supplied ${usdc(supplyRaw)} USDC.`;
                    })
                  }
                >
                  {busy === 'supply' ? 'Supplying…' : 'Approve and supply'}
                </button>
              </div>
              {myUsdc !== undefined && myUsdc < supplyRaw ? (
                <p className="lm-error">You don't have that much USDC on Arc. Keep some for gas.</p>
              ) : null}
            </div>
            <dl className="lm-quote">
              <div>
                <dt>Your USDC</dt>
                <dd>{usdc(myUsdc)}</dd>
              </div>
            </dl>
          </section>
        </>
      ) : null}

      <section id="keeper" className="lm-panel">
        <div className="lm-panel-copy">
          <h2>Keeper</h2>
          <p>
            Every 15 seconds the keeper checks the pool: it refreshes the ARCAT price and liquidates
            loans that are past due or below the minimum. It pays gas from its own wallet and keeps 1%
            of each sale.
          </p>
          {keeper?.keeper ? (
            <p className="lm-meta">
              Keeper wallet: <code>{keeper.keeper}</code>
              <br />
              USDC for gas: {keeper.keeperUsdc ?? '—'}
              {keeper.keeperUsdc !== null && Number(keeper.keeperUsdc) < 0.2 ? ' · send it at least 1 USDC on Arc.' : ''}
            </p>
          ) : (
            <p className="lm-error">The keeper has no wallet configured on the site yet.</p>
          )}
        </div>
        <dl className="lm-quote">
          <div>
            <dt>Open loans</dt>
            <dd>{keeper?.openLoans ?? '—'}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}
