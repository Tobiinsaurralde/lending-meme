'use client';

/**
 * Identity / ENS (spec §27).
 *
 * Agent identity, namespace, lifecycle and revocation — kept separate from
 * financial permissions.
 *
 * The page states the distinction explicitly: ENS identifies and revokes
 * agents, ContextLock policy defines what they may spend. Financial limits are
 * never presented as ENS roles.
 */
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CornerDownRight, RefreshCw, ShieldAlert, Workflow } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockchainRef,
  BlockerBanner,
  Card,
  FreshnessBadge,
  KeyValue,
  Section,
  StatusBadge,
  TimeAgo,
} from '@/components/studio/primitives';
import { Modal, SecurityConfirmation } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { useControlRequest } from '@/lib/studio/control-bridge';
import { policyStatusOf, toIdentityState } from '@/lib/studio/api/adapters/operate';
import { useControlCommand, useInvalidateAll } from '@/lib/studio/api/queries';
import { ApiError } from '@/lib/studio/api/client';
import type { Status } from '@/lib/studio/types';

export default function IdentityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { pushToast, selection, setSelection } = useWorkbench();

  const { agent, agentSlug, project, ctx } = useStudioPage('identity');
  const invalidate = useInvalidateAll();
  const command = useControlCommand(ctx.deploymentId, ctx.dataProjectId ?? undefined);
  const IDENTITY = useMemo(() => toIdentityState(agent, project.agents, ctx.overview, ctx.deployment, ctx.buildView?.blueprint ?? null), [agent, project.agents, ctx.overview, ctx.deployment, ctx.buildView?.blueprint]);
  const POLICY = { network: project.environment.executionNetwork, observed: policyStatusOf(ctx.overview) };
  const [error, setError] = useState<string | null>(null);

  const state: Status = IDENTITY.state;
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [recordsOpen, setRecordsOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useControlRequest('REVOKE_AGENT', () => setRevokeOpen(true));

  const go = (segment: string) => router.push(`/projects/${ctx.routeProjectId}/${segment}?agent=${agentSlug}`);

  return (
    <StudioPage
      segment="identity"
      badges={
        <>
          <Badge tone="neutral">{agent.name}</Badge>
          <StatusBadge status={state} large />
          <FreshnessBadge freshness={IDENTITY.freshness} />
        </>
      }
      actions={
        <>
          <button
            type="button"
            className="cl-btn"
            onClick={() => {
              setRefreshing(true);
              void invalidate().then(() => { setRefreshing(false); pushToast('Identity re-read from the fork'); });
            }}
            disabled={refreshing}
          >
            <RefreshCw size={13} aria-hidden />
            {refreshing ? 'Reading…' : 'Refresh ENS State'}
          </button>
          <button type="button" className="cl-btn" onClick={() => setRecordsOpen(true)}>
            View Records
          </button>
          <button type="button" className="cl-btn" onClick={() => go('architecture')}>
            <Workflow size={13} aria-hidden />
            Open Architecture
          </button>
          <button
            type="button"
            className="cl-btn cl-btn-danger"
            onClick={() => setRevokeOpen(true)}
            disabled={state === 'REVOKED'}
          >
            <ShieldAlert size={13} aria-hidden />
            Revoke Agent Identity
          </button>
        </>
      }
      banners={
        <BlockerBanner tone="neutral" title="ENS identifies and revokes agents. ContextLock policy defines their financial permissions.">
          These are separate systems on purpose. Revoking this identity stops previously issued capabilities being
          honoured; it does not change what the policy permits, and the policy is currently {POLICY.observed}. No
          financial limit is stored as an ENS record.
        </BlockerBanner>
      }
    >
      {/* Identity carries hashes and addresses, the namespace carries short
          names — so the split is weighted rather than even. */}
      <div className="cl-grid cl-grid-wide-narrow">
        <Section label="Identity">
          <Card>
            <KeyValue
              rows={[
                {
                  label: 'ENS name',
                  value: <BlockchainRef label={IDENTITY.ensName} value={IDENTITY.node} kind="node" network={POLICY.network} />,
                },
                { label: 'Node hash', value: IDENTITY.node, mono: true },
                { label: 'Owner', value: <BlockchainRef value={IDENTITY.owner} network={POLICY.network} /> },
                { label: 'Manager', value: <BlockchainRef value={IDENTITY.manager} network={POLICY.network} /> },
                { label: 'Agent address', value: <BlockchainRef value={IDENTITY.agentAddress} network={POLICY.network} /> },
                { label: 'Identity hash', value: IDENTITY.identityHash, mono: true },
                { label: 'Expiry', value: IDENTITY.expiry ? <TimeAgo iso={IDENTITY.expiry} /> : 'no expiry' },
                { label: 'State', value: <StatusBadge status={state} /> },
              ]}
            />
            <div style={{ marginTop: 12 }}>
              <FreshnessBadge freshness={IDENTITY.freshness} />
            </div>
          </Card>
        </Section>

        <Section label="Organization namespace">
          <Card>
            <div className="cl-strong" style={{ fontSize: 13.5, marginBottom: 10 }}>
              treasury.ctxlock.eth
            </div>
            <ul className="cl-col" style={{ gap: 8 }}>
              {project.agents.map((sibling) => (
                <li key={sibling.id}>
                  <button
                    type="button"
                    className="cl-row"
                    style={{ gap: 8, width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    onClick={() => router.push(`/projects/${ctx.routeProjectId}/identity?agent=${sibling.slug}`)}
                  >
                    <CornerDownRight size={12} aria-hidden style={{ opacity: 0.5 }} />
                    <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <span className={sibling.slug === agentSlug ? 'cl-strong' : undefined} style={{ display: 'block', fontSize: 13 }}>
                        {sibling.ensName}
                      </span>
                      <span className="cl-meta">{sibling.role}</span>
                    </span>
                    {sibling.slug === agentSlug ? <Badge tone="neutral">viewing</Badge> : null}
                  </button>
                </li>
              ))}
            </ul>
            <p className="cl-meta" style={{ marginTop: 12, whiteSpace: 'normal' }}>
              Each agent holds its own name under the namespace. Revoking one does not affect its siblings — they are
              separate principals with separate identities.
            </p>
          </Card>
        </Section>
      </div>

      <Section
        label="Records"
        actions={
          <button type="button" className="cl-btn cl-btn-sm" onClick={() => setRecordsOpen(true)}>
            View all
          </button>
        }
      >
        <Card flush>
          <table className="cl-table">
            <thead>
              <tr>
                <th style={{ width: 190 }}>Key</th>
                <th>Value</th>
                <th style={{ width: 200 }}>Kind</th>
              </tr>
            </thead>
            <tbody>
              {IDENTITY.records.map((record) => (
                <tr
                  key={record.key}
                  data-clickable="true"
                  data-selected={selection?.id === record.key}
                  onClick={() => setSelection({ kind: 'ens-record', id: record.key, label: record.key })}
                >
                  <td className="cl-mono">{record.key}</td>
                  <td className="cl-mono" style={{ fontSize: 11.5 }}>
                    {record.value}
                  </td>
                  <td>
                    <Badge tone="neutral">{record.kind.replace(/-/g, ' ')}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <p className="cl-meta" style={{ marginTop: 10 }}>
          Records carry agent context, an endpoint and resolver metadata. Notice that no spending limit appears here:
          authority lives in the policy, not in a name record.
        </p>
      </Section>

      {/* revoke */}
      <SecurityConfirmation
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={() => {
          setRevokeOpen(false);
          if (!ctx.deployment) return;
          setError(null);
          command
            .mutateAsync({ operation: 'REVOKE_IDENTITY', expectedRevision: ctx.deployment.revision, reason: 'revoked from the Identity page', target: { identityNode: IDENTITY.node || null } })
            .then((r) => pushToast(r.ok === false ? `Refused: ${r.detail}` : `${r.detail ?? 'revoked'} — ${(r.result as { verification?: string } | undefined)?.verification ?? 'read back from the fork'}`))
            .catch((e) => setError(e instanceof ApiError ? e.message : (e as Error).message));
        }}
        busy={command.isPending}
        disabled={!ctx.deploymentId || state === 'REVOKED'}
        disabledReason={!ctx.deploymentId ? 'Revocation acts on a live deployment; this agent has none.' : 'Already revoked.'}
        action="Revoke agent identity"
        currentState={<StatusBadge status={state} />}
        requestedState={<StatusBadge status="REVOKED" />}
        network={POLICY.network}
        resource={<BlockchainRef label={IDENTITY.ensName} value={IDENTITY.node} kind="node" />}
        extraRows={[
          { label: 'Affected agent', value: agent.name },
          {
            label: 'Sibling impact',
            value:
              IDENTITY.siblings.filter((s) => s.affected).length === 0
                ? `None. ${IDENTITY.siblings.map((s) => s.ensName).join(', ')} are separate principals and keep their identities.`
                : IDENTITY.siblings.filter((s) => s.affected).map((s) => s.ensName).join(', '),
          },
          {
            label: 'Capability impact',
            value: 'Capabilities already issued to this identity stop being honoured by the executor.',
          },
          {
            label: 'Policy impact',
            value: (
              <span className="cl-row" style={{ gap: 7 }}>
                <Badge tone="warn">None</Badge>
                <span className="cl-meta">Policy stays {POLICY.observed}</span>
              </span>
            ),
          },
          { label: 'Post-write verification', value: 'A fresh ENS read must confirm the revocation before it is reported complete.' },
        ]}
        consequence="The agent loses its verifiable identity, so the executor will refuse capabilities presented under it. This is not a substitute for disabling financial authority."
        actionLabel="Revoke Agent Identity"
      />

      {/* records */}
      <Modal
        open={recordsOpen}
        onClose={() => setRecordsOpen(false)}
        title="ENS records"
        subtitle={IDENTITY.ensName}
        wide
        footer={
          <button type="button" className="cl-btn cl-btn-primary" onClick={() => setRecordsOpen(false)}>
            Close
          </button>
        }
      >
        <KeyValue rows={IDENTITY.records.map((r) => ({ label: r.key, value: r.value, mono: true }))} />
        <p className="cl-meta" style={{ marginTop: 14 }}>
          Resolver metadata and agent-context records only. A financial limit is never stored as a record, because a
          name record is not an authority boundary.
        </p>
      </Modal>
    </StudioPage>
  );
}
