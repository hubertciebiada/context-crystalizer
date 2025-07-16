export interface CrystallizedContext {
  filePath: string;
  relativePath: string;
  purpose: string;
  keyTerms: string[];
  dependencies: string[];
  patterns: string[];
  relatedContexts: string[];
  lastModified: Date;
  tokenCount?: number;
  template: 'overview' | 'standard' | 'detailed';
  complexity: 'low' | 'medium' | 'high';
  category: 'config' | 'source' | 'test' | 'docs' | 'other';
  crossReferences: CrossReference[];
  aiGuidance?: string;
  errorHandling?: string[];
  integrationPoints?: string[];
}

export interface CrossReference {
  type: 'imports' | 'exports' | 'calls' | 'extends' | 'implements' | 'uses';
  target: string;
  description?: string;
}

export interface ContextTemplate {
  name: string;
  maxTokens: number;
  sections: TemplateSection[];
}

export interface TemplateSection {
  name: string;
  required: boolean;
  maxTokens?: number;
  format: 'text' | 'list' | 'code' | 'markdown';
}

export interface FileQueueItem {
  path: string;
  relativePath: string;
  size: number;
  priority: number;
  fileType: string;
  estimatedTokens: number;
  category: 'config' | 'source' | 'test' | 'docs' | 'other';
  lastModified: Date;
}

export interface CrystallizationProgress {
  totalFiles: number;
  processedFiles: number;
  currentFile?: string;
  startTime: Date;
  estimatedTimeRemaining?: number;
  sessionId: string;
  totalEstimatedTokens: number;
  processedTokens: number;
  avgTokensPerFile: number;
  filesByCategory: Record<string, number>;
  processedByCategory: Record<string, number>;
  completionPercentage: number;
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

export interface QueueState {
  sessionId: string;
  repoPath: string;
  totalFiles: number;
  processedFiles: string[];
  remainingQueue: FileQueueItem[];
  startTime: Date;
  lastActivity: Date;
  excludePatterns: string[];
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  suggestions: string[];
  metrics: QualityMetrics;
}

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  category: 'completeness' | 'accuracy' | 'usefulness' | 'format';
  message: string;
  field?: string;
}

export interface QualityMetrics {
  completeness: number;
  specificity: number;
  aiReadability: number;
  tokenEfficiency: number;
  crossReferenceQuality: number;
}