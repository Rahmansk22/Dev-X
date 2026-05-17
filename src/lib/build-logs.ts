// Utility for saving and retrieving build/install logs
// In production, replace with DB or S3 storage

export interface BuildLog {
  projectId: string;
  step: 'install' | 'build';
  stdout: string;
  stderr: string;
  exitCode: number;
  timestamp: number;
}

const logs: BuildLog[] = [];

export function saveBuildLog(log: BuildLog) {
  logs.push(log);
}

export function getBuildLogs(projectId: string): BuildLog[] {
  return logs.filter(l => l.projectId === projectId);
}

export function classifyBuildError(log: string): string {
  if (log.includes('Module not found')) return 'missing_file';
  if (log.includes('use client') && log.includes('metadata')) return 'next_conflict';
  if (log.includes('OOM') || log.includes('Killed') || log.includes('137')) return 'memory';
  if (log.includes('process.env')) return 'env';
  if (log.includes('node-gyp') || log.includes('make failed')) return 'native_build';
  if (log.includes('Type \'') && log.includes('not assignable')) return 'typescript';
  return 'unknown';
}
