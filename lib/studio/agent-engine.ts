/**
 * Context Agent response engine (mock).
 *
 * Stands in for the backend agent until it exists. It is deliberately
 * constrained the same way the real one must be (spec §6.4, §30):
 *
 *  - it may explain, reference, navigate, draft and propose;
 *  - a project mutation is returned as a *proposal* requiring explicit Apply;
 *  - a security control is returned as a control-suggestion card whose button
 *    only opens the native deterministic dialog — it never executes;
 *  - it never invents financial ceilings, never promotes a trust class by prose
 *    and never claims DON/TEE execution.
 *
 * Swapping this for a real SSE endpoint means replacing `respond()` — the card
 * shapes and the authority rules stay exactly as they are.
 */
import { refusalFor } from './agent-refusals';
import { resolveMentions, EMPTY_MENTION_SOURCE, type MentionEntity, type MentionSource } from './mentions';
import type { AgentCitation, AgentPageContext, AgentResponseCard, PageKind } from './types';

export interface AgentRequest {
  prompt: string;
  context: AgentPageContext;
  selectionLabel?: string | null;
  /** What the project currently has, for resolving @mentions. */
  mentions?: MentionSource;
}

function explanation(text: string, citations?: AgentCitation[]): AgentResponseCard {
  return { kind: 'explanation', text, citations };
}

/** Mentioned entities become citation chips, so the answer is traceable (§6.7). */
function citations(entities: MentionEntity[]): AgentCitation[] {
  return entities.map((e) => ({ label: e.label, kind: e.kind, id: e.id, href: e.href }));
}

/** Per-page default answer, used when nothing more specific matches. */
const PAGE_DEFAULT: Record<PageKind, (ctx: AgentPageContext) => AgentResponseCard[]> = {
  projects: () => [explanation('Open a project to give me build and runtime context to work with.')],

  composer: () => [
    explanation(
      'I can turn a goal into explicit, checkable limits, but I will not invent a financial ceiling for you — a missing hard cap stays marked REQUIRED until you decide it.',
    ),
    {
      kind: 'proposed-patch',
      title: 'Add explicit limits to the description',
      targetPage: 'composer',
      target: 'Composer draft',
      summary: 'Restates the same intent with the boundaries made explicit. Authority is unchanged: no new capability is added.',
      diff: [
        {
          field: 'objective',
          before: 'Protect my Aave position from liquidation.',
          after:
            'Repay USDC debt on Aave v3 (Sepolia) when the health factor falls below 1.25, using only treasury-held funds.',
        },
        {
          field: 'limits',
          before: '(not stated)',
          after: 'Autonomous per action: REQUIRED — you must set this. Escalation band and hard ceiling: REQUIRED.',
        },
      ],
    },
  ],

  organization: () => [
    explanation(
      'Guardian and Rebalancer are separate principals with separate policy hashes and separate ENS identities — neither can spend the other’s budget. Reporter has execution class NONE, so it holds no capability-issuing path at all.',
    ),
    { kind: 'navigation', title: 'Compare authority side by side', href: 'security', label: 'Open Permissions & Security' },
  ],

  blueprint: (ctx) => [
    explanation(
      `Blueprint r${ctx.blueprintRevision ?? '—'} is the canonical definition: identity, data requirements, actions and the authority envelope. Editing creates a draft revision — the live deployment keeps running the revision it was deployed with until you deploy again.`,
    ),
    {
      kind: 'proposed-patch',
      title: 'Tighten the autonomous per-action limit',
      targetPage: 'blueprint',
      target: 'Blueprint · Autonomous policy',
      summary:
        'Reduces autonomous authority. This narrows the blast radius; it does not widen it, so it needs no additional escalation review.',
      diff: [{ field: 'autonomous.maxAmountPerAction', before: '$1,000', after: '$750', authorityExpansion: false }],
    },
  ],

  architecture: () => [
    explanation(
      'Money can only move along one path: Trigger → Strategy → CRE evaluation → ContextLock Policy → Capability issuance → Executor → Aave. If the policy layer denies, no capability is issued and the executor has nothing to submit.',
    ),
    { kind: 'navigation', title: 'See the deny rules in full', href: 'security', label: 'Open Permissions & Security' },
  ],

  permissions: () => [
    explanation(
      'Worst case with a fully compromised runtime: the agent can repay up to the autonomous per-action limit to an allowlisted recipient on the approved testnet, inside the rolling window budget. It cannot borrow, cannot withdraw collateral, cannot pay an external recipient and cannot write to mainnet — those are denied at the policy layer, not by prompt.',
    ),
    { kind: 'suggested-simulation', title: 'Prove the recipient deny rule', scenarioId: 'sim_recipient_mutation', rationale: 'Runs the recipient mutation attack and shows the exact stopping layer.' },
  ],

  simulation: () => [
    explanation(
      'A denial means the deterministic policy layer refused the action and no capability was issued. The reason code is the authoritative answer — I can explain it, but I cannot restate it as something softer.',
    ),
    { kind: 'suggested-simulation', title: 'Add an edge case at the ceiling boundary', scenarioId: 'sim_amount_boundary', rationale: 'Tests $999.99 / $1,000.00 / $1,000.01 against the autonomous limit.' },
  ],

  reality: () => [
    explanation(
      'Mainnet here is a read-only market source, and the execution target stays Sepolia. A snapshot is coherent when every source resolves to the same anchor block; where a source is unavailable it is reported UNAVAILABLE rather than quietly substituted.',
    ),
  ],

  attacks: () => [
    explanation(
      'Each attack result lists only the defences that were actually exercised in that run. If a layer was never reached, it is not claimed as a defence.',
    ),
  ],

  code: () => [
    explanation(
      'Generated code is read-only after a successful build so that the artifact still corresponds to the Blueprint. If you edit it in developer mode, correspondence is invalidated and a revalidation and rebuild are required before deployment.',
    ),
  ],

  integrations: () => [
    explanation(
      'Chainlink Data Feeds carry trust class VERIFIED_ORACLE; The Graph is INDEXED. An indexed source cannot satisfy a verified-price requirement — trust class is a property of the source, and I cannot promote it by describing it differently.',
    ),
  ],

  deploy: () => [
    explanation(
      'Deployment gas, per-action execution cost, model usage and runtime hosting are estimated separately because they are paid differently — merging them into one number would be misleading. I can explain any of them, but I cannot start the deployment.',
    ),
  ],

  deployment: () => [explanation('This deployment’s artifacts, receipts and contract addresses are recorded as observed at deploy time.')],

  overview: () => [
    explanation(
      'Everything on this page is observed state with its own freshness. The policy tile reflects the last verified chain read — not what the UI last submitted.',
    ),
  ],

  activity: () => [
    explanation(
      'Every decision carries a correlation ID, so a transaction can be traced back through capability issuance, policy evaluation, CRE execution, data reads and the original trigger.',
    ),
  ],

  policies: () => [
    explanation(
      'The policy is the financial authority boundary. I can draft a revision and explain the consequences, but enabling or disabling it is only possible through the typed confirmation on this page.',
    ),
    {
      kind: 'control-suggestion',
      title: 'Disable financial authority',
      rationale: 'If you want execution stopped at the authority layer, this is the control that does it. I will open the dialog; you complete it.',
      control: 'DISABLE_POLICY',
      buttonLabel: 'Open Disable Policy',
      tier: 'financial-authority',
    },
  ],

  runtime: () => [
    explanation(
      'Stopping the runtime stops agent processing. It does not by itself disable on-chain financial authority — the policy stays in whatever state the chain says it is in.',
    ),
  ],

  'control-plane': () => [
    explanation(
      'Drift means the observed value no longer matches what the deployment expects. Until reconciliation confirms otherwise, treat the observed column as the truth.',
    ),
    {
      kind: 'control-suggestion',
      title: 'Emergency Lock',
      rationale: 'If policy state drift is critical, the strongest control is Emergency Lock. It attempts the financial policy first.',
      control: 'EMERGENCY_LOCK',
      buttonLabel: 'Open Emergency Lock',
      tier: 'emergency',
    },
  ],

  cre: () => [
    explanation(
      'This project runs the official CRE CLI simulator. That is a real simulation of the workflow, but it is not a DON, there is no DON consensus and there is no hardware TEE evidence. Those three stay NO until a real deployment produces evidence for them.',
    ),
  ],

  identity: () => [
    explanation(
      'ENS identifies and revokes agents. ContextLock policy defines their financial permissions. Revoking the identity prevents previously issued capabilities from being honoured; it does not itself change the policy’s enabled state.',
    ),
  ],

  reports: () => [
    explanation(
      'A safety report states what was built and what was actually tested, and marks simulated claims as simulated. I will not describe a simulator result as DON execution.',
    ),
  ],

  settings: () => [
    explanation(
      'Developer mode reveals raw IDs, raw JSON and the constrained terminal. It never disables a security check, and simulation limits stay server-enforced regardless of what is set here.',
    ),
  ],
};

/** Keyword routes that apply on any page. */
function keywordCards(prompt: string, ctx: AgentPageContext): AgentResponseCard[] | null {
  const p = prompt.toLowerCase();

  if (/\b(emergency|kill switch|lock everything|shut (it )?down)\b/.test(p)) {
    return [
      explanation(
        'Emergency Lock attempts, in order: disable the ContextLock policy, block new capability issuance, pause or stop the CRE path, stop the agent runtime, and optionally revoke the ENS identity. The financial policy is attempted first.',
      ),
      {
        kind: 'control-suggestion',
        title: 'Emergency Lock',
        rationale: 'I cannot run this. The button opens the native critical confirmation, which you complete.',
        control: 'EMERGENCY_LOCK',
        buttonLabel: 'Open Emergency Lock',
        tier: 'emergency',
      },
    ];
  }

  if (/\b(enable|disable|turn (on|off))\b.*\bpolicy\b/.test(p) || /\bpolicy\b.*\b(enable|disable)\b/.test(p)) {
    const disable = /\b(disable|turn off|stop)\b/.test(p);
    return [
      explanation(
        disable
          ? 'Disabling the policy removes the agent’s ability to obtain a capability, so no new execution can be authorized. The UI will stay DISABLING until a fresh chain read proves the new state.'
          : 'Enabling financial authority requires every precondition to pass first: deployment verified, runtime healthy, required CRE mode healthy, identity active, adapters healthy, no critical drift, and the testnet network guard satisfied.',
      ),
      {
        kind: 'control-suggestion',
        title: disable ? 'Disable financial authority' : 'Enable testnet financial authority',
        rationale: 'A free-text message is never authorization for a financial control. I can only open the dialog.',
        control: disable ? 'DISABLE_POLICY' : 'ACTIVATE_TESTNET_POLICY',
        buttonLabel: disable ? 'Open Disable Policy' : 'Open Enable Policy',
        tier: 'financial-authority',
      },
    ];
  }

  if (/\bmainnet\b/.test(p) && /\b(write|execute|deploy|send)\b/.test(p)) {
    return [
      explanation(
        'There is no mainnet write path in this product. Production-chain execution is disabled: mainnet is available as a read-only data source or as an isolated local fork, and a mainnet write attempt is denied by the execution network guard with MAINNET_WRITE_PROHIBITED.',
      ),
      { kind: 'navigation', title: 'See the boundary proved', href: 'attacks', label: 'Open Attack Lab' },
    ];
  }

  if (/\bstale\b/.test(p) || /\bfresh(ness)?\b/.test(p)) {
    return [
      explanation(
        'Freshness is tracked per source. A source past its time-to-live is shown STALE with its last confirmed time, and a decision that depends on it is refused with ORACLE_STALE rather than made on old data.',
      ),
    ];
  }

  if (/\bdon\b|\btee\b/.test(p)) {
    return [
      explanation(
        'This project is running the official CRE CLI simulator. Real DON execution, DON consensus and hardware TEE attestation are all NO here. I will not describe simulator output as DON or TEE execution — the CRE page states each of those separately, with evidence flags.',
      ),
      { kind: 'navigation', title: 'Check the truth labels', href: 'cre', label: 'Open Chainlink CRE' },
    ];
  }

  if (/\bblast radius\b|\bcompromis/.test(p)) {
    return PAGE_DEFAULT.permissions(ctx);
  }

  if (/\bstale\b.*\bpages?\b|\bwhat becomes stale\b/.test(p)) {
    return [
      explanation(
        'Changing the Blueprint marks the Strategy, the build, every simulation run against the old revision, and the generated code as stale. The deployment and the live Overview keep showing the deployed revision until you deploy again.',
      ),
    ];
  }

  return null;
}

export function respond(req: AgentRequest): AgentResponseCard[] {
  /* §30 prohibited shortcuts are checked first and unconditionally. If a
     keyword or page default could answer a request that must be refused, the
     refusal would depend on routing order — which is not a property a security
     behaviour should have. */
  const refusal = refusalFor(req.context.pageKind, req.prompt);
  if (refusal) return [refusal];

  /* Mentions are resolved by the frontend, never left for the model to guess
     at (§6.2). An unknown one is reported rather than answered around. */
  const mentions = resolveMentions(req.prompt, req.mentions ?? EMPTY_MENTION_SOURCE);
  if (mentions.unresolved.length > 0) {
    return [
      explanation(
        `I don’t have ${mentions.unresolved.join(', ')} in this project. I will not answer as though I do — type @ to see what exists here.`,
        citations(mentions.entities),
      ),
    ];
  }

  const keyword = keywordCards(req.prompt, req.context);
  if (keyword) return withCitations(keyword, mentions.entities);

  const base = PAGE_DEFAULT[req.context.pageKind]?.(req.context) ?? [
    explanation('I can explain what is on this page, trace how it connects to the Blueprint, and propose changes for you to review.'),
  ];

  /* An explicit mention is a stronger signal than the page default: the user
     named the thing they want addressed, so lead with it. */
  if (mentions.entities.length > 0) {
    return [
      explanation(describeMentions(mentions.entities), citations(mentions.entities)),
      ...base,
    ];
  }

  if (req.selectionLabel) {
    return [
      explanation(
        `Looking at ${req.selectionLabel}. ${describeSelection(req.context.pageKind)}`,
      ),
      ...base,
    ];
  }

  return base;
}

/** Attaches citation chips to the first explanation in a set of cards. */
function withCitations(cards: AgentResponseCard[], entities: MentionEntity[]): AgentResponseCard[] {
  if (entities.length === 0) return cards;
  let attached = false;
  return cards.map((card) => {
    if (attached || card.kind !== 'explanation') return card;
    attached = true;
    return { ...card, citations: citations(entities) };
  });
}

function describeMentions(entities: MentionEntity[]): string {
  if (entities.length === 1) {
    const [only] = entities;
    return `${only.label} — ${only.detail ?? 'in context for this turn'}. I have its identifiers in context; the chip below opens it.`;
  }
  return `I have ${entities.map((e) => e.label).join(', ')} in context for this turn. Only these references travel with the message — not the whole project.`;
}

function describeSelection(kind: PageKind): string {
  switch (kind) {
    case 'architecture':
      return 'Its inspector shows the configured purpose, adapter, trust class, network role and the Blueprint field that generated it.';
    case 'simulation':
      return 'The run records deterministic inputs, the expected and actual results, and the exact layer that produced the verdict.';
    case 'code':
      return 'I can point at the Blueprint field that generated this file and the test that covers it.';
    case 'activity':
      return 'The event carries a correlation ID that links it back through capability issuance to the original trigger.';
    default:
      return 'I have its identifiers and current observed state in context.';
  }
}

/** Streams a string in small chunks so the sidebar renders progressively. */
export function streamText(
  text: string,
  onChunk: (soFar: string) => void,
  onDone: () => void,
  signal?: { cancelled: boolean },
): void {
  const words = text.split(' ');
  let index = 0;
  let acc = '';

  const step = () => {
    if (signal?.cancelled) {
      onDone();
      return;
    }
    const take = Math.min(words.length - index, 2 + Math.floor(Math.random() * 3));
    acc += (index === 0 ? '' : ' ') + words.slice(index, index + take).join(' ');
    index += take;
    onChunk(acc);
    if (index < words.length) {
      window.setTimeout(step, 26);
    } else {
      onDone();
    }
  };

  step();
}
