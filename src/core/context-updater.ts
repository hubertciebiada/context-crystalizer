import { promises as fs } from 'fs';
import path from 'path';
import { FileScanner } from './file-scanner.js';
import { ContextStorage } from './context-storage.js';
import { ChangeDetector, FileChange } from './change-detector.js';
import { QueueManager } from './queue-manager.js';
import { FileQueueItem } from '../types/index.js';

export interface UpdateResult {
  summary: {
    filesScanned: number;
    changesDetected: number;
    contextsUpdated: number;
    contextsAdded: number;
    contextsRemoved: number;
    errors: number;
  };
  changes: FileChange[];
  updatedContexts: string[];
  errors: Array<{ file: string; error: string }>;
}

export interface UpdateOptions {
  forceUpdate?: boolean;
  includeUnchanged?: boolean;
  cleanupDeleted?: boolean;
}

export class ContextUpdater {
  private repoPath: string;
  private fileScanner: FileScanner;
  private contextStorage: ContextStorage;
  private changeDetector: ChangeDetector;
  private queueManager: QueueManager;

  constructor(
    repoPath: string,
    fileScanner: FileScanner,
    contextStorage: ContextStorage,
    changeDetector: ChangeDetector,
    queueManager: QueueManager
  ) {
    this.repoPath = repoPath;
    this.fileScanner = fileScanner;
    this.contextStorage = contextStorage;
    this.changeDetector = changeDetector;
    this.queueManager = queueManager;
  }

  async updateContexts(options: UpdateOptions = {}): Promise<UpdateResult> {
    const result: UpdateResult = {
      summary: {
        filesScanned: 0,
        changesDetected: 0,
        contextsUpdated: 0,
        contextsAdded: 0,
        contextsRemoved: 0,
        errors: 0,
      },
      changes: [],
      updatedContexts: [],
      errors: [],
    };

    try {
      // Scan repository for current files
      const currentFiles = await this.fileScanner.scanRepository();
      result.summary.filesScanned = currentFiles.length;

      // Detect changes
      const changeResult = await this.changeDetector.detectChanges(currentFiles);
      result.changes = changeResult.changes;
      result.summary.changesDetected = changeResult.stats.totalChanges;

      // Get files needing context (new files without context)
      const filesNeedingContext = await this.changeDetector.getFilesNeedingContext(currentFiles);
      
      // Get outdated contexts (modified files)
      const outdatedContexts = await this.changeDetector.getOutdatedContexts(changeResult.changes);

      // Prepare update queue
      const updateQueue: FileQueueItem[] = [];

      // Add new files
      for (const change of changeResult.changes) {
        if (change.type === 'added') {
          const fileItem = currentFiles.find(f => f.path === change.path);
          if (fileItem) {
            updateQueue.push(fileItem);
          }
        }
      }

      // Add modified files
      if (!options.forceUpdate) {
        for (const change of changeResult.changes) {
          if (change.type === 'modified') {
            const fileItem = currentFiles.find(f => f.path === change.path);
            if (fileItem) {
              updateQueue.push(fileItem);
            }
          }
        }
      } else {
        // Force update all files
        updateQueue.push(...currentFiles);
      }

      // Add files without context if requested
      if (options.includeUnchanged) {
        for (const file of filesNeedingContext) {
          if (!updateQueue.some(f => f.path === file.path)) {
            updateQueue.push(file);
          }
        }
      }

      // Initialize queue for processing
      await this.queueManager.initializeQueue(updateQueue, this.repoPath, []);

      // Process queue (this would normally be done by AI agents)
      // For now, we'll just mark them as ready for processing
      result.summary.contextsAdded = updateQueue.filter(f => 
        changeResult.changes.some(c => c.path === f.path && c.type === 'added')
      ).length;
      
      result.summary.contextsUpdated = updateQueue.filter(f => 
        changeResult.changes.some(c => c.path === f.path && c.type === 'modified')
      ).length;

      result.updatedContexts = updateQueue.map(f => f.relativePath);

      // Cleanup deleted files if requested
      if (options.cleanupDeleted) {
        const deletedFiles = changeResult.changes
          .filter(c => c.type === 'deleted')
          .map(c => c.relativePath);
        
        const cleanedCount = await this.changeDetector.cleanupObsoleteContexts(deletedFiles);
        result.summary.contextsRemoved = cleanedCount;
      }

      // Regenerate index after updates
      // Note: Index will be regenerated when contexts are actually stored

    } catch (error) {
      result.errors.push({
        file: 'general',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      result.summary.errors++;
    }

    return result;
  }

  async getUpdateStatus(): Promise<{
    needsUpdate: boolean;
    summary: {
      lastScan: Date | null;
      totalFiles: number;
      filesWithContext: number;
      contextCoverage: number;
      estimatedOutdated: number;
    };
  }> {
    const changeSummary = await this.changeDetector.getChangesSummary();
    const currentFiles = await this.fileScanner.scanRepository();
    
    // Quick check for obvious changes
    const needsUpdate = changeSummary.totalTrackedFiles !== currentFiles.length ||
                       changeSummary.contextCoverage < 90;

    // Estimate outdated contexts (this is a rough estimate)
    const estimatedOutdated = Math.max(0, currentFiles.length - changeSummary.filesWithContext);

    return {
      needsUpdate,
      summary: {
        lastScan: changeSummary.lastScan,
        totalFiles: currentFiles.length,
        filesWithContext: changeSummary.filesWithContext,
        contextCoverage: changeSummary.contextCoverage,
        estimatedOutdated,
      },
    };
  }

  async validateContextFreshness(relativePath: string): Promise<{
    isFresh: boolean;
    reason?: string;
    lastModified?: Date;
    contextAge?: number;
  }> {
    try {
      const fullPath = path.join(this.repoPath, relativePath);
      const stats = await fs.stat(fullPath);
      const context = await this.contextStorage.getContext(relativePath);
      
      if (!context) {
        return {
          isFresh: false,
          reason: 'No context exists for this file',
        };
      }

      const contextAge = Date.now() - context.lastModified.getTime();
      const fileAge = Date.now() - stats.mtime.getTime();

      if (fileAge < contextAge) {
        return {
          isFresh: false,
          reason: 'File has been modified since context was generated',
          lastModified: stats.mtime,
          contextAge,
        };
      }

      return {
        isFresh: true,
        lastModified: stats.mtime,
        contextAge,
      };
    } catch (error) {
      return {
        isFresh: false,
        reason: 'Error checking file status',
      };
    }
  }

  async generateUpdateReport(): Promise<string> {
    const updateStatus = await this.getUpdateStatus();
    const changeSummary = await this.changeDetector.getChangesSummary();
    
    const report = [
      '# Context Update Report',
      '',
      '## Current Status',
      `- Last scan: ${changeSummary.lastScan?.toISOString() || 'Never'}`,
      `- Total files: ${updateStatus.summary.totalFiles}`,
      `- Files with context: ${updateStatus.summary.filesWithContext}`,
      `- Context coverage: ${updateStatus.summary.contextCoverage}%`,
      `- Estimated outdated: ${updateStatus.summary.estimatedOutdated}`,
      '',
      '## Recommendation',
      updateStatus.needsUpdate 
        ? '⚠️ **Update recommended** - Context coverage is below 90% or file count has changed'
        : '✅ **Context is up to date** - No significant changes detected',
      '',
      '## Update Options',
      '- `update_context()` - Update only changed files',
      '- `update_context(forceUpdate: true)` - Regenerate all contexts',
      '- `update_context(includeUnchanged: true)` - Include files without context',
      '- `update_context(cleanupDeleted: true)` - Remove contexts for deleted files',
    ];

    return report.join('\n');
  }
}