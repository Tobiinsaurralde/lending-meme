/** Blueprint page copy (spec §12, §36). */
export const VALIDATION_GROUP_LABEL: Record<string, string> = {
  schema: 'Schema',
  'security-invariant': 'Security invariant',
  'missing-required': 'Missing required information',
  'trust-freshness': 'Trust / freshness',
  'adapter-compatibility': 'Adapter compatibility',
  'execution-network': 'Execution network',
};

/** Surfaces invalidated when the Blueprint changes (spec §36). */
export const STALE_ON_BLUEPRINT_CHANGE = [
  { surface: 'Strategy', detail: 'Regenerated from the new revision.' },
  { surface: 'Build', detail: 'The generated code no longer corresponds to the Blueprint until it is rebuilt.' },
  { surface: 'Simulation', detail: 'Every run built against the previous revision becomes STALE.' },
  { surface: 'Code', detail: 'Generated files must be rebuilt.' },
  { surface: 'Deployment', detail: 'Stays on its revision until you deploy again — not invalidated.' },
];

/** Architecture page copy (spec §13). */
export const EDGE_KIND_LABEL: Record<string, string> = {
  READ: 'Reads data from',
  CONTEXT: 'Supplies context to',
  TRIGGER: 'Triggers',
  POLICY: 'Submits for policy evaluation',
  AUTHORIZATION: 'Authorizes',
  EXECUTE: 'Executes against',
  ESCALATE: 'Escalates to',
};

export const ARCH_LAYERS: { id: string; label: string; description: string }[] = [
  { id: 'identity', label: 'Identity', description: 'Who the agent is and how it can be revoked.' },
  { id: 'data', label: 'Data', description: 'Where context comes from and at what trust class.' },
  { id: 'policy', label: 'Policy', description: 'Where actions are allowed, escalated or denied.' },
  { id: 'execution', label: 'Execution', description: 'How a transaction actually reaches the chain.' },
  { id: 'runtime', label: 'Runtime', description: 'The agent process itself.' },
  { id: 'live-health', label: 'Live health', description: 'Observed state overlaid on the graph.' },
  { id: 'security-boundaries', label: 'Security boundaries', description: 'Where authority is enforced.' },
];
