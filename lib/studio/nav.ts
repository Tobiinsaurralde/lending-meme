/**
 * Activity rail, explorer groups and per-page metadata.
 *
 * The rail switches which explorer groups are visible (IDE view containers).
 * Page metadata carries the title, the one-line purpose, the agent page-kind and
 * the page-specific Context Agent quick prompts defined in the product spec.
 */
import type { PageKind } from './types';

export type RailViewId =
  | 'project'
  | 'design'
  | 'test'
  | 'code'
  | 'deploy'
  | 'operate'
  | 'integrations'
  | 'reports'
  | 'settings';

export type IconName =
  | 'layout-grid'
  | 'pencil-ruler'
  | 'flask-conical'
  | 'file-code'
  | 'rocket'
  | 'activity'
  | 'plug'
  | 'file-text'
  | 'settings'
  | 'message-square'
  | 'users'
  | 'file-json'
  | 'workflow'
  | 'shield'
  | 'play'
  | 'globe'
  | 'swords'
  | 'database'
  | 'list-checks'
  | 'box'
  | 'gauge'
  | 'scroll'
  | 'server'
  | 'radio'
  | 'link'
  | 'fingerprint'
  | 'shield-check'
  | 'folder';

export interface NavItem {
  id: string;
  label: string;
  /** Route segment appended to /projects/:projectId */
  segment: string;
  icon: IconName;
  pageKind: PageKind;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

export interface RailView {
  id: RailViewId;
  label: string;
  icon: IconName;
  /** Explorer groups shown when this rail entry is active. */
  groupIds: string[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'project',
    label: 'Project',
    items: [
      { id: 'composer', label: 'Composer', segment: 'build', icon: 'message-square', pageKind: 'composer' },
      { id: 'organization', label: 'Organization / Agents', segment: 'organization', icon: 'users', pageKind: 'organization' },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    items: [
      { id: 'blueprint', label: 'Blueprint', segment: 'blueprint', icon: 'file-json', pageKind: 'blueprint' },
      { id: 'architecture', label: 'Architecture', segment: 'architecture', icon: 'workflow', pageKind: 'architecture' },
      { id: 'security', label: 'Permissions & Security', segment: 'security', icon: 'shield', pageKind: 'permissions' },
    ],
  },
  {
    id: 'test',
    label: 'Test',
    items: [
      { id: 'simulation', label: 'Simulation', segment: 'simulation', icon: 'play', pageKind: 'simulation' },
      { id: 'reality', label: 'Reality Lab', segment: 'reality', icon: 'globe', pageKind: 'reality' },
      { id: 'attacks', label: 'Attack Lab', segment: 'attacks', icon: 'swords', pageKind: 'attacks' },
    ],
  },
  {
    id: 'implement',
    label: 'Implement',
    items: [
      { id: 'code', label: 'Code', segment: 'code', icon: 'file-code', pageKind: 'code' },
      { id: 'integrations', label: 'Integrations & Data Sources', segment: 'integrations', icon: 'database', pageKind: 'integrations' },
    ],
  },
  {
    id: 'deploy',
    label: 'Deploy',
    items: [
      { id: 'preflight', label: 'Preflight', segment: 'deploy', icon: 'list-checks', pageKind: 'deploy' },
      { id: 'deployments', label: 'Deployments', segment: 'deployments', icon: 'box', pageKind: 'deployment' },
    ],
  },
  {
    id: 'operate',
    label: 'Operate',
    items: [
      { id: 'overview', label: 'Overview', segment: 'overview', icon: 'gauge', pageKind: 'overview' },
      { id: 'activity', label: 'Activity', segment: 'activity', icon: 'scroll', pageKind: 'activity' },
      { id: 'policies', label: 'Policies', segment: 'policies', icon: 'shield-check', pageKind: 'policies' },
      { id: 'runtime', label: 'Runtime', segment: 'runtime', icon: 'server', pageKind: 'runtime' },
      { id: 'control-plane', label: 'Control Plane', segment: 'control-plane', icon: 'activity', pageKind: 'control-plane' },
      { id: 'cre', label: 'Chainlink CRE', segment: 'cre', icon: 'radio', pageKind: 'cre' },
      { id: 'identity', label: 'Identity / ENS', segment: 'identity', icon: 'fingerprint', pageKind: 'identity' },
    ],
  },
  {
    id: 'output',
    label: 'Output',
    items: [
      { id: 'reports', label: 'Safety Reports', segment: 'reports', icon: 'file-text', pageKind: 'reports' },
      { id: 'evidence', label: 'Evidence', segment: 'reports?tab=evidence', icon: 'folder', pageKind: 'reports' },
    ],
  },
  {
    id: 'workspace',
    label: 'Workspace',
    items: [{ id: 'settings', label: 'Settings', segment: 'settings', icon: 'settings', pageKind: 'settings' }],
  },
];

export const RAIL_VIEWS: RailView[] = [
  { id: 'project', label: 'Project / Build', icon: 'layout-grid', groupIds: ['project'] },
  { id: 'design', label: 'Design', icon: 'pencil-ruler', groupIds: ['design'] },
  { id: 'test', label: 'Test', icon: 'flask-conical', groupIds: ['test'] },
  { id: 'code', label: 'Code', icon: 'file-code', groupIds: ['implement'] },
  { id: 'deploy', label: 'Deploy', icon: 'rocket', groupIds: ['deploy'] },
  { id: 'operate', label: 'Operate', icon: 'activity', groupIds: ['operate'] },
  { id: 'integrations', label: 'Integrations', icon: 'plug', groupIds: ['implement'] },
  { id: 'reports', label: 'Reports', icon: 'file-text', groupIds: ['output'] },
];

/**
 * Settings reaches the same explorer group, but it lives in the rail *footer*
 * next to Help rather than in the main list — where every other entry is a
 * stage of building an agent, and a workspace preference is not one.
 */
export const SETTINGS_RAIL_VIEW: RailView = {
  id: 'settings',
  label: 'Settings',
  icon: 'settings',
  groupIds: ['workspace'],
};

/** Every rail view, wherever it is rendered — use this for lookups by id. */
export const ALL_RAIL_VIEWS: RailView[] = [...RAIL_VIEWS, SETTINGS_RAIL_VIEW];

/** Which rail entry owns a given route segment, so navigation keeps the rail in sync. */
export const SEGMENT_TO_RAIL: Record<string, RailViewId> = {
  build: 'project',
  organization: 'project',
  blueprint: 'design',
  architecture: 'design',
  security: 'design',
  simulation: 'test',
  reality: 'test',
  attacks: 'test',
  code: 'code',
  integrations: 'integrations',
  deploy: 'deploy',
  deployments: 'deploy',
  overview: 'operate',
  activity: 'operate',
  policies: 'operate',
  runtime: 'operate',
  'control-plane': 'operate',
  cre: 'operate',
  identity: 'operate',
  reports: 'reports',
  settings: 'settings',
};

export interface PageMeta {
  segment: string;
  title: string;
  /** Short tab label used by the editor tab bar. */
  tabTitle: string;
  purpose: string;
  pageKind: PageKind;
  /** Context Agent empty-state suggestions for this page (spec §6.5). */
  quickPrompts: string[];
}

export const PAGE_META: Record<string, PageMeta> = {
  build: {
    segment: 'build',
    title: 'Build Agent',
    tabTitle: 'Composer',
    purpose: 'Describe what this agent should do and the boundaries it must obey.',
    pageKind: 'composer',
    quickPrompts: [
      'Help me turn this goal into explicit limits.',
      'What important financial boundary is missing?',
      'Explain why the build is blocked.',
      'Rewrite this goal without changing its authority.',
    ],
  },
  organization: {
    segment: 'organization',
    title: 'Organization / Agents',
    tabTitle: 'Organization',
    purpose: 'Manage multi-agent organizations as distinct principals rather than one super-agent.',
    pageKind: 'organization',
    quickPrompts: [
      'Compare Guardian and Rebalancer authority.',
      "Why can't Reporter execute?",
      'Show aggregate budget risk.',
    ],
  },
  blueprint: {
    segment: 'blueprint',
    title: 'Blueprint',
    tabTitle: 'Blueprint',
    purpose: 'The canonical, machine-precise definition of this agent and its authority model.',
    pageKind: 'blueprint',
    quickPrompts: [
      'Explain this field.',
      'Is this authority broader than revision 7?',
      'Propose a safer autonomous limit.',
      'Show which pages become stale if I apply this change.',
    ],
  },
  architecture: {
    segment: 'architecture',
    title: 'Architecture',
    tabTitle: 'Architecture',
    purpose: 'How the agent obtains identity, context, policy decisions and execution authority.',
    pageKind: 'architecture',
    quickPrompts: [
      'Explain this architecture.',
      'Trace how money can move.',
      'What happens if this node is compromised?',
      'Why does this edge require CRE?',
      'Trace authority from user to executor.',
    ],
  },
  security: {
    segment: 'security',
    title: 'Permissions & Security',
    tabTitle: 'Permissions',
    purpose: 'What can this agent do, and what can it never do?',
    pageKind: 'permissions',
    quickPrompts: [
      'Summarize the blast radius if the agent is compromised.',
      'Explain ALLOW vs ESCALATE.',
      'Find authority increases since last revision.',
      'Which attack simulations prove this deny rule?',
    ],
  },
  simulation: {
    segment: 'simulation',
    title: 'Simulation Center',
    tabTitle: 'Simulation',
    purpose: 'Run deterministic ContextLock simulations and official CRE workflow simulations with exact reason codes.',
    pageKind: 'simulation',
    quickPrompts: [
      'Explain why this scenario denied.',
      'Why did expected and actual differ?',
      'Create an edge case around this threshold.',
      'Show the exact security field that changed.',
    ],
  },
  reality: {
    segment: 'reality',
    title: 'Reality Lab',
    tabTitle: 'Reality Lab',
    purpose: 'Real mainnet read-only context, local forks, snapshots and synthetic overlays — never an execution path.',
    pageKind: 'reality',
    quickPrompts: [
      'Explain why this source is VERIFIED_ORACLE.',
      'Is this snapshot coherent enough for the strategy?',
      'What happens under a 30% ETH drop?',
      'Why is Historical Replay blocked?',
      'Compare fork execution with testnet execution.',
    ],
  },
  attacks: {
    segment: 'attacks',
    title: 'Attack Lab',
    tabTitle: 'Attack Lab',
    purpose: "Run adversarial scenarios against the agent and see exactly which layer stops them.",
    pageKind: 'attacks',
    quickPrompts: [
      'Explain why this attack failed.',
      'What would happen if this policy check were removed?',
      'Which layer first stopped this attack?',
      'Create a stronger variant of this attack.',
    ],
  },
  code: {
    segment: 'code',
    title: 'Code',
    tabTitle: 'Code',
    purpose: 'The generated sandbox files behind this agent. Generated code is read-only after a successful build.',
    pageKind: 'code',
    quickPrompts: [
      'Explain this file.',
      'Explain selected code.',
      'Which Blueprint field generated this?',
      'Find the test that covers this policy.',
      'Propose a patch.',
    ],
  },
  integrations: {
    segment: 'integrations',
    title: 'Integrations & Data Sources',
    tabTitle: 'Integrations',
    purpose: 'Registered adapters, data trust classes, credentials and source health.',
    pageKind: 'integrations',
    quickPrompts: [
      'Which source satisfies my verified-price requirement?',
      "Why can't The Graph replace Chainlink here?",
      "Explain this adapter's trust class.",
      'What breaks if I disable this source?',
    ],
  },
  deploy: {
    segment: 'deploy',
    title: 'Deploy / Preflight',
    tabTitle: 'Preflight',
    purpose: 'Turn a verified build into a safe Testnet Lab deployment with explicit costs, artifacts and blockers.',
    pageKind: 'deploy',
    quickPrompts: [
      'Explain this gas estimate.',
      'Why is deployment blocked?',
      'Which contracts will be reused?',
      'What exactly will happen when I deploy?',
    ],
  },
  deployments: {
    segment: 'deployments',
    title: 'Deployments',
    tabTitle: 'Deployments',
    purpose: 'Every deployment of this agent, its artifacts and its receipts.',
    pageKind: 'deployment',
    quickPrompts: [
      'What changed between deployment 2 and 3?',
      'Which contracts were reused here?',
      'Show the artifact hashes for this deployment.',
    ],
  },
  overview: {
    segment: 'overview',
    title: 'Overview',
    tabTitle: 'Overview',
    purpose: 'Observed state of the deployed agent: authority, health, decisions and market context.',
    pageKind: 'overview',
    quickPrompts: [
      'Summarize what this agent has done today.',
      'Why did the last decision escalate?',
      'Are any data sources stale?',
      'Explain current authority usage.',
    ],
  },
  activity: {
    segment: 'activity',
    title: 'Activity',
    tabTitle: 'Activity',
    purpose: 'Queryable audit timeline across agent, CRE, policy, chain, adapters and runtime.',
    pageKind: 'activity',
    quickPrompts: [
      'Summarize this run.',
      'Why did this event happen?',
      'Trace this transaction back to the trigger.',
      'Compare this run with the previous one.',
    ],
  },
  policies: {
    segment: 'policies',
    title: 'Policies',
    tabTitle: 'Policies',
    purpose: 'View and safely revise the current ContextLock financial authority state.',
    pageKind: 'policies',
    quickPrompts: [
      'Explain this policy.',
      'What changes if I increase this limit?',
      'Which simulations prove this rule?',
      'Why is Enable Policy disabled?',
    ],
  },
  runtime: {
    segment: 'runtime',
    title: 'Runtime',
    tabTitle: 'Runtime',
    purpose: 'Operate the containerized agent process without confusing process state with financial authority.',
    pageKind: 'runtime',
    quickPrompts: [
      'Why is runtime degraded?',
      'Explain this restart loop.',
      'Compare runtime revisions.',
      'Will stopping runtime disable the policy?',
    ],
  },
  'control-plane': {
    segment: 'control-plane',
    title: 'Control Plane',
    tabTitle: 'Control Plane',
    purpose: 'Operator view of live components, reconciliation, alerts and emergency controls.',
    pageKind: 'control-plane',
    quickPrompts: [
      'Explain the current system health.',
      'What does this drift mean?',
      'Summarize critical alerts.',
      'Why is Emergency Lock partial?',
    ],
  },
  cre: {
    segment: 'cre',
    title: 'Chainlink CRE',
    tabTitle: 'Chainlink CRE',
    purpose: 'Simulator, user simulator and real DON state — stated separately and only with evidence.',
    pageKind: 'cre',
    quickPrompts: [
      'Explain simulator vs DON.',
      "Why can't I promote this workflow?",
      'Explain this CRE result.',
      'What evidence would prove TEE execution?',
    ],
  },
  identity: {
    segment: 'identity',
    title: 'Identity / ENS',
    tabTitle: 'Identity',
    purpose: 'Agent identity, namespace, lifecycle and revocation — separate from financial permissions.',
    pageKind: 'identity',
    quickPrompts: [
      'Explain what ENS does here.',
      'Will revoking this agent affect its siblings?',
      'How does identity revocation stop old capabilities?',
    ],
  },
  reports: {
    segment: 'reports',
    title: 'Safety Reports & Evidence',
    tabTitle: 'Reports',
    purpose: 'Shareable, secret-free evidence of what the agent was built to do and what was actually tested.',
    pageKind: 'reports',
    quickPrompts: [
      'Summarize this report for a judge.',
      'Explain the strongest security evidence.',
      'Which claims are still simulated?',
      'What blockers remain?',
    ],
  },
  settings: {
    segment: 'settings',
    title: 'Settings',
    tabTitle: 'Settings',
    purpose: 'Non-secret project and workspace behaviour.',
    pageKind: 'settings',
    quickPrompts: [
      'What does developer mode change?',
      'Are my simulation limits server-enforced?',
      'Explain the density and layout options.',
    ],
  },
};

export function metaForSegment(segment: string): PageMeta {
  return PAGE_META[segment] ?? PAGE_META.overview;
}

/**
 * Route segment that owns a page kind.
 *
 * Not an identity mapping: the Composer lives at `build`, and Permissions at
 * `security`. Anything routing by page kind — an agent patch going back to the
 * page that owns its artifact — has to go through here.
 */
export function segmentForPageKind(pageKind: PageKind): string {
  for (const group of NAV_GROUPS) {
    const hit = group.items.find((item) => item.pageKind === pageKind);
    if (hit) return hit.segment;
  }
  return 'overview';
}

export function findNavItem(segment: string): NavItem | undefined {
  for (const group of NAV_GROUPS) {
    const hit = group.items.find((item) => item.segment === segment);
    if (hit) return hit;
  }
  return undefined;
}
