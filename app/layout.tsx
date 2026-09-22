import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ContextLock — Give AI authority, not keys',
  description:
    'Design, prove, deploy and operate secure financial agents. Authority is bounded by a deterministic policy layer, not by a prompt.',
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
        <link rel="stylesheet" href="/styles/landing.css" precedence="high" />
        {children}
      </body>
    </html>
  );
}
