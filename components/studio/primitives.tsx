'use client';

/**
 * Shared domain primitives (spec §33–35, §40).
 *
 * Rules encoded here rather than left to each page:
 *  - every status renders its text label, never colour alone;
 *  - freshness is always shown next to observed state;
 *  - LOCAL_FORK transactions never receive a public explorer link;
 *  - reason codes keep their deterministic code, prose is supplementary.
 */
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  CircleDashed,
  Copy,
  ExternalLink,
  Info,
  Loader,
  Minus,
  Pause,
  ShieldAlert,
  Square,
} from 'lucide-react';
import type {
  CreMode,
  Freshness,
  NetworkRole,
  Severity,
  Status,
  Tone,
  TrustClass,
  Verdict,
} from '@/lib/studio/types';

/* ------------------------------------------------------------------ mapping */

const STATUS_TONE: Record<string, Tone> = {
  READY: 'neutral',
  RUNNING: 'sim',
  PASS: 'pass',
  HEALTHY: 'pass',
  ACTIVE: 'pass',
  ENABLED: 'pass',
  COMPLETE: 'pass',
  VALID: 'pass',
  WARN: 'warn',
  ESCALATE: 'warn',
  DEGRADED: 'warn',
  LIMITED: 'warn',
  PENDING: 'neutral',
  REQUIRED: 'warn',
  ENABLING: 'warn',
  DISABLING: 'warn',
  DRAFT: 'neutral',
  DENY: 'deny',
  FAIL: 'deny',
  REVOKED: 'deny',
  BLOCKED: 'blocked',
  UNAVAILABLE: 'blocked',
  STALE: 'warn',
  PAUSED: 'warn',
  STOPPED: 'blocked',
  DISABLED: 'blocked',
  UNKNOWN: 'blocked',
  NOT_ISSUED: 'blocked',
  NOT_SUBMITTED: 'blocked',
  NOT_REQUESTED: 'blocked',
  SIMULATED: 'sim',
};

export function statusTone(status: Status | string | null | undefined): Tone {
  if (!status) return 'blocked';
  return STATUS_TONE[status] ?? 'neutral';
}

function StatusIcon({ tone, status }: { tone: Tone; status?: string }) {
  if (status === 'RUNNING' || status === 'ENABLING' || status === 'DISABLING') return <Loader aria-hidden />;
  if (status === 'PAUSED') return <Pause aria-hidden />;
  if (status === 'STOPPED') return <Square aria-hidden />;
  if (status === 'UNKNOWN') return <CircleDashed aria-hidden />;
  switch (tone) {
    case 'pass':
      return <Check aria-hidden />;
    case 'warn':
      return <AlertTriangle aria-hidden />;
    case 'deny':
      return <Ban aria-hidden />;
    case 'blocked':
      return <Minus aria-hidden />;
    case 'sim':
      return <Info aria-hidden />;
    default:
      return null;
  }
}

/** Human label for a machine status — spacing only, never a synonym. */
export function statusLabel(status: Status | string): string {
  return String(status).replace(/_/g, ' ');
}

/* ------------------------------------------------------------------- badges */

export function StatusBadge({
  status,
  label,
  large,
  icon = true,
  title,
}: {
  status: Status | string;
  label?: string;
  large?: boolean;
  icon?: boolean;
  title?: string;
}) {
  const tone = statusTone(status);
  return (
    <span className={`cl-badge${large ? ' cl-badge-lg' : ''}`} data-tone={tone} title={title ?? statusLabel(status)}>
      {icon ? <StatusIcon tone={tone} status={String(status)} /> : null}
      {label ?? statusLabel(status)}
    </span>
  );
}

export function VerdictBadge({ verdict, large }: { verdict: Verdict; large?: boolean }) {
  const tone: Tone = verdict === 'ALLOW' ? 'pass' : verdict === 'ESCALATE' ? 'warn' : 'deny';
  return (
    <span className={`cl-badge${large ? ' cl-badge-lg' : ''}`} data-tone={tone}>
      <StatusIcon tone={tone} />
      {verdict}
    </span>
  );
}

export function Badge({
  tone = 'neutral',
  children,
  large,
  title,
}: {
  tone?: Tone;
  children: ReactNode;
  large?: boolean;
  title?: string;
}) {
  return (
    <span className={`cl-badge${large ? ' cl-badge-lg' : ''}`} data-tone={tone} title={title}>
      {children}
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  const tone: Tone =
    severity === 'CRITICAL' || severity === 'HIGH' ? 'deny' : severity === 'MEDIUM' ? 'warn' : 'neutral';
  return (
    <span className="cl-badge" data-tone={tone}>
      {severity === 'CRITICAL' ? <ShieldAlert aria-hidden /> : null}
      {severity}
    </span>
  );
}

export function RevisionBadge({
  label,
  revision,
  stale,
}: {
  label: string;
  revision: number | null;
  stale?: boolean;
}) {
  return (
    <span className="cl-badge" data-tone={stale ? 'warn' : 'neutral'} title={stale ? 'Built against an older revision' : undefined}>
      {stale ? <AlertTriangle aria-hidden /> : null}
      {label} {revision === null ? '—' : `r${revision}`}
      {stale ? ' · STALE' : ''}
    </span>
  );
}

const TRUST_TONE: Record<TrustClass, Tone> = {
  VERIFIED_ORACLE: 'pass',
  INDEXED: 'data',
  READ_ONLY: 'data',
  SIMULATED: 'sim',
  LOCAL_FORK: 'sim',
  UNVERIFIED: 'warn',
};

export function TrustClassBadge({ trust }: { trust: TrustClass }) {
  return (
    <span className="cl-badge" data-tone={TRUST_TONE[trust]} title={`Data trust class: ${trust.replace(/_/g, ' ')}`}>
      {trust.replace(/_/g, ' ')}
    </span>
  );
}

const NETWORK_ROLE_LABEL: Record<NetworkRole, string> = {
  EXECUTION_TESTNET: 'EXECUTION · TESTNET',
  MAINNET_READ_ONLY: 'MAINNET · READ ONLY',
  LOCAL_FORK: 'LOCAL FORK',
  OFF_CHAIN: 'OFF CHAIN',
  NONE: 'EXECUTION: NONE',
};

const NETWORK_ROLE_TONE: Record<NetworkRole, Tone> = {
  EXECUTION_TESTNET: 'sim',
  MAINNET_READ_ONLY: 'data',
  LOCAL_FORK: 'sim',
  OFF_CHAIN: 'neutral',
  NONE: 'blocked',
};

export function NetworkRoleBadge({ role }: { role: NetworkRole }) {
  return (
    <span className="cl-badge" data-tone={NETWORK_ROLE_TONE[role]}>
      {NETWORK_ROLE_LABEL[role]}
    </span>
  );
}

export const CRE_MODE_LABEL: Record<CreMode, string> = {
  CONTEXTLOCK_SIMULATOR: 'Official CLI Simulator',
  MY_CRE_SIMULATOR: 'My CRE Simulator',
  MY_CRE_DEPLOYMENT: 'My CRE Deployment',
  NONE: 'Not configured',
};

export function CreModeBadge({ mode, donEvidence = false }: { mode: CreMode; donEvidence?: boolean }) {
  // A simulator may never render a DON badge (spec §51 state-truth tests).
  const tone: Tone = mode === 'MY_CRE_DEPLOYMENT' && donEvidence ? 'pass' : mode === 'NONE' ? 'blocked' : 'sim';
  return (
    <span className="cl-badge" data-tone={tone} title={CRE_MODE_LABEL[mode]}>
      CRE · {mode === 'MY_CRE_DEPLOYMENT' && donEvidence ? 'DON' : 'SIMULATED'}
    </span>
  );
}

export function HealthIndicator({ status, label }: { status: Status; label: string }) {
  const tone = statusTone(status);
  return (
    <span className="cl-row" style={{ gap: 7 }}>
      <span
        className={`cl-badge-dot${status === 'HEALTHY' || status === 'ACTIVE' ? ' cl-pulse' : ''}`}
        style={{ color: `var(--cl-${tone === 'neutral' ? 'ink-2' : tone})` }}
        aria-hidden
      />
      <span style={{ fontSize: 12.5 }}>{label}</span>
      <StatusBadge status={status} icon={false} />
    </span>
  );
}

/* ---------------------------------------------------------------- freshness */

function formatAge(iso: string | null): string {
  if (!iso) return 'never';
  const deltaMs = Date.now() - new Date(iso).getTime();

  // A future timestamp — an expiry, say — is not an age. Clamping it to zero
  // reported "0s ago" for something 268 days away.
  if (deltaMs < 0) return `in ${formatSpan(Math.abs(deltaMs))}`;
  return `${formatSpan(deltaMs)} ago`;
}

function formatSpan(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

/**
 * Freshness badge (spec §33). A stale observation never renders as healthy —
 * the state label and the last-confirmed time are always both present.
 */
export function FreshnessBadge({ freshness, compact }: { freshness: Freshness; compact?: boolean }) {
  // Age is clock-dependent, so compute it after mount to keep SSR deterministic.
  const [age, setAge] = useState<string | null>(null);
  useEffect(() => {
    const tick = () => setAge(formatAge(freshness.observedAt ?? freshness.lastSuccessfulAt ?? null));
    tick();
    const handle = window.setInterval(tick, 5000);
    return () => window.clearInterval(handle);
  }, [freshness.observedAt, freshness.lastSuccessfulAt]);

  const { state } = freshness;
  const tone: Tone = state === 'FRESH' ? 'pass' : state === 'STALE' ? 'warn' : 'blocked';
  const text =
    state === 'FRESH'
      ? `Fresh · verified ${age ?? '—'}`
      : state === 'STALE'
        ? `STALE · last confirmed ${age ?? '—'}`
        : state === 'UNAVAILABLE'
          ? `UNAVAILABLE · ${freshness.staleReason ?? 'source unreachable'}`
          : 'UNKNOWN · never synchronized';

  return (
    <span
      className={`cl-badge${compact ? '' : ' cl-badge-lg'}`}
      data-tone={tone}
      title={`${freshness.source}${freshness.staleReason ? ` · ${freshness.staleReason}` : ''}`}
      style={{ textTransform: 'none', letterSpacing: 0, fontSize: compact ? 10 : 11 }}
    >
      <StatusIcon tone={tone} />
      {text}
    </span>
  );
}

/* ------------------------------------------------------------ blockchain ref */

const EXPLORERS: Record<string, string> = {
  'Ethereum Sepolia': 'https://sepolia.etherscan.io',
  'Base Sepolia': 'https://sepolia.basescan.org',
  'Ethereum Mainnet': 'https://etherscan.io',
};

export function shortHash(value: string, lead = 6, tail = 4): string {
  if (value.length <= lead + tail + 2) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

/**
 * Address / hash / identity reference (spec §34).
 * `local` marks a LOCAL_FORK object — those never get a public explorer link.
 */
export function BlockchainRef({
  label,
  value,
  network,
  kind = 'address',
  local = false,
  copyable = true,
}: {
  label?: string;
  value: string;
  network?: string;
  kind?: 'address' | 'hash' | 'tx' | 'node';
  local?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const explorerBase = !local && network ? EXPLORERS[network] : undefined;
  const explorerHref = explorerBase
    ? `${explorerBase}/${kind === 'tx' ? 'tx' : 'address'}/${value}`
    : undefined;

  return (
    <span className="cl-ref">
      {label ? <span className="cl-ref-label">{label}</span> : null}
      <span className="cl-ref-value" title={value}>
        {shortHash(value)}
      </span>
      {network ? (
        <span className="cl-badge" data-tone={local ? 'sim' : network.includes('Mainnet') ? 'data' : 'sim'}>
          {local ? 'LOCAL FORK' : network}
        </span>
      ) : null}
      {copyable ? (
        <button
          type="button"
          className="cl-ref-copy"
          aria-label={`Copy ${label ?? 'value'}`}
          onClick={() => {
            navigator.clipboard?.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
        </button>
      ) : null}
      {explorerHref ? (
        <a
          className="cl-ref-copy"
          href={explorerHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Open in block explorer"
          title="Open in block explorer"
        >
          <ExternalLink size={12} aria-hidden />
        </a>
      ) : null}
    </span>
  );
}

export function ArtifactHash({ label, value }: { label: string; value: string }) {
  return <BlockchainRef label={label} value={value} kind="hash" />;
}

/* -------------------------------------------------------------- reason code */

export interface ReasonCodeDetail {
  explanation: string;
  deterministicSource: string;
  policyRef?: string;
  relatedTests?: string[];
  field?: { name: string; value: string };
}

/** Catalog of deterministic reason codes. Model prose never replaces these. */
export const REASON_CODES: Record<string, ReasonCodeDetail> = {
  RECIPIENT_NOT_ALLOWED: {
    explanation:
      'The transaction recipient is not present in the policy recipient allowlist, so no capability was issued and nothing was submitted.',
    deterministicSource: 'ContextLock Policy · recipient allowlist check',
    policyRef: 'CL-17',
    relatedTests: ['sim_recipient_mutation', 'sim_baseline_repay'],
    field: { name: 'recipient', value: '0xAttacker…' },
  },
  AMOUNT_ABOVE_CEILING: {
    explanation: 'The requested amount exceeds the hard deny ceiling defined in the Blueprint autonomous policy.',
    deterministicSource: 'ContextLock Policy · amount ceiling check',
    policyRef: 'CL-04',
    relatedTests: ['sim_amount_above_ceiling'],
    field: { name: 'amount', value: '$7,500' },
  },
  ESCALATION_REQUIRED: {
    explanation:
      'The amount falls inside the escalation band, so autonomous execution is refused and a human approval is required.',
    deterministicSource: 'ContextLock Policy · escalation band check',
    policyRef: 'CL-05',
    relatedTests: ['sim_escalation_band'],
  },
  CAPABILITY_EXPIRED: {
    explanation: 'The capability presented at execution time was past its expiry, so the executor refused it.',
    deterministicSource: 'Capability verifier · expiry check',
    policyRef: 'CL-22',
    relatedTests: ['sim_expired_capability'],
  },
  CAPABILITY_REPLAYED: {
    explanation: 'The capability nonce had already been consumed. Replay of a spent authorization is rejected.',
    deterministicSource: 'Capability verifier · nonce check',
    policyRef: 'CL-23',
    relatedTests: ['sim_replay'],
  },
  ORACLE_STALE: {
    explanation:
      'The price round used for the decision was older than the freshness requirement, so the decision was refused rather than made on stale data.',
    deterministicSource: 'Data trust layer · freshness check',
    policyRef: 'CL-31',
    relatedTests: ['sim_stale_oracle'],
  },
  DATA_SOURCE_UNAVAILABLE: {
    explanation:
      'A required data source is unavailable and no lower-trust substitute is permitted, so the decision was refused.',
    deterministicSource: 'Adapter broker · source availability check',
    policyRef: 'CL-33',
    relatedTests: ['sim_graph_unavailable'],
  },
  ORACLE_DISAGREEMENT: {
    explanation: 'Two independent price sources disagreed beyond the permitted deviation, so the decision was refused.',
    deterministicSource: 'Data trust layer · cross-source deviation check',
    policyRef: 'CL-34',
    relatedTests: ['sim_oracle_disagreement'],
  },
  TARGET_NOT_ALLOWED: {
    explanation: 'The contract target is not in the policy target allowlist.',
    deterministicSource: 'ContextLock Policy · target allowlist check',
    policyRef: 'CL-18',
    relatedTests: ['sim_target_mutation'],
  },
  ACTION_NOT_PERMITTED: {
    explanation: 'The requested action is not among the actions this agent may perform under any amount.',
    deterministicSource: 'ContextLock Policy · action allowlist check',
    policyRef: 'CL-02',
    relatedTests: ['sim_borrow_denied'],
  },
  WRONG_CHAIN: {
    explanation: 'The transaction targeted a chain other than the approved execution testnet.',
    deterministicSource: 'Execution network guard · chain id check',
    policyRef: 'CL-41',
    relatedTests: ['sim_wrong_chain'],
  },
  MAINNET_WRITE_PROHIBITED: {
    explanation:
      'Production-chain execution is disabled for this Testnet Lab project. Mainnet is available only as a read-only data source or an isolated local fork.',
    deterministicSource: 'Execution network guard · mainnet write boundary',
    policyRef: 'CL-42',
    relatedTests: ['sim_mainnet_write'],
  },
  IDENTITY_REVOKED: {
    explanation: 'The agent identity was revoked, so previously issued capabilities can no longer be honoured.',
    deterministicSource: 'Identity verifier · ENS revocation check',
    policyRef: 'CL-51',
    relatedTests: ['sim_ens_revocation'],
  },
  POLICY_DISABLED: {
    explanation: 'The on-chain financial policy is disabled, so no capability can be issued.',
    deterministicSource: 'Policy registry · enabled flag',
    policyRef: 'CL-01',
    relatedTests: ['sim_policy_disabled'],
  },
  INSTRUCTION_NOT_AUTHORITY: {
    explanation:
      'Injected instructions were treated as untrusted content. Authority is derived from the Blueprint and policy, never from model input.',
    deterministicSource: 'ContextLock Policy · authority source check',
    policyRef: 'CL-11',
    relatedTests: ['sim_prompt_injection'],
  },
  CROSS_AGENT_APPROVAL_INVALID: {
    explanation: 'An approval presented by another agent did not verify against the approving principal’s identity.',
    deterministicSource: 'Ledger / approval verifier · signature check',
    policyRef: 'CL-61',
    relatedTests: ['sim_cross_agent_fake_approval'],
  },
  CCIP_DESTINATION_NOT_ALLOWED: {
    explanation: 'The cross-chain destination selector is not in the approved destination allowlist.',
    deterministicSource: 'Cross-chain guard · destination allowlist',
    policyRef: 'CL-71',
    relatedTests: ['sim_ccip_wrong_destination'],
  },
};

export function ReasonCode({
  code,
  verdict,
  onOpenPolicy,
  onOpenSimulation,
}: {
  code: string;
  verdict?: Verdict | 'FAIL';
  onOpenPolicy?: (policyRef: string) => void;
  onOpenSimulation?: (simulationId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const detail = REASON_CODES[code];
  const tone: Tone = verdict === 'ALLOW' ? 'pass' : verdict === 'ESCALATE' ? 'warn' : 'deny';

  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', gap: 6, maxWidth: '100%' }}>
      <button
        type="button"
        className="cl-badge"
        data-tone={tone}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        title="Show the deterministic source of this reason code"
        style={{ cursor: 'pointer' }}
      >
        {verdict ? `${verdict} · ` : ''}
        {code}
      </button>
      {open && detail ? (
        <span className="cl-card" style={{ display: 'block', padding: 10, maxWidth: 460 }}>
          <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.5 }}>{detail.explanation}</span>
          <span className="cl-meta" style={{ display: 'block', marginTop: 8 }}>
            Deterministic source: {detail.deterministicSource}
          </span>
          <span className="cl-row cl-row-wrap" style={{ marginTop: 8, gap: 6 }}>
            {detail.policyRef ? (
              <button type="button" className="cl-btn cl-btn-sm" onClick={() => onOpenPolicy?.(detail.policyRef!)}>
                Open policy rule {detail.policyRef}
              </button>
            ) : null}
            {detail.relatedTests?.slice(0, 2).map((testId) => (
              <button
                key={testId}
                type="button"
                className="cl-btn cl-btn-sm"
                onClick={() => onOpenSimulation?.(testId)}
              >
                Open simulation
              </button>
            ))}
          </span>
          {detail.field ? (
            <span className="cl-meta" style={{ display: 'block', marginTop: 8 }}>
              Field: <span className="cl-mono">{detail.field.name}</span> = <span className="cl-mono">{detail.field.value}</span>
            </span>
          ) : null}
        </span>
      ) : null}
    </span>
  );
}

/* ------------------------------------------------------------- log message */

/** Tokens worth picking out of a log line so it can be scanned, not read. */
const LOG_VERDICT = /^(ALLOW|DENY|ESCALATE|PASS|FAIL|WARN|REJECT|reject|refuse)$/;
const LOG_REASON_CODE = /^[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+$/;
const LOG_NUMERIC = /^[$]?[\d,]+(?:\.\d+)?[a-zA-Z%$/]*$/;
const LOG_REF = /^(0x[0-9a-fA-F.…]+|[a-z]+_[a-z0-9_]+)$/;

/**
 * Renders one log message with its meaningful tokens tinted.
 *
 * A build or run log set in a single ink colour is a wall of text; the useful
 * parts are the verdict, the reason code and the values. Everything else stays
 * secondary so those stand out.
 */
export function LogMessage({ text }: { text: string }) {
  const parts = useMemo(() => text.split(/(\s+)/), [text]);

  return (
    <>
      {parts.map((token, i) => {
        if (/^\s+$/.test(token)) return token;

        let color: string | undefined;
        let family: string | undefined;

        if (LOG_VERDICT.test(token)) {
          const upper = token.toUpperCase();
          color =
            upper === 'ALLOW' || upper === 'PASS'
              ? 'var(--cl-pass)'
              : upper === 'ESCALATE' || upper === 'WARN'
                ? 'var(--cl-warn)'
                : 'var(--cl-deny)';
          family = 'var(--medium)';
        } else if (LOG_REASON_CODE.test(token)) {
          color = 'var(--cl-deny)';
          family = 'var(--medium)';
        } else if (token === '→' || token === '·') {
          color = 'var(--cl-ink-3)';
        } else if (LOG_NUMERIC.test(token)) {
          color = 'var(--cl-data)';
        } else if (LOG_REF.test(token)) {
          color = 'var(--cl-sim)';
        }

        return color ? (
          <span key={i} style={{ color, fontFamily: family }}>
            {token}
          </span>
        ) : (
          token
        );
      })}
    </>
  );
}

/* ----------------------------------------------------------------- banners */

export function BlockerBanner({
  tone = 'blocked',
  title,
  children,
  actions,
}: {
  tone?: Tone;
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="cl-banner" data-tone={tone} role={tone === 'deny' ? 'alert' : 'status'}>
      {tone === 'pass' ? <Check aria-hidden /> : tone === 'sim' ? <Info aria-hidden /> : <AlertTriangle aria-hidden />}
      <div className="cl-banner-main">
        <div className="cl-banner-title">{title}</div>
        {children ? <div className="cl-banner-body">{children}</div> : null}
      </div>
      {actions ? <div className="cl-banner-actions">{actions}</div> : null}
    </div>
  );
}

/** Persistent banner shown when the open draft is ahead of the live deployment. */
export function DraftAheadBanner({
  draftRevision,
  deployedRevision,
  onCompare,
  onDeploy,
}: {
  draftRevision: number;
  deployedRevision: number;
  onCompare?: () => void;
  onDeploy?: () => void;
}) {
  return (
    <BlockerBanner
      tone="warn"
      title={`You are editing Blueprint r${draftRevision}.`}
      actions={
        <>
          <button type="button" className="cl-btn cl-btn-sm" onClick={onCompare}>
            Compare
          </button>
          <button type="button" className="cl-btn cl-btn-sm" onClick={onDeploy}>
            Deploy r{draftRevision} when ready
          </button>
        </>
      }
    >
      The active Testnet Lab deployment is still r{deployedRevision}.
    </BlockerBanner>
  );
}

/** Stale-artifact banner. Old passing results are never presented as current. */
export function StaleBanner({
  what,
  builtAgainst,
  current,
  onRerun,
  rerunLabel = 'Re-run',
}: {
  what: string;
  builtAgainst: number;
  current: number;
  onRerun?: () => void;
  rerunLabel?: string;
}) {
  return (
    <BlockerBanner
      tone="warn"
      title={`${what} STALE`}
      actions={
        onRerun ? (
          <button type="button" className="cl-btn cl-btn-sm" onClick={onRerun}>
            {rerunLabel}
          </button>
        ) : null
      }
    >
      Built against Blueprint r{builtAgainst}. Current Blueprint is r{current}.
    </BlockerBanner>
  );
}

/* ----------------------------------------------------------- layout helpers */

export function PageHeader({
  title,
  subtitle,
  badges,
  actions,
}: {
  title: string;
  subtitle?: string;
  badges?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="cl-page-head">
      <div className="cl-page-head-main">
        <h1 className="cl-page-title">{title}</h1>
        {subtitle ? <p className="cl-page-sub">{subtitle}</p> : null}
        {badges ? (
          <div className="cl-row cl-row-wrap" style={{ marginTop: 10 }}>
            {badges}
          </div>
        ) : null}
      </div>
      {actions ? <div className="cl-page-actions">{actions}</div> : null}
    </header>
  );
}

export function Section({
  label,
  actions,
  children,
}: {
  label: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="cl-section">
      <div className="cl-section-head">
        <span className="cl-label">{label}</span>
        <span className="cl-section-rule" />
        {actions}
      </div>
      {children}
    </section>
  );
}

export function Card({
  title,
  actions,
  children,
  flush,
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  flush?: boolean;
}) {
  return (
    <div className="cl-card">
      {title ? (
        <div className="cl-card-head">
          <div className="cl-card-title">{title}</div>
          {actions}
        </div>
      ) : null}
      <div className={flush ? 'cl-card-body cl-card-body-flush' : 'cl-card-body'}>{children}</div>
    </div>
  );
}

export function KeyValue({ rows }: { rows: { label: string; value: ReactNode; mono?: boolean }[] }) {
  return (
    <dl className="cl-kv">
      {rows.map((row) => (
        <div key={row.label} style={{ display: 'contents' }}>
          <dt>{row.label}</dt>
          <dd className={row.mono ? 'cl-mono' : undefined}>{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Empty state that answers: what is this, why is it empty, what next (spec §47). */
export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="cl-empty">
      <h2 className="cl-empty-title">{title}</h2>
      <p className="cl-empty-body">{body}</p>
      {action}
    </div>
  );
}

export function Skeleton({ height = 14, width = '100%' }: { height?: number; width?: number | string }) {
  return <div className="cl-skeleton" style={{ height, width }} aria-hidden />;
}

/* --------------------------------------------------------------- copy value */

export function CopyButton({ value, label = 'Copy' }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="cl-btn cl-btn-sm"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1400);
      }}
    >
      {copied ? <Check size={12} aria-hidden /> : <Copy size={12} aria-hidden />}
      {copied ? 'Copied' : label}
    </button>
  );
}

/* ------------------------------------------------------------ security path */

export function SecurityPath({
  steps,
  onReasonCode,
}: {
  steps: { layer: string; status: Status; detail?: string; reasonCode?: string }[];
  onReasonCode?: (code: string) => void;
}) {
  return (
    <div className="cl-path">
      {steps.map((step) => (
        <div className="cl-path-step" key={step.layer}>
          <span className="cl-path-step-name">{step.layer}</span>
          <StatusBadge status={step.status} />
          {step.reasonCode ? (
            <ReasonCode
              code={step.reasonCode}
              verdict={step.status === 'DENY' ? 'DENY' : step.status === 'ESCALATE' ? 'ESCALATE' : undefined}
              onOpenPolicy={() => onReasonCode?.(step.reasonCode!)}
            />
          ) : null}
          {step.detail ? <span className="cl-path-step-detail">{step.detail}</span> : null}
        </div>
      ))}
    </div>
  );
}

/* --------------------------------------------------------------- tab strip */

export function TabStrip<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string; badge?: ReactNode }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="cl-row" style={{ gap: 0, borderBottom: '1px solid var(--cl-line)', marginBottom: 16 }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className="cl-bottom-tab"
          data-active={tab.id === active}
          onClick={() => onChange(tab.id)}
          role="tab"
          aria-selected={tab.id === active}
        >
          {tab.label}
          {tab.badge}
        </button>
      ))}
    </div>
  );
}

/** Relative timestamp that renders after mount so SSR output stays stable. */
export function TimeAgo({ iso, prefix = '' }: { iso: string | null; prefix?: string }) {
  const [text, setText] = useState<string>('—');
  useEffect(() => {
    const tick = () => setText(formatAge(iso));
    tick();
    const handle = window.setInterval(tick, 5000);
    return () => window.clearInterval(handle);
  }, [iso]);
  return (
    <span title={iso ?? undefined}>
      {prefix}
      {text}
    </span>
  );
}

export function useNow(intervalMs = 1000): number {
  const [now, setNow] = useState(() => 0);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    setNow(Date.now());
    const handle = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(handle);
  }, [intervalMs]);
  return now;
}

export function formatNumber(value: number, digits = 0): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatUsd(value: number): string {
  return `$${formatNumber(value)}`;
}

export function useLocalTime(iso: string | null): string {
  return useMemo(() => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
  }, [iso]);
}

export function Timestamp({ iso }: { iso: string | null }) {
  const text = useLocalTime(iso);
  return <span className="cl-mono">{text}</span>;
}
