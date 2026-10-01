import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'BagFi — Borrow USDC on Arc',
  description:
    'BagFi is a fixed-term lending protocol on Arc. Borrow USDC against a memecoin. Flat fee, and the bag stays in the vault.',
};

export default function MarketLayout({ children }: { children: ReactNode }) {
  return children;
}
