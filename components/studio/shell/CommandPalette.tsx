'use client';

/**
 * Command palette (spec §4.5).
 *
 * Security-sensitive entries ("Disable policy", "Emergency Lock") open their
 * native confirmation — the palette never executes them directly.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkbench } from '@/lib/studio/workbench';
import type { ControlCommand } from '@/lib/studio/types';

export interface PaletteCommand {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
  danger?: boolean;
}

export function CommandPalette({
  projectId,
  agentSlug,
  onControlRequest,
  onCompareRevisions,
}: {
  projectId: string;
  agentSlug: string;
  onControlRequest: (control: ControlCommand) => void;
  onCompareRevisions: () => void;
}) {
  const router = useRouter();
  const { paletteOpen, setPaletteOpen, openBottom, toggleAgent, toggleBottom, focusAgentInput, pushToast } = useWorkbench();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const go = (segment: string, extra = '') =>
    router.push(`/projects/${projectId}/${segment}?agent=${agentSlug}${extra}`);

  const commands = useMemo<PaletteCommand[]>(
    () => [
      { id: 'go-blueprint', label: 'Go to Blueprint', hint: 'Design', run: () => go('blueprint') },
      { id: 'go-architecture', label: 'Go to Architecture', hint: 'Design', run: () => go('architecture') },
      { id: 'go-permissions', label: 'Go to Permissions & Security', hint: 'Design', run: () => go('security') },
      { id: 'go-simulation', label: 'Go to Simulation', hint: 'Test', run: () => go('simulation') },
      { id: 'run-all-sims', label: 'Run all simulations', hint: 'Test', run: () => go('simulation', '&run=all') },
      { id: 'open-attack-lab', label: 'Open Attack Lab', hint: 'Test', run: () => go('attacks') },
      { id: 'go-reality', label: 'Open Reality Lab', hint: 'Test', run: () => go('reality') },
      { id: 'go-code', label: 'Go to Code', hint: 'Implement', run: () => go('code') },
      { id: 'go-integrations', label: 'Go to Integrations & Data Sources', hint: 'Implement', run: () => go('integrations') },
      { id: 'go-deploy', label: 'Go to Deploy / Preflight', hint: 'Deploy', run: () => go('deploy') },
      { id: 'open-latest-deployment', label: 'Open latest deployment', hint: 'Deploy', run: () => go('deployments') },
      { id: 'go-overview', label: 'Go to Overview', hint: 'Operate', run: () => go('overview') },
      { id: 'go-activity', label: 'Go to Activity', hint: 'Operate', run: () => go('activity') },
      { id: 'go-policies', label: 'Go to Policies', hint: 'Operate', run: () => go('policies') },
      { id: 'go-runtime', label: 'Go to Runtime', hint: 'Operate', run: () => go('runtime') },
      { id: 'go-control-plane', label: 'Go to Control Plane', hint: 'Operate', run: () => go('control-plane') },
      { id: 'go-cre', label: 'Go to Chainlink CRE', hint: 'Operate', run: () => go('cre') },
      { id: 'go-identity', label: 'Go to Identity / ENS', hint: 'Operate', run: () => go('identity') },
      { id: 'go-reports', label: 'Go to Safety Reports', hint: 'Output', run: () => go('reports') },
      { id: 'go-settings', label: 'Go to Settings', hint: 'Workspace', run: () => go('settings') },
      { id: 'focus-agent', label: 'Focus Agent Sidebar', hint: '⌘⇧A', run: focusAgentInput },
      { id: 'toggle-agent', label: 'Toggle Agent Sidebar', hint: '⌘⇧A', run: toggleAgent },
      { id: 'toggle-bottom', label: 'Toggle bottom panel', hint: '⌘J', run: toggleBottom },
      { id: 'compare-revisions', label: 'Compare revisions', run: onCompareRevisions },
      { id: 'open-problems', label: 'Open Problems', hint: 'Panel', run: () => openBottom('problems') },
      {
        id: 'copy-project-id',
        label: 'Copy project ID',
        run: () => {
          navigator.clipboard?.writeText(projectId);
          pushToast('Project ID copied');
        },
      },
      { id: 'open-current-tx', label: 'Open current transaction', hint: 'Activity', run: () => go('activity', '&filter=tx') },
      {
        id: 'disable-policy',
        label: 'Disable policy',
        hint: 'Opens confirmation',
        danger: true,
        run: () => {
          go('policies');
          window.setTimeout(() => onControlRequest('DISABLE_POLICY'), 60);
        },
      },
      {
        id: 'emergency-lock',
        label: 'Emergency Lock',
        hint: 'Opens critical confirmation',
        danger: true,
        run: () => {
          go('control-plane');
          window.setTimeout(() => onControlRequest('EMERGENCY_LOCK'), 60);
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projectId, agentSlug],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => c.label.toLowerCase().includes(q) || (c.hint ?? '').toLowerCase().includes(q));
  }, [commands, query]);

  useEffect(() => {
    if (paletteOpen) {
      setQuery('');
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [paletteOpen]);

  useEffect(() => setCursor(0), [query]);

  if (!paletteOpen) return null;

  const runAt = (index: number) => {
    const command = filtered[index];
    if (!command) return;
    setPaletteOpen(false);
    command.run();
  };

  return (
    <div
      className="cl-palette-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setPaletteOpen(false);
      }}
    >
      <div className="cl-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          ref={inputRef}
          className="cl-palette-input"
          placeholder="Type a command or search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setPaletteOpen(false);
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setCursor((c) => Math.min(c + 1, filtered.length - 1));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setCursor((c) => Math.max(c - 1, 0));
            }
            if (e.key === 'Enter') {
              e.preventDefault();
              runAt(cursor);
            }
          }}
          aria-label="Command"
        />
        <div className="cl-palette-list" role="listbox">
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12.5 }} className="cl-dim">
              No matching command.
            </div>
          ) : (
            filtered.map((command, i) => (
              <div
                key={command.id}
                role="option"
                aria-selected={i === cursor}
                className="cl-palette-item"
                data-active={i === cursor}
                onMouseEnter={() => setCursor(i)}
                onClick={() => runAt(i)}
                style={{ color: command.danger ? 'var(--cl-deny)' : undefined }}
              >
                {command.label}
                {command.hint ? <span className="cl-palette-item-hint">{command.hint}</span> : null}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
