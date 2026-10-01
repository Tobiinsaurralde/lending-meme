'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BaseError,
  ContractFunctionRevertedError,
  erc20Abi,
  formatUnits,
  isAddress,
  parseAbi,
  parseUnits,
  type Address,
} from 'viem';
import { useAccount, useDeployContract, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { WalletChip } from '@/components/studio/wallet/WalletChip';
import { BrandMark, MarketNav } from '@/components/market/MarketChrome';
import { poolClient } from '@/components/market/MarketsBoard';
import { useWalletSession } from '@/lib/studio/wallet-session';
import { ARC_USDC, arc } from '@/lib/market/arc';
import {
  BAGFI_OWNER,
  DEVELOPER_INBOX,
  INBOX_STORAGE,
  developerInboxAbi,
  developerInboxBytecode,
} from '@/lib/market/developerInbox';
import { LENDING_POOL, USDC, lendingPoolAbi } from '@/lib/market/pool';
import { TIERS, formatUsd, type TierId } from '@/lib/market/quote';
import { ARC_TOKENS, type ArcToken } from '@/lib/market/tokens';

const TIER_INDEX: Record<TierId, number> = { express: 0, quick: 1, standard: 2 };
const ZERO = '0x0000000000000000000000000000000000000000';

const metaAbi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
]);
const pairAbi = parseAbi([
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)',
]);

const POOL_ERRORS: Record<string, string> = {
  NotEnabled: 'This token is not active in the pool yet.',
  OracleUnavailable: 'The average price is updating. Try again in a few minutes.',
  NoLiquidity: 'The pool does not have enough USDC for that amount.',
  BadInput: 'Check the amount.',
  Insolvent: 'That amount is over the limit for this market.',
  Exists: 'You already have an open request for this token.',
  NotOwner: 'Only the BagFi owner can do that.',
  ClosedRequest: 'That request is already closed.',
};

type Found = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  listed: ArcToken | null;
  enabled: boolean;
};

type RequestRow = {
  id: number;
  applicant: Address;
  token: Address;
  pool: Address;
  venue: number;
  createdAt: number;
  open: boolean;
  project: string;
  contact: string;
};

function shortError(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk((item) => item instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && POOL_ERRORS[name]) return POOL_ERRORS[name];
    }
  }
  if (error && typeof error === 'object' && 'shortMessage' in error && typeof error.shortMessage === 'string') {
    return error.shortMessage;
  }
  if (error instanceof Error) return error.message;
  return 'The transaction was not sent.';
}

function usdc(units: bigint | undefined): string {
  if (units === undefined) return '—';
  return formatUsd(Number(formatUnits(units, 6)));
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function storedInbox(): Address | null {
  if (typeof window === 'undefined') return DEVELOPER_INBOX;
  const saved = window.localStorage.getItem(INBOX_STORAGE);
  if (saved && isAddress(saved)) return saved;
  return DEVELOPER_INBOX;
}

async function lookupToken(raw: string): Promise<Found> {
  const text = raw.trim();
  const listedBySymbol = ARC_TOKENS.find((token) => token.symbol.toLowerCase() === text.toLowerCase());
  const address = listedBySymbol?.address ?? (isAddress(text) ? text : null);
  if (!address) throw new Error('Paste the token contract address on Arc.');
  if (address.toLowerCase() === ARC_USDC.toLowerCase()) {
    throw new Error('That is USDC, the asset BagFi lends. Paste your project token.');
  }

  const [name, symbol, decimals] = await Promise.all([
    poolClient.readContract({ address, abi: metaAbi, functionName: 'name' }),
    poolClient.readContract({ address, abi: metaAbi, functionName: 'symbol' }),
    poolClient.readContract({ address, abi: metaAbi, functionName: 'decimals' }),
  ]);
  if (decimals > 36) throw new Error('This token uses an unsupported decimal count.');

  const listed = ARC_TOKENS.find((token) => token.address.toLowerCase() === address.toLowerCase()) ?? null;
  const asset = LENDING_POOL
    ? await poolClient
        .readContract({
          address: LENDING_POOL,
          abi: lendingPoolAbi,
          functionName: 'assets',
          args: [address],
        })
        .catch(() => null)
    : null;

  return {
    address,
    name: name || 'Token',
    symbol: symbol || shortAddress(address),
    decimals,
    listed,
    enabled: Boolean(asset?.[0]),
  };
}

async function readPoolVenue(pool: Address, token: Address): Promise<number> {
  const [token0, token1] = await Promise.all([
    poolClient.readContract({ address: pool, abi: pairAbi, functionName: 'token0' }),
    poolClient.readContract({ address: pool, abi: pairAbi, functionName: 'token1' }),
  ]);
  const sides = [token0.toLowerCase(), token1.toLowerCase()];
  if (!sides.includes(token.toLowerCase()) || !sides.includes(USDC.toLowerCase())) {
    throw new Error('That pool is not this token against USDC.');
  }
  try {
    await poolClient.readContract({ address: pool, abi: pairAbi, functionName: 'slot0' });
    return 1;
  } catch {
    return 2;
  }
}

async function loadRequests(inbox: Address): Promise<RequestRow[]> {
  const count = Number(
    await poolClient.readContract({ address: inbox, abi: developerInboxAbi, functionName: 'nextId' }),
  );
  if (!Number.isFinite(count) || count <= 0) return [];
  const start = Math.max(0, count - 30);
  const rows = await poolClient.multicall({
    allowFailure: true,
    contracts: Array.from({ length: count - start }, (_, index) => ({
      address: inbox,
      abi: developerInboxAbi,
      functionName: 'requests' as const,
      args: [BigInt(start + index)] as const,
    })),
  });
  return rows.flatMap((entry, index) => {
    const row = entry.result as
      | readonly [Address, Address, Address, number, bigint, boolean, string, string]
      | undefined;
    if (!row || row[0] === ZERO) return [];
    return [
      {
        id: start + index,
        applicant: row[0],
        token: row[1],
        pool: row[2],
        venue: Number(row[3]),
        createdAt: Number(row[4]),
        open: row[5],
        project: row[6],
        contact: row[7],
      },
    ];
  });
}

function venueLabel(venue: number): string {
  if (venue === 1) return 'Uniswap V3';
  if (venue === 2) return 'V2 pair';
  return 'Pool not set';
}

function useDeskTx() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync, isPending: switching } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();
  const client = usePublicClient({ chainId: arc.id });
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onArc = chainId === arc.id;

  async function confirmed(hash: `0x${string}`) {
    if (!client) throw new Error('Arc is not connected.');
    const receipt = await client.waitForTransactionReceipt({ hash });
    if (receipt.status !== 'success') throw new Error('The transaction reverted on Arc.');
    return receipt;
  }

  async function run(action: () => Promise<string>) {
    setError(null);
    setNote(null);
    setBusy(true);
    try {
      if (chainId !== arc.id) await switchChainAsync({ chainId: arc.id });
      setNote(await action());
    } catch (cause) {
      setError(shortError(cause));
    } finally {
      setBusy(false);
    }
  }

  return { isConnected, onArc, switching, isPending, busy, error, note, run, writeContractAsync, confirmed, setNote };
}

function statusCopy(found: Found, connected: boolean): string {
  if (found.listed && found.enabled) {
    return connected
      ? 'BagFi already lends against this token. The loan uses the shared USDC pool.'
      : 'BagFi already lends against this token. Connect the wallet that holds it to borrow.';
  }
  if (found.listed) return 'BagFi already has this token. Borrow opens when its market is active.';
  return connected
    ? 'This token is not listed yet. Send a request with the public team behind it. BagFi opens the market after that check.'
    : 'This token is not listed yet. Connect to send a request. The team behind the token has to be public.';
}

function SharedBorrow({ token }: { token: ArcToken }) {
  const tx = useDeskTx();
  const { address } = useAccount();
  const [amount, setAmount] = useState('100');
  const [tierId, setTierId] = useState<TierId>('quick');
  const tierIndex = TIER_INDEX[tierId];
  const tier = TIERS[tierIndex];
  const pool = LENDING_POOL;

  const amountRaw = useMemo(() => {
    try {
      if (!amount || Number(amount) <= 0) return 0n;
      return parseUnits(amount, token.decimals);
    } catch {
      return 0n;
    }
  }, [amount, token.decimals]);

  const { data: asset } = useReadContract({
    address: pool ?? undefined,
    abi: lendingPoolAbi,
    functionName: 'assets',
    args: [token.address],
    chainId: arc.id,
    query: { enabled: Boolean(pool) },
  });
  const enabled = Boolean(asset?.[0]);
  const { data: allowance, refetch } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address && pool ? [address, pool] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address && pool) },
  });
  const preview = useReadContract({
    address: pool ?? undefined,
    abi: lendingPoolAbi,
    functionName: 'previewBorrow',
    args: [token.address, amountRaw, tierIndex],
    chainId: arc.id,
    query: { enabled: Boolean(pool) && enabled && amountRaw > 0n, retry: false },
  });
  const terms = preview.data as readonly [bigint, bigint, bigint, bigint, bigint] | undefined;
  const needsApproval = pool !== null && (allowance ?? 0n) < amountRaw;

  function label() {
    if (!pool) return 'Pool not deployed';
    if (!enabled) return 'Token has no active market';
    if (needsApproval) return `Approve ${token.symbol === 'USDC' ? token.name : token.symbol}`;
    return 'Borrow USDC';
  }

  return (
    <section className="lm-panel" id="developer-borrow">
      <div className="lm-panel-copy">
        <h2>Borrow USDC</h2>
        <p>
          Your collateral stays in the pool until you repay the principal. You receive the principal
          minus the fee. If you miss the due date, or the token falls to half the value backing the
          debt, the pool sells it and you lose all of the collateral.
        </p>
        <label className="lm-field">
          {token.symbol === 'USDC' ? token.name : token.symbol} amount
          <input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </label>
        <div className="lm-tiers" role="radiogroup" aria-label="Loan tier">
          {TIERS.map((item) => (
            <label key={item.id} className={item.id === tierId ? 'is-on' : undefined}>
              <input
                type="radio"
                name="developer-tier"
                value={item.id}
                checked={item.id === tierId}
                onChange={() => setTierId(item.id)}
              />
              <strong>{item.name}</strong>
              <span>{item.ltvBps / 100}% LTV</span>
              <span>
                {item.days} days · {(item.feeBps / 100).toFixed(1)}%
              </span>
            </label>
          ))}
        </div>
        <div className="lm-actions">
          {!tx.onArc && tx.isConnected ? (
            <button
              type="button"
              className="lm-btn"
              disabled={tx.switching}
              onClick={() => void tx.run(async () => 'Switched to Arc.')}
            >
              Switch to Arc
            </button>
          ) : null}
          <button
            type="button"
            className="lm-btn"
            disabled={!pool || !enabled || amountRaw === 0n || !tx.isConnected || tx.isPending || tx.busy || (!needsApproval && !terms)}
            onClick={() =>
              void tx.run(async () => {
                if (!pool) return 'Pool not deployed';
                if ((allowance ?? 0n) < amountRaw) {
                  await tx.confirmed(
                    await tx.writeContractAsync({
                      address: token.address,
                      abi: erc20Abi,
                      functionName: 'approve',
                      args: [pool, amountRaw],
                      chainId: arc.id,
                    }),
                  );
                }
                await tx.confirmed(
                  await tx.writeContractAsync({
                    address: pool,
                    abi: lendingPoolAbi,
                    functionName: 'borrow',
                    args: [token.address, amountRaw, tierIndex],
                    chainId: arc.id,
                  }),
                );
                await refetch();
                return 'Loan sent.';
              })
            }
          >
            {label()}
          </button>
        </div>
        {preview.error && enabled ? <p className="lm-error">{shortError(preview.error)}</p> : null}
        <DeskMessages error={tx.error} note={tx.note} />
      </div>
      <dl className="lm-quote">
        <div>
          <dt>You receive</dt>
          <dd>{terms ? `${usdc(terms[3])} USDC` : '—'}</dd>
        </div>
        <div>
          <dt>Fee</dt>
          <dd>{terms ? usdc(terms[2]) : '—'}</dd>
        </div>
        <div>
          <dt>You repay</dt>
          <dd>{terms ? `${usdc(terms[1])} in ${tier.days} days` : '—'}</dd>
        </div>
        <div>
          <dt>Term</dt>
          <dd>{tier.name}</dd>
        </div>
      </dl>
    </section>
  );
}

function RequestForm({ found, inbox, onSent }: { found: Found; inbox: Address | null; onSent: () => void }) {
  const tx = useDeskTx();
  const [project, setProject] = useState('');
  const [contact, setContact] = useState('');
  const [pool, setPool] = useState('');
  const [doxxed, setDoxxed] = useState(false);

  return (
    <section className="lm-panel">
      <div className="lm-panel-copy">
        <h2>Request a market</h2>
        <p>
          BagFi only opens a market for a doxxed token: the team behind it is public. Put that name and
          an X profile here. This transaction only records the request. It does not move your tokens or
          USDC, and it does not open the loan by itself.
        </p>
        <label className="lm-field">
          Project name
          <input value={project} maxLength={64} onChange={(event) => setProject(event.target.value)} />
        </label>
        <label className="lm-field">
          Public team, name and X
          <input value={contact} maxLength={80} onChange={(event) => setContact(event.target.value)} placeholder="Name, @handle" />
        </label>
        <label className="lm-check">
          <input type="checkbox" checked={doxxed} onChange={(event) => setDoxxed(event.target.checked)} />
          The team behind this token is public
        </label>
        <label className="lm-field">
          USDC pool on Arc
          <input
            value={pool}
            spellCheck={false}
            placeholder="0x… optional"
            onChange={(event) => setPool(event.target.value.trim())}
          />
        </label>
        <div className="lm-actions">
          <button
            type="button"
            className="lm-btn"
            disabled={!inbox || !tx.isConnected || tx.isPending || tx.busy || !doxxed || project.trim() === '' || contact.trim() === ''}
            onClick={() =>
              void tx.run(async () => {
                if (!inbox) return 'The request desk is not on Arc yet.';
                let venue = 0;
                let poolAddress = ZERO as Address;
                if (pool) {
                  if (!isAddress(pool)) throw new Error('Paste the pool address, or leave it empty.');
                  venue = await readPoolVenue(pool, found.address);
                  poolAddress = pool;
                }
                await tx.confirmed(
                  await tx.writeContractAsync({
                    address: inbox,
                    abi: developerInboxAbi,
                    functionName: 'submit',
                    args: [found.address, poolAddress, venue, project.trim(), contact.trim()],
                    chainId: arc.id,
                  }),
                );
                onSent();
                return 'Request sent. BagFi checks that the team is public before the token can be borrowed against.';
              })
            }
          >
            {inbox ? 'Send request' : 'Request desk is not on Arc yet'}
          </button>
        </div>
        <DeskMessages error={tx.error} note={tx.note} />
      </div>
      <dl className="lm-quote">
        <div>
          <dt>Token</dt>
          <dd>{found.symbol}</dd>
        </div>
        <div>
          <dt>Contract</dt>
          <dd>{shortAddress(found.address)}</dd>
        </div>
        <div>
          <dt>What happens next</dt>
          <dd>BagFi checks the public team</dd>
        </div>
      </dl>
    </section>
  );
}

function DeskMessages({ error, note }: { error: string | null; note: string | null }) {
  return (
    <div aria-live="polite">
      {error ? <p className="lm-error">{error}</p> : null}
      {note ? <p className="lm-meta">{note}</p> : null}
    </div>
  );
}

function RequestTable({ rows }: { rows: RequestRow[] }) {
  if (rows.length === 0) return <p className="lm-meta">No requests yet.</p>;
  return (
    <div className="lm-dev-book" role="table" aria-label="Token requests">
      {rows.map((row) => (
        <div className="lm-dev-row" role="row" key={row.id}>
          <span role="cell">
            <strong>{row.project}</strong>
            <small>{row.contact}</small>
          </span>
          <span role="cell">
            <strong>{shortAddress(row.token)}</strong>
            <small>{venueLabel(row.venue)}</small>
          </span>
          <span role="cell">
            <strong>{shortAddress(row.applicant)}</strong>
            <small>
              {row.createdAt
                ? new Date(row.createdAt * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric' })
                : '—'}
            </small>
          </span>
          <span role="cell">
            <span className={row.open ? 'lm-pill is-live' : 'lm-pill'}>{row.open ? 'Open' : 'Closed'}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

function Connected({
  found,
  inbox,
  onInbox,
}: {
  found: Found | null;
  inbox: Address | null;
  onInbox: (next: Address) => void;
}) {
  const { address } = useAccount();
  const owner = Boolean(address && address.toLowerCase() === BAGFI_OWNER.toLowerCase());
  const [rows, setRows] = useState<RequestRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const tx = useDeskTx();
  const { deployContractAsync } = useDeployContract();
  const [pasted, setPasted] = useState('');

  useEffect(() => {
    if (!inbox) {
      setRows(null);
      return;
    }
    let live = true;
    loadRequests(inbox)
      .then((next) => {
        if (live) {
          setRows(next);
          setListError(null);
        }
      })
      .catch((cause) => {
        if (live) setListError(shortError(cause));
      });
    return () => {
      live = false;
    };
  }, [inbox, tick]);

  return (
    <>
      {found?.listed ? <SharedBorrow token={found.listed} /> : null}
      {found && !found.listed ? (
        <RequestForm found={found} inbox={inbox} onSent={() => setTick((value) => value + 1)} />
      ) : null}

      <section className="lm-panel" id="requests">
        <div className="lm-panel-copy">
          <h2>Requests</h2>
          <p>Each row is a doxxed project asking BagFi to lend USDC against its token. The owner opens the market after the team checks out.</p>
          {!inbox ? <p className="lm-meta">The request desk is not on Arc yet.</p> : null}
          {inbox && rows === null && !listError ? <p className="lm-meta">Loading requests.</p> : null}
          {inbox && rows !== null ? <RequestTable rows={rows} /> : null}
          {listError ? <p className="lm-error">{listError}</p> : null}
          {owner && inbox
            ? (rows ?? [])
                .filter((row) => row.open)
                .map((row) => (
                  <div className="lm-actions" key={`close-${row.id}`}>
                    <button
                      type="button"
                      className="lm-btn lm-btn-secondary"
                      disabled={tx.busy || tx.isPending}
                      onClick={() =>
                        void tx.run(async () => {
                          await tx.confirmed(
                            await tx.writeContractAsync({
                              address: inbox,
                              abi: developerInboxAbi,
                              functionName: 'close',
                              args: [BigInt(row.id)],
                              chainId: arc.id,
                            }),
                          );
                          setTick((value) => value + 1);
                          return `Closed the ${row.project} request.`;
                        })
                      }
                    >
                      Close {row.project}
                    </button>
                  </div>
                ))
            : null}
          <DeskMessages error={tx.error} note={tx.note} />
        </div>
        {owner ? (
          <div>
            <h2>Publish the desk</h2>
            <p>
              One transaction from this wallet deploys the request contract. After it confirms, add the
              address as NEXT_PUBLIC_DEVELOPER_INBOX and publish the site so every developer can send a request.
            </p>
            {inbox ? null : (
              <div className="lm-actions">
                <button
                  type="button"
                  className="lm-btn"
                  disabled={tx.busy || tx.isPending}
                  onClick={() =>
                    void tx.run(async () => {
                      const receipt = await tx.confirmed(
                        await deployContractAsync({
                          abi: developerInboxAbi,
                          bytecode: developerInboxBytecode,
                          args: [BAGFI_OWNER],
                          chainId: arc.id,
                        }),
                      );
                      const deployed = receipt.contractAddress;
                      if (!deployed) throw new Error('Arc did not return the contract address.');
                      window.localStorage.setItem(INBOX_STORAGE, deployed);
                      onInbox(deployed);
                      return `Request desk deployed at ${deployed}.`;
                    })
                  }
                >
                  Publish request desk
                </button>
              </div>
            )}
            <label className="lm-field">
              Already deployed? Paste the address
              <input value={pasted} spellCheck={false} placeholder="0x…" onChange={(event) => setPasted(event.target.value.trim())} />
            </label>
            <div className="lm-actions">
              <button
                type="button"
                className="lm-btn lm-btn-secondary"
                disabled={!isAddress(pasted)}
                onClick={() => {
                  if (!isAddress(pasted)) return;
                  window.localStorage.setItem(INBOX_STORAGE, pasted);
                  onInbox(pasted);
                  tx.setNote(`This browser will use ${pasted}.`);
                }}
              >
                Use this address
              </button>
            </div>
            {inbox ? <p className="lm-meta">{inbox}</p> : null}
          </div>
        ) : null}
      </section>
    </>
  );
}

export function DeveloperDesk({ embedded = false }: { embedded?: boolean }) {
  const { activated, requestConnect } = useWalletSession();
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Found | null>(null);
  const [looking, setLooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inbox, setInbox] = useState<Address | null>(DEVELOPER_INBOX);
  const [publicRows, setPublicRows] = useState<RequestRow[] | null>(null);

  useEffect(() => {
    const saved = storedInbox();
    if (saved) setInbox(saved);
  }, []);

  useEffect(() => {
    if (activated || !inbox) return;
    let live = true;
    loadRequests(inbox)
      .then((rows) => {
        if (live) setPublicRows(rows);
      })
      .catch(() => {
        if (live) setPublicRows([]);
      });
    return () => {
      live = false;
    };
  }, [activated, inbox]);

  const body = (
    <>
      <div id="developers" data-tour="developers">
        {embedded ? null : <p className="lm-kicker">Developers · Arc</p>}
        {embedded ? (
          <h2>Borrow against the token you launched.</h2>
        ) : (
          <h1>Borrow against the token you launched.</h1>
        )}
        <p className="lm-lead">
          A doxxed Arc project can post its own token as collateral and borrow USDC. The team behind the
          token is public. BagFi checks that before opening the market.
        </p>
        <ol className="lm-dev-steps">
          <li>
            <span>01</span>Paste the token contract on Arc.
          </li>
          <li>
            <span>02</span>Name the public team behind the token.
          </li>
          <li>
            <span>03</span>Send the request. BagFi opens the market after that check.
          </li>
        </ol>

        <section className="lm-panel">
          <form
            className="lm-panel-copy"
            onSubmit={(event) => {
              event.preventDefault();
              setLooking(true);
              setError(null);
              void lookupToken(query)
                .then((next) => {
                  setFound(next);
                  setError(null);
                })
                .catch((cause) => {
                  setFound(null);
                  setError(cause instanceof Error ? cause.message : 'Arc did not return that token.');
                })
                .finally(() => setLooking(false));
            }}
          >
            <h2>Your token</h2>
            <div className="lm-dev-lookup">
              <label className="lm-field">
                Token contract
                <input
                  value={query}
                  spellCheck={false}
                  placeholder="0x… or a listed symbol"
                  onChange={(event) => setQuery(event.target.value)}
                />
              </label>
              <button type="submit" className="lm-btn" disabled={looking || query.trim() === ''}>
                {looking ? 'Looking up…' : 'Look up'}
              </button>
            </div>
            {error ? <p className="lm-error">{error}</p> : null}
            {found ? (
              <div className="lm-dev-token">
                {found.listed ? <img src={found.listed.logo} alt="" width={36} height={36} /> : null}
                <span>
                  <strong>
                    {found.symbol}
                    {found.name && found.name !== found.symbol ? ` · ${found.name}` : ''}
                  </strong>
                  <small>{shortAddress(found.address)}</small>
                </span>
              </div>
            ) : null}
            {found ? <p className="lm-meta">{statusCopy(found, activated)}</p> : null}
            {found && !activated ? (
              <div className="lm-actions">
                <button type="button" className="lm-btn" onClick={requestConnect}>
                  Connect the wallet that holds the token
                </button>
              </div>
            ) : null}
          </form>
          <dl className="lm-quote">
            <div>
              <dt>Listed tokens</dt>
              <dd>Borrow here</dd>
            </div>
            <div>
              <dt>New tokens</dt>
              <dd>Request a market</dd>
            </div>
            <div>
              <dt>Chain</dt>
              <dd>Arc</dd>
            </div>
          </dl>
        </section>

        {activated ? <Connected found={found} inbox={inbox} onInbox={setInbox} /> : null}
        {!activated && inbox ? (
          <section className="lm-panel">
            <div>
              <h2>Requests</h2>
              <RequestTable rows={publicRows ?? []} />
            </div>
          </section>
        ) : null}
      </div>
    </>
  );

  if (embedded) return body;

  return (
    <div className="cl-studio lm-market">
      <header className="lm-bar">
        <BrandMark />
        <MarketNav current="developers" />
        <span>
          <WalletChip />
        </span>
      </header>
      <main className="lm-main">{body}</main>
    </div>
  );
}
