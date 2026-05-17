import { classifyBuildError } from './build-logs';

export function getBuildErrorType(logs: { stdout: string; stderr: string }[]): string {
  for (const log of logs) {
    const type = classifyBuildError(log.stderr + '\n' + log.stdout);
    if (type !== 'unknown') return type;
  }
  return 'unknown';
}
