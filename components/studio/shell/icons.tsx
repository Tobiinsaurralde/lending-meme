'use client';

import {
  Activity,
  Box,
  Database,
  Fingerprint,
  FileCode,
  FileJson,
  FileText,
  FlaskConical,
  Folder,
  Gauge,
  Globe,
  LayoutGrid,
  Link as LinkIcon,
  ListChecks,
  MessageSquare,
  PencilRuler,
  Play,
  Plug,
  Radio,
  Rocket,
  Scroll,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Swords,
  Users,
  Workflow,
} from 'lucide-react';
import type { IconName } from '@/lib/studio/nav';

const MAP: Record<IconName, React.ComponentType<{ size?: number | string; strokeWidth?: number; 'aria-hidden'?: boolean }>> = {
  'layout-grid': LayoutGrid,
  'pencil-ruler': PencilRuler,
  'flask-conical': FlaskConical,
  'file-code': FileCode,
  rocket: Rocket,
  activity: Activity,
  plug: Plug,
  'file-text': FileText,
  settings: Settings,
  'message-square': MessageSquare,
  users: Users,
  'file-json': FileJson,
  workflow: Workflow,
  shield: Shield,
  play: Play,
  globe: Globe,
  swords: Swords,
  database: Database,
  'list-checks': ListChecks,
  box: Box,
  gauge: Gauge,
  scroll: Scroll,
  server: Server,
  radio: Radio,
  link: LinkIcon,
  fingerprint: Fingerprint,
  'shield-check': ShieldCheck,
  folder: Folder,
};

export function Icon({ name, size = 15 }: { name: IconName; size?: number }) {
  const Cmp = MAP[name] ?? LayoutGrid;
  return <Cmp size={size} strokeWidth={1.6} aria-hidden />;
}
