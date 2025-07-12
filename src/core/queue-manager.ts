import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
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

  constructor() {
    this.sessionId = crypto.randomUUID();
  }

  async initializeQueue(files: FileQueueItem[], repoPath: string, excludePatterns: string[] = []): Promise<void> {
    this.repoPath = repoPath;
    this.excludePatterns = excludePatterns;
    this.queueStatePath = path.join(repoPath, '.context-crystal', 'processing-queue.json');
    
    // Try to recover from existing session
    const recovered = await this.tryRecoverSession(repoPath, excludePatterns);
    
    if (!recovered) {
      this.queue = [...files];
      this.processed.clear();
      this.startTime = new Date();
      await this.saveQueueState();
    }
  }

  async getNextFile(): Promise<FileQueueItem | null> {
    while (this.queue.length > 0) {
      const file = this.queue.shift()!;
      
      if (!this.processed.has(file.path)) {
        this.currentFile = file.path;
        await this.saveQueueState();
        return file;
      }
    }
    
    this.currentFile = null;
    await this.saveQueueState();
    return null;
  }

  async markProcessed(filePath: string): Promise<void> {
    this.processed.add(filePath);
    
    if (this.currentFile === filePath) {
      this.currentFile = null;
    }
    
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
      const queueStatePath = path.join(repoPath, '.context-crystal', 'processing-queue.json');
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
      this.queue = state.remainingQueue.map(item => ({
        ...item,
        lastModified: new Date(item.lastModified),
      }));
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
      console.error('Failed to save queue state:', error);
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
}