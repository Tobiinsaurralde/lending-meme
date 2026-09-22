/**
 * Prohibited shortcuts (spec §30, third column).
 *
 * ┌─ THIS IS NOT A SECURITY BOUNDARY ──────────────────────────────────────┐
 * │ This file MOCKS how the backend agent should answer. It is pattern     │
 * │ matching on a prompt, which anyone can phrase around, and it must      │
 * │ never be relied on to stop anything.                                   │
 * │                                                                        │
 * │ What actually stops the agent acting is architectural: it has no tool  │
 * │ that executes a privileged control. A `control-suggestion` card can    │
 * │ only carry a ControlCommand that OPENS a native dialog, and the        │
 * │ dialog is completed by a person. A real model replying "done, I        │
 * │ disabled it" changes nothing, because there is nothing to call.        │
 * │                                                                        │
 * │ When the backend lands, delete this routing and let the real agent     │
 * │ produce refusal cards. Keep the card shape; keep the architecture.     │
 * └────────────────────────────────────────────────────────────────────────┘
 *
 * Every page names one thing the Context Agent must never do there, and those
 * prohibitions are the product. An agent that quietly declines reads as broken;
 * an agent that complies is a security hole. So each one is answered with a
 * visible refusal that says what was asked, why it is not the agent's to do,
 * and where the legitimate route is.
 *
 * The detectors are intentionally narrow. A refusal fired at a genuine question
 * is worse than no refusal at all — "explain the hard cap" must answer, while
 * "set the hard cap to 10k" must refuse — so each pattern requires an
 * imperative or a value, not merely the topic.
 */
import type { AgentResponseCard, PageKind } from './types';

interface Refusal {
  /** Fires only when the user is asking for the shortcut, not about it. */
  test: RegExp;
  card: Omit<Extract<AgentResponseCard, { kind: 'refusal' }>, 'kind'>;
}

/** Imperative framing — "set X", "make X", "just do X". */
const ASK = String.raw`(?:set|make|change|update|put|give|raise|lower|bump|use|pick|choose|force|just|go ahead and|can you (?:just )?)`;

const PAGE_REFUSALS: Partial<Record<PageKind, Refusal[]>> = {
  composer: [
    {
      test: new RegExp(
        String.raw`\b${ASK}\b[^.?!]*\b(cap|limit|ceiling|budget|max(?:imum)?)\b|\b(cap|limit|ceiling|budget)\b[^.?!]*\b(?:to|at|of)\s*\$?\d`,
        'i',
      ),
      card: {
        title: 'I will not choose your financial cap',
        text: 'You asked me to set a hard financial limit for this agent.',
        because:
          'A hard cap is the boundary on how much of your money an autonomous process may move. Picking it is the one decision that cannot be delegated to the thing being bounded. I can explain what each limit governs and what a given number would permit, but the number stays REQUIRED until you set it.',
        alternative: { label: 'Open Blueprint to set it yourself', href: 'blueprint' },
      },
    },
  ],

  organization: [
    {
      test: /\b(merge|combine|unify|consolidate|share)\b[^.?!]*\b(agents?|principals?|identit|polic|budget)/i,
      card: {
        title: 'I will not merge two principals',
        text: 'You asked me to combine these agents into one.',
        because:
          'Separate principals are what makes one agent’s authority distinguishable from another’s. Merging them silently would mean a compromise of either could spend the combined budget, and nothing on screen would show that had changed. Creating a principal is an explicit act with its own identity, policy and budget.',
        alternative: { label: 'Compare their authority side by side', href: 'security' },
      },
    },
  ],

  blueprint: [
    {
      test: /\b(publish|release|ship|promote|commit)\b[^.?!]*\b(revision|blueprint|draft|change)|\b(auto|automatically)\b[^.?!]*\bpublish/i,
      card: {
        title: 'I can draft a revision, not publish one',
        text: 'You asked me to publish this Blueprint revision.',
        because:
          'Publishing a revision changes what a later deployment will run. I can propose the exact change and show you its security diff, but turning a draft into a revision is an explicit action you take, so that the record shows a person approved it.',
        alternative: { label: 'Review the draft and publish it yourself', href: 'blueprint' },
      },
    },
  ],

  architecture: [
    {
      test: new RegExp(
        String.raw`\b${ASK}\b[^.?!]*\b(node|edge|graph|component|connection)\b|\b(add|remove|delete|connect|rewire|redraw)\b[^.?!]*\b(node|edge|component)\b`,
        'i',
      ),
      card: {
        title: 'The graph is derived, not edited',
        text: 'You asked me to change the architecture graph directly.',
        because:
          'This graph is generated from the Blueprint. Editing it in place would make the picture disagree with the definition that actually governs the agent — the diagram would show one authority path while the deployed artifact ran another. The change belongs in the Blueprint, and the graph follows.',
        alternative: { label: 'Change it in the Blueprint', href: 'blueprint' },
      },
    },
  ],

  permissions: [
    {
      test: /\b(do you think|in your opinion|would it be (?:ok|fine|safe)|is it probably|i assume|surely)\b|\b(probably|likely)\b[^.?!]*\b(allowed|permitted|denied|safe)\b/i,
      card: {
        title: 'I do not have an opinion about what is permitted',
        text: 'You asked me to judge whether something is allowed.',
        because:
          'What this agent can and cannot do is decided by the deterministic policy layer, not by me. If I answered from inference I would be giving you a confident guess about a security boundary. The matrix on this page is the authoritative answer, and it is computed, not estimated.',
        alternative: { label: 'Read the permission matrix', href: 'security' },
      },
    },
  ],

  simulation: [
    {
      test: /\b(make|get|force|help)\b[^.?!]*\b(test|scenario|sim(?:ulation)?|run|it)\b[^.?!]*\b(pass|green|succeed)\b|\b(change|rewrite|adjust|update|fix)\b[^.?!]*\bexpected\b/i,
      card: {
        title: 'I will not edit an expectation to make a test pass',
        text: 'You asked me to change what this scenario expects.',
        because:
          'The expected result is the claim being tested. Rewriting it to match the actual result does not fix anything — it deletes the evidence that something was wrong, and every later report would cite a green run that proves nothing.',
        alternative: { label: 'Look at why it failed instead', href: 'simulation' },
      },
    },
  ],

  reality: [
    {
      test: /\b(use|switch|fall ?back|substitute|swap)\b[^.?!]*\b(graph|indexed|cached|other|another|different)\b[^.?!]*\b(source|feed|data|price)\b|\b(just )?use\b[^.?!]*\binstead\b/i,
      card: {
        title: 'I will not quietly substitute a weaker source',
        text: 'You asked me to use a different data source in place of the unavailable one.',
        because:
          'Trust class is a property of the source, and a decision made on indexed data is not the same decision made on a verified oracle round. Where a required source is unavailable this product reports UNAVAILABLE — substituting silently would leave a decision looking equally well-founded when it is not.',
        alternative: { label: 'See each source and its trust class', href: 'integrations' },
      },
    },
  ],

  attacks: [
    {
      test: /\b(disable|turn off|remove|bypass|relax|loosen|weaken|skip)\b[^.?!]*\b(control|check|guard|polic|defen[cs]e|validation|rule)\b/i,
      card: {
        title: 'I will not weaken a control to change an attack result',
        text: 'You asked me to disable a control that is currently stopping this attack.',
        because:
          'The attack result is only meaningful because the controls were in place when it ran. Turning one off to see a different outcome does not test anything — it removes the defence and reports the absence as a finding.',
        alternative: { label: 'See which layer stopped it', href: 'attacks' },
      },
    },
  ],

  code: [
    {
      test: /\b(edit|write|change|patch|modify|fix)\b[^.?!]*\b(file|code|directly|for me|it)\b|\bjust (edit|change|write|fix)\b/i,
      card: {
        title: 'Generated code is locked while it is deployed',
        text: 'You asked me to edit this file directly.',
        because:
          'This file is locked after a successful build so the running artifact still corresponds to its Blueprint. Writing to it directly would break that correspondence without invalidating the build, so the deployment would keep claiming to match a Blueprint it no longer implements.',
        alternative: { label: 'Change the Blueprint and rebuild', href: 'blueprint' },
      },
    },
  ],

  integrations: [
    {
      test: /\b(treat|count|mark|promote|upgrade|consider|call)\b[^.?!]*\b(verified|trusted|oracle|reliable|good enough)\b|\btrust class\b[^.?!]*\b(change|raise|set|promote)\b/i,
      card: {
        title: 'I cannot promote a trust class by describing it differently',
        text: 'You asked me to treat this source as more trustworthy than it is classified.',
        because:
          'Trust class comes from what the source actually is — a verified oracle round carries cryptographic provenance an indexed query does not. Calling it VERIFIED in conversation would change how it reads on screen while changing nothing about the data, which is precisely the confusion this classification exists to prevent.',
        alternative: { label: 'Compare the sources on their evidence', href: 'integrations' },
      },
    },
  ],

  deploy: [
    {
      test: /\b(deploy|approve|confirm|click|press|go ahead|do it|ship it|launch)\b[^.?!]*\b(for me|it|this|now|yourself)\b|^\s*(deploy|approve|ship it|do it)\s*[.!]?\s*$/i,
      card: {
        title: 'I will not press Deploy for you',
        text: 'You asked me to start the deployment.',
        because:
          'Deployment is the moment this configuration becomes something that can act on a network. The confirmation exists so a person sees the plan, the cost and the blockers and accepts them. An agent clicking it on your behalf would make that record false.',
        alternative: { label: 'Review the plan and deploy yourself', href: 'deploy' },
      },
    },
  ],

  overview: [
    {
      test: /\b(is|are)\b[^.?!]*\b(polic|authority)\b[^.?!]*\b(really|actually|definitely|currently)\b|\bcan you (?:just )?(?:tell|confirm)\b[^.?!]*\bpolicy is\b/i,
      card: {
        title: 'I read this from the last chain read, not from the screen',
        text: 'You asked me to confirm the current policy state.',
        because:
          'What this page shows is an observation with a timestamp, not a live guarantee. If I answered from what the UI is currently rendering I would be reporting a cached value as present truth. The policy tile carries its own freshness, and a stale read is reported stale rather than restated as fact.',
        alternative: { label: 'Read the policy’s on-chain state', href: 'policies' },
      },
    },
  ],

  activity: [
    {
      test: /\b(show|give|reveal|dump|print|expose|what.s in)\b[^.?!]*\b(payload|raw (?:body|data|event)|private|confidential|secret|full event)\b/i,
      card: {
        title: 'Confidential event payloads stay confidential',
        text: 'You asked me to show the private payload of this event.',
        because:
          'Events carry public metadata deliberately separated from confidential content. The separation is what allows this log to be shared, exported into a report, or read by someone who should see that a decision happened without seeing what it contained.',
        alternative: { label: 'See the public metadata and correlation trail', href: 'activity' },
      },
    },
  ],

  policies: [
    {
      /*
       * Two things to get right here:
       *
       *  - `polic\w*`, not `polic`: a trailing \b after a truncated stem can
       *    never match, because the boundary falls inside the word.
       *  - the leading guard. "Why is Enable Policy disabled?" is a question
       *    about a greyed-out button, and refusing it would be nonsense. An
       *    interrogative opener means the user is asking about the control,
       *    not asking for it.
       */
      test: /^(?!\s*(?:why|what|how|when|which|who|is|are|does|do|explain|show|tell|describe)\b)[^.?!]*\b(enable|disable|turn (?:on|off)|activate|deactivate|switch (?:on|off))\b[^.?!]*\b(polic\w*|authority|it)\b/i,
      card: {
        title: 'Chat is never authorization for a financial control',
        text: 'You asked me to change the policy’s enabled state.',
        because:
          'This is the boundary that decides whether the agent can obtain a capability at all. Free-text instruction is not authorization for it — if a sentence in a chat box could flip this, then anything that can put a sentence in the chat box could flip it too. It moves only through the typed confirmation on this page.',
        alternative: { label: 'Open the policy control', href: 'policies' },
      },
    },
  ],

  runtime: [
    {
      test: /\b(stop|pause|kill|halt)\b[^.?!]*\b(runtime|agent|it)\b[^.?!]*\b(safe|enough|disable|stops? (?:spending|money|payments))\b|\bis stopping\b[^.?!]*\benough\b/i,
      card: {
        title: 'Stopping the runtime is not disabling financial authority',
        text: 'You asked whether stopping the runtime is enough to stop the agent spending.',
        because:
          'Stopping the runtime stops this process from doing work. It does not change the policy, which is on-chain state and stays in whatever state the chain says it is in. Treating the two as equivalent is how a system ends up believed to be safe while its authority is still live.',
        alternative: { label: 'Disable authority at the policy layer', href: 'policies' },
      },
    },
  ],

  'control-plane': [
    {
      test: /\b(run|trigger|execute|do|perform|start)\b[^.?!]*\bemergency\b|\bemergency lock\b[^.?!]*\b(now|for me|yourself)\b/i,
      card: {
        title: 'I cannot run Emergency Lock',
        text: 'You asked me to execute the Emergency Lock.',
        because:
          'This is the strongest control in the product and it acts on live financial authority. It runs only through its own critical confirmation, where each step and its expected behaviour is stated before anything is attempted. I can open that dialog; completing it is yours.',
        alternative: { label: 'Open the Emergency Lock dialog', href: 'control-plane' },
      },
    },
  ],

  cre: [
    {
      test: /\b(is|isn.t|does)\b[^.?!]*\b(this|it)\b[^.?!]*\b(don|tee|consensus|attested|secure enclave)\b|\b(count|treat|call)\b[^.?!]*\b(don|tee)\b/i,
      card: {
        title: 'This is the simulator, and I will not call it a DON',
        text: 'You asked me to treat simulator output as DON or TEE execution.',
        because:
          'The official CRE CLI simulator runs the workflow faithfully, but there is no DON, no consensus across independent nodes and no hardware attestation. Those are the three properties someone would be relying on if I described it that way, and none of them are present here.',
        alternative: { label: 'See each evidence flag stated separately', href: 'cre' },
      },
    },
  ],

  identity: [
    {
      test: /\b(set|store|put|encode|add|record)\b[^.?!]*\b(limit|cap|budget|permission|authority|spend)\b[^.?!]*\b(ens|record|name|text record)\b|\bens\b[^.?!]*\b(limit|cap|budget|permission)\b/i,
      card: {
        title: 'ENS is identity, not financial policy',
        text: 'You asked me to express a financial permission as an ENS record.',
        because:
          'A name record is metadata anyone can read and the name’s owner can change. It is not an authority boundary and nothing enforces it at execution time. Storing a limit there would look like a control while enforcing nothing — the limit belongs in the policy, which the executor actually consults.',
        alternative: { label: 'Set the limit in the policy', href: 'policies' },
      },
    },
  ],

  reports: [
    {
      test: /\b(say|write|claim|state|make it (?:sound|look)|word it)\b[^.?!]*\b(secure|safe|audited|production ready|bulletproof|guaranteed|verified)\b|\b(stronger|better|more impressive|less bad)\b/i,
      card: {
        title: 'I will not state more than the evidence supports',
        text: 'You asked me to describe the agent’s safety more strongly than the runs support.',
        because:
          'A safety report is read by people deciding whether to trust this with money. Every claim in it is tied to something that actually ran, and simulated results are marked simulated. Strengthening the language without strengthening the evidence is exactly the failure this document exists to prevent.',
        alternative: { label: 'See what was actually tested', href: 'reports' },
      },
    },
  ],
};

/**
 * Returns a refusal card when the prompt asks for this page's prohibited
 * shortcut, and null otherwise. Checked before any other routing, so no
 * page-default answer can accidentally satisfy a request that must be refused.
 */
export function refusalFor(pageKind: PageKind, prompt: string): AgentResponseCard | null {
  for (const refusal of PAGE_REFUSALS[pageKind] ?? []) {
    if (refusal.test.test(prompt)) return { kind: 'refusal', ...refusal.card };
  }
  return null;
}

/** Every prohibited shortcut, for the settings/reference surfaces. */
export function prohibitedShortcuts(): { pageKind: PageKind; title: string; because: string }[] {
  return Object.entries(PAGE_REFUSALS).flatMap(([pageKind, list]) =>
    (list ?? []).map((r) => ({ pageKind: pageKind as PageKind, title: r.card.title, because: r.card.because })),
  );
}
