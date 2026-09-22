import { redirect } from 'next/navigation';

/** Opening a project lands on Overview. */
export default async function ProjectIndex({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  redirect(`/projects/${projectId}/overview`);
}
