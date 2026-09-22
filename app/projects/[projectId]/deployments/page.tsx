'use client';

/**
 * Deployments (spec §20).
 *
 * Every deployment of this agent with its artifacts and receipts. A deployment
 * records what was true when it was made — it is evidence about that revision,
 * not a claim about the current one.
 */
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Rocket } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockchainRef,
  Card,
  KeyValue,
  Section,
  StatusBadge,
  TimeAgo,
} from '@/components/studio/primitives';
import { Modal } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { toDeployment } from '@/lib/studio/api/adapters/operate';
import { useForkDeployments } from '@/lib/studio/api/queries';
import type { Deployment } from '@/lib/studio/types';

export default function DeploymentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelection } = useWorkbench();
  const { agent, agentSlug, project, ctx } = useStudioPage('deployments');
  const list = useForkDeployments(ctx.dataProjectId, true);
  /* Every fork deployment this project has made, newest first; the revision number is its ordinal. */
  const DEPLOYMENTS = useMemo<Deployment[]>(() => {
    const rows = [...(list.data ?? [])].reverse();
    return rows.map((d, i) => toDeployment(d, i + 1, project.revisions.creArtifactHash)).reverse();
  }, [list.data, project.revisions.creArtifactHash]);

  const [receipt, setReceipt] = useState<Deployment | null>(null);
  const current = ctx.deployment ? (DEPLOYMENTS.find((d) => d.id === ctx.deployment!.deploymentId)?.revision ?? null) : null;

  return (
    <StudioPage
      segment="deployments"
      badges={
        <>
          <Badge tone="neutral">{agent.name}</Badge>
          <Badge tone="neutral">{DEPLOYMENTS.length} deployments</Badge>
          <Badge tone="pass">Active: r{current}</Badge>
        </>
      }
      actions={
        <button
          type="button"
          className="cl-btn cl-btn-primary"
          onClick={() => router.push(`/projects/${ctx.routeProjectId}/deploy?agent=${agentSlug}`)}
        >
          <Rocket size={13} aria-hidden />
          Run Deployment Preflight
        </button>
      }
    >
      <Section label="History">
        <Card flush>
          <div className="cl-table-scroll">
            <table className="cl-table" style={{ minWidth: 940 }}>
              <thead>
                <tr>
                  <th style={{ width: 150 }}>Deployment</th>
                  <th style={{ width: 130 }}>Status</th>
                  <th style={{ width: 150 }}>Blueprint / build</th>
                  <th style={{ width: 170 }}>Network</th>
                  <th style={{ minWidth: 180 }}>CRE mode</th>
                  <th style={{ width: 140 }}>Security</th>
                  <th style={{ width: 130 }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {DEPLOYMENTS.map((deployment) => (
                  <tr
                    key={deployment.id}
                    data-clickable="true"
                    data-selected={deployment.revision === current}
                    onClick={() => {
                      setReceipt(deployment);
                      setSelection({ kind: 'deployment', id: deployment.id, label: `Deployment ${deployment.revision}` });
                    }}
                  >
                    <td>
                      {/* text and badge need a row with a gap; placed adjacent
                          they collide once the column is narrow */}
                      <span className="cl-row cl-row-wrap" style={{ gap: 7 }}>
                        <span className="cl-strong">r{deployment.revision}</span>
                        {deployment.revision === current ? (
                          <Badge tone="pass" title="Currently deployed">
                            active
                          </Badge>
                        ) : null}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={deployment.status} />
                    </td>
                    <td className="cl-mono">
                      r{deployment.blueprintRevision} / r{deployment.buildRevision}
                    </td>
                    <td>
                      <Badge tone="sim">{deployment.network}</Badge>
                    </td>
                    <td className="cl-meta">Official CLI simulator</td>
                    <td>
                      <StatusBadge status={deployment.securityStatus} />
                    </td>
                    <td className="cl-meta">
                      <TimeAgo iso={deployment.createdAt} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <p className="cl-meta" style={{ marginTop: 10 }}>
          A deployment records what was true when it was made. {current ? `The active deployment stays on r${current} until a new` : 'There is no active deployment; a new'}
          one is made, regardless of how far the Blueprint has moved on.
        </p>
      </Section>

      {/* receipt */}
      <Modal
        open={receipt !== null}
        onClose={() => setReceipt(null)}
        title={receipt ? `Deployment r${receipt.revision}` : ''}
        subtitle="Deployment receipt"
        wide
        footer={
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => setReceipt(null)}>
            Close
          </button>
        }
      >
        {receipt ? (
          <>
            <KeyValue
              rows={[
                { label: 'Status', value: <StatusBadge status={receipt.status} /> },
                { label: 'Network', value: receipt.network },
                { label: 'Blueprint / build', value: `r${receipt.blueprintRevision} / r${receipt.buildRevision}` },
                { label: 'Created', value: <TimeAgo iso={receipt.createdAt} /> },
                { label: 'Runtime image', value: receipt.runtimeImageDigest, mono: true },
                { label: 'CRE workflow hash', value: <BlockchainRef value={receipt.creWasmHash} kind="hash" /> },
                { label: 'Security at deploy', value: <StatusBadge status={receipt.securityStatus} /> },
                { label: 'Policy at deploy', value: <Badge tone="blocked">DISABLED</Badge> },
              ]}
            />

            {receipt.contracts.length > 0 ? (
              <div style={{ marginTop: 18 }}>
                <div className="cl-label" style={{ marginBottom: 8 }}>
                  Contracts
                </div>
                <table className="cl-table">
                  <thead>
                    <tr>
                      <th>Contract</th>
                      <th style={{ width: 230 }}>Address</th>
                      <th style={{ width: 120 }}>Verified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.contracts.map((contract) => (
                      <tr key={contract.name}>
                        <td className="cl-strong">{contract.name}</td>
                        <td>
                          <BlockchainRef value={contract.address} network={receipt.network} />
                        </td>
                        <td>
                          <StatusBadge status={contract.verified ? 'PASS' : 'PENDING'} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="cl-meta" style={{ marginTop: 16 }}>
                No contract receipts recorded for this deployment.
              </p>
            )}

            {receipt.progress.length > 0 ? (
              <div style={{ marginTop: 18 }}>
                <div className="cl-label" style={{ marginBottom: 8 }}>
                  Progress
                </div>
                <div className="cl-steps">
                  {receipt.progress.map((step, i) => (
                    <div className="cl-step" key={step.id} style={{ cursor: 'default' }}>
                      <span className="cl-step-index">{i + 1}</span>
                      <span className="cl-step-name">{step.label}</span>
                      <span className="cl-step-status">
                        <StatusBadge status={step.status} />
                      </span>
                      <span className="cl-step-detail">{step.detail ?? ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>
        ) : null}
      </Modal>
    </StudioPage>
  );
}
