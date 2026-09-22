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

export default function SiteScripts() {
  useEffect(() => {
    if (started) return;
    started = true;

    (async () => {
      // Before the engine boots, so its first play() call already sees the stub.
      neutraliseSilencedAudio();
      for (const src of CLASSIC) await loadScript(src);
      // ES module: its relative imports/model URLs resolve from /assets & /models
      await loadScript('/assets/app.module.js', 'module');
      await loadScript('/vendor/inline.js');
    })().catch((e) => console.error('[contextlock] script boot failed', e));
  }, []);

  return null;
}
