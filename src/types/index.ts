export interface CrystallizedContext {
  filePath: string;
  relativePath: string;
  purpose: string;
  keyAPIs: string[];
  dependencies: string[];
  patterns: string[];
  relatedContexts: string[];
  lastModified: Date;
  tokenCount?: number;
}

export interface FileQueueItem {
  path: string;
  relativePath: string;
  size: number;
  priority: number;
}

export interface CrystallizationProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export interface SearchResult {
  context: CrystallizedContext;
  relevanceScore: number;
  highlights: string[];
}

export interface ContextBundle {
  contexts: CrystallizedContext[];
  totalTokens: number;
  query: string;
}