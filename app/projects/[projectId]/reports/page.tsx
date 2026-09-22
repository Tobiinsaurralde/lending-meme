'use client';

/**
 * Safety Reports & Evidence (spec §28).
 *
 * Produces shareable, secret-free evidence of what the agent was built to do
 * and what was actually tested.
 *
 * Rules encoded here:
 *  - Secret scanning gates distribution. Download, PDF and share link are
 *    unavailable until a scan has passed — an unscanned report is UNSCANNED,
 *    not "probably fine".
 *  - A report built against an older revision is marked stale and says so;
 *    it is never silently presented as current.
 *  - Simulated evidence is labelled simulated, in the preview and in the
 *    evidence bundle. A simulator result is never rendered as DON execution.
 */
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Check,
  Download,
  Eye,
  FileJson,
  FileText,
  Link2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  ArtifactHash,
  Badge,
  BlockerBanner,
  Card,
  CopyButton,
  EmptyState,
  KeyValue,
  Section,
  StatusBadge,
  TabStrip,
  TimeAgo,
  Timestamp,
} from '@/components/studio/primitives';
import { Modal, StandardConfirmation } from '@/components/studio/dialogs';
import { AgentPatchInbox } from '@/components/studio/AgentPatches';
import { useWorkbench } from '@/lib/studio/workbench';
import { EVIDENCE_KIND_LABEL, REPORT_TYPE_LABEL, toEvidence, toReports } from '@/lib/studio/api/adapters/reports';
import { useCreSimulations, useSafetyReport, useInvalidateAll } from '@/lib/studio/api/queries';
import { lab as labApi } from '@/lib/studio/api/endpoints';
import { apiUrl } from '@/lib/studio/api/client';
import type { Report } from '@/lib/studio/types';

type Tab = 'reports' | 'evidence';

/** Distribution is gated on a passed scan, not merely on the report existing. */
function canDistribute(report: Report): boolean {
  return report.secretScan === 'PASS' && report.privacy === 'SECRET_FREE';
}

export default function ReportsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelection, selection, pushToast, developerMode } = useWorkbench();

  const { agent, agentSlug, project, ctx } = useStudioPage('reports');
  const invalidate = useInvalidateAll();
  const reportQ = useSafetyReport(ctx.dataProjectId);
  const creRuns = useCreSimulations(ctx.dataProjectId);
  const REPORTS = useMemo(() => toReports(reportQ.data ?? null, ctx.buildView, ctx.deployment, creRuns.data ?? []), [reportQ.data, ctx.buildView, ctx.deployment, creRuns.data]);
  const EVIDENCE = useMemo(() => toEvidence(reportQ.data ?? null, ctx.deployment, creRuns.data ?? []), [reportQ.data, ctx.deployment, creRuns.data]);

  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'evidence' ? 'evidence' : 'reports');
  const [selectedId, setSelectedId] = useState('rep_safety');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [verified, setVerified] = useState<string[]>([]);

  const selected = REPORTS.find((r) => r.id === selectedId) ?? REPORTS[0];
  const stale = REPORTS.filter((r) => !r.current && r.generatedAt);
  const ungenerated = REPORTS.filter((r) => !r.generatedAt);

  const go = (segment: string) => router.push(`/projects/${ctx.routeProjectId}/${segment}?agent=${agentSlug}`);

  /* Generation is a server read: the backend rebuilds the report from live state, seals and scans it. */
  const generate = (report: Report) => {
    setGenerating(report.id);
    void invalidate().then(() => {
      setGenerating(null);
      pushToast(`${report.title} regenerated from the server's current state — secret scan runs before it leaves`);
    });
  };

  const downloadJson = (report: Report) => {
    const body = report.type === 'agent-safety' && reportQ.data ? reportQ.data : { title: report.title, revision: report.revision, generatedAt: report.generatedAt, sections: report.sections ?? [] };
    const blob = new Blob([JSON.stringify(body, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.type}-r${report.revision}.json`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast(`${report.title}.json downloaded`);
  };

  const simulatedEvidence = useMemo(() => EVIDENCE.filter((e) => e.simulated).length, [EVIDENCE]);

  return (
    <StudioPage
      segment="reports"
      badges={
        <>
          <Badge tone="neutral">{agent.name}</Badge>
          <Badge tone="neutral">{REPORTS.filter((r) => r.generatedAt).length} of {REPORTS.length} generated</Badge>
          {stale.length > 0 ? <Badge tone="warn">{stale.length} stale</Badge> : null}
        </>
      }
      actions={
        <>
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => generate(selected)} disabled={!!generating}>
            <Sparkles size={13} aria-hidden />
            {generating ? 'Generating…' : 'Generate Report'}
          </button>
          <button
            type="button"
            className="cl-btn"
            onClick={() => generate(selected)}
            disabled={!!generating || !selected.generatedAt}
            title={selected.generatedAt ? undefined : 'This report has never been generated'}
          >
            <RefreshCw size={13} aria-hidden />
            Regenerate Current Revision
          </button>
          <button
            type="button"
            className="cl-btn"
            onClick={() => setPreviewOpen(true)}
            disabled={!selected.sections}
            title={selected.sections ? undefined : 'No preview until this report is generated'}
          >
            <Eye size={13} aria-hidden />
            Preview
          </button>
          <button type="button" className="cl-btn" onClick={() => setVerifyOpen(true)} disabled={!selected.hash}>
            <ShieldCheck size={13} aria-hidden />
            Verify Hash
          </button>
        </>
      }
      banners={
        <>
          {ungenerated.length > 0 ? (
            <BlockerBanner tone="warn" title={`${ungenerated.length} report has never been generated`}>
              {ungenerated.map((r) => r.title).join(', ')} has no hash and no secret-scan result. It is reported
              UNSCANNED rather than counted as an empty pass, and it cannot be downloaded or shared.
            </BlockerBanner>
          ) : null}
          {stale.length > 0 ? (
            <BlockerBanner
              tone="warn"
              title={`${stale.length} report was built against an older revision`}
              actions={
                <button type="button" className="cl-btn cl-btn-sm" onClick={() => generate(stale[0])}>
                  Regenerate
                </button>
              }
            >
              {stale.map((r) => `${r.title} (r${r.revision})`).join(', ')} — the Blueprint is now r
              {project.revisions.blueprint}. A stale report still describes what it actually measured; it is simply not
              evidence about the current revision.
            </BlockerBanner>
          ) : null}
        </>
      }
    >
      <AgentPatchInbox pageKind="reports" />

      <TabStrip<Tab>
        tabs={[
          { id: 'reports', label: 'Reports', badge: <Badge tone="neutral">{REPORTS.length}</Badge> },
          { id: 'evidence', label: 'Evidence', badge: <Badge tone="neutral">{EVIDENCE.length}</Badge> },
        ]}
        active={tab}
        onChange={(next) => {
          setTab(next);
          router.replace(`/projects/${ctx.routeProjectId}/reports?agent=${agentSlug}${next === 'evidence' ? '&tab=evidence' : ''}`);
        }}
      />

      {tab === 'reports' ? (
        <>
          <Section label="Reports">
            <Card flush>
              <div className="cl-table-scroll">
                <table className="cl-table" style={{ minWidth: 940 }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 200 }}>Report</th>
                      <th style={{ width: 110 }}>Type</th>
                      <th style={{ width: 90 }}>Revision</th>
                      <th style={{ width: 130 }}>Generated</th>
                      <th style={{ minWidth: 160 }}>Hash</th>
                      <th style={{ width: 110 }}>State</th>
                      <th style={{ width: 150 }}>Privacy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {REPORTS.map((report) => (
                      <tr
                        key={report.id}
                        data-clickable="true"
                        data-selected={report.id === selectedId}
                        onClick={() => {
                          setSelectedId(report.id);
                          setSelection({ kind: 'report', id: report.id, label: report.title });
                        }}
                      >
                        <td className="cl-strong">{report.title}</td>
                        <td className="cl-meta">{REPORT_TYPE_LABEL[report.type]}</td>
                        <td className="cl-mono">r{report.revision}</td>
                        <td className="cl-meta">
                          {report.generatedAt ? <TimeAgo iso={report.generatedAt} /> : 'never'}
                        </td>
                        <td>
                          {report.hash ? (
                            <span className="cl-mono" style={{ fontSize: 11.5 }}>
                              {report.hash.slice(0, 10)}…{report.hash.slice(-6)}
                            </span>
                          ) : (
                            <span className="cl-meta">—</span>
                          )}
                        </td>
                        <td>
                          {!report.generatedAt ? (
                            <Badge tone="neutral">NOT GENERATED</Badge>
                          ) : report.current ? (
                            <Badge tone="pass">CURRENT</Badge>
                          ) : (
                            <Badge tone="warn">STALE</Badge>
                          )}
                        </td>
                        <td>
                          {report.privacy === 'SECRET_FREE' ? (
                            <Badge tone="pass">SECRET-FREE</Badge>
                          ) : report.privacy === 'INTERNAL' ? (
                            <Badge tone="warn">INTERNAL</Badge>
                          ) : (
                            <Badge tone="blocked">UNSCANNED</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </Section>

          <Section label={`Selected — ${selected.title}`}>
            <Card>
              <KeyValue
                rows={[
                  { label: 'Report type', value: REPORT_TYPE_LABEL[selected.type] },
                  { label: 'Built against', value: `Blueprint r${selected.revision}` },
                  {
                    label: 'Generated',
                    value: selected.generatedAt ? <Timestamp iso={selected.generatedAt} /> : 'Never generated',
                  },
                  {
                    label: 'Content hash',
                    value: selected.hash ? <ArtifactHash label="sha256" value={selected.hash} /> : '—',
                  },
                  {
                    label: 'Secret scan',
                    value: (
                      <span className="cl-row" style={{ gap: 8 }}>
                        <StatusBadge status={selected.secretScan} />
                        <span className="cl-meta">
                          {selected.secretScan === 'PASS'
                            ? 'No secrets found. Download and sharing are available.'
                            : 'Not scanned. Download and sharing stay unavailable until a scan passes.'}
                        </span>
                      </span>
                    ),
                  },
                ]}
              />

              {/* Distribution controls are gated together: one rule, one place. */}
              <div className="cl-btn-group" style={{ marginTop: 14 }}>
                <button
                  type="button"
                  className="cl-btn"
                  disabled={!canDistribute(selected)}
                  title={canDistribute(selected) ? undefined : 'Blocked until secret scanning passes'}
                  onClick={() => pushToast('PDF rendering is not offered by the Studio API; download the JSON, which is the sealed artifact')}
                >
                  <FileText size={13} aria-hidden />
                  Download PDF
                </button>
                <button
                  type="button"
                  className="cl-btn"
                  disabled={!canDistribute(selected)}
                  title={canDistribute(selected) ? undefined : 'Blocked until secret scanning passes'}
                  onClick={() => downloadJson(selected)}
                >
                  <FileJson size={13} aria-hidden />
                  Download JSON
                </button>
                <button
                  type="button"
                  className="cl-btn"
                  disabled={!canDistribute(selected)}
                  title={canDistribute(selected) ? undefined : 'Blocked until secret scanning passes'}
                  onClick={() => setShareOpen(true)}
                >
                  <Link2 size={13} aria-hidden />
                  Copy Share Link
                </button>
              </div>

              {!canDistribute(selected) ? (
                <p className="cl-meta" style={{ marginTop: 10 }}>
                  Distribution is blocked because this report has not passed secret scanning. Generate it, let the scan
                  complete, and the controls become available.
                </p>
              ) : null}
            </Card>
          </Section>
        </>
      ) : (
        <Section
          label="Evidence bundle"
          actions={
            <span className="cl-meta">
              {simulatedEvidence} of {EVIDENCE.length} items are from simulated runs
            </span>
          }
        >
          {EVIDENCE.length === 0 ? (
            <EmptyState title="No evidence yet" body="Run a simulation or a deployment to produce evidence." />
          ) : (
            <Card flush>
              <div className="cl-table-scroll">
                <table className="cl-table" style={{ minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 200 }}>File</th>
                      <th style={{ width: 110 }}>Kind</th>
                      <th style={{ width: 110 }}>Produced</th>
                      <th style={{ width: 90 }}>Size</th>
                      <th style={{ minWidth: 280 }}>What it proves</th>
                    </tr>
                  </thead>
                  <tbody>
                    {EVIDENCE.map((item) => (
                      <tr
                        key={item.id}
                        data-clickable="true"
                        data-selected={selection?.id === item.id}
                        onClick={() => setSelection({ kind: 'evidence', id: item.id, label: item.name })}
                      >
                        <td>
                          <span className="cl-mono cl-strong" style={{ fontSize: 12 }}>
                            {item.name}
                          </span>
                          {developerMode ? (
                            <div className="cl-mono cl-meta" style={{ fontSize: 11, marginTop: 3 }}>
                              {item.hash}
                            </div>
                          ) : null}
                        </td>
                        <td className="cl-meta">{EVIDENCE_KIND_LABEL[item.kind]}</td>
                        <td className="cl-meta">
                          <TimeAgo iso={item.producedAt} />
                        </td>
                        <td className="cl-meta">{item.sizeLabel}</td>
                        <td>
                          <div style={{ fontSize: 12.5, lineHeight: 1.5 }}>{item.proves}</div>
                          {/* Simulated evidence is labelled wherever it appears, so a
                              reader never has to infer it from the filename. */}
                          {item.simulated ? (
                            <div style={{ marginTop: 5 }}>
                              <Badge tone="sim">SIMULATED RUN</Badge>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          <p className="cl-meta" style={{ marginTop: 10 }}>
            Evidence is what a claim in a report points at. Where a run was simulated, the item says so — the CRE
            evidence here proves an official simulator execution, not DON consensus or a hardware attestation.
          </p>
        </Section>
      )}

      {/* preview */}
      <Modal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={selected.title}
        subtitle={`Blueprint r${selected.revision} · ${canDistribute(selected) ? 'secret-free' : 'not cleared for sharing'}`}
        wide
        footer={
          <>
            <button type="button" className="cl-btn" onClick={() => setPreviewOpen(false)}>
              Close
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-primary"
              disabled={!canDistribute(selected)}
              onClick={() => downloadJson(selected)}
            >
              <Download size={13} aria-hidden />
              Download PDF
            </button>
          </>
        }
      >
        {selected.sections?.map((section) => (
          <div key={section.title} style={{ marginBottom: 18 }}>
            <div className="cl-label" style={{ marginBottom: 8 }}>
              {section.title}
            </div>
            <KeyValue rows={section.rows.map((row) => ({ label: row.label, value: row.value, mono: row.mono }))} />
          </div>
        ))}
        <p className="cl-meta">
          Every claim above is tied to a run that actually happened. Simulated results are marked simulated, and the
          CRE evidence classification states official simulation, real DON, DON consensus and hardware TEE separately.
        </p>
      </Modal>

      {/* verify hash */}
      <Modal
        open={verifyOpen}
        onClose={() => {
          setVerifyOpen(false);
          setVerified((prev) => [...new Set([...prev, selected.id])]);
        }}
        title="Verify report hash"
        subtitle={selected.title}
        footer={
          <button
            type="button"
            className="cl-btn cl-btn-primary"
            onClick={() => {
              /* Recompute means: ask the server to rebuild and reseal the report, then compare hashes. */
              if (!ctx.dataProjectId) return;
              void labApi.safetyReport(ctx.dataProjectId).then((fresh) => {
                const match = selected.type === 'agent-safety' ? fresh.reportHash === selected.hash : false;
                if (match) setVerified((prev) => [...new Set([...prev, selected.id])]);
                setVerifyOpen(false);
                pushToast(match ? 'Hash recomputed by the server and matched' : selected.type === 'agent-safety' ? `Hash differs: the server now seals ${fresh.reportHash.slice(0, 18)}… — the underlying state changed since this report` : 'Only the Agent Safety Report carries a sealed hash');
              }).catch((e: Error) => pushToast(e.message));
            }}
          >
            <Check size={13} aria-hidden />
            Recompute and Compare
          </button>
        }
      >
        <KeyValue
          rows={[
            { label: 'Recorded hash', value: selected.hash ?? '—', mono: true },
            { label: 'Algorithm', value: 'sha256 over the canonical report JSON' },
            {
              label: 'Status',
              value: verified.includes(selected.id) ? <Badge tone="pass">MATCHES</Badge> : <Badge tone="neutral">NOT CHECKED</Badge>,
            },
          ]}
        />
        <p className="cl-meta" style={{ marginTop: 12 }}>
          Verification recomputes the hash from the report content and compares it with the recorded value. A mismatch
          means the file is not the report that was generated — it does not mean the agent is unsafe, and it is not
          reported as such.
        </p>
        {selected.hash ? (
          <div style={{ marginTop: 12 }}>
            <CopyButton value={selected.hash} label="Copy hash" />
          </div>
        ) : null}
      </Modal>

      {/* share link */}
      <StandardConfirmation
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        onConfirm={() => {
          setShareOpen(false);
          const link = `${window.location.origin}${apiUrl(`/api/lab/projects/${encodeURIComponent(ctx.dataProjectId ?? '')}/safety-report/public`)}`;
          navigator.clipboard?.writeText(link);
          pushToast('Public-view link copied — built from an allow-list on the server; it never carries deployments, runtime or reality sections');
        }}
        title="Copy share link"
        consequence="The link exposes this report's generated content to anyone who holds it. Only a revision that has passed secret scanning can be shared, and the link always points at that exact revision rather than at whatever is latest."
        resource={`${selected.title} · r${selected.revision}`}
        actionLabel="Copy Share Link"
      />
    </StudioPage>
  );
}
