import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import pLimit from 'p-limit';
import { FileQueueItem, CrystallizationProgress, QueueState } from '../types/index.js';

export class QueueManager {
  private queue: FileQueueItem[] = [];
  private processed: Set<string> = new Set();
  private startTime: Date | null = null;
  private currentFile: string | null = null;
  private sessionId: string;
  private repoPath: string | null = null;
  private queueStatePath: string | null = null;
  private excludePatterns: string[] = [];
  
  // Concurrent agent support
  private claimLimit = pLimit(1); // Mutex: only 1 agent can claim at a time
  private claimsPath: string | null = null;
  private timeoutSeconds: number = 900; // 15 minutes default

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  async initializeQueue(files: FileQueueItem[], repoPath: string, excludePatterns: string[] = []): Promise<void> {
    this.repoPath = repoPath;
    this.excludePatterns = excludePatterns;
    this.queueStatePath = path.join(repoPath, '.context-crystallizer', 'processing-queue.json');
    this.claimsPath = path.join(repoPath, '.context-crystallizer', 'file-claims.json');
    
    // Load timeout configuration
    await this.loadTimeoutConfig();
    
    // Try to recover from existing session
    const recovered = await this.tryRecoverSession(repoPath, excludePatterns);
    
    if (!recovered) {
      // Filter out files that already have fresh contexts
      const filesToProcess: FileQueueItem[] = [];
      for (const file of files) {
        if (!(await this.isContextFresh(file))) {
          filesToProcess.push(file);
        }
      }
      
      this.queue = filesToProcess;
      this.processed.clear();
      this.startTime = new Date();
      await this.saveQueueState();
    }
  }

  async getNextFile(): Promise<FileQueueItem | null> {
    // Critical section: only one agent can claim files at a time
    return this.claimLimit(async () => {
      await this.cleanupExpiredClaims();
      
      while (this.queue.length > 0) {
        const file = this.queue.shift()!;
        
        if (!this.processed.has(file.path) && !await this.isFileClaimed(file.path)) {
          await this.claimFile(file.path);
          this.currentFile = file.path;
          await this.saveQueueState();
          return file;
        }
      }
      
      this.currentFile = null;
      await this.saveQueueState();
      return null;
    });
  }

  async markProcessed(filePath: string): Promise<void> {
    this.processed.add(filePath);
    
    if (this.currentFile === filePath) {
      this.currentFile = null;
    }
    
    // Release the claim when processing is complete
    await this.releaseClaim(filePath);
    
    await this.saveQueueState();
  }

  getProgress(): CrystallizationProgress {
    const totalFiles = this.queue.length + this.processed.size;
    const processedFiles = this.processed.size;
    
    // Calculate token statistics
    const totalEstimatedTokens = this.queue.reduce((sum, file) => sum + file.estimatedTokens, 0);
    const processedTokens = 0; // Would need to track actual generated tokens
    const avgTokensPerFile = totalFiles > 0 ? totalEstimatedTokens / totalFiles : 0;
    
    // Calculate category breakdown
    const filesByCategory: Record<string, number> = {};
    const processedByCategory: Record<string, number> = {};
    
    // Count all files by category
    this.queue.forEach(file => {
      filesByCategory[file.category] = (filesByCategory[file.category] || 0) + 1;
    });
    
    // Note: We'd need to track processed files with their metadata to get processedByCategory
    // For now, initialize with zeros
    Object.keys(filesByCategory).forEach(category => {
      processedByCategory[category] = 0;
    });
    
    const completionPercentage = totalFiles > 0 ? Math.round((processedFiles / totalFiles) * 100) : 0;
    
    const progress: CrystallizationProgress = {
      totalFiles,
      processedFiles,
      currentFile: this.currentFile || undefined,
      startTime: this.startTime || new Date(),
      sessionId: this.sessionId,
      totalEstimatedTokens,
      processedTokens,
      avgTokensPerFile,
      filesByCategory,
      processedByCategory,
      completionPercentage,
    };
    
    if (processedFiles > 0 && this.startTime) {
      const elapsedMs = Date.now() - this.startTime.getTime();
      const avgTimePerFile = elapsedMs / processedFiles;
      const remainingFiles = totalFiles - processedFiles;
      progress.estimatedTimeRemaining = Math.round(avgTimePerFile * remainingFiles);
    }
    
    return progress;
  }

  getRemainingFiles(): number {
    return this.queue.length;
  }

  getProcessedCount(): number {
    return this.processed.size;
  }

  async tryRecoverSession(repoPath: string, excludePatterns: string[]): Promise<boolean> {
    try {
      const queueStatePath = path.join(repoPath, '.context-crystallizer', 'processing-queue.json');
      const stateContent = await fs.readFile(queueStatePath, 'utf-8');
      const state: QueueState = JSON.parse(stateContent);
      
      // Check if the session is recent (within 24 hours) and patterns match
      const lastActivity = new Date(state.lastActivity);
      const hoursSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceActivity > 24) {
        return false; // Session too old
      }
      
      // Check if exclude patterns match
      if (!this.arraysEqual(state.excludePatterns, excludePatterns)) {
        return false; // Configuration changed
      }
      
      // Restore session
      this.sessionId = state.sessionId;
      this.repoPath = state.repoPath;
      this.excludePatterns = state.excludePatterns;
      this.processed = new Set(state.processedFiles);
      
      // Filter the restored queue to remove files with fresh contexts
      const restoredQueue = state.remainingQueue.map(item => ({
        ...item,
        lastModified: new Date(item.lastModified),
      }));
      
      const filteredQueue: FileQueueItem[] = [];
      for (const file of restoredQueue) {
        if (!(await this.isContextFresh(file))) {
          filteredQueue.push(file);
        }
      }
      
      this.queue = filteredQueue;
      this.startTime = new Date(state.startTime);
      this.queueStatePath = queueStatePath;
      
      console.error(`Recovered session ${this.sessionId} with ${this.processed.size} processed files and ${this.queue.length} remaining.`);
      
      return true;
    } catch (_error) {
      return false; // No valid session to recover
    }
  }

  private async saveQueueState(): Promise<void> {
    if (!this.queueStatePath || !this.repoPath) return;
    
    const state: QueueState = {
      sessionId: this.sessionId,
      repoPath: this.repoPath,
      totalFiles: this.queue.length + this.processed.size,
      processedFiles: Array.from(this.processed),
      remainingQueue: this.queue,
      startTime: this.startTime!,
      lastActivity: new Date(),
      excludePatterns: this.excludePatterns,
    };
    
    try {
      await fs.mkdir(path.dirname(this.queueStatePath), { recursive: true });
      await fs.writeFile(this.queueStatePath, JSON.stringify(state, null, 2), 'utf-8');
    } catch (_error) {
      console.error('Failed to save queue state:', _error);
    }
  }

  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((val, index) => val === sortedB[index]);
  }

  async clearSession(): Promise<void> {
    if (!this.queueStatePath) return;
    
    try {
      await fs.unlink(this.queueStatePath);
    } catch (_error) {
      // File might not exist
    }
  }

  getSessionInfo(): { sessionId: string; startTime: Date | null; repoPath: string | null } {
    return {
      sessionId: this.sessionId,
      startTime: this.startTime,
      repoPath: this.repoPath,
    };
  }

  private async isContextFresh(file: FileQueueItem): Promise<boolean> {
    if (!this.repoPath) return false;
    
    // Build path to the crystallized context file
    const relativePath = path.isAbsolute(file.path) ? path.relative(this.repoPath, file.path) : file.path;
    const contextPath = path.join(this.repoPath, '.context-crystallizer', 'context', `${relativePath}.context.md`);
    
    try {
      const contextStats = await fs.stat(contextPath);
      // Context is fresh if it was created/modified after the source file
      return contextStats.mtime >= file.lastModified;
    } catch (_error) {
      // Context file doesn't exist, so not fresh
      return false;
    }
  }

  // Claim management methods for concurrent agent support

  private async loadTimeoutConfig(): Promise<void> {
    if (!this.repoPath) return;
    
    const timeoutConfigPath = path.join(this.repoPath, '.context-crystallizer', 'crystallization_timeout.txt');
    
    try {
      const content = await fs.readFile(timeoutConfigPath, 'utf-8');
      const timeout = parseInt(content.trim());
      if (!isNaN(timeout) && timeout > 0) {
        this.timeoutSeconds = timeout;
      }
    } catch (_error) {
      // Use default timeout if file doesn't exist or is invalid
      this.timeoutSeconds = 900; // 15 minutes
    }
  }

  private async loadClaims(): Promise<Record<string, number>> {
    if (!this.claimsPath) return {};
    
    try {
      const content = await fs.readFile(this.claimsPath, 'utf-8');
      return JSON.parse(content);
    } catch (_error) {
      // Return empty claims if file doesn't exist or is invalid
      return {};
    }
  }

  private async saveClaims(claims: Record<string, number>): Promise<void> {
    if (!this.claimsPath) return;
    
    try {
      await fs.writeFile(this.claimsPath, JSON.stringify(claims, null, 2), 'utf-8');
    } catch (_error) {
      console.error('Failed to save claims:', _error);
    }
  }

  private async claimFile(filePath: string): Promise<void> {
    const claims = await this.loadClaims();
    claims[filePath] = Date.now();
    await this.saveClaims(claims);
  }

  private async releaseClaim(filePath: string): Promise<void> {
    const claims = await this.loadClaims();
    const hadClaim = filePath in claims;
    delete claims[filePath];
    await this.saveClaims(claims);
    
    if (hadClaim) {
      console.error(`✓ Released claim for: ${filePath}`);
    } else {
      console.error(`⚠ No claim to release for: ${filePath}`);
    }
  }

  private async isFileClaimed(filePath: string): Promise<boolean> {
    const claims = await this.loadClaims();
    const claimTime = claims[filePath];
    
    if (!claimTime) return false;
    
    const now = Date.now();
    const timeoutMs = this.timeoutSeconds * 1000;
    
    // Check if claim has expired
    if (now - claimTime > timeoutMs) {
      // Claim expired, remove it
      delete claims[filePath];
      await this.saveClaims(claims);
      return false;
    }
    
    return true;
  }

  private async cleanupExpiredClaims(): Promise<void> {
    const claims = await this.loadClaims();
    const now = Date.now();
    const timeoutMs = this.timeoutSeconds * 1000;
    
    const activeClaims: Record<string, number> = {};
    let hasExpiredClaims = false;
    
    for (const [filePath, claimTime] of Object.entries(claims)) {
      if (now - claimTime < timeoutMs) {
        activeClaims[filePath] = claimTime;
      } else {
        hasExpiredClaims = true;
      }
    }
    
    // Only save if we found expired claims to clean up
    if (hasExpiredClaims) {
      await this.saveClaims(activeClaims);
    }
  }
}