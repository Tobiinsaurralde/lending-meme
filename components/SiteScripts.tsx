'use client';

import { useEffect } from 'react';

/**
 * Boots the site's runtime in the original page's order:
 *   jQuery -> Webflow runtime -> hls.js -> the custom Three.js module bundle
 *   -> the small inline setup script.
 *
 * The Three.js bundle (app.module.js) is an ES module that enhances the existing
 * DOM by querySelector (.webgl canvas, scene-* spacers, [data-insight] ...) and
 * loads its GLB models from /models and Draco decoders from gstatic. The inline
 * script sets --vh and removes the preloader.
 */
const CLASSIC = [
  '/vendor/jquery.min.js',
  '/vendor/webflow.js',
  '/vendor/hls.min.js',
];

let started = false;

function loadScript(src: string, type?: string) {
  return new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    if (type) el.type = type;
    el.async = false; // preserve order
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`failed to load ${src}`));
    document.body.appendChild(el);
  });
}

/**
 * Stops the engine's audio calls from surfacing as runtime errors.
 *
 * The background loop and the narration clips were deliberately left sourceless
 * when the audio was removed, because the engine holds those elements by query
 * and calls play()/pause() on them — deleting them throws. But play() on an
 * element with no source returns a promise that rejects the moment pause()
 * follows it, which React surfaces as:
 *
 *   AbortError: The play() request was interrupted by a call to pause()
 *
 * The call is harmless and there is nothing to hear either way, so play() is
 * replaced on these elements with a resolved promise. Only elements we
 * silenced are touched; any other media on the page keeps its real play().
 */
function neutraliseSilencedAudio() {
  document.querySelectorAll<HTMLAudioElement>('audio.audio-bg, audio.audio-chapter').forEach((el) => {
    el.muted = true;
    el.play = () => Promise.resolve();
  });
}

const PHONE = '(max-width: 1024px)';

/** Pinch-zoom lock for the landing on a phone. Desktop keeps the normal viewport. */
function lockPhoneZoom() {
  if (!window.matchMedia(PHONE).matches) return () => {};
  const meta = document.querySelector('meta[name="viewport"]');
  const previous = meta?.getAttribute('content') ?? null;
  meta?.setAttribute(
    'content',
    'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  );
  const blockGesture = (event: Event) => event.preventDefault();
  const blockPinch = (event: TouchEvent) => {
    if (event.touches.length > 1) event.preventDefault();
  };
  document.addEventListener('gesturestart', blockGesture);
  document.addEventListener('gesturechange', blockGesture);
  document.addEventListener('touchmove', blockPinch, { passive: false });
  return () => {
    if (meta && previous !== null) meta.setAttribute('content', previous);
    document.removeEventListener('gesturestart', blockGesture);
    document.removeEventListener('gesturechange', blockGesture);
    document.removeEventListener('touchmove', blockPinch);
  };
}

/**
 * After Enter Site, the phone must show the hero. iOS keeps the scroll
 * position of whatever sat under the tap once the overlay is removed, which
 * lands on the introduction paragraph. Hold the top until that overlay is gone.
 */
function pinTopUntilEntered() {
  if (!window.matchMedia(PHONE).matches) return () => {};
  const toTop = () => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };
  toTop();
  let pinning = true;
  const onScroll = () => {
    if (pinning && window.scrollY > 0) toTop();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  const preloader = document.querySelector('.preloader');
  const onEnter = () => {
    toTop();
    const startedAt = performance.now();
    const id = window.setInterval(() => {
      toTop();
      if (performance.now() - startedAt > 1500) {
        window.clearInterval(id);
        pinning = false;
        toTop();
      }
    }, 50);
  };
  preloader?.addEventListener('click', onEnter, true);
  return () => {
    pinning = false;
    window.removeEventListener('scroll', onScroll);
    preloader?.removeEventListener('click', onEnter, true);
  };
}

export default function SiteScripts() {
  useEffect(() => {
    const unlockZoom = lockPhoneZoom();
    const unpin = pinTopUntilEntered();
    if (!started) {
      started = true;
      (async () => {
        // Before the engine boots, so its first play() call already sees the stub.
        neutraliseSilencedAudio();
        for (const src of CLASSIC) await loadScript(src);
        // ES module: its relative imports/model URLs resolve from /assets & /models
        await loadScript('/assets/app.module.js?v=2', 'module');
        await loadScript('/vendor/inline.js');
      })().catch((e) => console.error('[contextlock] script boot failed', e));
    }
    return () => {
      unlockZoom();
      unpin();
    };
  }, []);

  return null;
}
