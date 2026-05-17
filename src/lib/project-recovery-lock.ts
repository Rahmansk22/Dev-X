const recoveryLocks = new Map<string, Promise<unknown>>();

export function isProjectRecoveryLocked(projectId: string): boolean {
  return recoveryLocks.has(projectId);
}

export async function withProjectRecoveryLock<T>(
  projectId: string,
  task: () => Promise<T>
): Promise<T> {
  const active = recoveryLocks.get(projectId);
  if (active) {
    // Await the active process, but do NOT return its result directly 
    // if it contains a NextResponse stream (which cannot be reused).
    // Instead we wait for completion, then execute our own task.
    await active.catch(() => {});
  }

  const current = task();
  recoveryLocks.set(projectId, current);

  try {
    return await current;
  } finally {
    if (recoveryLocks.get(projectId) === current) {
      recoveryLocks.delete(projectId);
    }
  }
}
