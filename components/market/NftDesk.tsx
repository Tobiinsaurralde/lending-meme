'use client';

import { useEffect, useState } from 'react';
import {
  BaseError,
  ContractFunctionRevertedError,
  erc20Abi,
  erc721Abi,
  formatUnits,
  isAddress,
  parseUnits,
  type Address,
} from 'viem';
import { useAccount, useDeployContract, usePublicClient, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { BrandMark, MarketNav } from '@/components/market/MarketChrome';
import { poolClient } from '@/components/market/MarketsBoard';
import { WalletChip } from '@/components/studio/wallet/WalletChip';
import { arc } from '@/lib/market/arc';
import { BAGFI_OWNER } from '@/lib/market/developerInbox';
import { nftEscrowAbi, nftEscrowBytecode } from '@/lib/market/isolatedArtifact';
import { NFT_ESCROW, NFT_ESCROW_KEY, storedNftEscrow, TEST_NFT_KEY } from '@/lib/market/nft';
import { testNftAbi, testNftBytecode } from '@/lib/market/testNftArtifact';
import { USDC } from '@/lib/market/pool';
import { formatUsd } from '@/lib/market/quote';
import { useWalletSession } from '@/lib/studio/wallet-session';

const ZERO = '0x0000000000000000000000000000000000000000';
const metaAbi = [
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
] as const;

type NftLoan = {
  id: number;
  lender: Address;
  borrower: Address;
  nft: Address;
  tokenId: bigint;
  principal: bigint;
  repay: bigint;
  due: bigint;
  anyId: boolean;
  filled: boolean;
  open: boolean;
};

const ERRORS: Record<string, string> = {
  BadInput: 'Check the collection, the amounts and the date.',
  NotLender: 'Only the wallet that left the USDC can do that.',
  NotBorrower: 'Only the wallet that locked the NFT can repay.',
  NotOpen: 'That offer is no longer open.',
  NotDue: 'The date has not passed yet.',
  WrongNft: 'That token is not the one this offer asked for.',
  TransferFailed: 'The USDC transfer did not go through.',
};

function shortError(error: unknown): string {
  if (error instanceof BaseError) {
    const reverted = error.walk((item) => item instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      const name = reverted.data?.errorName;
      if (name && ERRORS[name]) return ERRORS[name];
    }
  }
  if (error && typeof error === 'object' && 'shortMessage' in error && typeof error.shortMessage === 'string') {
    return error.shortMessage;
  }
  if (error instanceof Error) return error.message;
  return 'The transaction was not sent.';
}

function usdc(units: bigint): string {
  return formatUsd(Number(formatUnits(units, 6)));
}

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function dueLabel(due: bigint): string {
  return new Date(Number(due) * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function asLoan(id: number, row: unknown): NftLoan | null {
  if (!row || typeof row !== 'object') return null;
  const record = row as Record<string | number, unknown>;
  const pick = <T,>(name: string, index: number) => (record[name] ?? record[index]) as T;
  const nft = pick<Address>('nft', 2);
  if (!nft || nft.toLowerCase() === ZERO) return null;
  return {
    id,
    lender: pick<Address>('lender', 0),
    borrower: pick<Address>('borrower', 1),
    nft,
    tokenId: pick<bigint>('tokenId', 3),
    principal: pick<bigint>('principal', 4),
    repay: pick<bigint>('repay', 5),
    due: pick<bigint>('due', 6),
    anyId: Boolean(pick<boolean>('anyId', 7)),
    filled: Boolean(pick<boolean>('filled', 8)),
    open: Boolean(pick<boolean>('open', 9)),
  };
}

async function loadLoans(escrow: Address): Promise<NftLoan[]> {
  const count = await poolClient.readContract({ address: escrow, abi: nftEscrowAbi, functionName: 'loanCount' });
  const total = Number(count);
  if (total === 0) return [];
  const start = Math.max(0, total - 100);
  const rows = await poolClient.multicall({
    allowFailure: true,
    contracts: Array.from({ length: total - start }, (_, index) => ({
      address: escrow,
      abi: nftEscrowAbi,
      functionName: 'loans' as const,
      args: [BigInt(start + index)] as const,
    })),
  });
  return rows.flatMap((entry, index) => {
    const loan = asLoan(start + index, entry.result);
    return loan ? [loan] : [];
  });
}

async function loadNames(addresses: Address[]): Promise<Record<string, string>> {
  const unique = [...new Set(addresses.map((item) => item.toLowerCase() as Address))];
  if (unique.length === 0) return {};
  const rows = await poolClient.multicall({
    allowFailure: true,
    contracts: unique.flatMap((address) => [
      { address, abi: metaAbi, functionName: 'symbol' as const },
      { address, abi: metaAbi, functionName: 'name' as const },
    ]),
  });
  const names: Record<string, string> = {};
  unique.forEach((address, index) => {
    const symbol = rows[index * 2]?.result;
    const name = rows[index * 2 + 1]?.result;
    names[address] = (typeof symbol === 'string' && symbol) || (typeof name === 'string' && name) || shortAddress(address);
  });
  return names;
}

function collectionLabel(loan: NftLoan, names: Record<string, string>): string {
  return names[loan.nft.toLowerCase()] ?? shortAddress(loan.nft);
}

function tokenLabel(loan: NftLoan): string {
  if (loan.anyId && !loan.filled) return 'Any token';
  return `#${loan.tokenId.toString()}`;
}

function parseUsdc(value: string): bigint {
  if (!value || Number(value) <= 0) return 0n;
  return parseUnits(value, 6);
}

function parseTokenId(value: string): bigint | null {
  if (!/^\d+$/.test(value.trim())) return null;
  return BigInt(value.trim());
}

export function NftDesk() {
  const { activated, requestConnect } = useWalletSession();
  const [escrow, setEscrow] = useState<Address | null>(NFT_ESCROW);
  const [loans, setLoans] = useState<NftLoan[] | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});
  const [tick, setTick] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sample, setSample] = useState<{ collection: Address; tokenId: string } | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem(TEST_NFT_KEY);
    if (!raw) return;
    try {
      const saved = JSON.parse(raw) as { collection?: string; tokenId?: string };
      if (saved.collection && isAddress(saved.collection) && saved.tokenId) {
        setSample({ collection: saved.collection, tokenId: saved.tokenId });
      }
    } catch {
      /* ignore a stale test nft blob */
    }
  }, []);

  useEffect(() => {
    setEscrow(storedNftEscrow());
  }, []);

  useEffect(() => {
    if (!escrow) {
      setLoans([]);
      return;
    }
    let live = true;
    loadLoans(escrow)
      .then(async (next) => {
        if (!live) return;
        setLoans(next);
        setLoadError(null);
        setNames(await loadNames(next.map((loan) => loan.nft)));
      })
      .catch((cause) => {
        if (live) setLoadError(shortError(cause));
      });
    return () => {
      live = false;
    };
  }, [escrow, tick]);

  const open = (loans ?? []).filter((loan) => loan.open && !loan.filled);
  const body = (
    <div id="nfts" data-tour="nfts">
      <p className="lm-kicker">NFTs · Arc</p>
      <h1>Borrow USDC against an NFT.</h1>
      <p className="lm-lead">
        Someone leaves USDC for a collection. You lock that NFT and take the USDC. Repay before the date and the NFT
        comes back. After the date, they keep it. This desk does not use the meme pool.
      </p>
      <ol className="lm-dev-steps">
        <li>
          <span>01</span>An offer names the collection, and a token unless any piece of that collection is accepted.
        </li>
        <li>
          <span>02</span>Lock the NFT. The USDC arrives in the same transaction.
        </li>
        <li>
          <span>03</span>Repay before the date, or the NFT stays with the lender.
        </li>
      </ol>

      <section className="lm-panel lm-nft-board" id="offers">
        <div className="lm-panel-copy">
          <h2>Open offers</h2>
          {loadError ? <p className="lm-error">{loadError}</p> : null}
          {!escrow ? (
            <p className="lm-meta">The escrow is not on Arc yet. Offers show up here after it is published.</p>
          ) : loans === null ? (
            <p className="lm-meta">Loading offers.</p>
          ) : open.length === 0 ? (
            <p className="lm-meta">No USDC is waiting on an NFT. Leave some, or come back when an offer is open.</p>
          ) : null}
        </div>
        {open.map((loan) => (
          <article className="lm-loan" key={loan.id}>
            <div className="lm-loan-token">
              <div>
                <strong>{collectionLabel(loan, names)}</strong>
                <span>{tokenLabel(loan)}</span>
              </div>
            </div>
            <dl>
              <div>
                <dt>You receive</dt>
                <dd>{usdc(loan.principal)}</dd>
              </div>
              <div>
                <dt>You repay</dt>
                <dd>{usdc(loan.repay)}</dd>
              </div>
              <div>
                <dt>Due</dt>
                <dd>{dueLabel(loan.due)}</dd>
              </div>
            </dl>
          </article>
        ))}
      </section>

      {activated ? (
        <Live
          escrow={escrow}
          loans={loans ?? []}
          names={names}
          sample={sample}
          onSample={setSample}
          onEscrow={setEscrow}
          onDone={() => setTick((value) => value + 1)}
        />
      ) : (
        <section className="lm-panel">
          <div className="lm-panel-copy">
            <h2>Leave USDC, or lock an NFT</h2>
            <p>Connect a wallet on Arc to leave USDC for a collection, or to lock an NFT against an open offer.</p>
            <div className="lm-actions">
              <button type="button" className="lm-btn" onClick={requestConnect}>
                Connect wallet
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );

  return (
    <div className="cl-studio lm-market">
      <header className="lm-bar">
        <BrandMark />
        <MarketNav current="nfts" />
        <span>
          <WalletChip />
        </span>
      </header>
      <main className="lm-main">{body}</main>
    </div>
  );
}

function Live({
  escrow,
  loans,
  names,
  sample,
  onSample,
  onEscrow,
  onDone,
}: {
  escrow: Address | null;
  loans: NftLoan[];
  names: Record<string, string>;
  sample: { collection: Address; tokenId: string } | null;
  onSample: (next: { collection: Address; tokenId: string }) => void;
  onEscrow: (next: Address) => void;
  onDone: () => void;
}) {
  const { address } = useAccount();
  const owner = Boolean(address && address.toLowerCase() === BAGFI_OWNER.toLowerCase());
  const open = loans.filter((loan) => loan.open && !loan.filled);
  const mine = loans.filter(
    (loan) =>
      address &&
      (loan.borrower.toLowerCase() === address.toLowerCase() || loan.lender.toLowerCase() === address.toLowerCase()) &&
      loan.open,
  );

  return (
    <>
      {escrow && open.length > 0 ? (
        <section className="lm-panel lm-nft-board">
          <div className="lm-panel-copy">
            <h2>Lock an NFT</h2>
            <p>The NFT has to be the collection on the offer. A pinned token id has to match exactly.</p>
          </div>
          {open.map((loan) => (
            <LockRow key={loan.id} escrow={escrow} loan={loan} names={names} onDone={onDone} />
          ))}
        </section>
      ) : null}

      <MintTest onMinted={onSample} />

      {escrow ? <OfferForm escrow={escrow} onDone={onDone} sample={sample} /> : null}

      {escrow ? (
        <section className="lm-panel lm-nft-board" id="yours">
          <div className="lm-panel-copy">
            <h2>Yours</h2>
            {mine.length === 0 ? <p className="lm-meta">This wallet has no open NFT loan.</p> : null}
          </div>
          {mine.map((loan) => (
            <YoursRow key={loan.id} escrow={escrow} loan={loan} names={names} wallet={address} onDone={onDone} />
          ))}
        </section>
      ) : null}

      {owner ? <Publish escrow={escrow} onEscrow={onEscrow} /> : null}
    </>
  );
}

function useNftTx() {
  const { chainId, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const { writeContractAsync, isPending } = useWriteContract();
  const client = usePublicClient({ chainId: arc.id });
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return { isConnected, isPending, busy, error, note, run, writeContractAsync, confirmed, client };
}

function LockRow({
  escrow,
  loan,
  names,
  onDone,
}: {
  escrow: Address;
  loan: NftLoan;
  names: Record<string, string>;
  onDone: () => void;
}) {
  const tx = useNftTx();
  const { address } = useAccount();
  const [tokenId, setTokenId] = useState(loan.anyId ? '' : loan.tokenId.toString());
  const id = loan.anyId ? parseTokenId(tokenId) : loan.tokenId;

  return (
    <article className="lm-loan">
      <div className="lm-loan-token">
        <div>
          <strong>{collectionLabel(loan, names)}</strong>
          <span>
            {usdc(loan.principal)} now · repay {usdc(loan.repay)}
          </span>
        </div>
      </div>
      <div className="lm-loan-side">
        {loan.anyId ? (
          <label className="lm-field">
            Token id
            <input inputMode="numeric" value={tokenId} onChange={(event) => setTokenId(event.target.value)} />
          </label>
        ) : (
          <p className="lm-meta">Token {tokenLabel(loan)}</p>
        )}
        <button
          type="button"
          className="lm-btn"
          disabled={!tx.isConnected || tx.busy || tx.isPending || id === null}
          onClick={() =>
            void tx.run(async () => {
              if (!address || id === null) return 'Connect a wallet on Arc.';
              const approved = await poolClient.readContract({
                address: loan.nft,
                abi: erc721Abi,
                functionName: 'isApprovedForAll',
                args: [address, escrow],
              });
              if (!approved) {
                await tx.confirmed(
                  await tx.writeContractAsync({
                    address: loan.nft,
                    abi: erc721Abi,
                    functionName: 'setApprovalForAll',
                    args: [escrow, true],
                    chainId: arc.id,
                  }),
                );
              }
              await tx.confirmed(
                await tx.writeContractAsync({
                  address: escrow,
                  abi: nftEscrowAbi,
                  functionName: 'fill',
                  args: [BigInt(loan.id), id],
                  chainId: arc.id,
                }),
              );
              onDone();
              return 'NFT locked. USDC is in this wallet.';
            })
          }
        >
          Lock NFT
        </button>
        {tx.error ? <p className="lm-error">{tx.error}</p> : null}
        {tx.note ? <p className="lm-meta">{tx.note}</p> : null}
      </div>
    </article>
  );
}

function MintTest({ onMinted }: { onMinted: (next: { collection: Address; tokenId: string }) => void }) {
  const tx = useNftTx();
  const { deployContractAsync } = useDeployContract();

  return (
    <section className="lm-panel" id="mint">
      <div className="lm-panel-copy">
        <h2>Mint a test NFT</h2>
        <p>
          This wallet can mint a BAGNFT on Arc. It has no price and no buyer. Use it only to try this desk. For the
          trial, set the lend amount to 1 and the repay amount to 1.1 before you approve.
        </p>
        <div className="lm-actions">
          <button
            type="button"
            className="lm-btn"
            disabled={!tx.isConnected || tx.busy || tx.isPending}
            onClick={() =>
              void tx.run(async () => {
                const saved = window.localStorage.getItem(TEST_NFT_KEY);
                let collection: Address | null = null;
                if (saved) {
                  try {
                    const parsed = JSON.parse(saved) as { collection?: string };
                    if (parsed.collection && isAddress(parsed.collection)) collection = parsed.collection;
                  } catch {
                    collection = null;
                  }
                }
                if (!collection) {
                  const receipt = await tx.confirmed(
                    await deployContractAsync({
                      abi: testNftAbi,
                      bytecode: testNftBytecode,
                      chainId: arc.id,
                    }),
                  );
                  if (!receipt.contractAddress) throw new Error('Arc did not return the NFT contract.');
                  collection = receipt.contractAddress;
                  window.localStorage.setItem(TEST_NFT_KEY, JSON.stringify({ collection, tokenId: '1' }));
                  onMinted({ collection, tokenId: '1' });
                  return `BAGNFT #1 is in this wallet. Collection ${collection} is filled in below.`;
                }
                const id = await poolClient.readContract({
                  address: collection,
                  abi: testNftAbi,
                  functionName: 'nextId',
                });
                await tx.confirmed(
                  await tx.writeContractAsync({
                    address: collection,
                    abi: testNftAbi,
                    functionName: 'mint',
                    chainId: arc.id,
                  }),
                );
                const tokenId = id.toString();
                window.localStorage.setItem(TEST_NFT_KEY, JSON.stringify({ collection, tokenId }));
                onMinted({ collection, tokenId });
                return `BAGNFT #${tokenId} is in this wallet. Collection ${collection} is filled in below.`;
              })
            }
          >
            {tx.busy || tx.isPending ? 'Minting…' : 'Mint test NFT'}
          </button>
        </div>
        {tx.error ? <p className="lm-error">{tx.error}</p> : null}
        {tx.note ? <p className="lm-meta">{tx.note}</p> : null}
      </div>
    </section>
  );
}

function OfferForm({
  escrow,
  onDone,
  sample,
}: {
  escrow: Address;
  onDone: () => void;
  sample: { collection: Address; tokenId: string } | null;
}) {
  const tx = useNftTx();
  const { address } = useAccount();
  const [collection, setCollection] = useState(sample?.collection ?? '');
  const [tokenId, setTokenId] = useState(sample?.tokenId ?? '');
  const [anyId, setAnyId] = useState(false);

  useEffect(() => {
    if (!sample) return;
    setCollection(sample.collection);
    setTokenId(sample.tokenId);
    setAnyId(false);
  }, [sample]);
  const [principal, setPrincipal] = useState('100');
  const [repay, setRepay] = useState('110');
  const [days, setDays] = useState('7');
  const nft = isAddress(collection) ? collection : null;
  const principalRaw = (() => {
    try {
      return parseUsdc(principal);
    } catch {
      return 0n;
    }
  })();
  const repayRaw = (() => {
    try {
      return parseUsdc(repay);
    } catch {
      return 0n;
    }
  })();
  const id = anyId ? 0n : parseTokenId(tokenId);
  const dayCount = Number(days);
  const ready = Boolean(nft && id !== null && principalRaw > 0n && repayRaw >= principalRaw && dayCount >= 1);

  const { data: allowance, refetch } = useReadContract({
    address: USDC,
    abi: erc20Abi,
    functionName: 'allowance',
    args: address ? [address, escrow] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(address) },
  });
  const needsApproval = principalRaw > 0n && (allowance ?? 0n) < principalRaw;

  return (
    <section className="lm-panel" id="offer">
      <div className="lm-panel-copy">
        <h2>Leave USDC</h2>
        <p>
          Name the collection first. The USDC stays here until that NFT is locked, or until you cancel the offer.
          This does not draw from the shared pool.
        </p>
        <label className="lm-field">
          Collection contract
          <input
            value={collection}
            spellCheck={false}
            placeholder="0x…"
            onChange={(event) => setCollection(event.target.value.trim())}
          />
        </label>
        <label className="lm-check">
          <input type="checkbox" checked={anyId} onChange={(event) => setAnyId(event.target.checked)} />
          Any token in this collection
        </label>
        {anyId ? null : (
          <label className="lm-field">
            Token id
            <input inputMode="numeric" value={tokenId} onChange={(event) => setTokenId(event.target.value)} />
          </label>
        )}
        <label className="lm-field">
          USDC to lend
          <input inputMode="decimal" value={principal} onChange={(event) => setPrincipal(event.target.value)} />
        </label>
        <label className="lm-field">
          USDC they repay
          <input inputMode="decimal" value={repay} onChange={(event) => setRepay(event.target.value)} />
        </label>
        <label className="lm-field">
          Days
          <input inputMode="numeric" value={days} onChange={(event) => setDays(event.target.value)} />
        </label>
        <div className="lm-actions">
          <button
            type="button"
            className="lm-btn"
            disabled={!tx.isConnected || tx.busy || tx.isPending || !ready}
            onClick={() =>
              void tx.run(async () => {
                if (!nft || id === null) return 'Paste the collection contract.';
                if ((allowance ?? 0n) < principalRaw) {
                  await tx.confirmed(
                    await tx.writeContractAsync({
                      address: USDC,
                      abi: erc20Abi,
                      functionName: 'approve',
                      args: [escrow, principalRaw],
                      chainId: arc.id,
                    }),
                  );
                  await refetch();
                }
                const due = BigInt(Math.floor(Date.now() / 1000) + Math.floor(dayCount) * 86_400);
                await tx.confirmed(
                  await tx.writeContractAsync({
                    address: escrow,
                    abi: nftEscrowAbi,
                    functionName: 'offer',
                    args: [nft, id, anyId, principalRaw, repayRaw, due],
                    chainId: arc.id,
                  }),
                );
                onDone();
                return 'Offer is open. The USDC is locked until that NFT arrives, or you cancel.';
              })
            }
          >
            {needsApproval ? 'Approve USDC' : 'Leave USDC'}
          </button>
        </div>
        {tx.error ? <p className="lm-error">{tx.error}</p> : null}
        {tx.note ? <p className="lm-meta">{tx.note}</p> : null}
      </div>
      <dl className="lm-quote">
        <div>
          <dt>They receive</dt>
          <dd>{principalRaw > 0n ? usdc(principalRaw) : '—'}</dd>
        </div>
        <div>
          <dt>They repay</dt>
          <dd>{repayRaw > 0n ? usdc(repayRaw) : '—'}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{dayCount >= 1 ? `${Math.floor(dayCount)} days` : '—'}</dd>
        </div>
      </dl>
    </section>
  );
}

function YoursRow({
  escrow,
  loan,
  names,
  wallet,
  onDone,
}: {
  escrow: Address;
  loan: NftLoan;
  names: Record<string, string>;
  wallet: Address | undefined;
  onDone: () => void;
}) {
  const tx = useNftTx();
  const borrower = Boolean(wallet && loan.borrower.toLowerCase() === wallet.toLowerCase());
  const lender = Boolean(wallet && loan.lender.toLowerCase() === wallet.toLowerCase());
  const pastDue = loan.due <= BigInt(Math.floor(Date.now() / 1000));
  const { data: allowance, refetch } = useReadContract({
    address: USDC,
    abi: erc20Abi,
    functionName: 'allowance',
    args: wallet && borrower && loan.filled ? [wallet, escrow] : undefined,
    chainId: arc.id,
    query: { enabled: Boolean(wallet && borrower && loan.filled) },
  });

  let action = 'Open';
  if (!loan.filled && lender) action = 'Cancel';
  else if (loan.filled && borrower) action = (allowance ?? 0n) < loan.repay ? 'Approve USDC' : 'Repay';
  else if (loan.filled && lender && pastDue) action = 'Take the NFT';
  else if (loan.filled && lender) action = 'Waiting on the date';

  return (
    <article className="lm-loan">
      <div className="lm-loan-token">
        <div>
          <strong>{collectionLabel(loan, names)}</strong>
          <span>
            {tokenLabel(loan)} · {loan.filled ? 'NFT locked' : 'Waiting for the NFT'}
          </span>
        </div>
      </div>
      <dl>
        <div>
          <dt>{borrower ? 'You repay' : 'You left'}</dt>
          <dd>{usdc(borrower ? loan.repay : loan.principal)}</dd>
        </div>
        <div>
          <dt>Due</dt>
          <dd>{dueLabel(loan.due)}</dd>
        </div>
      </dl>
      <div className="lm-loan-side">
        <button
          type="button"
          className="lm-btn lm-btn-secondary"
          disabled={tx.busy || tx.isPending || action === 'Waiting on the date' || action === 'Open'}
          onClick={() =>
            void tx.run(async () => {
              if (!loan.filled && lender) {
                await tx.confirmed(
                  await tx.writeContractAsync({
                    address: escrow,
                    abi: nftEscrowAbi,
                    functionName: 'cancel',
                    args: [BigInt(loan.id)],
                    chainId: arc.id,
                  }),
                );
                onDone();
                return 'Offer cancelled. USDC is back in this wallet.';
              }
              if (loan.filled && borrower) {
                if ((allowance ?? 0n) < loan.repay) {
                  await tx.confirmed(
                    await tx.writeContractAsync({
                      address: USDC,
                      abi: erc20Abi,
                      functionName: 'approve',
                      args: [escrow, loan.repay],
                      chainId: arc.id,
                    }),
                  );
                  await refetch();
                  return 'USDC approved. Repay to get the NFT back.';
                }
                await tx.confirmed(
                  await tx.writeContractAsync({
                    address: escrow,
                    abi: nftEscrowAbi,
                    functionName: 'repay',
                    args: [BigInt(loan.id)],
                    chainId: arc.id,
                  }),
                );
                onDone();
                return 'Repaid. The NFT is back in this wallet.';
              }
              await tx.confirmed(
                await tx.writeContractAsync({
                  address: escrow,
                  abi: nftEscrowAbi,
                  functionName: 'claim',
                  args: [BigInt(loan.id)],
                  chainId: arc.id,
                }),
              );
              onDone();
              return 'The NFT is in this wallet.';
            })
          }
        >
          {action}
        </button>
        {tx.error ? <p className="lm-error">{tx.error}</p> : null}
        {tx.note ? <p className="lm-meta">{tx.note}</p> : null}
      </div>
    </article>
  );
}

function Publish({ escrow, onEscrow }: { escrow: Address | null; onEscrow: (next: Address) => void }) {
  const tx = useNftTx();
  const { deployContractAsync } = useDeployContract();
  const [pasted, setPasted] = useState('');

  return (
    <section className="lm-panel">
      <div className="lm-panel-copy">
        <h2>Publish the desk</h2>
        <p>
          One transaction from this wallet deploys the escrow. After it confirms, set NEXT_PUBLIC_NFT_ESCROW to that
          address and publish the site so every wallet can see the offers.
        </p>
        <p className="lm-meta">{escrow ?? 'Not published yet.'}</p>
        <div className="lm-actions">
          <button
            type="button"
            className="lm-btn lm-btn-secondary"
            disabled={tx.busy || tx.isPending}
            onClick={() =>
              void tx.run(async () => {
                const receipt = await tx.confirmed(
                  await deployContractAsync({
                    abi: nftEscrowAbi,
                    bytecode: nftEscrowBytecode,
                    args: [USDC],
                    chainId: arc.id,
                  }),
                );
                const deployed = receipt.contractAddress;
                if (!deployed) throw new Error('Arc did not return the contract address.');
                window.localStorage.setItem(NFT_ESCROW_KEY, deployed);
                onEscrow(deployed);
                return `Escrow deployed at ${deployed}.`;
              })
            }
          >
            Deploy escrow
          </button>
        </div>
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
              window.localStorage.setItem(NFT_ESCROW_KEY, pasted);
              onEscrow(pasted);
            }}
          >
            Use this address
          </button>
        </div>
        {tx.error ? <p className="lm-error">{tx.error}</p> : null}
        {tx.note ? <p className="lm-meta">{tx.note}</p> : null}
      </div>
    </section>
  );
}
