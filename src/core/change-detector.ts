import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FileQueueItem } from '../types/index.js';

export interface FileChange {
  path: string;
  relativePath: string;
  type: 'added' | 'modified' | 'deleted';
  oldHash?: string;
  newHash?: string;
  lastModified: Date;
  size: number;
}

export interface ChangeDetectionResult {
  changes: FileChange[];
  stats: {
    added: number;
    modified: number;
    deleted: number;
    totalChanges: number;
  };
  hashManifest: FileHashManifest;
}

export interface FileHashManifest {
  version: string;
  generatedAt: Date;
  files: Record<string, FileHashEntry>;
}

export interface FileHashEntry {
  hash: string;
  size: number;
  lastModified: string;
  hasContext: boolean;
}

export class ChangeDetector {
  private repoPath: string;
  private manifestPath: string;
  private contextBasePath: string;

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
    this.contextBasePath = path.join(this.repoPath, '.context-crystal');
    this.manifestPath = path.join(this.contextBasePath, 'file-hash-manifest.json');
  }

  async detectChanges(currentFiles: FileQueueItem[]): Promise<ChangeDetectionResult> {
    const previousManifest = await this.loadManifest();
    const newManifest: FileHashManifest = {
      version: '1.0',
      generatedAt: new Date(),
      files: {},
    };

    const changes: FileChange[] = [];
    const processedPaths = new Set<string>();

    // Check for added or modified files
    for (const file of currentFiles) {
      processedPaths.add(file.path);
      
      const hash = await this.calculateFileHash(file.path);
      const hasContext = await this.hasExistingContext(file.relativePath);
      
      newManifest.files[file.path] = {
        hash,
        size: file.size,
        lastModified: file.lastModified.toISOString(),
        hasContext,
      };

      const previousEntry = previousManifest?.files[file.path];
      
      if (!previousEntry) {
        // New file
        changes.push({
          path: file.path,
          relativePath: file.relativePath,
          type: 'added',
          newHash: hash,
          lastModified: file.lastModified,
          size: file.size,
        });
      } else if (previousEntry.hash !== hash) {
        // Modified file
        changes.push({
          path: file.path,
          relativePath: file.relativePath,
          type: 'modified',
          oldHash: previousEntry.hash,
          newHash: hash,
          lastModified: file.lastModified,
          size: file.size,
        });
      }
    }

    // Check for deleted files
    if (previousManifest) {
      for (const [filePath, entry] of Object.entries(previousManifest.files)) {
        if (!processedPaths.has(filePath) && entry.hasContext) {
          changes.push({
            path: filePath,
            relativePath: path.relative(this.repoPath, filePath),
            type: 'deleted',
            oldHash: entry.hash,
            lastModified: new Date(entry.lastModified),
            size: entry.size,
          });
        }
      }
    }

    // Calculate stats
    const stats = {
      added: changes.filter(c => c.type === 'added').length,
      modified: changes.filter(c => c.type === 'modified').length,
      deleted: changes.filter(c => c.type === 'deleted').length,
      totalChanges: changes.length,
    };

    // Save the new manifest
    await this.saveManifest(newManifest);

    return {
      changes,
      stats,
      hashManifest: newManifest,
    };
  }

  async getFilesNeedingContext(currentFiles: FileQueueItem[]): Promise<FileQueueItem[]> {
    const needsContext: FileQueueItem[] = [];
    
    for (const file of currentFiles) {
      const hasContext = await this.hasExistingContext(file.relativePath);
      if (!hasContext) {
        needsContext.push(file);
      }
    }
    
    return needsContext;
  }

  async getOutdatedContexts(changes: FileChange[]): Promise<string[]> {
    const outdatedContexts: string[] = [];
    
    for (const change of changes) {
      if (change.type === 'modified' || change.type === 'deleted') {
        const contextPath = path.join(
          this.contextBasePath,
          'context',
          change.relativePath + '.context.md'
        );
        
        try {
          await fs.access(contextPath);
          outdatedContexts.push(change.relativePath);
        } catch {
          // Context doesn't exist, nothing to update
        }
      }
    }
    
    return outdatedContexts;
  }

  async cleanupObsoleteContexts(deletedFiles: string[]): Promise<number> {
    let cleanedCount = 0;
    
    for (const relativePath of deletedFiles) {
      // Remove context file
      const contextPath = path.join(
        this.contextBasePath,
        'context',
        relativePath + '.context.md'
      );
      
      try {
        await fs.unlink(contextPath);
        cleanedCount++;
      } catch {
        // File might not exist
      }
      
      // Remove metadata file
      const metadataPath = path.join(
        this.contextBasePath,
        'ai-metadata',
        relativePath.replace(/\//g, '_') + '.json'
      );
      
      try {
        await fs.unlink(metadataPath);
      } catch {
        // File might not exist
      }
    }
    
    return cleanedCount;
  }

  async getChangesSummary(): Promise<{
    lastScan: Date | null;
    totalTrackedFiles: number;
    filesWithContext: number;
    contextCoverage: number;
  }> {
    const manifest = await this.loadManifest();
    
    if (!manifest) {
      return {
        lastScan: null,
        totalTrackedFiles: 0,
        filesWithContext: 0,
        contextCoverage: 0,
      };
    }
    
    const totalTrackedFiles = Object.keys(manifest.files).length;
    const filesWithContext = Object.values(manifest.files).filter(f => f.hasContext).length;
    const contextCoverage = totalTrackedFiles > 0 
      ? Math.round((filesWithContext / totalTrackedFiles) * 100) 
      : 0;
    
    return {
      lastScan: manifest.generatedAt,
      totalTrackedFiles,
      filesWithContext,
      contextCoverage,
    };
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(content);
      return hash.digest('hex');
    } catch (error) {
      // If file can't be read, return empty hash
      return '';
    }
  }

  private async hasExistingContext(relativePath: string): Promise<boolean> {
    const contextPath = path.join(
      this.contextBasePath,
      'context',
      relativePath + '.context.md'
    );
    
    try {
      await fs.access(contextPath);
      return true;
    } catch {
      return false;
    }
  }

  private async loadManifest(): Promise<FileHashManifest | null> {
    try {
      const content = await fs.readFile(this.manifestPath, 'utf-8');
      const manifest = JSON.parse(content);
      manifest.generatedAt = new Date(manifest.generatedAt);
      return manifest;
    } catch {
      return null;
    }
  }

  private async saveManifest(manifest: FileHashManifest): Promise<void> {
    await fs.mkdir(this.contextBasePath, { recursive: true });
    await fs.writeFile(this.manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  async resetManifest(): Promise<void> {
    try {
      await fs.unlink(this.manifestPath);
    } catch {
      // File might not exist
    }
  }
}