/**
 * @-mention resolution for the Context Agent (spec §6.2, §6.7).
 *
 * Two rules from the spec drive the whole design here:
 *
 *  1. "The frontend resolves mentions to IDs." A mention is not a piece of
 *     text the model has to guess at — the UI turns `@agent:guardian` into a
 *     concrete `agt_guardian` before the turn is ever sent. An unresolvable
 *     mention is reported back as unresolved rather than passed along as prose.
 *
 *  2. "Do not display opaque IDs when a human label exists." Every entity
 *     carries both: the id travels in the context envelope, the label is what
 *     the user reads.
 *
 * Never include a secret. Credentials are deliberately absent from the index —
 * an adapter is mentionable, the API key that authenticates it is not.
 */
import type { Agent, Alert, ProblemItem, RuntimeEvent } from './types';

/**
 * What can be mentioned, as the pages currently have it.
 *
 * Supplied by the sidebar from the project context, so a mention can never drift from what is on
 * screen. Credentials are deliberately absent: an adapter is mentionable, its API key is not.
 */
export interface MentionSource {
  agents: Agent[];
  policy: { version: number | null; observed: string; network: string } | null;
  adapters: Array<{ id: string; adapterId: string; name: string; trustClass: string; status: string }>;
  scenarios: Array<{ id: string; name: string; group: string; result: string | null }>;
  attacks: Array<{ id: string; name: string; severity: string; lastResult: string | null }>;
  deployments: Array<{ id: string; revision: number; network: string; status: string; contracts: Array<{ name: string; txHash: string | null }> }>;
  events: RuntimeEvent[];
  alerts: Alert[];
  files: Array<{ name: string; path: string; group: string; coveredByTest?: string }>;
  problems: ProblemItem[];
}

export const EMPTY_MENTION_SOURCE: MentionSource = {
  agents: [], policy: null, adapters: [], scenarios: [], attacks: [], deployments: [], events: [], alerts: [], files: [], problems: [],
};

export type MentionKind =
  | 'blueprint'
  | 'architecture'
  | 'policy'
  | 'runtime'
  | 'agent'
  | 'adapter'
  | 'simulation'
  | 'attack'
  | 'deployment'
  | 'event'
  | 'tx'
  | 'alert'
  | 'file'
  | 'problem';

export interface MentionEntity {
  /** What the user types, without the leading @ — e.g. `agent:guardian`. */
  token: string;
  kind: MentionKind;
  /** The real entity id that travels in the context envelope. */
  id: string;
  /** What a human reads. Never an opaque id when a name exists. */
  label: string;
  /** Secondary line in the picker, and the citation's subtitle. */
  detail?: string;
  /** Route segment this entity opens in, if it has one. */
  href?: string;
}

/** Turns a name into the slug a user would plausibly type. */
function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * The full mentionable surface of the project, from what the pages currently hold.
 */
export function mentionIndex(src: MentionSource): MentionEntity[] {
  const entities: MentionEntity[] = [];
  const { agents: AGENTS, adapters: ADAPTERS, scenarios: SCENARIOS, deployments: DEPLOYMENTS, events: EVENTS, alerts: ALERTS, files: CODE_FILES, problems: PROBLEMS } = src;
  const POLICY = src.policy ?? { version: null, observed: 'UNKNOWN', network: 'not deployed' };

  /* ---- singletons: the artifacts there is only ever one of ---- */
  entities.push(
    {
      token: 'blueprint',
      kind: 'blueprint',
      id: 'blueprint',
      label: 'Blueprint',
      detail: 'Canonical agent definition',
      href: 'blueprint',
    },
    {
      token: 'architecture',
      kind: 'architecture',
      id: 'architecture',
      label: 'Architecture',
      detail: 'Component graph and authority path',
      href: 'architecture',
    },
    {
      token: 'policy',
      kind: 'policy',
      id: `policy_v${POLICY.version ?? '—'}`,
      label: POLICY.version === null ? 'Policy' : `Policy v${POLICY.version}`,
      detail: `Observed ${POLICY.observed} on ${POLICY.network}`,
      href: 'policies',
    },
    {
      token: 'runtime',
      kind: 'runtime',
      id: 'runtime',
      label: 'Runtime',
      detail: 'Agent process health and revision',
      href: 'runtime',
    },
  );

  for (const agent of AGENTS) {
    entities.push({
      token: `agent:${agent.slug}`,
      kind: 'agent',
      id: agent.id,
      label: agent.name,
      detail: agent.role,
      href: 'organization',
    });
  }

  for (const adapter of ADAPTERS) {
    entities.push({
      token: `adapter:${adapter.adapterId}`,
      kind: 'adapter',
      id: adapter.id,
      label: adapter.name,
      detail: `${adapter.trustClass.replace(/_/g, ' ')} · ${adapter.status}`,
      href: 'integrations',
    });
  }

  for (const scenario of SCENARIOS) {
    entities.push({
      token: `simulation:${slug(scenario.name)}`,
      kind: 'simulation',
      id: scenario.id,
      label: scenario.name,
      detail: `${scenario.group} · last result ${scenario.result ?? 'not run'}`,
      href: 'simulation',
    });
  }

  for (const attack of src.attacks) {
    entities.push({
      token: `attack:${slug(attack.name)}`,
      kind: 'attack',
      id: attack.id,
      label: attack.name,
      detail: `${attack.severity} · last result ${attack.lastResult ?? 'not run'}`,
      href: 'attacks',
    });
  }

  for (const deployment of DEPLOYMENTS) {
    entities.push({
      token: `deployment:${deployment.revision}`,
      kind: 'deployment',
      id: deployment.id,
      label: `Deployment r${deployment.revision}`,
      detail: `${deployment.network} · ${deployment.status}`,
      href: 'deployments',
    });

    /* Contract deployment transactions are mentionable by hash (spec lists
       @tx:<hash>). Labelled by what the transaction did, so the user never has
       to read a hash to pick the right one. */
    for (const contract of deployment.contracts) {
      if (!contract.txHash) continue;
      entities.push({
        token: `tx:${contract.txHash.slice(0, 10)}`,
        kind: 'tx',
        id: contract.txHash,
        label: `${contract.name} deployment tx`,
        detail: `r${deployment.revision} · ${deployment.network}`,
        href: 'deployments',
      });
    }
  }

  for (const event of EVENTS) {
    entities.push({
      token: `event:${event.id}`,
      kind: 'event',
      id: event.id,
      label: event.type.replace(/_/g, ' '),
      detail: event.summary,
      href: 'activity',
    });
    if (event.txHash) {
      entities.push({
        token: `tx:${event.txHash.slice(0, 10)}`,
        kind: 'tx',
        id: event.txHash,
        /* A local-fork transaction must never be mistaken for a public one. */
        label: event.txKind === 'LOCAL_FORK' ? 'Local fork transaction' : 'Testnet transaction',
        detail: event.summary,
        href: 'activity',
      });
    }
  }

  for (const alert of ALERTS) {
    entities.push({
      token: `alert:${slug(alert.type)}`,
      kind: 'alert',
      id: alert.id,
      label: alert.type.replace(/_/g, ' '),
      detail: `${alert.severity} · ${alert.state} · ${alert.resource}`,
      href: 'control-plane',
    });
  }

  for (const file of CODE_FILES) {
    entities.push({
      token: `file:${file.name}`,
      kind: 'file',
      id: file.path,
      label: file.path,
      detail: file.coveredByTest ? `Covered by ${file.coveredByTest}` : file.group.replace(/-/g, ' '),
      href: 'code',
    });
  }

  for (const problem of PROBLEMS) {
    entities.push({
      token: `problem:${problem.id}`,
      kind: 'problem',
      id: problem.id,
      label: problem.message,
      detail: `${problem.severity} · ${problem.resource}`,
      href: problem.href,
    });
  }

  return entities;
}

/**
 * Ranked lookup for the composer typeahead.
 *
 * Prefix matches on the token outrank everything, because that is what someone
 * typing `@sim…` is doing; label matches come next, then detail. Without the
 * ranking a substring hit deep in a description could outrank the exact entity
 * whose name the user was spelling out.
 */
export function searchMentions(query: string, src: MentionSource, limit = 8): MentionEntity[] {
  const index = mentionIndex(src);
  const q = query.trim().toLowerCase().replace(/^@/, '');
  if (!q) {
    /* Empty query: lead with the singletons and one of each collection, so the
       first thing shown is a map of what can be mentioned at all. */
    const seen = new Set<MentionKind>();
    return index.filter((e) => (seen.has(e.kind) ? false : (seen.add(e.kind), true))).slice(0, limit);
  }

  const scored = index
    .map((entity) => {
      const token = entity.token.toLowerCase();
      const label = entity.label.toLowerCase();
      const detail = (entity.detail ?? '').toLowerCase();

      let score = -1;
      if (token.startsWith(q)) score = 0;
      else if (token.includes(q)) score = 1;
      else if (label.startsWith(q)) score = 2;
      else if (label.includes(q)) score = 3;
      else if (detail.includes(q)) score = 4;

      return { entity, score };
    })
    .filter((row) => row.score >= 0)
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, limit).map((row) => row.entity);
}

export interface ResolvedMentions {
  /** `kind:id` refs safe to put in the context envelope. */
  refs: string[];
  /** The entities themselves, for rendering citation chips. */
  entities: MentionEntity[];
  /** Tokens the user typed that match nothing — reported, never guessed at. */
  unresolved: string[];
}

const MENTION_PATTERN = /@([a-z]+(?::[A-Za-z0-9_\-.:]+)?)/g;

/**
 * Resolves every @mention in a prompt to a concrete entity.
 *
 * An unknown mention is returned in `unresolved` rather than dropped or
 * silently treated as plain text: the agent must be able to say "I don't know
 * what @foo is" instead of inventing an answer about it.
 */
export function resolveMentions(text: string, src: MentionSource): ResolvedMentions {
  const index = mentionIndex(src);
  const byToken = new Map(index.map((e) => [e.token.toLowerCase(), e]));

  const entities: MentionEntity[] = [];
  const unresolved: string[] = [];
  const seen = new Set<string>();

  for (const match of text.matchAll(MENTION_PATTERN)) {
    const token = match[1].toLowerCase();
    if (seen.has(token)) continue;
    seen.add(token);

    const exact = byToken.get(token);
    if (exact) {
      entities.push(exact);
      continue;
    }

    /* `@event:evt_000241` and `@tx:0x0c47…` are addressed by raw id rather than
       by slug, so fall back to an id match before declaring it unresolved. */
    const [kind, rest] = token.split(':');
    const byId = rest
      ? index.find((e) => e.kind === kind && (e.id.toLowerCase() === rest || e.id.toLowerCase().startsWith(rest)))
      : undefined;

    if (byId) entities.push(byId);
    else unresolved.push(`@${match[1]}`);
  }

  return {
    refs: entities.map((e) => `${e.kind}:${e.id}`),
    entities,
    unresolved,
  };
}
