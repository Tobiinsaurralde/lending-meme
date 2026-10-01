import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'BagFi — Borrow USDC on Arc',
  description:
    'BagFi is a fixed-term lending protocol on Arc. Borrow USDC against a memecoin. Flat fee, and the bag stays in the vault.',
  icons: {
    icon: [{ url: '/favicon.ico?v=5' }, { url: '/icon.png?v=5', type: 'image/png' }],
    apple: [{ url: '/apple-icon.png?v=5' }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    /*
     * suppressHydrationWarning on <html> and <body> only.
     *
     * Wallet extensions (Leather, MetaMask, Phantom) inject provider scripts as
     * direct children of <body> before React hydrates, which React reports as a
     * hydration mismatch it cannot attribute to anything in this codebase. The
     * flag suppresses the warning one level deep — it does not extend into the
     * app tree, so genuine mismatches inside the workbench are still reported.
     */
    <html lang="en" className="w-mod-js" suppressHydrationWarning>
      <body className="body" suppressHydrationWarning>
        {/* Same cascade order as the original: Webflow base, Lenis, then the
            custom Three.js app styles. Served verbatim from /public. */}
        <link rel="stylesheet" href="/styles/webflow.css" precedence="high" />
        <link rel="stylesheet" href="/styles/lenis.css" precedence="high" />
        <link rel="stylesheet" href="/styles/app.css" precedence="high" />
        <link rel="stylesheet" href="/styles/inline.css" precedence="high" />
        {/* ContextLock's own additions load last so they win on equal
            specificity without !important. Kept separate from the scraped
            Webflow sheets above. */}
        <link rel="stylesheet" href="/styles/landing.css?v=7" precedence="high" />
        <style>{`
          :root, body {
            --soft: #d5e0e7;
            --color: #1b3158;
            --color-medium: #2f578c;
            --dark-blue: #12192b;
            --color-soft: #acc6e9;
          }
          .section-blue,
          section.onclock.section-blue,
          section.importance.section-blue {
            background: #12192b;
          }
        `}</style>
        {children}
      </body>
    </html>
  );
}
