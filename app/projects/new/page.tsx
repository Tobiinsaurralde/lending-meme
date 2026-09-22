'use client';

/** /projects/new — the new-project modal presented over the projects list. */
import { useRouter } from 'next/navigation';
import { NewProjectModal } from '@/components/studio/NewProjectModal';

export default function NewProjectPage() {
  const router = useRouter();
  return (
    <div className="cl-studio" style={{ minHeight: '100vh', background: 'var(--cl-canvas)' }}>
      <NewProjectModal open onClose={() => router.push('/projects')} />
    </div>
  );
}
