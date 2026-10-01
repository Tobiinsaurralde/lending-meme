'use client';

import { BrandMark, MarketNav } from '@/components/market/MarketChrome';
import { MorphoDesk } from '@/components/market/MorphoDesk';
import { WalletChip } from '@/components/studio/wallet/WalletChip';

export default function MorphoPage() {
  return (
    <div className="cl-studio lm-market">
      <header className="lm-bar">
        <BrandMark />
        <MarketNav current="morpho" />
        <span>
          <WalletChip />
        </span>
      </header>
      <main className="lm-main">
        <p className="lm-kicker">Lending protocol on Arc</p>
        <MorphoDesk />
      </main>
    </div>
  );
}
