'use client';

/**
 * New-project modal (spec §9.1).
 *
 * Fields: name · single agent or multi-agent organization · optional template ·
 * start from description. Creating a project never establishes authority — the
 * project starts as a draft with policy disabled and no deployment.
 *
 * What it creates on the backend:
 *  - a single agent WITH a description starts a build (prompt = description) and opens its Composer;
 *  - a single agent without one opens an empty Composer, which starts the build on Generate;
 *  - an organization needs a description and the ENS root you control; it is designed at once.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Modal } from './dialogs';
import { PROJECT_TEMPLATES } from '@/lib/studio/content/templates';
import { studio } from '@/lib/studio/api/endpoints';
import { useInvalidateAll } from '@/lib/studio/api/queries';
import { ApiError } from '@/lib/studio/api/client';

const ENS_RE = /^([a-z0-9-]+\.)+eth$/;

export function NewProjectModal({ open, onClose, templateId: initialTemplate }: { open: boolean; onClose: () => void; templateId?: string }) {
  const router = useRouter();
  const invalidate = useInvalidateAll();
  const [name, setName] = useState('');
  const [shape, setShape] = useState<'single' | 'organization'>('single');
  const [templateId, setTemplateId] = useState<string>(initialTemplate ?? 'tpl_blank');
  const [description, setDescription] = useState('');
  const [ensName, setEnsName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* A template chosen from the projects page arrives with the modal open. */
  useEffect(() => {
    if (!open) return;
    const t = PROJECT_TEMPLATES.find((x) => x.id === (initialTemplate ?? templateId));
    if (initialTemplate && t) {
      setTemplateId(t.id);
      setShape(t.shape);
      if (!description) setDescription(t.prompt);
      if (!name && t.id !== 'tpl_blank') setName(t.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialTemplate]);

  const pickTemplate = (id: string) => {
    setTemplateId(id);
    const t = PROJECT_TEMPLATES.find((x) => x.id === id);
    if (t) {
      setShape(t.shape);
      if (t.prompt) setDescription(t.prompt);
    }
  };

  const ensOk = ensName.trim() === '' || ENS_RE.test(ensName.trim());
  const canCreate =
    name.trim().length > 0 &&
    !busy &&
    ensOk &&
    (shape === 'single' ? true : description.trim().length >= 10 && ENS_RE.test(ensName.trim()));

  const create = async () => {
    setError(null);
    setBusy(true);
    try {
      if (shape === 'organization') {
        const org = await studio.createOrganization({ prompt: description.trim(), rootEns: ensName.trim(), name: name.trim() });
        await invalidate();
        onClose();
        router.push(`/projects/${org.id}/organization`);
        return;
      }
      if (description.trim().length >= 10) {
        const build = await studio.createBuild({
          prompt: description.trim(),
          name: name.trim(),
          ...(ensName.trim() ? { ensName: ensName.trim() } : {}),
          idempotencyKey: `ui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        });
        await invalidate();
        onClose();
        router.push(`/projects/${build.projectId}/build?start=1`);
        return;
      }
      onClose();
      const q = new URLSearchParams({ name: name.trim() });
      if (ensName.trim()) q.set('ens', ensName.trim());
      router.push(`/projects/new/build?${q.toString()}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New agent project"
      subtitle="The project starts as a draft. No identity, policy or deployment is created yet."
      wide
      footer={
        <>
          <button type="button" className="cl-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="cl-btn cl-btn-primary" onClick={create} disabled={!canCreate}>
            {busy ? 'Creating…' : shape === 'organization' ? 'Design Organization' : 'Create Project'}
          </button>
        </>
      }
    >
      {error ? (
        <p className="cl-meta" style={{ color: 'var(--cl-deny)', whiteSpace: 'normal', marginBottom: 10 }}>
          {error}
        </p>
      ) : null}

      <div className="cl-field">
        <label className="cl-field-label" htmlFor="np-name">
          Project name
        </label>
        <input
          id="np-name"
          className="cl-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Treasury Guardian"
          autoComplete="off"
        />
      </div>

      <div className="cl-field">
        <span className="cl-field-label">Shape</span>
        <div className="cl-grid cl-grid-2">
          {(
            [
              { id: 'single' as const, title: 'Single agent', body: 'One principal with one identity, one policy and one budget.' },
              { id: 'organization' as const, title: 'Multi-agent organization', body: 'Several agents as distinct principals, each with its own identity, policy and budget, under one ENS root.' },
            ]
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              className="cl-card"
              onClick={() => setShape(option.id)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: shape === option.id ? 'var(--cl-ink)' : 'var(--cl-line)',
                background: shape === option.id ? 'rgba(0,66,175,0.06)' : 'var(--cl-panel)',
                padding: 0,
              }}
            >
              <div className="cl-card-body">
                <div className="cl-strong" style={{ fontSize: 12.5 }}>
                  {option.title}
                </div>
                <p className="cl-meta" style={{ marginTop: 5, whiteSpace: 'normal' }}>
                  {option.body}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="cl-field">
        <label className="cl-field-label" htmlFor="np-template">
          Template <span className="cl-dim">(optional)</span>
        </label>
        <select id="np-template" className="cl-select" value={templateId} onChange={(e) => pickTemplate(e.target.value)}>
          {PROJECT_TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <span className="cl-field-hint">
          A template pre-fills a description. It never pre-fills a financial ceiling that you did not state.
        </span>
      </div>

      <div className="cl-field">
        <label className="cl-field-label" htmlFor="np-ens">
          {shape === 'organization' ? 'ENS root you control' : 'ENS name for this agent'}{' '}
          {shape === 'organization' ? null : <span className="cl-dim">(optional)</span>}
        </label>
        <input
          id="np-ens"
          className="cl-input"
          value={ensName}
          onChange={(e) => setEnsName(e.target.value.toLowerCase())}
          placeholder={shape === 'organization' ? 'acme.eth' : 'guardian.acme.eth'}
          spellCheck={false}
          autoComplete="off"
        />
        <span className="cl-field-hint" style={!ensOk ? { color: 'var(--cl-deny)' } : undefined}>
          {shape === 'organization'
            ? 'Agents are named beneath it. The root is the one thing the Studio will not guess — a guessed name would put your department in a stranger’s namespace.'
            : 'When given it is authoritative; the model never guesses a name over it. Lowercase .eth only.'}
        </span>
      </div>

      <div className="cl-field" style={{ marginBottom: 0 }}>
        <label className="cl-field-label" htmlFor="np-description">
          {shape === 'organization' ? 'Describe the department' : 'Start from a description'}{' '}
          {shape === 'organization' ? null : <span className="cl-dim">(optional)</span>}
        </label>
        <textarea
          id="np-description"
          className="cl-textarea"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            shape === 'organization'
              ? 'A guardian that repays Aave debt up to $500 per action, a rebalancer that swaps up to $250 per action, and a reporter that can never move money…'
              : 'Build an Aave guardian that repays my USDC debt when the health factor falls below 1.25…'
          }
        />
        <span className="cl-field-hint">
          {shape === 'organization'
            ? 'The Studio splits this into separate principals, each with its own limits. A member without a stated ceiling is rejected, not completed.'
            : 'With a description the build starts now and stops for your review before any code is generated. Without one, the Composer opens empty.'}{' '}
          Do not paste secrets, private keys or API credentials.
        </span>
      </div>
    </Modal>
  );
}
