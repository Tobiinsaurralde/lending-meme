import { redirect } from 'next/navigation';

export default async function BorrowPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  redirect(`/market${query}#borrow`);
}
