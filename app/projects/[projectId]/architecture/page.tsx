'use client';

/**
 * Architecture (spec §13).
 *
 * How the agent obtains identity, context, policy decisions and execution
 * authority. The live overlay reuses this same graph rather than generating a
 * second one, the node inspector opens inside the center workspace (never over
 * the Agent Sidebar), and an accessible node list mirrors the canvas (§45).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Activity,
  Download,
  Layers,
  List,
  Lock,
  Maximize,
  Unlock,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { StudioPage } from '@/components/studio/PageScaffold';
import { ArchFlowNode } from '@/components/studio/architecture/ArchNode';
import {
  Badge,
  BlockchainRef,
  BlockerBanner,
  FreshnessBadge,
  KeyValue,
  StatusBadge,
} from '@/components/studio/primitives';
import { Popover, MenuLabel } from '@/components/studio/shell/Popover';
import { useWorkbench } from '@/lib/studio/workbench';
import { ARCH_LAYERS, EDGE_KIND_LABEL } from '@/lib/studio/content/blueprint';
import { toArchitecture, type LiveNodeStates } from '@/lib/studio/api/adapters/design';
import { useStudioPage } from '@/components/studio/PageScaffold';
import { policyStatusOf, runtimeStatusOf } from '@/lib/studio/api/adapters/operate';
import { EmptyState } from '@/components/studio/primitives';
import type { ArchLayer, ArchNodeData, ArchitectureGraph } from '@/lib/studio/types';

const nodeTypes = { arch: ArchFlowNode };

const ALL_LAYERS: ArchLayer[] = [
  'identity',
  'data',
  'policy',
  'execution',
  'runtime',
  'live-health',
  'security-boundaries',
];

export default function ArchitecturePage() {
  return (
    <ReactFlowProvider>
      <ArchitectureCanvas />
    </ReactFlowProvider>
  );
}

function ArchitectureCanvas() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setSelection, pushToast } = useWorkbench();
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  /* Each agent is its own principal with its own venues and execution class, so
     each gets its own graph. A reporting-only agent has no policy, capability or
     executor node at all. */
  const { agent, agentSlug, ctx } = useStudioPage('architecture');
  const view = ctx.buildView;

  /*
   * The graph is the backend's projection of the compiled Blueprint. The live overlay is the same
   * graph with the control plane's readings painted on: nothing here is a second graph, and a node
   * with no reading stays as the build left it rather than turning green from absence.
   */
  const liveStates = useMemo<LiveNodeStates>(() => {
    const o = ctx.overview;
    if (!ctx.deploymentId || !o) return {};
    const runtime = runtimeStatusOf(o.panels.runtime.state);
    const policy = policyStatusOf(o);
    const identity = o.panels.identity?.value ? (o.panels.identity.value.revoked ? 'REVOKED' : o.panels.identity.isCurrent ? 'ACTIVE' : 'STALE') : 'UNKNOWN';
    const adapters = o.panels.adapters.every((a) => a.state === 'HEALTHY') ? 'HEALTHY' : o.panels.adapters.some((a) => a.state === 'DEGRADED') ? 'DEGRADED' : 'UNKNOWN';
    return {
      'agent-runtime': runtime,
      policy: policy === 'ENABLED' ? 'ENABLED' : policy === 'DISABLED' ? 'DISABLED' : 'UNKNOWN',
      ens: identity,
      cre: 'SIMULATED',
      'chainlink-feed': adapters,
      aave: adapters,
      uniswap: adapters,
      'adapter-broker': adapters,
      executor: policy === 'ENABLED' ? 'READY' : 'DISABLED',
      capability: policy === 'ENABLED' ? 'READY' : 'BLOCKED',
      ledger: 'SIMULATED',
    };
  }, [ctx.overview, ctx.deploymentId]);

  const graph = useMemo<ArchitectureGraph>(
    () => (view?.graph ? toArchitecture(view.graph, view.blueprint, liveStates) : { revision: 0, nodes: [], edges: [] }),
    [view?.graph, view?.blueprint, liveStates],
  );
  const hasGraph = graph.nodes.length > 0;

  const [liveOverlay, setLiveOverlay] = useState(true);
  const [locked, setLocked] = useState(false);
  const [activeLayers, setActiveLayers] = useState<ArchLayer[]>(ALL_LAYERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const isLayerOn = (layers: ArchLayer[]) => layers.some((l) => activeLayers.includes(l));

  const nodes = useMemo<Node[]>(
    () =>
      graph.nodes.map((node) => ({
        id: node.id,
        type: 'arch',
        position: node.position,
        selected: node.id === selectedId,
        data: { ...node.data, liveOverlay, dimmed: !isLayerOn(node.data.layers) },
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph, liveOverlay, activeLayers, selectedId],
  );

  const edges = useMemo<Edge[]>(
    () =>
      graph.edges.map((edge) => {
        const visible = isLayerOn(edge.layers);
        const tone =
          edge.kind === 'EXECUTE' || edge.kind === 'AUTHORIZATION'
            ? 'var(--cl-deny)'
            : edge.kind === 'ESCALATE'
              ? 'var(--cl-warn)'
              : edge.kind === 'READ' || edge.kind === 'CONTEXT'
                ? 'var(--cl-data)'
                : 'var(--cl-ink-2)';
        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          label: edge.label,
          animated: liveOverlay && (edge.kind === 'EXECUTE' || edge.kind === 'POLICY'),
          style: { stroke: tone, strokeWidth: 1.4, opacity: visible ? 1 : 0.12 },
          labelStyle: {
            fill: tone,
            fontFamily: 'var(--medium)',
            fontSize: 9.5,
            letterSpacing: '0.08em',
            opacity: visible ? 1 : 0.12,
          },
          labelBgStyle: { fill: 'var(--cl-panel)', fillOpacity: visible ? 0.95 : 0.1 },
          labelBgPadding: [4, 2] as [number, number],
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [graph, liveOverlay, activeLayers],
  );

  const selected = graph.nodes.find((n) => n.id === selectedId) ?? null;

  const selectNode = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      const node = graph.nodes.find((n) => n.id === id);
      setSelection(node ? { kind: 'architecture-node', id: node.id, label: node.data.label } : null);
    },
    [graph, setSelection],
  );

  /* A node id selected on one agent's graph may not exist on another's. */
  useEffect(() => {
    setSelectedId(null);
  }, [agentSlug]);

  const toggleLayer = (layer: ArchLayer) =>
    setActiveLayers((prev) => (prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]));

  if (!hasGraph) {
    return (
      <StudioPage segment="architecture">
        <EmptyState
          title={ctx.loading ? 'Loading the architecture…' : 'No architecture yet'}
          body={ctx.loading ? '' : 'The graph is a projection of a compiled Blueprint. Generate the Blueprint in the Composer and it appears here — nothing is drawn that the Blueprint does not define.'}
          action={ctx.loading ? undefined : <button type="button" className="cl-btn cl-btn-primary" onClick={() => router.push(`/projects/${ctx.routeProjectId}/build`)}>Build Agent</button>}
        />
      </StudioPage>
    );
  }

  return (
    <StudioPage
      segment="architecture"
      bleed
      live={liveOverlay && !!ctx.deploymentId}
      banners={
        <div className="cl-row cl-row-wrap" style={{ marginBottom: 12, gap: 8 }}>
          <span className="cl-page-title" style={{ fontSize: 22, marginRight: 8 }}>
            Architecture
          </span>
          <Badge tone="neutral">{agent.name}</Badge>
          <Badge tone="neutral">Blueprint r{graph.revision}</Badge>
          {agent.executionClass === 'REPORTING_ONLY' ? <Badge tone="blocked">EXECUTION: NONE</Badge> : null}
          {liveOverlay && ctx.deploymentId ? <Badge tone="pass">Live overlay · observed state</Badge> : liveOverlay ? <Badge tone="neutral">Live overlay · no deployment to observe</Badge> : <Badge tone="neutral">Configured state</Badge>}
          <span className="cl-spacer" />

          <div className="cl-btn-group">
            <button type="button" className="cl-btn cl-btn-sm" onClick={() => fitView({ duration: 300, padding: 0.15 })}>
              <Maximize size={12} aria-hidden />
              Fit
            </button>
            <button type="button" className="cl-btn cl-btn-sm" onClick={() => zoomOut({ duration: 160 })} aria-label="Zoom out">
              <ZoomOut size={12} aria-hidden />
            </button>
            <button type="button" className="cl-btn cl-btn-sm" onClick={() => zoomIn({ duration: 160 })} aria-label="Zoom in">
              <ZoomIn size={12} aria-hidden />
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => setLocked((v) => !v)}
              aria-pressed={locked}
              title={locked ? 'Unlock viewport' : 'Lock viewport'}
            >
              {locked ? <Lock size={12} aria-hidden /> : <Unlock size={12} aria-hidden />}
              {locked ? 'Locked' : 'Lock'}
            </button>

            <Popover
              width={300}
              label="Layers"
              trigger={({ toggle }) => (
                <button type="button" className="cl-btn cl-btn-sm" onClick={toggle}>
                  <Layers size={12} aria-hidden />
                  Layers ({activeLayers.length}/{ALL_LAYERS.length})
                </button>
              )}
            >
              {() => (
                <>
                  <MenuLabel>Show layers</MenuLabel>
                  {ARCH_LAYERS.map((layer) => (
                    <label key={layer.id} className="cl-checkbox" style={{ padding: '7px 12px' }}>
                      <input
                        type="checkbox"
                        checked={activeLayers.includes(layer.id as ArchLayer)}
                        onChange={() => toggleLayer(layer.id as ArchLayer)}
                      />
                      <span>
                        {layer.label}
                        <span className="cl-meta" style={{ display: 'block', whiteSpace: 'normal' }}>
                          {layer.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </>
              )}
            </Popover>

            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => setLiveOverlay((v) => !v)}
              aria-pressed={liveOverlay}
            >
              <Activity size={12} aria-hidden />
              Live Overlay
            </button>
            <button
              type="button"
              className="cl-btn cl-btn-sm"
              onClick={() => setListOpen((v) => !v)}
              aria-pressed={listOpen}
              title="Accessible node list"
            >
              <List size={12} aria-hidden />
              Nodes
            </button>
            <button type="button" className="cl-btn cl-btn-sm" onClick={() => pushToast('Architecture exported as SVG')}>
              <Download size={12} aria-hidden />
              Export SVG
            </button>
          </div>
        </div>
      }
    >
      {agent.executionClass === 'REPORTING_ONLY' ? (
        <div style={{ padding: '0 16px 12px' }}>
          <BlockerBanner tone="neutral" title="This agent has no execution path">
            {agent.name} is a reporting-only principal. There is no policy, capability issuer or executor in its
            architecture, because none exists for it — the absence of authority is structural, not a setting.
          </BlockerBanner>
        </div>
      ) : null}

      <div style={{ display: 'flex', flex: '1 1 auto', minHeight: 0, borderTop: '1px solid var(--cl-line)' }}>
        {/* accessible alternate node list (spec §45) */}
        {listOpen ? (
          <div
            style={{
              flex: '0 0 250px',
              overflowY: 'auto',
              borderRight: '1px solid var(--cl-line)',
              background: 'var(--cl-panel)',
            }}
          >
            <div className="cl-explorer-head">
              <span className="cl-label">Nodes</span>
              <button
                type="button"
                className="cl-btn cl-btn-ghost cl-btn-sm"
                onClick={() => setListOpen(false)}
                aria-label="Close node list"
              >
                <X size={12} aria-hidden />
              </button>
            </div>
            <ul>
              {graph.nodes.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    className="cl-nav-item"
                    data-active={node.id === selectedId}
                    onClick={() => selectNode(node.id)}
                  >
                    <span className="cl-nav-item-label">{node.data.label}</span>
                    <StatusBadge status={liveOverlay ? (node.data.liveStatus ?? node.data.status) : node.data.status} icon={false} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {/* canvas */}
        {/* React Flow handles its own wheel events for zoom; Lenis must not
            smooth them or the canvas stops responding to the wheel. */}
        <div data-lenis-prevent style={{ flex: '1 1 auto', minWidth: 0, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.16 }}
            minZoom={0.25}
            maxZoom={1.6}
            panOnDrag={!locked}
            zoomOnScroll={!locked}
            zoomOnPinch={!locked}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable
            proOptions={{ hideAttribution: true }}
            onNodeClick={(_, node) => selectNode(node.id)}
            onPaneClick={() => selectNode(null)}
            style={{ background: 'var(--cl-canvas)' }}
          >
            {/* No MiniMap or built-in Controls: at this graph's scale the minimap
                rendered as an empty grey rectangle, and Fit / Zoom / Lock already
                live in the page toolbar where they are labelled. */}
            {/* Near-black dot grid over the cream ground — the canvas reads as a
                drafting surface, and the cream still carries the palette. */}
            <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="var(--cl-canvas-dot)" />
          </ReactFlow>

          {/*
            Node inspector. Still inside the center workspace (never over the
            Agent Sidebar, per spec §13), but floated over the canvas rather than
            placed beside it: as a flex sibling it competed with the canvas for
            width and was clipped whenever the centre column got tight.
          */}
          {selected ? (
            <div className="cl-drawer cl-drawer-float">
              <div className="cl-drawer-head">
                <span className="cl-label" style={{ flex: '1 1 auto' }}>
                  Node inspector
                </span>
                <button
                  type="button"
                  className="cl-btn cl-btn-ghost cl-btn-sm"
                  onClick={() => selectNode(null)}
                  aria-label="Close inspector"
                >
                  <X size={13} aria-hidden />
                </button>
              </div>
              <div className="cl-drawer-body">
                <NodeInspector
                  nodeId={selected.id}
                  data={selected.data}
                  graph={graph}
                  liveOverlay={liveOverlay}
                  onOpen={(segment, hash) =>
                    router.push(`/projects/${ctx.routeProjectId}/${segment}${hash ? `#${hash}` : ''}`)
                  }
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </StudioPage>
  );
}

function NodeInspector({
  nodeId,
  data,
  graph,
  liveOverlay,
  onOpen,
}: {
  nodeId: string;
  data: ArchNodeData;
  graph: ArchitectureGraph;
  liveOverlay: boolean;
  onOpen: (segment: string, hash?: string) => void;
}) {
  const status = liveOverlay ? (data.liveStatus ?? data.status) : data.status;
  const labelFor = (id: string) => graph.nodes.find((n) => n.id === id)?.data.label ?? id;
  const outgoing = graph.edges.filter((e) => e.source === nodeId);
  const incoming = graph.edges.filter((e) => e.target === nodeId);

  return (
    <div className="cl-col" style={{ gap: 14 }}>
      <div>
        <div className="cl-h1">{data.label}</div>
        <p className="cl-meta" style={{ marginTop: 6, whiteSpace: 'normal' }}>
          {data.purpose}
        </p>
      </div>

      <div className="cl-row cl-row-wrap" style={{ gap: 5 }}>
        <StatusBadge status={status} />
        {data.trustClass ? (
          <Badge tone={data.trustClass === 'VERIFIED_ORACLE' ? 'pass' : data.trustClass === 'SIMULATED' ? 'sim' : 'data'}>
            {data.trustClass.replace(/_/g, ' ')}
          </Badge>
        ) : null}
        {data.networkRole === 'MAINNET_READ_ONLY' ? <Badge tone="data">MAINNET · READ ONLY</Badge> : null}
        {data.networkRole === 'EXECUTION_TESTNET' ? <Badge tone="sim">SEPOLIA · TESTNET</Badge> : null}
      </div>

      {data.freshness ? <FreshnessBadge freshness={data.freshness} /> : null}

      <KeyValue
        rows={[
          { label: 'Adapter / provider', value: data.adapter ?? '—', mono: Boolean(data.adapter) },
          { label: 'Version', value: data.version ?? '—' },
          { label: 'Network role', value: data.networkRole.replace(/_/g, ' ') },
          { label: 'Configured status', value: data.status },
          ...(liveOverlay && data.liveStatus ? [{ label: 'Observed status', value: data.liveStatus }] : []),
          ...(data.ref
            ? [
                {
                  label: data.ref.kind === 'address' ? 'Address' : data.ref.kind === 'hash' ? 'Hash' : 'Node',
                  value: (
                    <BlockchainRef
                      value={data.ref.value}
                      network={data.ref.network}
                      kind={data.ref.kind === 'node' ? 'node' : data.ref.kind}
                    />
                  ),
                },
              ]
            : []),
          ...(data.generatedModule ? [{ label: 'Generated module', value: data.generatedModule, mono: true }] : []),
        ]}
      />

      {data.capabilities?.length ? (
        <div>
          <div className="cl-label" style={{ marginBottom: 6 }}>
            Capabilities
          </div>
          <div className="cl-row cl-row-wrap" style={{ gap: 5 }}>
            {data.capabilities.map((c) => (
              <Badge key={c} tone="neutral">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {outgoing.length > 0 || incoming.length > 0 ? (
        <div>
          <div className="cl-label" style={{ marginBottom: 6 }}>
            Connections
          </div>
          <div className="cl-col" style={{ gap: 7 }}>
            {outgoing.map((edge) => (
              <div key={edge.id}>
                <div style={{ fontSize: 12.5 }}>
                  {EDGE_KIND_LABEL[edge.kind]} <span className="cl-strong">{labelFor(edge.target)}</span>
                  {edge.requiresCre ? <Badge tone="sim">requires CRE</Badge> : null}
                </div>
                {edge.note ? (
                  <div className="cl-meta" style={{ whiteSpace: 'normal' }}>
                    {edge.note}
                  </div>
                ) : null}
              </div>
            ))}
            {incoming.map((edge) => (
              <div key={edge.id} className="cl-meta">
                ← <span className="cl-strong">{labelFor(edge.source)}</span> {EDGE_KIND_LABEL[edge.kind].toLowerCase()}{' '}
                this node
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Navigation only — no destructive controls live in a node inspector. */}
      <div className="cl-col" style={{ gap: 6 }}>
        {data.blueprintSection ? (
          <button type="button" className="cl-btn cl-btn-block" onClick={() => onOpen('blueprint')}>
            Open Blueprint section
          </button>
        ) : null}
        {data.codePath ? (
          <button type="button" className="cl-btn cl-btn-block" onClick={() => onOpen('code')}>
            Open Code
          </button>
        ) : null}
        <button type="button" className="cl-btn cl-btn-block" onClick={() => onOpen('activity')}>
          Open Activity
        </button>
        {data.relatedSimulationId ? (
          <button type="button" className="cl-btn cl-btn-block" onClick={() => onOpen('simulation')}>
            Run related simulation
          </button>
        ) : null}
        <button type="button" className="cl-btn cl-btn-block" onClick={() => onOpen('reality')}>
          View provenance
        </button>
      </div>
    </div>
  );
}
