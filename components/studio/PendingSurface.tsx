'use client';

/**
 * Placeholder for a surface that is navigable but not yet built.
 *
 * It states what the page is for and that it is not available, and nothing
 * else. It never shows invented data, and never shows a green or healthy state
 * for something that does not exist yet.
 */
import { StudioPage } from './PageScaffold';
import { Badge, Card, EmptyState } from './primitives';
import { metaForSegment } from '@/lib/studio/nav';

export function PendingSurface({ segment }: { segment: string }) {
  const meta = metaForSegment(segment);

  return (
    <StudioPage segment={segment} badges={<Badge tone="blocked">Not available yet</Badge>}>
      <Card>
        <EmptyState title={meta.title} body={meta.purpose} />
      </Card>
    </StudioPage>
  );
}
