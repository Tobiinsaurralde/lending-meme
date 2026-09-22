/** Code page copy (spec §18). */
import type { CodeFile } from '../types';

export const CODE_GROUPS: { id: CodeFile['group']; label: string }[] = [
  { id: 'generated-agent', label: 'Generated agent' },
  { id: 'contextlock-modules', label: 'ContextLock modules' },
  { id: 'adapter-modules', label: 'Adapter modules' },
  { id: 'tests', label: 'Tests' },
  { id: 'cre-workflow', label: 'CRE workflow' },
  { id: 'deployment', label: 'Deployment' },
  { id: 'config', label: 'Config' },
];

export const CODE_MARK_LABEL: Record<string, { label: string; tone: 'pass' | 'warn' | 'sim' | 'blocked' | 'neutral'; title: string }> = {
  generated: { label: 'GENERATED', tone: 'sim', title: 'Produced by the build from the Blueprint' },
  'template-owned': { label: 'TEMPLATE', tone: 'neutral', title: 'Owned by the adapter template, upgraded with it' },
  modified: { label: 'MODIFIED', tone: 'warn', title: 'Edited by hand; artifact correspondence is invalidated' },
  stale: { label: 'STALE', tone: 'warn', title: 'Built against an older Blueprint revision' },
  locked: { label: 'LOCKED', tone: 'blocked', title: 'Generated from the Blueprint; edit the Blueprint instead' },
};
