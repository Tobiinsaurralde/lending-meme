import { PRELOADER_HTML } from '@/components/preloaderHtml';

/**
 * Restores the .preloader-master and .preloader overlays the scrape dropped.
 * The Three.js engine's hero/intro class queries ".preloader" (and its
 * .rect-solid SVG / __enter), animates it out, then removes it and adds
 * body.webgl-ready. Without these nodes it throws null.addEventListener and the
 * hero scene never initializes. dangerouslySetInnerHTML keeps the inline <style>
 * and SVG intact and lets the engine own/remove the nodes.
 */
export default function Preloader() {
  return <div dangerouslySetInnerHTML={{ __html: PRELOADER_HTML }} />;
}
