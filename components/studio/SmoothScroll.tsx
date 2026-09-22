'use client';

/**
 * Smooth scrolling for the workbench content pane.
 *
 * The landing page already runs Lenis from the site's own bundle, but it drives
 * the *window* scroll. The workbench shell is `position: fixed`, so the window
 * never scrolls — scrolling happens inside the centre content pane. Lenis is
 * therefore bound to that element as its wrapper.
 *
 * Nested scrollers (explorer, agent sidebar, console, tables) carry
 * `data-lenis-prevent` so they keep scrolling natively at full speed, rather
 * than paying for smoothing they do not want.
 *
 * `respectReducedMotion` is Lenis's default: with `prefers-reduced-motion: reduce`
 * the smoothing is dropped and scroll tracks the input device directly.
 */
import { useEffect, useRef, type ReactNode } from 'react';
import Lenis from 'lenis';

export function SmoothScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const lenis = new Lenis({
      wrapper,
      content,
      // A tool is scrolled to read something, not to be admired: keep the ease
      // short so content still lands where the wheel says it should.
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch devices keep native scroll; syncTouch is unstable and this is a
      // desktop-first authoring product.
      syncTouch: false,
      autoRaf: true,
      // Anything marked data-lenis-prevent scrolls natively.
      allowNestedScroll: false,
    });

    return () => lenis.destroy();
  }, []);

  return (
    <div ref={wrapperRef} className={className}>
      <div ref={contentRef} className="cl-page-content">
        {children}
      </div>
    </div>
  );
}
