import { isAddress, type Address } from 'viem';
import { EXTRAS_KEY } from '@/lib/market/isolated';

export const NFT_ESCROW_KEY = 'bagfi.nft.v1';
export const TEST_NFT_KEY = 'bagfi.testnft.v1';

const raw = process.env.NEXT_PUBLIC_NFT_ESCROW ?? '';

/** Escrow on Arc. Empty until NftEscrow is deployed and the address is published. */
export const NFT_ESCROW: Address | null =
  /^0x[0-9a-fA-F]{40}$/.test(raw) && !/^0x0{40}$/i.test(raw) ? (raw as Address) : null;

export function storedNftEscrow(): Address | null {
  if (typeof window === 'undefined') return NFT_ESCROW;
  const saved = window.localStorage.getItem(NFT_ESCROW_KEY);
  if (saved && isAddress(saved)) return saved;
  const extras = window.localStorage.getItem(EXTRAS_KEY);
  if (extras) {
    try {
      const nft = (JSON.parse(extras) as { nft?: string }).nft;
      if (nft && isAddress(nft)) return nft;
    } catch {
      /* ignore a stale extras blob */
    }
  }
  return NFT_ESCROW;
}
