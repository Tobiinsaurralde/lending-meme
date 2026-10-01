import { protocolEarnings } from '@/lib/market/protocolFees';

export const dynamic = 'force-dynamic';

export async function GET() {
  const earned = await protocolEarnings();
  return Response.json({
    fees: earned.fees.toString(),
    reserves: earned.reserves.toString(),
    total: (earned.fees + earned.reserves).toString(),
  });
}
