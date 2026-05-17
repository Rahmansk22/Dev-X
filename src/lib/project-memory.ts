/**
 * PROJECT MEMORY LAYER - Persistent Storage
 * 
 * Stores project history, snapshots, and metadata for all user projects.
 * Enables features like:
 * - Project recovery
 * - Version history
 * - Undo/rollback
 * - Project statistics
 * - Collaboration tracking
 */

export interface ProjectSnapshot {
  id: string;
  projectId: string;
  version: number;
  timestamp: Date;
  description?: string;
  files: Record<string, string>; // filename -> content
  buildSuccess: boolean;
  buildLog?: string;
  metadata: {
    authorship?: string;
    changes?: string[];
    errorCount?: number;
  };
}

export interface ProjectMemory {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  currentVersion: number;
  snapshots: ProjectSnapshot[]; // ordered by version (newest last)
  status: 'active' | 'archived' | 'deleted';
  stats: {
    totalVersions: number;
    successfulBuilds: number;
    failedBuilds: number;
    totalEdits: number;
    averageBuildTime?: number;
  };
  deployments: Deployment[];
}

export interface Deployment {
  id: string;
  projectId: string;
  version: number;
  deploymentUrl: string;
  provider: 'vercel' | 'railway' | 'fly' | 'netlify';
  status: 'pending' | 'success' | 'failed';
  deployedAt: Date;
  metadata?: Record<string, any>;
}

export interface ProjectDiff {
  version: number;
  previousVersion: number;
  timestamp: Date;
  filesAdded: string[];
  filesModified: string[];
  filesDeleted: string[];
  changes: {
    file: string;
    oldContent: string;
    newContent: string;
    lineChanges: number;
  }[];
}

/**
 * In-memory project store (for MVP)
 * In production, use Supabase, Convex, or custom database
 */
export class ProjectMemoryStore {
  private projects: Map<string, ProjectMemory> = new Map();
  private snapshots: Map<string, ProjectSnapshot> = new Map();

  /**
   * Create new project
   */
  createProject(
    userId: string,
    name: string,
    description?: string,
  ): ProjectMemory {
    const projectId = this.generateId('proj');

    const project: ProjectMemory = {
      id: projectId,
      userId,
      name,
      description,
      createdAt: new Date(),
      updatedAt: new Date(),
      currentVersion: 1,
      snapshots: [],
      status: 'active',
      stats: {
        totalVersions: 1,
        successfulBuilds: 0,
        failedBuilds: 0,
        totalEdits: 0,
      },
      deployments: [],
    };

    this.projects.set(projectId, project);
    return project;
  }

  /**
   * Save project snapshot (on successful build)
   */
  saveSnapshot(
    projectId: string,
    files: Record<string, string>,
    buildSuccess: boolean,
    buildLog?: string,
    description?: string,
  ): ProjectSnapshot {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const snapshotId = this.generateId('snap');
    const version = project.currentVersion + 1;

    const snapshot: ProjectSnapshot = {
      id: snapshotId,
      projectId,
      version,
      timestamp: new Date(),
      description,
      files,
      buildSuccess,
      buildLog,
      metadata: {
        errorCount: buildLog ? (buildLog.match(/error/gi) || []).length : 0,
      },
    };

    this.snapshots.set(snapshotId, snapshot);
    project.snapshots.push(snapshot);
    project.currentVersion = version;
    project.updatedAt = new Date();

    // Update stats
    project.stats.totalVersions++;
    if (buildSuccess) {
      project.stats.successfulBuilds++;
    } else {
      project.stats.failedBuilds++;
    }

    return snapshot;
  }

  /**
   * Get specific version
   */
  getSnapshot(projectId: string, version: number): ProjectSnapshot | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    return project.snapshots.find((s) => s.version === version) || null;
  }

  /**
   * Get latest successful snapshot
   */
  getLatestSuccessful(projectId: string): ProjectSnapshot | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    const successful = [...project.snapshots].reverse().find((s) => s.buildSuccess);
    return successful || null;
  }

  /**
   * Rollback to specific version
   */
  rollback(projectId: string, targetVersion: number): ProjectSnapshot | null {
    const snapshot = this.getSnapshot(projectId, targetVersion);
    if (!snapshot) return null;

    const project = this.projects.get(projectId);
    if (!project) return null;

    // Create a new snapshot with rolled-back content
    return this.saveSnapshot(
      projectId,
      snapshot.files,
      snapshot.buildSuccess,
      snapshot.buildLog,
      `Rolled back to version ${targetVersion}`,
    );
  }

  /**
   * Get diff between two versions
   */
  getDiff(projectId: string, version1: number, version2: number): ProjectDiff | null {
    const snap1 = this.getSnapshot(projectId, version1);
    const snap2 = this.getSnapshot(projectId, version2);

    if (!snap1 || !snap2) return null;

    const files1 = new Set(Object.keys(snap1.files));
    const files2 = new Set(Object.keys(snap2.files));

    const filesAdded = Array.from(files2).filter((f) => !files1.has(f));
    const filesDeleted = Array.from(files1).filter((f) => !files2.has(f));
    const filesModified = Array.from(files1)
      .filter((f) => files2.has(f) && snap1.files[f] !== snap2.files[f]);

    const changes = filesModified.map((file) => {
      const oldContent = snap1.files[file] || '';
      const newContent = snap2.files[file] || '';
      const lineChanges = this.countLineChanges(oldContent, newContent);

      return {
        file,
        oldContent,
        newContent,
        lineChanges,
      };
    });

    return {
      version: version2,
      previousVersion: version1,
      timestamp: snap2.timestamp,
      filesAdded,
      filesModified,
      filesDeleted,
      changes,
    };
  }

  /**
   * Get all projects for user
   */
  getUserProjects(userId: string): ProjectMemory[] {
    return Array.from(this.projects.values()).filter((p) => p.userId === userId && p.status === 'active');
  }

  /**
   * Record deployment
   */
  recordDeployment(
    projectId: string,
    version: number,
    provider: 'vercel' | 'railway' | 'fly' | 'netlify',
    deploymentUrl: string,
    status: 'pending' | 'success' | 'failed' = 'pending',
  ): Deployment {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);

    const deployment: Deployment = {
      id: this.generateId('deploy'),
      projectId,
      version,
      provider,
      deploymentUrl,
      status,
      deployedAt: new Date(),
    };

    project.deployments.push(deployment);
    return deployment;
  }

  /**
   * Get project history
   */
  getHistory(projectId: string, limit: number = 10): ProjectSnapshot[] {
    const project = this.projects.get(projectId);
    if (!project) return [];

    return project.snapshots.slice(-limit).reverse();
  }

  /**
   * Archive project
   */
  archiveProject(projectId: string): void {
    const project = this.projects.get(projectId);
    if (project) {
      project.status = 'archived';
      project.updatedAt = new Date();
    }
  }

  /**
   * Get project statistics
   */
  getStats(projectId: string): ProjectMemory['stats'] | null {
    const project = this.projects.get(projectId);
    return project?.stats || null;
  }

  /**
   * Export project (for backup)
   */
  exportProject(projectId: string): object | null {
    const project = this.projects.get(projectId);
    if (!project) return null;

    return {
      project,
      snapshots: project.snapshots,
      exportedAt: new Date(),
    };
  }

  /**
   * Import project from backup
   */
  importProject(data: any): ProjectMemory {
    const project = data.project as ProjectMemory;
    const snapshots = data.snapshots as ProjectSnapshot[];

    this.projects.set(project.id, project);
    snapshots.forEach((snap) => this.snapshots.set(snap.id, snap));

    return project;
  }

  // Helper methods
  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private countLineChanges(oldContent: string, newContent: string): number {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    let changes = 0;

    const maxLen = Math.max(oldLines.length, newLines.length);
    for (let i = 0; i < maxLen; i++) {
      if ((oldLines[i] || '') !== (newLines[i] || '')) {
        changes++;
      }
    }

    return changes;
  }
}

// Global store instance (for MVP)
export const projectMemoryStore = new ProjectMemoryStore();
