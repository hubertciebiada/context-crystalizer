import { FileQueueItem, CrystallizationProgress } from '../types/index.js';

export class QueueManager {
  private queue: FileQueueItem[] = [];
  private processed: Set<string> = new Set();
  private startTime: Date | null = null;
  private currentFile: string | null = null;

  initializeQueue(files: FileQueueItem[]): void {
    this.queue = [...files];
    this.processed.clear();
    this.startTime = new Date();
  }

  async getNextFile(): Promise<FileQueueItem | null> {
    while (this.queue.length > 0) {
      const file = this.queue.shift()!;
      
      if (!this.processed.has(file.path)) {
        this.currentFile = file.path;
        return file;
      }
    }
    
    this.currentFile = null;
    return null;
  }

  markProcessed(filePath: string): void {
    this.processed.add(filePath);
    
    if (this.currentFile === filePath) {
      this.currentFile = null;
    }
  }

  getProgress(): CrystallizationProgress {
    const totalFiles = this.queue.length + this.processed.size;
    const processedFiles = this.processed.size;
    
    const progress: CrystallizationProgress = {
      totalFiles,
      processedFiles,
      currentFile: this.currentFile || undefined,
      startTime: this.startTime || new Date(),
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
}