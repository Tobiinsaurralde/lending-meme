'use client';

/**
 * Global status bar (spec §7).
 *
 * Every item is a click target with a defined destination. Policy state here is
 * the observed chain state with its freshness — never optimistic client state.
 */
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Modal } from '../dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import type { CreMode, Environment, Freshness, Status } from '@/lib/studio/types';
import { CRE_MODE_LABEL, statusTone } from '../primitives';

/** Verdict hues re-tuned for the navy chrome bar. */
const CHROME_DOT: Record<string, string> = {
  pass: '#4ac68a',
  warn: '#e8b055',
  deny: '#f5776d',
  sim: '#b79cf7',
  data: '#63c3de',
  blocked: '#bcc2d4',
  neutral: '#fef1d0',
};

export function StatusBar({
  projectId,
  agentSlug,
  environment,
  policyState,
  policyFreshness,
  runtimeState,
  creMode,
  creStatus,
  syncSeconds,
  problemCount,
}: {
  projectId: string;
  agentSlug: string;
  environment: Environment;
  policyState: Status;
  policyFreshness: Freshness;
  runtimeState: Status;
  creMode: CreMode;
  creStatus: Status;
  syncSeconds: number;
  problemCount: number;
}) {
  const router = useRouter();
  const { openBottom } = useWorkbench();
  const [boundaryOpen, setBoundaryOpen] = useState(false);
  const [sync, setSync] = useState(syncSeconds);

  // Sync age ticks locally; a reconnect refetches the authoritative snapshot.
  useEffect(() => {
    setSync(syncSeconds);
    const handle = window.setInterval(() => setSync((s) => s + 1), 1000);
    return () => window.clearInterval(handle);
  }, [syncSeconds]);

  const go = (segment: string) => router.push(`/projects/${projectId}/${segment}?agent=${agentSlug}`);

  const item = (key: string, label: string, value: string, onClick: () => void, tone?: string, title?: string) => (
    <button type="button" className="cl-status-item" onClick={onClick} title={title ?? label} key={key}>
      {tone ? (
        <span
          className="cl-badge-dot"
          /* Light-end hues: the cream-ground verdict palette is too dark to read
             against the navy status bar. */
          style={{ background: CHROME_DOT[tone] ?? 'var(--cl-ink-inv)' }}
          aria-hidden
        />
      ) : null}
      <span style={{ opacity: 0.72 }}>{label}</span>
      <span>{value}</span>
    </button>
  );

  return (
    <>
      <footer className="cl-statusbar" aria-label="Status bar">
        <button
          type="button"
          className="cl-status-item"
          onClick={() => setBoundaryOpen(true)}
          title="Explain the network boundary"
          style={{ fontFamily: 'var(--medium)', letterSpacing: '0.08em' }}
        >
          TESTNET
        </button>
        <span className="cl-status-sep" />
        {item('exec', 'Exec:', environment.executionNetwork, () => go('deploy'), 'sim', 'Open Deploy / environment inspector')}
        <span className="cl-status-sep" />
        {item(
          'reality',
          'Reality:',
          `${environment.realitySource} READ ONLY`,
          () => go('reality'),
          'data',
          'Open Reality Lab',
        )}
        <span className="cl-status-sep" />
        {item('cre', 'CRE:', CRE_MODE_LABEL[creMode], () => go('cre'), statusTone(creStatus), 'Open Chainlink CRE')}
        <span className="cl-status-sep" />
        {item(
          'policy',
          'Policy:',
          `${policyState}${policyFreshness.state !== 'FRESH' ? ` · ${policyFreshness.state}` : ''}`,
          () => go('policies'),
          statusTone(policyState),
          `Observed on-chain state · ${policyFreshness.state.toLowerCase()}`,
        )}
        <span className="cl-status-sep" />
        {item('runtime', 'Runtime:', runtimeState, () => go('runtime'), statusTone(runtimeState), 'Open Runtime')}
        <span className="cl-status-sep" />
        {item('sync', 'Sync:', `${sync}s`, () => go('control-plane'), undefined, 'Open Control Plane freshness details')}
        <span className="cl-status-sep" />
        {item(
          'problems',
          'Problems:',
          String(problemCount),
          () => openBottom('problems'),
          problemCount > 0 ? 'warn' : undefined,
          'Open Problems panel',
        )}
        <span className="cl-status-spacer" />
      </footer>

      <Modal
        open={boundaryOpen}
        onClose={() => setBoundaryOpen(false)}
        title="Testnet Lab network boundary"
        footer={
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => setBoundaryOpen(false)}>
            Understood
          </button>
        }
      >
        <p style={{ fontSize: 13, lineHeight: 1.6 }}>
          Production-chain execution is disabled for this project. Mainnet may only be used as a read-only data source or
          as an isolated local fork.
        </p>
        <dl className="cl-statechange" style={{ marginTop: 14 }}>
          <div className="cl-statechange-row">
            <dt>Execution target</dt>
            <dd>
              {environment.executionNetwork} · chain id {environment.executionChainId}
            </dd>
          </div>
          <div className="cl-statechange-row">
            <dt>Market source</dt>
            <dd>{environment.realitySource} · READ ONLY</dd>
          </div>
          <div className="cl-statechange-row">
            <dt>Production-chain writes</dt>
            <dd>{environment.mainnetWrites}</dd>
          </div>
        </dl>
      </Modal>
    </>
  );
}
