/** Simulation / Attack Lab copy (spec §15, §17). */
import type { AttackCategory, SimulationScenario } from '../types';

export const SCENARIO_GROUPS: { id: SimulationScenario['group']; label: string }[] = [
  { id: 'baseline', label: 'Baseline' },
  { id: 'policy-boundaries', label: 'Policy boundaries' },
  { id: 'prompt-injection', label: 'Prompt injection' },
  { id: 'mutation-replay', label: 'Mutation / replay' },
  { id: 'ens-policy-lifecycle', label: 'ENS / policy lifecycle' },
  { id: 'data-freshness', label: 'Data / freshness' },
  { id: 'adapter-failures', label: 'Adapter failures' },
  { id: 'protocol-specific', label: 'Protocol-specific' },
  { id: 'cross-chain', label: 'Cross-chain' },
  { id: 'organization', label: 'Organization' },
  { id: 'cre', label: 'CRE' },
];

export const ATTACK_CATEGORIES: { id: AttackCategory; label: string }[] = [
  { id: 'prompt-agent-compromise', label: 'Prompt / agent compromise' },
  { id: 'transaction-mutation', label: 'Transaction mutation' },
  { id: 'replay-expiry', label: 'Replay / expiry' },
  { id: 'identity-ens', label: 'Identity / ENS' },
  { id: 'data-oracle', label: 'Data / oracle' },
  { id: 'policy', label: 'Policy' },
  { id: 'cre-runtime', label: 'CRE / runtime' },
  { id: 'cross-agent', label: 'Cross-agent' },
  { id: 'cross-chain', label: 'Cross-chain' },
  { id: 'network-boundary', label: 'Network boundary' },
];
