import { FileScanner } from '../core/file-scanner.js';
import { ContextStorage } from '../core/context-storage.js';
import { QueueManager } from '../core/queue-manager.js';
import { ContextSearch } from '../core/context-search.js';
import { ContextValidator } from '../core/context-validator.js';
import { ChangeDetector } from '../core/change-detector.js';
import { ContextUpdater } from '../core/context-updater.js';

export interface CrystallizerContext {
  purpose: string;
  keyAPIs: string[];
  dependencies?: string[];
  patterns?: string[];
  relatedContexts?: string[];
  aiGuidance?: string;
  errorHandling?: string[];
  integrationPoints?: string[];
}

export interface FileMetadata {
  complexity: 'low' | 'medium' | 'high';
  category: 'config' | 'source' | 'test' | 'docs' | 'other';
  estimatedTokens: number;
}

export class CrystallizerCore {
  private fileScanner?: FileScanner;
  private contextStorage?: ContextStorage;
  private queueManager?: QueueManager;
  private contextSearch?: ContextSearch;
  private contextValidator?: ContextValidator;
  private changeDetector?: ChangeDetector;
  private contextUpdater?: ContextUpdater;

  async initializeCrystallization(repoPath: string, exclude: string[] = ['node_modules', '.git', 'dist', 'build']) {
    this.fileScanner = new FileScanner(repoPath, exclude);
    this.contextStorage = new ContextStorage(repoPath);
    this.queueManager = new QueueManager();
    this.contextSearch = new ContextSearch(repoPath);
    this.contextValidator = new ContextValidator(repoPath);
    this.changeDetector = new ChangeDetector(repoPath);
    this.contextUpdater = new ContextUpdater(repoPath, this.fileScanner, this.contextStorage, this.changeDetector, this.queueManager);

    const files = await this.fileScanner.scanRepository();
    await this.queueManager.initializeQueue(files, repoPath, exclude);
    
    // Initialize context storage with all file paths
    const allFilePaths = files.map(f => f.path);
    await this.contextStorage.initialize(allFilePaths);

    return { filesQueued: files.length };
  }

  async getNextFileForCrystallization() {
    if (!this.queueManager || !this.fileScanner) {
      throw new Error('Repository not initialized. Run init_crystallization first.');
    }

    const nextFile = await this.queueManager.getNextFile();
    if (!nextFile) {
      return null; // No more files to crystallize
    }

    const content = await this.fileScanner.readFile(nextFile.path);
    return {
      path: nextFile.path,
      relativePath: nextFile.relativePath,
      content,
      metadata: {
        size: nextFile.size,
        priority: nextFile.priority,
        fileType: nextFile.fileType,
        estimatedTokens: nextFile.estimatedTokens,
        complexity: nextFile.complexity,
        category: nextFile.category,
        lastModified: nextFile.lastModified,
      },
    };
  }

  async storeCrystallizedContext(filePath: string, context: CrystallizerContext, fileContent?: string, fileMetadata?: Partial<FileMetadata>) {
    if (!this.contextStorage || !this.queueManager) {
      throw new Error('Repository not initialized.');
    }

    // Convert partial metadata to complete metadata if provided
    const completeMetadata = fileMetadata ? {
      complexity: fileMetadata.complexity || 'medium' as const,
      category: fileMetadata.category || 'other' as const,
      estimatedTokens: fileMetadata.estimatedTokens || 1000
    } : undefined;

    await this.contextStorage.storeContext(filePath, context, fileContent, completeMetadata);
    await this.queueManager.markProcessed(filePath);

    const stats = await this.contextStorage.getContextStatistics();
    return {
      filePath,
      totalContexts: stats.totalContexts,
      totalTokens: stats.totalTokens
    };
  }

  async getCrystallizationProgress() {
    if (!this.queueManager || !this.contextStorage) {
      throw new Error('Repository not initialized.');
    }

    const progress = this.queueManager.getProgress();
    const stats = await this.contextStorage.getContextStatistics();
    const sessionInfo = this.queueManager.getSessionInfo();

    return {
      ...progress,
      contextStats: stats,
      session: sessionInfo,
      completionPercentage: progress.totalFiles > 0 ? Math.round((progress.processedFiles / progress.totalFiles) * 100) : 0,
      estimatedCompletionTime: progress.estimatedTimeRemaining ? new Date(Date.now() + progress.estimatedTimeRemaining).toISOString() : null,
    };
  }

  async searchCrystallizedContexts(query: string, maxTokens: number = 4000, category?: string) {
    if (!this.contextSearch) {
      throw new Error('Repository not initialized.');
    }

    const results = await this.contextSearch.searchContexts(query, maxTokens, category);
    return {
      query,
      results: results.length,
      totalTokens: results.reduce((sum, r) => sum + (r.context.tokenCount || 0), 0),
      matches: results.map(r => ({
        file: r.context.relativePath,
        relevance: r.relevanceScore,
        category: r.context.category,
        complexity: r.context.complexity,
        tokens: r.context.tokenCount,
        highlights: r.highlights,
        purpose: `${r.context.purpose.substring(0, 150)}...`,
        keyAPIs: r.context.keyAPIs.slice(0, 3),
      })),
    };
  }

  async getCrystallizedBundle(files: string[], maxTokens: number = 8000) {
    if (!this.contextSearch) {
      throw new Error('Repository not initialized.');
    }

    const bundle = await this.contextSearch.getContextBundle(files, maxTokens);
    return {
      requestedFiles: files.length,
      includedFiles: bundle.contexts.length,
      totalTokens: bundle.totalTokens,
      contexts: bundle.contexts.map(ctx => ({
        file: ctx.relativePath,
        purpose: ctx.purpose,
        keyAPIs: ctx.keyAPIs,
        dependencies: ctx.dependencies,
        patterns: ctx.patterns,
        crossReferences: ctx.crossReferences,
        complexity: ctx.complexity,
        category: ctx.category,
        tokenCount: ctx.tokenCount,
      })),
    };
  }

  async findRelatedCrystallizedContexts(filePath: string, maxResults: number = 5) {
    if (!this.contextSearch) {
      throw new Error('Repository not initialized.');
    }

    const results = await this.contextSearch.findRelatedContexts(filePath, maxResults);
    return {
      sourceFile: filePath,
      relatedContexts: results.length,
      matches: results.map(r => ({
        file: r.context.relativePath,
        relevance: r.relevanceScore,
        category: r.context.category,
        purpose: `${r.context.purpose.substring(0, 100)}...`,
        keyAPIs: r.context.keyAPIs.slice(0, 2),
        relationship: r.highlights.join(', '),
      })),
    };
  }

  async searchByComplexity(complexity: 'low' | 'medium' | 'high', maxResults: number = 10) {
    if (!this.contextSearch) {
      throw new Error('Repository not initialized.');
    }

    const results = await this.contextSearch.searchByComplexity(complexity, maxResults);
    return {
      complexity,
      totalFound: results.length,
      contexts: results.map(r => ({
        file: r.context.relativePath,
        category: r.context.category,
        purpose: `${r.context.purpose.substring(0, 100)}...`,
        keyAPIs: r.context.keyAPIs.slice(0, 3),
        tokenCount: r.context.tokenCount,
      })),
    };
  }

  async validateCrystallizationQuality(filePath?: string, generateReport: boolean = false) {
    if (!this.contextValidator) {
      throw new Error('Repository not initialized.');
    }

    if (generateReport) {
      const report = await this.contextValidator.generateProjectQualityReport();
      return {
        type: 'project_quality_report',
        ...report,
      };
    } else if (filePath) {
      // Validate specific context
      const context = await this.contextSearch?.loadContext?.(filePath);
      if (!context) {
        throw new Error(`Context not found for ${filePath}`);
      }

      const validation = await this.contextValidator.validateContext(context);
      return {
        type: 'context_validation',
        file: filePath,
        ...validation,
      };
    } else {
      throw new Error('Either specify a filePath or set generateReport to true');
    }
  }

  async updateCrystallizedContexts(options: {
    forceUpdate?: boolean;
    includeUnchanged?: boolean;
    cleanupDeleted?: boolean;
    checkOnly?: boolean;
    generateReport?: boolean;
  } = {}) {
    if (!this.contextUpdater) {
      throw new Error('Repository not initialized.');
    }

    const {
      forceUpdate = false,
      includeUnchanged = false,
      cleanupDeleted = true,
      checkOnly = false,
      generateReport = false
    } = options;

    if (generateReport) {
      const report = await this.contextUpdater.generateUpdateReport();
      return { type: 'update_report', report };
    }

    if (checkOnly) {
      const status = await this.contextUpdater.getUpdateStatus();
      return {
        type: 'update_status',
        ...status,
      };
    }

    // Perform the update
    const updateResult = await this.contextUpdater.updateContexts({
      forceUpdate,
      includeUnchanged,
      cleanupDeleted,
    });

    return {
      type: 'update_result',
      ...updateResult,
    };
  }
}