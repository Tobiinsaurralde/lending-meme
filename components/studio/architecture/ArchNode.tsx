'use client';

/**
 * Custom Architecture node.
 *
 * One node type renders every category, distinguished by icon, label and its
 * network role. When the live overlay is on, the observed state replaces the
 * configured state — the same graph, never a second one (spec §13).
 */
import { Handle, Position, type NodeProps } from '@xyflow/react';
import {
  Boxes,
  CircleUser,
  Cpu,
  Database,
  Fingerprint,
  Globe,
  Landmark,
  Link2,
  Radio,
  ScrollText,
  Server,
  ShieldCheck,
  Ticket,
  Waypoints,
  Wallet,
  Send,
} from 'lucide-react';
import { StatusBadge, statusTone } from '../primitives';
import type { ArchNodeData, ArchNodeKind } from '@/lib/studio/types';

const ICONS: Record<ArchNodeKind, React.ComponentType<{ size?: number; strokeWidth?: number; 'aria-hidden'?: boolean }>> = {
  operator: CircleUser,
  'agent-runtime': Server,
  ens: Fingerprint,
  policy: ShieldCheck,
  cre: Radio,
  'chainlink-feed': Link2,
  'the-graph': Database,
  aave: Landmark,
  uniswap: Waypoints,
  'adapter-broker': Boxes,
  'reality-engine': Globe,
  'local-fork': Cpu,
  capability: Ticket,
  executor: Send,
  treasury: Wallet,
  ledger: ScrollText,
};

export type ArchFlowNodeData = ArchNodeData & { liveOverlay: boolean; dimmed: boolean };

export function ArchFlowNode({ data, selected }: NodeProps) {
  const d = data as ArchFlowNodeData;
  const Icon = ICONS[d.kind] ?? Boxes;
  const status = d.liveOverlay ? (d.liveStatus ?? d.status) : d.status;
  const tone = statusTone(status);

  return (
    <div
      style={{
        width: 216,
        background: 'var(--cl-panel)',
        border: `1px solid ${selected ? 'var(--cl-ink)' : 'var(--cl-line-strong)'}`,
        boxShadow: selected ? '0 0 0 2px rgba(0,66,175,0.22)' : 'none',
        opacity: d.dimmed ? 0.26 : 1,
        transition: 'opacity 0.2s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: 'var(--cl-ink-3)', width: 7, height: 7, border: 'none' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderBottom: '1px solid var(--cl-line)',
          background: 'var(--cl-panel-2)',
        }}
      >
        <Icon size={15} strokeWidth={1.6} aria-hidden />
        <span
          style={{
            flex: '1 1 auto',
            minWidth: 0,
            fontFamily: 'var(--medium)',
            fontSize: 12.5,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {d.label}
        </span>
        <span
          className="cl-badge-dot"
          style={{ background: `var(--cl-${tone === 'neutral' ? 'ink-2' : tone})`, flex: '0 0 auto' }}
          aria-hidden
        />
      </div>

      <div style={{ padding: '8px 10px' }}>
        <div className="cl-row cl-row-wrap" style={{ gap: 4 }}>
          <StatusBadge status={status} icon={false} />
          {d.trustClass ? (
            <span className="cl-badge" data-tone={d.trustClass === 'VERIFIED_ORACLE' ? 'pass' : d.trustClass === 'SIMULATED' ? 'sim' : 'data'}>
              {d.trustClass.replace(/_/g, ' ')}
            </span>
          ) : null}
        </div>
        {d.networkRole === 'MAINNET_READ_ONLY' ? (
          <div className="cl-meta" style={{ marginTop: 6, fontSize: 10.5 }}>
            MAINNET · READ ONLY
          </div>
        ) : d.networkRole === 'EXECUTION_TESTNET' ? (
          <div className="cl-meta" style={{ marginTop: 6, fontSize: 10.5 }}>
            SEPOLIA · TESTNET
          </div>
        ) : null}
      </div>

      <Handle type="source" position={Position.Right} style={{ background: 'var(--cl-ink-3)', width: 7, height: 7, border: 'none' }} />
    </div>
  );
}
