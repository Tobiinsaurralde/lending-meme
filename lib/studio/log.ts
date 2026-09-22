/** Output-panel log lines, built from the build event stream. */
export type LogLevel = 'info' | 'step' | 'pass' | 'fail' | 'warn';

export interface LogLine {
  time: string;
  scope: string;
  message: string;
  level: LogLevel;
}

/** Flat text form, used for copy and for the sanitized log download. */
export function logAsText(lines: LogLine[]): string {
  return lines.map((l) => `[${l.time}] ${l.scope} · ${l.message}`).join('\n');
}

const hhmmss = (ms: number) => new Date(ms).toTimeString().slice(0, 8);

/** One build event → one log line. The payload is summarised, never dumped: this panel is read, not parsed. */
export function logLineOf(type: string, payload: Record<string, unknown>, at: number, buildRevision: number | null): LogLine | null {
  const scope = `build${buildRevision ? ` r${buildRevision}` : ''}`;
  const s = (k: string) => (payload[k] === undefined || payload[k] === null ? '' : String(payload[k]));
  switch (type) {
    case 'build.created': return { time: hhmmss(at), scope, message: 'build created', level: 'info' };
    case 'requirements.started': return { time: hhmmss(at), scope, message: 'understanding the request', level: 'step' };
    case 'requirements.completed': return { time: hhmmss(at), scope, message: `requirements: ${s('objective')}${Array.isArray(payload.unknowns) && payload.unknowns.length ? ` · unknowns: ${(payload.unknowns as string[]).join(', ')}` : ''}`, level: 'pass' };
    case 'blueprint.started': return { time: hhmmss(at), scope, message: 'designing the Blueprint', level: 'step' };
    case 'blueprint.updated': return { time: hhmmss(at), scope, message: `adapters resolved${Array.isArray(payload.unresolved) && payload.unresolved.length ? ` · unresolved: ${(payload.unresolved as string[]).join(', ')}` : ''}`, level: 'info' };
    case 'blueprint.completed': return { time: hhmmss(at), scope, message: `Blueprint r${s('revision')} ${payload.buildable ? 'buildable' : 'NOT buildable'}`, level: payload.buildable ? 'pass' : 'warn' };
    case 'security.started': return { time: hhmmss(at), scope, message: 'security review', level: 'step' };
    case 'security.finding': return { time: hhmmss(at), scope, message: `${s('severity')} ${s('code')} — ${s('message').slice(0, 140)}`, level: s('severity') === 'CRITICAL' || s('severity') === 'HIGH' ? 'fail' : s('severity') === 'INFO' ? 'info' : 'warn' };
    case 'security.completed': return { time: hhmmss(at), scope, message: `security review complete · ${s('critical') || 0} critical`, level: Number(s('critical')) > 0 ? 'warn' : 'pass' };
    case 'approval.requested': return { time: hhmmss(at), scope, message: 'waiting for your review before any code is generated', level: 'warn' };
    case 'approval.granted': return { time: hhmmss(at), scope, message: 'build approved', level: 'pass' };
    case 'code.started': return { time: hhmmss(at), scope, message: `generating code in an isolated ${s('sandboxProvider')} sandbox`, level: 'step' };
    case 'code.file.created': return { time: hhmmss(at), scope, message: `wrote ${s('path')} (${s('bytes')} b)`, level: 'info' };
    case 'code.file.updated': return { time: hhmmss(at), scope, message: `updated ${s('path')}`, level: 'info' };
    case 'test.started': return { time: hhmmss(at), scope, message: 'compiling and testing', level: 'step' };
    case 'test.passed': return { time: hhmmss(at), scope, message: `${s('suite')} passed${s('passed') ? ` (${s('passed')})` : ''}`, level: 'pass' };
    case 'test.failed': return { time: hhmmss(at), scope, message: `${s('suite')} FAILED${s('output') ? ` — ${s('output').slice(0, 160)}` : ''}`, level: 'fail' };
    case 'repair.started': return { time: hhmmss(at), scope, message: `repair cycle ${s('cycle')}`, level: 'step' };
    case 'repair.completed': return { time: hhmmss(at), scope, message: `repair cycle ${s('cycle')} complete`, level: 'info' };
    case 'simulation.started': return { time: hhmmss(at), scope, message: payload.userRequested ? 'running requested scenarios' : 'running the mandatory security pass', level: 'step' };
    case 'simulation.step': return { time: hhmmss(at), scope, message: `${s('scenarioId')} → ${s('verdict')} / ${s('outcome')} (stopped at ${s('stoppedAt')})`, level: payload.passed ? 'pass' : 'fail' };
    case 'simulation.completed': return { time: hhmmss(at), scope, message: `${s('passed')} of ${s('total')} scenarios passed${Number(s('truncated')) > 0 ? ` · ${s('truncated')} not run` : ''}`, level: s('passed') === s('total') ? 'pass' : 'fail' };
    case 'usage.updated': return { time: hhmmss(at), scope, message: `${s('requests')} model calls · ${s('inputTokens')}+${s('outputTokens')} tokens`, level: 'info' };
    case 'usage.warning': return { time: hhmmss(at), scope, message: `usage at ${Math.round(Number(s('peakFraction')) * 100)}% of the build budget`, level: 'warn' };
    case 'build.completed': return { time: hhmmss(at), scope, message: `BUILD COMPLETE · ${s('files')} files`, level: 'pass' };
    case 'build.failed': return { time: hhmmss(at), scope, message: `build stopped: ${s('reason')}`, level: 'fail' };
    case 'build.paused': return { time: hhmmss(at), scope, message: `build paused: ${s('reason')}`, level: 'warn' };
    case 'build.limit_reached': return { time: hhmmss(at), scope, message: `limit reached: ${s('kind')} ${s('used')}/${s('limit')}`, level: 'warn' };
    case 'build.abandoned': return { time: hhmmss(at), scope, message: `build abandoned: ${s('reason')}`, level: 'warn' };
    default: return null;
  }
}
