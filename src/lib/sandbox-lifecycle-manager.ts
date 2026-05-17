/**
 * ═══════════════════════════════════════════════════════════════════════════
 * SANDBOX LIFECYCLE MANAGER - Production-Grade System
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Responsibilities:
 * 1. Track sandbox state (active, sleeping, dead, rebuilding)
 * 2. Detect sandbox expiration and termination
 * 3. Manage sandbox metadata (creation time, last heartbeat, framework)
 * 4. Provide heartbeat monitoring
 * 5. Coordinate sandbox recovery/recreation
 * 
 * Design:
 * - Single source of truth: SandboxMetadata table
 * - Stateless API design (no in-process caching)
 * - Proper cleanup on sandbox death
 * - TTL-based automatic recreation
 */

import { Sandbox } from 'e2b';
import prisma from '@/lib/db';
import { isServerListeningHttpCode } from '@/lib/sandbox-preview';

export enum SandboxState {
  ACTIVE = 'active',           // Sandbox & dev server running
  SLEEPING = 'sleeping',       // Sandbox alive but dev server stopped
  DEAD = 'dead',               // Sandbox no longer exists
  REBUILDING = 'rebuilding',   // In process of recovery
  UNKNOWN = 'unknown',         // Never checked
}

export interface SandboxMetadata {
  projectId: string;
  sandboxId: string;
  state: SandboxState;
  
  // Creation & lifecycle
  createdAt: Date;
  lastHeartbeatAt: Date;
  expiresAt: Date;  // E2B sandbox TTL
  
  // Framework detection
  framework: 'nextjs' | 'vite' | 'react' | 'custom' | null;
  port: number;
  
  // Preview URL (generated via E2B getHost)
  previewUrl: string | null;
  
  // Error tracking
  lastError: string | null;
  failureCount: number;
  
  // Files snapshot for recovery
  filesChecksum: string;  // Hash of current files
}

/**
 * SYSTEM STATE DIAGRAM
 * 
 *                    ┌─────────────┐
 *                    │   UNKNOWN   │ (new project, never run dev server)
 *                    └──────┬──────┘
 *                           │ (first dev server start)
 *                           ↓
 *                    ┌─────────────┐
 *                    │   ACTIVE    │ ←──┐
 *                    │ (running)   │    │ (reconnect successful)
 *                    └─────┬───────┘    │
 *                          │            │
 *               ┌──────────┴────────────┘
 *               │
 *          (30min later or sandbox killed)
 *               │
 *               ↓
 *        ┌─────────────┐
 *        │  SLEEPING   │
 *        │ (needs wake)│
 *        └────────┬────┘
 *                 │
 *        ┌────────┴──────────┐
 *        │  (wakeup button)   │
 *        ↓                    ↓
 *    ┌─────────┐       ┌──────────────┐
 *    │ ACTIVE  │       │  REBUILDING  │
 *    └─────────┘       └──────┬───────┘
 *                             │
 *                    ┌────────┴────────┐
 *                    │                 │
 *                (success)         (timeout after 5 retries)
 *                    │                 │
 *                    ↓                 ↓
 *                 ACTIVE            DEAD
 *                                    │
 *                              (create new sandbox)
 *                                    │
 *                                    ↓
 *                                ACTIVE
 * 
 * E2B SANDBOX EXPIRATION:
 * - Default TTL: 30 minutes
 * - Automatic cleanup after expiration
 * - Can be extended with setTimeout()
 * - Once expired, connections fail with E2B 404/502 errors
 */

/**
 * SANDBOX LIFECYCLE MANAGER
 */
export class SandboxLifecycleManager {
  private static readonly HEARTBEAT_INTERVAL_SEC = 120;  // Every 2 minutes
  private static readonly E2B_SANDBOX_TTL_SEC = 30 * 60; // 30 minutes
  private static readonly REBUILD_TIMEOUT_SEC = 300;      // 5 minutes max for rebuild
  private static readonly REBUILD_MAX_RETRIES = 5;

  /**
   * Check sandbox state: ACTIVE, SLEEPING, DEAD, or UNKNOWN
   */
  static async checkSandboxState(projectId: string): Promise<SandboxState> {
    try {
      // Get project with latest metadata
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project?.sandboxId) {
        return SandboxState.UNKNOWN;
      }

      // Try to connect
      try {
        const sandbox = await Sandbox.connect(project.sandboxId);

        // Fast, single probe to keep ping endpoint low-latency.
        let httpCode = 0;
        try {
          const ping = await sandbox.commands.run(
            'curl -s -m 1 -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo 0',
            { timeoutMs: 1500 }
          );
          httpCode = parseInt(ping.stdout?.trim() || '0', 10);
        } catch {
          httpCode = 0;
        }

        if (isServerListeningHttpCode(httpCode)) {
          return SandboxState.ACTIVE;
        } else {
          return SandboxState.SLEEPING;
        }
      } catch (err) {
        // Sandbox connection failed → sandbox is dead
        return SandboxState.DEAD;
      }
    } catch (err) {
      console.error('[SandboxLifecycleManager] Error checking state:', err);
      return SandboxState.UNKNOWN;
    }
  }

  /**
   * Detect framework from filesystem
   */
  static async detectFramework(
    sandbox: Sandbox,
    homeDir: string
  ): Promise<'nextjs' | 'vite' | 'react' | 'custom'> {
    try {
      const files = await sandbox.commands.run(
        `ls -la '${homeDir}/' | grep -E 'next.config|vite.config|package.json'`,
        { timeoutMs: 3000 }
      );

      const output = files.stdout || '';
      if (output.includes('next.config')) return 'nextjs';
      if (output.includes('vite.config')) return 'vite';
      if (output.includes('package.json')) return 'react';
      return 'custom';
    } catch {
      return 'custom';
    }
  }

  /**
   * Get dev server start command based on framework
   */
  static getStartCommand(
    framework: 'nextjs' | 'vite' | 'react' | 'custom',
    port: number = 3000,
    homeDir: string
  ): string {
    const commands = {
      // Always prefer local project script; avoid npx pulling global Next versions.
      nextjs: `cd '${homeDir}' && npm run dev -- --hostname 0.0.0.0 --port ${port}`,
      vite: `cd '${homeDir}' && npm run dev -- --host 0.0.0.0 --port ${port}`,
      react: `cd '${homeDir}' && PORT=${port} npm start`,
      custom: `cd '${homeDir}' && PORT=${port} npm run dev`,
    };
    return commands[framework];
  }

  /**
   * Wait for dev server to be ready with exponential backoff
   */
  static async waitForServerReady(
    sandbox: Sandbox,
    port: number,
    timeoutSec: number = 60,
    maxRetries: number = 30
  ): Promise<boolean> {
    let attempt = 0;
    const startTime = Date.now();

    while (attempt < maxRetries && Date.now() - startTime < timeoutSec * 1000) {
      attempt++;
      
      try {
        let httpCode = 0;
        try {
          const curlResult = await sandbox.commands.run(
            `curl -s -o /dev/null -w "%{http_code}" --connect-timeout 1 --max-time 1 http://127.0.0.1:${port} 2>/dev/null || echo 0`,
            { timeoutMs: 2000 }
          );
          httpCode = parseInt(curlResult.stdout?.trim() || '0', 10);
        } catch {
          httpCode = 0;
        }

        if (isServerListeningHttpCode(httpCode)) {
          console.log(
            `[SandboxLifecycleManager] Dev server ready on port ${port} after ${attempt * 2}s`
          );
          return true;
        }
      } catch (err) {
        // Not ready yet, continue
      }

      // Exponential backoff: 1s, 2s, 2s, 2s, ...
      const backoffMs = attempt === 1 ? 1000 : 2000;
      await new Promise((r) => setTimeout(r, backoffMs));
    }

    console.warn(
      `[SandboxLifecycleManager] Dev server NOT ready after ${timeoutSec}s`
    );
    return false;
  }

  /**
   * Get Sandbox preview URL
   */
  static async getPreviewUrl(sandbox: Sandbox, port: number = 3000): Promise<string | null> {
    try {
      const host = (sandbox as any).getHost?.(port) || `${port}-${sandbox.sandboxId}.e2b.app`;
      return `https://${host}`;
    } catch (err) {
      console.error('[SandboxLifecycleManager] Error getting preview URL:', err);
      return null;
    }
  }

  /**
   * Compute checksum of files for change detection
   */
  static getFilesChecksum(files: Record<string, string>): string {
    const crypto = require('crypto');
    const fileList = Object.entries(files)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([path, content]) => `${path}:${content.length}`)
      .join('|');
    
    return crypto.createHash('sha256').update(fileList).digest('hex');
  }
}

export default SandboxLifecycleManager;
