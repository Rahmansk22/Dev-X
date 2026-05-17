import { Sandbox } from 'e2b';
import { saveBuildLog } from './build-logs';

export async function runInstallAndBuild(sandbox: Sandbox, projectId: string) {
  // 1. Install
  const installBuffers = { stdout: '', stderr: '' };
  const installResult = await sandbox.commands.run('export CI=true && npm ci', {
    timeoutMs: 10 * 60 * 1000,
    onStdout: (data: string) => { installBuffers.stdout += data; },
    onStderr: (data: string) => { installBuffers.stderr += data; },
  });
  saveBuildLog({
    projectId,
    step: 'install',
    stdout: installBuffers.stdout,
    stderr: installBuffers.stderr,
    exitCode: installResult.exitCode ?? 0,
    timestamp: Date.now(),
  });

  // 2. Build
  const buildBuffers = { stdout: '', stderr: '' };
  const buildResult = await sandbox.commands.run('export CI=true && npm run build -- --verbose', {
    timeoutMs: 10 * 60 * 1000,
    onStdout: (data: string) => { buildBuffers.stdout += data; },
    onStderr: (data: string) => { buildBuffers.stderr += data; },
  });
  saveBuildLog({
    projectId,
    step: 'build',
    stdout: buildBuffers.stdout,
    stderr: buildBuffers.stderr,
    exitCode: buildResult.exitCode ?? 0,
    timestamp: Date.now(),
  });

  return { install: installResult, build: buildResult };
}
