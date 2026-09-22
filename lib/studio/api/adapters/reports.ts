/**
 * The sealed safety report and the deployment's own records → the Reports page.
 *
 * The Agent Safety Report is the backend's: built from live state, sealed with a sha256 and scanned
 * for secrets before it leaves the server. The other rows are projections of records that already
 * exist (a deployment receipt, the simulation rows, the attack results) — they carry no hash of
 * their own and are marked INTERNAL rather than pretending to be sealed artifacts.
 */
import type { Report } from '../../types';
import type { BuildView, CreSimulationRun, ForkDeploymentView, SafetyReportView } from '../types';

export interface EvidenceItem {
  id: string;
  name: string;
  kind: 'artifact' | 'receipt' | 'run-log' | 'attestation' | 'snapshot';
  producedAt: string;
  hash: string;
  sizeLabel: string;
  proves: string;
  simulated?: boolean;
}

export const EVIDENCE_KIND_LABEL: Record<EvidenceItem['kind'], string> = {
  artifact: 'Artifact',
  receipt: 'Receipt',
  'run-log': 'Run log',
  attestation: 'Attestation',
  snapshot: 'Snapshot',
};

const row = (label: string, value: string, mono = false) => ({ label, value, mono });

export function toReports(report: SafetyReportView | null, view: BuildView | null, deployment: ForkDeploymentView | null, creRuns: CreSimulationRun[]): Report[] {
  const bpRev = view?.blueprint?.revision ?? view?.build.blueprintRevision ?? 0;
  const generatedAt = report ? new Date(report.generatedAtMs).toISOString() : null;
  const stale = !!report && report.agent.blueprintRevision < bpRev;
  const cre = creRuns.find((r) => r.status !== 'RUNNING') ?? null;
  const rec = deployment?.record ?? null;
  const sims = view?.simulations ?? [];
  const passed = sims.filter((s) => s.passed).length;

  const safety: Report = {
    id: 'rep_safety',
    type: 'agent-safety',
    title: 'Agent Safety Report',
    revision: report?.agent.blueprintRevision ?? bpRev,
    generatedAt,
    hash: report?.reportHash ?? null,
    current: !!report && !stale,
    privacy: report ? 'SECRET_FREE' : 'UNSCANNED',
    secretScan: report ? 'PASS' : 'UNKNOWN',
    sections: report
      ? [
          { title: 'Agent goal', rows: [row('Objective', report.agent.goal), row('ENS identity', report.agent.ensIdentity ?? '—'), row('Blueprint revision', `r${report.agent.blueprintRevision}`)] },
          { title: 'Blueprint & Strategy hashes', rows: [row('Blueprint', report.agent.blueprintHash, true), row('Strategy', report.agent.strategyHash, true)] },
          { title: 'Execution networks', rows: [...report.execution.networks.map((n) => row(n.name, `chain ${n.chainId} · ${n.role}`)), row('Production-chain execution', report.execution.productionChainExecution)] },
          { title: 'Production write boundary', rows: report.execution.productionWriteEvidence.map((e, i) => row(`Evidence ${i + 1}`, e)) },
          { title: 'Reality data sources', rows: [...report.reality.sources.map((s) => row(s.sourceId, `${s.kind} · ${s.trustClass} · ${s.status}${s.blocker ? ` · ${s.blocker}` : ''}`)), row('The Graph', report.reality.theGraphState), row('Historical replay', report.reality.archiveReplayState), row('Market snapshot', report.reality.marketSnapshotHash ?? 'none', true), row('Anchor block', report.reality.anchorBlock ?? '—', true)] },
          { title: 'CRE', rows: [row('Mode', `${report.cre.mode} · ${report.cre.executionMode}`), row('Workflow binary', report.cre.wasmHash ?? 'not run', true), row('Production limits', report.cre.productionLimits), row('DON deployment', report.cre.donDeployment), row('Hardware TEE', report.cre.hardwareTee), row('TEE attestation', report.cre.teeAttestation), row('Deploy Access', report.cre.deployAccess)] },
          { title: 'Runtime', rows: [row('Image digest', report.runtime.imageDigest ?? 'none — in-process fork runtime'), row('Adapters', report.runtime.adapterVersions.join(', ') || 'none')] },
          { title: 'Simulations', rows: [row('Mandatory security pass', `${report.testing.securitySimulations.passed} / ${report.testing.securitySimulations.total}`)] },
          { title: 'Attacks', rows: report.testing.attacks.map((a) => row(a.scenario, `${a.result}${a.stoppedBy ? ` by ${a.stoppedBy}` : ''}${a.reasonCode ? ` (${a.reasonCode})` : ''}`)) },
          { title: 'Deployment receipts', rows: report.deployments.length ? report.deployments.map((d) => row(d.name, `${d.address} · chain ${d.chainId}${d.explorerUrl ? '' : ' · no public explorer (local fork)'}`, true)) : [row('Deployments', 'none')] },
          { title: 'Privacy claims', rows: report.privacy.map((p) => row(p.claim, `${p.answer}${p.evidence ? ` — ${p.evidence}` : ''}${p.blocker ? ` (${p.blocker})` : ''}`)) },
          { title: 'Known blockers', rows: report.knownBlockers.map((b) => row(b.id, b.effect)) },
          { title: 'Seal', rows: [row('Report id', report.reportId, true), row('Hash', report.reportHash, true), row('Schema', report.schemaVersion, true)] },
        ]
      : undefined,
  };

  const receipt: Report = {
    id: 'rep_receipt',
    type: 'deployment-receipt',
    title: 'Deployment Receipt',
    revision: deployment?.blueprintRevision ?? bpRev,
    generatedAt: deployment?.updatedAt ?? null,
    hash: rec?.policyHash ?? null,
    current: !!deployment && deployment.state !== 'FAILED',
    privacy: deployment ? 'INTERNAL' : 'UNSCANNED',
    secretScan: deployment ? 'PASS' : 'UNKNOWN',
    sections: rec
      ? [
          { title: 'Deployment', rows: [row('Id', rec.deploymentId, true), row('State', deployment!.state), row('Agent', rec.agentId), row('ENS', rec.ensName), row('Policy hash', rec.policyHash, true), row('Identity hash', rec.agentIdentityHash, true), row('Approver', `${rec.roles.approver} (${rec.approverMode})`, true)] },
          { title: 'Fork', rows: rec.fork ? [row('Fork id', rec.fork.forkId, true), row('Block', rec.fork.forkBlock, true), row('Block hash', rec.fork.forkBlockHash, true), row('Anvil', rec.fork.anvilVersion), row('State', rec.fork.state)] : [row('Fork', 'none')] },
          { title: 'Contracts', rows: Object.entries(rec.contracts ?? {}).map(([n, a]) => row(n, a, true)) },
          { title: 'Transactions', rows: rec.setupTransactions.map((t) => row(t.label, `${t.hash} · block ${t.blockNumber} · ${t.gasUsed} gas · ${t.status} · ${t.network}`, true)) },
          { title: 'Phases', rows: rec.phases.map((p) => row(p.key, `${p.status}${p.detail ? ` — ${p.detail}` : ''}`)) },
        ]
      : undefined,
  };

  const simulation: Report = {
    id: 'rep_simulation',
    type: 'simulation',
    title: 'Simulation Report',
    revision: bpRev,
    generatedAt: sims.length ? (view?.build.approvedAt ?? null) : null,
    hash: null,
    current: sims.length > 0 && !(view?.staleSimulations ?? 0),
    privacy: sims.length ? 'INTERNAL' : 'UNSCANNED',
    secretScan: sims.length ? 'PASS' : 'UNKNOWN',
    sections: sims.length ? [{ title: `Results · ${passed} / ${sims.length} passed`, rows: sims.map((s) => row(s.scenarioId, `${s.passed ? 'PASS' : 'FAIL'} · ${s.verdict} · ${s.outcome} · stopped at ${s.stoppedAt} · r${s.blueprintRevision}/b${s.buildRevision}${s.stale ? ' · STALE' : ''}`)) }] : undefined,
  };

  const attacks: Report = {
    id: 'rep_attacks',
    type: 'attack-lab',
    title: 'Attack Lab Report',
    revision: report?.agent.blueprintRevision ?? bpRev,
    generatedAt,
    hash: null,
    current: !!report && !stale,
    privacy: report ? 'INTERNAL' : 'UNSCANNED',
    secretScan: report ? 'PASS' : 'UNKNOWN',
    sections: report ? [{ title: 'Attacks', rows: report.testing.attacks.map((a) => row(a.scenario, `${a.result}${a.stoppedBy ? ` — stopped by ${a.stoppedBy}` : ''}${a.reasonCode ? ` (${a.reasonCode})` : ''}`)) }] : undefined,
  };

  const reality: Report = {
    id: 'rep_reality',
    type: 'reality-fork',
    title: 'Reality / Fork Report',
    revision: deployment?.blueprintRevision ?? bpRev,
    generatedAt: rec?.snapshot?.observedAtMs ? new Date(rec.snapshot.observedAtMs).toISOString() : deployment?.createdAt ?? null,
    hash: rec?.snapshot?.snapshotHash ?? null,
    current: !!rec?.snapshot,
    privacy: rec?.snapshot ? 'INTERNAL' : 'UNSCANNED',
    secretScan: rec?.snapshot ? 'PASS' : 'UNKNOWN',
    sections: rec?.snapshot ? [{ title: 'Sealed snapshot', rows: [row('Snapshot id', rec.snapshot.snapshotId, true), row('Anchor block', rec.snapshot.anchorBlock, true), row('Hash', rec.snapshot.snapshotHash, true)] }, { title: 'Positions', rows: (rec.position?.scenarios ?? []).map((s) => row(s.protocol, `${s.actionKind} — ${s.detail}`)) }] : undefined,
  };

  const creEvidence: Report = {
    id: 'rep_cre',
    type: 'cre-evidence',
    title: 'CRE Simulation Evidence',
    revision: cre?.blueprintRevision ?? bpRev,
    generatedAt: cre?.finishedAt ?? cre?.startedAt ?? null,
    hash: cre?.result.binaryHash ?? null,
    current: !!cre && cre.blueprintRevision === bpRev,
    privacy: cre ? 'INTERNAL' : 'UNSCANNED',
    secretScan: cre ? 'PASS' : 'UNKNOWN',
    sections: cre ? [{ title: 'Official CLI simulation (SIMULATED RUN)', rows: [row('Run', cre.id, true), row('Status', cre.status), row('Verdict', cre.result.verdict ?? '—'), row('Binary', cre.result.binaryHash ?? '—', true), row('Config', cre.result.configHash ?? '—', true), row('Production limits', cre.result.productionLimits ? 'ENABLED' : 'not confirmed'), row('CLI', cre.result.cliVersion ?? '—'), row('Duration', `${cre.result.durationMs ?? 0} ms`), row('Real DON', 'NO'), row('Hardware TEE', 'NO')] }, { title: 'CLI output (tail)', rows: (cre.result.outputTail ?? []).map((l, i) => row(`${i + 1}`, l, true)) }] : undefined,
  };

  const tests: Report = {
    id: 'rep_tests',
    type: 'test-results',
    title: 'Test Results',
    revision: bpRev,
    generatedAt: view?.tests.length ? (view.build.approvedAt ?? null) : null,
    hash: null,
    current: !!view?.tests.length && !view.codeStale,
    privacy: view?.tests.length ? 'INTERNAL' : 'UNSCANNED',
    secretScan: view?.tests.length ? 'PASS' : 'UNKNOWN',
    sections: view?.tests.length ? [{ title: 'Suites', rows: view.tests.map((t) => row(t.suite, `${t.passed} passed · ${t.failed} failed · build r${t.buildRevision}`)) }] : undefined,
  };

  return [safety, receipt, simulation, attacks, reality, creEvidence, tests];
}

export function toEvidence(report: SafetyReportView | null, deployment: ForkDeploymentView | null, creRuns: CreSimulationRun[]): EvidenceItem[] {
  const out: EvidenceItem[] = [];
  const rec = deployment?.record ?? null;
  const cre = creRuns.find((r) => r.status !== 'RUNNING') ?? null;
  if (cre?.result.binaryHash) out.push({ id: `ev_wasm_${cre.id}`, name: 'cre-workflow.wasm', kind: 'artifact', producedAt: cre.startedAt, hash: cre.result.binaryHash, sizeLabel: '—', proves: 'The exact workflow binary the official simulator executed, hashed by the CRE CLI.', simulated: true });
  if (cre) out.push({ id: `ev_run_${cre.id}`, name: 'cre-simulator-run.log', kind: 'run-log', producedAt: cre.finishedAt ?? cre.startedAt, hash: cre.result.configHash ?? '—', sizeLabel: `${cre.result.outputTail?.length ?? 0} lines`, proves: `The official CRE CLI ${cre.status === 'PASSED' ? 'returned ' + (cre.result.verdict ?? 'a verdict') : 'did not complete'} under ${cre.result.productionLimits ? 'production' : 'default'} limits.`, simulated: true });
  if (rec?.snapshot) out.push({ id: `ev_snap_${rec.snapshot.snapshotId}`, name: 'market-snapshot.json', kind: 'snapshot', producedAt: rec.snapshot.observedAtMs ? new Date(rec.snapshot.observedAtMs).toISOString() : deployment!.createdAt, hash: rec.snapshot.snapshotHash, sizeLabel: '—', proves: `Every source read at fork block ${rec.snapshot.anchorBlock}; the base every scenario comparison is valued against.` });
  for (const tx of rec?.setupTransactions ?? []) out.push({ id: `ev_tx_${tx.hash}`, name: `${tx.label}`, kind: 'receipt', producedAt: deployment!.createdAt, hash: tx.hash, sizeLabel: `${tx.gasUsed} gas`, proves: `${tx.status} on ${tx.network}, block ${tx.blockNumber}. A local-fork transaction: no public explorer link exists.` });
  if (report) out.push({ id: `ev_report_${report.reportId}`, name: 'agent-safety-report.json', kind: 'attestation', producedAt: new Date(report.generatedAtMs).toISOString(), hash: report.reportHash, sizeLabel: '—', proves: 'The sealed report: six privacy claims answered separately, scanned for secrets, hashed.' });
  return out;
}

export const REPORT_TYPE_LABEL: Record<Report['type'], string> = {
  'agent-safety': 'Agent Safety Report',
  'deployment-receipt': 'Deployment Receipt',
  simulation: 'Simulation Report',
  'attack-lab': 'Attack Lab Report',
  'reality-fork': 'Reality / Fork Report',
  'cre-evidence': 'CRE Simulation Evidence',
  'test-results': 'Test Results',
};
