/**
 * Project templates (spec §9.1). A template pre-fills a description; it never pre-fills a financial
 * ceiling — the user states that themselves.
 */
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  protocols: string[];
  /** The description the Composer starts from. Empty for a blank project. */
  prompt: string;
  shape: 'single' | 'organization';
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl_aave_guardian',
    name: 'Aave Liquidation Guardian',
    description: 'Watches a lending position and repays debt within a hard ceiling when the health factor falls.',
    protocols: ['Aave v3', 'Chainlink Data Feeds'],
    prompt:
      'I want an Aave agent that protects me from liquidation. Keep my health factor above 1.6. Repay up to $1,000 automatically. $1,000–$5,000 requires Ledger. Never withdraw collateral.',
    shape: 'single',
  },
  {
    id: 'tpl_treasury_guardian',
    name: 'Multi-protocol Treasury Guardian',
    description: 'Guards Aave, Morpho Blue and Compound positions, stakes idle ETH into Lido and rebalances on a DEX.',
    protocols: ['Aave v3', 'Morpho Blue', 'Compound v3', 'Lido', 'DEX router'],
    prompt:
      'Guard my treasury across Aave, Morpho Blue and Compound: keep every health factor above 1.6 and repay up to $1,000 automatically. Stake idle ETH above a 0.5 ETH reserve into Lido. Keep the vault 50/50 WETH–USDC and rebalance on the DEX when it drifts more than 5%. Anything from $1,000 to $5,000 needs Ledger. Never withdraw collateral.',
    shape: 'single',
  },
  {
    id: 'tpl_department',
    name: 'Treasury Department (organization)',
    description: 'A guardian, a rebalancer and a read-only reporter as separate principals under one ENS root.',
    protocols: ['Aave v3', 'DEX router', 'Chainlink Data Feeds'],
    prompt:
      'Build my treasury department. A guardian agent that repays Aave debt to keep my health factor above 1.6, up to $500 per action and $750 a day. A rebalancer that swaps to hold 40% ETH, up to $250 per action and $750 a day. A reporter that reads positions and writes summaries and can never move money. The whole department may not spend more than $1,250 in 24 hours.',
    shape: 'organization',
  },
  {
    id: 'tpl_blank',
    name: 'Blank project',
    description: 'Start from a description with no preset protocols, actions or authority.',
    protocols: [],
    prompt: '',
    shape: 'single',
  },
];
