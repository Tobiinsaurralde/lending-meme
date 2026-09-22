'use client';

/**
 * Organization / Agents (spec §11).
 *
 * Agents are distinct principals, not one super-agent: separate identity,
 * separate policy hash, separate budget. A shared security primitive between two
 * agents is a blocking CRITICAL issue, and a reporting-only agent always shows
 * EXECUTION: NONE.
 */
import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CornerDownRight, Copy, Hammer, Plus, ShieldAlert, Trash2 } from 'lucide-react';
import { StudioPage, useStudioPage } from '@/components/studio/PageScaffold';
import {
  Badge,
  BlockchainRef,
  BlockerBanner,
  Card,
  KeyValue,
  NetworkRoleBadge,
  Section,
  StatusBadge,
  formatUsd,
} from '@/components/studio/primitives';
import { SecurityConfirmation, StandardConfirmation } from '@/components/studio/dialogs';
import { useWorkbench } from '@/lib/studio/workbench';
import { useControlRequest } from '@/lib/studio/control-bridge';
import { studio } from '@/lib/studio/api/endpoints';
import { useControlCommand, useInvalidateAll } from '@/lib/studio/api/queries';
import { ApiError } from '@/lib/studio/api/client';
import type { Agent } from '@/lib/studio/types';

export default function OrganizationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelection, pushToast } = useWorkbench();
  const { project, ctx } = useStudioPage('organization');
  const invalidate = useInvalidateAll();

  const agents = project.agents;
  const initial = agents.find((a) => a.slug === searchParams.get('agent')) ?? agents[0] ?? null;
  const [selectedId, setSelectedId] = useState<string | null>(initial?.id ?? null);
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [building, setBuilding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected: Agent | null = agents.find((a) => a.id === selectedId) ?? initial;
  const isRevoked = ctx.overview?.panels.identity?.value?.revoked === true && selected?.projectId === ctx.dataProjectId;
  const revoke = useControlCommand(ctx.deploymentId, ctx.dataProjectId ?? undefined);

  useControlRequest('REVOKE_AGENT', () => setRevokeOpen(true));

  /* A forbidden shared primitive between principals is a blocking issue — the backend's own check. */
  /* Every issue that stops the organization from being built, not only the CRITICAL ones: a HIGH
     validator finding (an unstated daily cap) disables the Build button just the same, and the
     page has to say so where the button is. */
  const blockingIssues = useMemo(() => {
    const issues = ctx.orgView?.issues ?? [];
    return ctx.orgView?.buildable === false ? issues.filter((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH') : issues.filter((i) => i.severity === 'CRITICAL');
  }, [ctx.orgView]);
  const sharedPolicy = useMemo(() => {
    const issues = ctx.orgView?.issues ?? [];
    return issues.filter((i) => i.severity === 'CRITICAL');
  }, [ctx.orgView]);

  const aggregate = agents.reduce((sum, a) => sum + a.orgBudgetImpact, 0);
  const blast = selected ? ctx.orgView?.blastRadii.find((b) => b.compromisedAgentId === selected.id) ?? null : null;

  const go = (segment: string) => {
    if (!selected) return;
    const base = selected.projectId ?? ctx.routeProjectId;
    router.push(`/projects/${base}/${segment}?agent=${selected.slug}`);
  };

  /** Start a member's build: an ordinary single-agent build whose prompt is derived from its role. */
  const buildMember = async (agent: Agent) => {
    if (!ctx.organization) return;
    setError(null);
    setBuilding(agent.id);
    try {
      const r = await studio.buildMember(ctx.organization.id, agent.id);
      await invalidate();
      router.push(`/projects/${r.build.projectId}/build?start=1`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    } finally {
      setBuilding(null);
    }
  };

  if (!selected) {
    return (
      <StudioPage segment="organization">
        <Card>
          <p className="cl-meta">{ctx.loading ? 'Loading the organization…' : 'This project has no agents to show yet.'}</p>
        </Card>
      </StudioPage>
    );
  }

  return (
    <StudioPage
      segment="organization"
      actions={
        <button type="button" className="cl-btn cl-btn-primary" disabled title="Members are designed together from the organization's description. To add one, design the organization again with the new member described.">
          <Plus size={13} aria-hidden />
          Add Agent
        </button>
      }
      banners={
        <>
          {error ? <BlockerBanner tone="deny" title="The Studio API refused">{error}</BlockerBanner> : null}
          {blockingIssues.length > 0 ? (
            <BlockerBanner tone="deny" title={sharedPolicy.length > 0 ? 'CRITICAL — the organization is not buildable' : 'The organization is not buildable until its design states every limit'}>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {blockingIssues.map((i) => (
                  <li key={`${i.code}-${i.path}`}><span className="cl-mono">{i.code}</span> · {i.message} <span className="cl-meta">{i.remediation}</span></li>
                ))}
              </ul>
              <p className="cl-meta" style={{ marginTop: 8, whiteSpace: 'normal' }}>Members are designed together from the description, so the fix is to design the organization again with the missing statements in it (for example “at most $10,000 a day” per agent).</p>
            </BlockerBanner>
          ) : null}
          {ctx.orgView?.unknowns?.length ? (
            <BlockerBanner tone="warn" title="Not established">
              {ctx.orgView.unknowns.join(' · ')}
            </BlockerBanner>
          ) : null}
        </>
      }
    >
      {/* auto-fit rather than a fixed two-column split: the centre pane narrows
          as the explorer widens, and a fixed split squeezes the detail column
          until its content cannot lay out. */}
      <div
        className="cl-grid"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', alignItems: 'start' }}
      >
        {/* organization tree */}
        <Card title={project.organization ?? 'Agents'} flush>
          <ul>
            {agents.map((agent) => {
              const agentRevoked = false;
              return (
                <li key={agent.id}>
                  <button
                    type="button"
                    className="cl-list-row"
                    style={{ width: '100%', textAlign: 'left' }}
                    data-selected={agent.id === selectedId}
                    onClick={() => {
                      setSelectedId(agent.id);
                      setSelection({ kind: 'agent', id: agent.id, label: agent.name });
                    }}
                  >
                    <CornerDownRight size={12} aria-hidden style={{ opacity: 0.5, flex: '0 0 auto' }} />
                    <span style={{ flex: '1 1 auto', minWidth: 0 }}>
                      <span className="cl-strong" style={{ display: 'block' }}>
                        {agent.name}
                      </span>
                      <span className="cl-meta">{agent.role}</span>
                    </span>
                    <StatusBadge status={agentRevoked ? 'REVOKED' : agent.unbuilt ? 'DRAFT' : agent.status} />
                  </button>
                </li>
              );
            })}
          </ul>
          <div style={{ padding: 11, borderTop: '1px solid var(--cl-line)' }}>
            <div className="cl-row" style={{ justifyContent: 'space-between' }}>
              <span className="cl-meta">Organization aggregate budget</span>
              <span className="cl-strong">{formatUsd(aggregate)}</span>
            </div>
            <p className="cl-meta" style={{ marginTop: 5, whiteSpace: 'normal' }}>
              Worst-case combined daily authority across all principals{ctx.organization ? ` under ${ctx.organization.rootEns}` : ''}.
            </p>
          </div>
        </Card>

        {/* selected agent */}
        <div>
          <Card
            title={
              <span className="cl-row" style={{ gap: 8 }}>
                {selected.name}
                <StatusBadge status={isRevoked ? 'REVOKED' : selected.status} />
                {selected.executionClass === 'REPORTING_ONLY' ? (
                  <NetworkRoleBadge role="NONE" />
                ) : (
                  <NetworkRoleBadge role="EXECUTION_TESTNET" />
                )}
              </span>
            }
            actions={
              <div className="cl-row" style={{ gap: 6 }}>
                <button type="button" className="cl-btn cl-btn-sm" onClick={() => go('blueprint')}>
                  Open Blueprint
                </button>
                <button type="button" className="cl-btn cl-btn-sm" onClick={() => go('architecture')}>
                  Open Architecture
                </button>
                <button type="button" className="cl-btn cl-btn-sm" onClick={() => go('policies')}>
                  Open Policy
                </button>
              </div>
            }
          >
            <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>{selected.objective || selected.role}</p>

            {selected.unbuilt ? (
              <BlockerBanner
                tone="warn"
                title="Not built yet"
                actions={
                  <button type="button" className="cl-btn cl-btn-sm cl-btn-primary" disabled={building === selected.id || !ctx.orgView?.buildable} title={!ctx.orgView?.buildable ? `Not buildable: ${blockingIssues.map((i) => i.message).join(' ')}` : undefined} onClick={() => void buildMember(selected)}>
                    <Hammer size={12} aria-hidden />
                    {building === selected.id ? 'Starting…' : 'Build this member'}
                  </button>
                }
              >
                This member is a design. Building it runs the ordinary single-agent pipeline on a prompt derived from its role and limits, and stops for your review before any code is generated.
              </BlockerBanner>
            ) : null}

            <KeyValue
              rows={[
                {
                  label: 'ENS identity',
                  value: selected.ensNode ? <BlockchainRef label={selected.ensName} value={selected.ensNode} kind="node" network={project.environment.executionNetwork} /> : <span className="cl-mono">{selected.ensName}</span>,
                },
                { label: 'Agent address', value: selected.address ? <BlockchainRef value={selected.address} network={project.environment.executionNetwork} /> : <span className="cl-meta">Not established until the agent is deployed.</span> },
                { label: 'Role / objective', value: selected.role },
                {
                  label: 'Execution class',
                  value:
                    selected.executionClass === 'REPORTING_ONLY' ? (
                      <span className="cl-row" style={{ gap: 8 }}>
                        <Badge tone="blocked">EXECUTION: NONE</Badge>
                        <span className="cl-meta">This agent can never obtain a capability or submit a transaction.</span>
                      </span>
                    ) : (
                      selected.executionClass.replace(/_/g, ' ')
                    ),
                },
                {
                  label: 'Allowed adapters',
                  value: (
                    <span className="cl-row cl-row-wrap" style={{ gap: 5 }}>
                      {selected.allowedAdapters.length === 0 ? <span className="cl-meta">none bound yet</span> : selected.allowedAdapters.map((a) => (
                        <Badge key={a} tone="neutral">
                          {a.replace('adp_', '')}
                        </Badge>
                      ))}
                    </span>
                  ),
                },
                {
                  label: 'Individual budget',
                  value:
                    selected.budget.autonomousPerAction === 0 ? (
                      <span className="cl-meta">No budget — this agent holds no spending authority.</span>
                    ) : (
                      <>
                        {formatUsd(selected.budget.autonomousPerAction)} autonomous per action ·{' '}
                        {selected.budget.window === '24h' ? `${formatUsd(selected.budget.windowLimit)} per 24h` : `escalate up to ${formatUsd(selected.budget.windowLimit)}`}
                        {blast ? (
                          <div className="cl-meta" style={{ whiteSpace: 'normal' }}>
                            Blast radius if compromised: {blast.directCapabilities.join(', ') || 'no direct capabilities'};
                            {' '}reaches {blast.authorityReachesAgents.length === 0 ? 'no other agent' : blast.authorityReachesAgents.map((r) => `${r.agentId} via ${r.via}`).join(', ')};
                            {' '}contained by {blast.containedBy.join(', ') || '—'}.
                          </div>
                        ) : null}
                      </>
                    ),
                },
                {
                  label: 'Organization impact',
                  value: `${formatUsd(selected.orgBudgetImpact)} of the ${formatUsd(aggregate)} aggregate`,
                },
                { label: 'Policy hash', value: selected.policyHash ? <BlockchainRef value={selected.policyHash} kind="hash" /> : <span className="cl-meta">Assigned at deployment.</span> },
                {
                  label: 'Runtime revision',
                  value: selected.runtimeRevision === null ? 'Never deployed' : `r${selected.runtimeRevision}`,
                },
              ]}
            />
          </Card>

          {selected.executionClass === 'REPORTING_ONLY' ? (
            <div style={{ marginTop: 14 }}>
              <BlockerBanner tone="neutral" title="Reporting-only principal">
                {selected.name} has execution class NONE. There is no capability-issuing path for it, so no policy limit
                needs to exist — the absence of authority is structural, not a setting that could be raised in place.
              </BlockerBanner>
            </div>
          ) : null}

          <Section label="Agent controls">
            <div className="cl-btn-group">
              <button type="button" className="cl-btn" onClick={() => setDuplicateOpen(true)} disabled={!selected.projectId}>
                <Copy size={13} aria-hidden />
                Duplicate as New Agent
              </button>
              <button type="button" className="cl-btn" onClick={() => setRemoveOpen(true)} disabled title="Members are part of the organization's design; removing one means designing the organization again without it.">
                <Trash2 size={13} aria-hidden />
                Remove Draft Agent
              </button>
              <span className="cl-spacer" />
              <button
                type="button"
                className="cl-btn cl-btn-danger"
                onClick={() => setRevokeOpen(true)}
                disabled={isRevoked || !ctx.deploymentId || selected.projectId !== ctx.dataProjectId}
                title={!ctx.deploymentId ? 'Identity revocation acts on a live deployment. This agent has none.' : undefined}
              >
                <ShieldAlert size={13} aria-hidden />
                Revoke Agent
              </button>
            </div>
          </Section>
        </div>
      </div>

      {/* revoke — security confirmation */}
      <SecurityConfirmation
        open={revokeOpen}
        onClose={() => setRevokeOpen(false)}
        onConfirm={() => {
          setRevokeOpen(false);
          if (!ctx.deployment) return;
          revoke.mutate(
            { operation: 'REVOKE_IDENTITY', expectedRevision: ctx.deployment.revision, reason: 'revoked from the Organization page', target: { identityNode: selected.ensNode || null } },
            {
              onSuccess: (r) => pushToast(r.ok === false ? `Revocation refused: ${r.detail}` : 'Revocation submitted — the identity page shows the fresh read'),
              onError: (e) => setError((e as Error).message),
            },
          );
        }}
        action="Revoke agent identity"
        currentState={<StatusBadge status="ACTIVE" />}
        requestedState={<StatusBadge status="REVOKED" />}
        network={project.environment.executionNetwork}
        resource={<BlockchainRef label={selected.ensName} value={selected.ensNode || selected.ensName} kind="node" />}
        extraRows={[
          {
            label: 'Sibling impact',
            value:
              agents.filter((a) => a.id !== selected.id).map((a) => a.name).join(', ') +
              ' are separate principals and are not affected.',
          },
          {
            label: 'Capability impact',
            value: 'Capabilities already issued to this identity can no longer be honoured by the executor.',
          },
        ]}
        consequence="The agent loses its verifiable identity. This does not by itself change the policy's enabled state — financial authority is a separate control."
        actionLabel="Revoke Agent Identity"
      />

      {/* duplicate */}
      <StandardConfirmation
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        onConfirm={() => {
          setDuplicateOpen(false);
          const row = ctx.row;
          if (!row) return;
          void studio
            .createBuild({ prompt: row.prompt, name: `${selected.name} (copy)`, idempotencyKey: `dup-${row.id}-${Date.now()}` })
            .then(async (b) => { await invalidate(); router.push(`/projects/${b.projectId}/build?start=1`); })
            .catch((e) => setError(e instanceof ApiError ? e.message : String(e)));
        }}
        title="Duplicate as new agent"
        consequence="Configuration is copied. A new ENS identity, a new namespace entry and a new policy are required — identity, policy hash and any active authority are never copied, so the duplicate starts with no authority."
        resource={selected.name}
        actionLabel="Duplicate as New Agent"
      />

      {/* remove draft */}
      <StandardConfirmation
        open={removeOpen}
        onClose={() => setRemoveOpen(false)}
        onConfirm={() => setRemoveOpen(false)}
        title="Remove draft agent"
        consequence="The draft principal and its unsaved configuration are removed. This is only possible because the agent has never been deployed."
        resource={selected.name}
        actionLabel="Remove Draft Agent"
      />
    </StudioPage>
  );
}
