'use client';

/**
 * The build event stream (spec §37).
 *
 * SSE, one connection per build. The server replays history from `afterSeq` and then streams, so a
 * refresh or reconnect misses nothing; the cursor is kept in sessionStorage per build. The stream is
 * never authoritative — it is the reason to re-fetch the persisted build, not a substitute for it.
 */
import { useEffect, useRef, useState } from 'react';
import { apiUrl } from './client';

export const STUDIO_EVENT_TYPES = [
  'build.created', 'requirements.started', 'requirements.completed',
  'blueprint.started', 'blueprint.updated', 'blueprint.completed',
  'security.started', 'security.finding', 'security.completed',
  'approval.requested', 'approval.granted',
  'code.started', 'code.file.created', 'code.file.updated', 'code.file.deleted',
  'test.started', 'test.passed', 'test.failed',
  'repair.started', 'repair.completed',
  'simulation.started', 'simulation.step', 'simulation.completed',
  'usage.updated', 'usage.warning',
  'build.completed', 'build.failed', 'build.paused', 'build.limit_reached', 'build.abandoned',
] as const;
export type StudioEventType = (typeof STUDIO_EVENT_TYPES)[number];

export interface StudioEvent {
  seq: number;
  type: StudioEventType;
  payload: Record<string, unknown>;
  at: number;
}

export function subscribeBuild(buildId: string, onEvent: (e: StudioEvent) => void): () => void {
  const key = `ctxlock.studio.seq.${buildId}`;
  let after = 0;
  try {
    after = Number(sessionStorage.getItem(key) ?? 0);
  } catch {
    /* no storage: replay from the beginning */
  }
  const es = new EventSource(apiUrl(`/api/studio/builds/${encodeURIComponent(buildId)}/events?afterSeq=${after}`));
  const handler = (e: MessageEvent) => {
    const seq = Number((e as MessageEvent & { lastEventId: string }).lastEventId || 0);
    if (seq) {
      try {
        sessionStorage.setItem(key, String(seq));
      } catch {
        /* ignore */
      }
    }
    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(e.data) as Record<string, unknown>;
    } catch {
      /* keep-alive comments are not events */
    }
    onEvent({ seq, type: e.type as StudioEventType, payload, at: Date.now() });
  };
  for (const t of STUDIO_EVENT_TYPES) es.addEventListener(t, handler as EventListener);
  return () => es.close();
}

/**
 * Subscribe for the lifetime of a component. `onEvent` is read through a ref, so callers may pass an
 * inline closure without re-opening the stream on every render.
 */
export function useBuildEvents(buildId: string | null, onEvent: (e: StudioEvent) => void): StudioEvent[] {
  const [log, setLog] = useState<StudioEvent[]>([]);
  const cb = useRef(onEvent);
  cb.current = onEvent;

  useEffect(() => {
    if (!buildId) return;
    setLog([]);
    const unsub = subscribeBuild(buildId, (e) => {
      setLog((l) => [...l.slice(-400), e]);
      cb.current(e);
    });
    return unsub;
  }, [buildId]);

  return log;
}
