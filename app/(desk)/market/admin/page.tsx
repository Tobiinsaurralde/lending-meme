import type { Metadata } from 'next';
import { PoolAdmin } from '@/components/market/PoolAdmin';

export const metadata: Metadata = {
  title: 'BagFi — Admin',
  robots: { index: false, follow: false },
};

export default function PoolAdminPage() {
  return <PoolAdmin />;
}
