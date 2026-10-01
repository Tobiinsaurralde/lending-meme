import { MORPHO_MARKETS } from '@/lib/market/morpho';

export const dynamic = 'force-dynamic';

interface Rates {
  supplyApy: number;
  borrowApy: number;
}

/** Variable rates for the Arc markets shown in the desk. Empty when Morpho is unreachable. */
export async function GET() {
  const wanted = new Set(MORPHO_MARKETS.map((market) => market.id.toLowerCase()));
  try {
    const response = await fetch('https://api.morpho.org/graphql', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        query: `query { markets(first: 20, orderBy: SupplyAssetsUsd, orderDirection: Desc, where: { chainId_in: [5042] }) { items { marketId state { supplyApy borrowApy } } } }`,
      }),
      cache: 'no-store',
    });
    if (!response.ok) return Response.json({ rates: {} satisfies Record<string, Rates> });
    const body = (await response.json()) as {
      data?: { markets?: { items?: { marketId: string; state?: { supplyApy?: number; borrowApy?: number } }[] } };
    };
    const rates: Record<string, Rates> = {};
    for (const item of body.data?.markets?.items ?? []) {
      const id = item.marketId.toLowerCase();
      if (!wanted.has(id) || !item.state) continue;
      rates[id] = {
        supplyApy: Number(item.state.supplyApy ?? 0),
        borrowApy: Number(item.state.borrowApy ?? 0),
      };
    }
    return Response.json({ rates });
  } catch {
    return Response.json({ rates: {} satisfies Record<string, Rates> });
  }
}
