import { FileScanner } from '../core/file-scanner.js';
import { ContextStorage } from '../core/context-storage.js';
import { QueueManager } from '../core/queue-manager.js';
import { ContextSearch } from '../core/context-search.js';
import { ContextValidator } from '../core/context-validator.js';
import { ChangeDetector } from '../core/change-detector.js';
import { ContextUpdater } from '../core/context-updater.js';
import path from 'path';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface CrystallizerContext {
  purpose: string;
  keyTerms: string[];
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
    // Check if crystallization already exists
    const alreadyInitialized = await this.isAlreadyInitialized(repoPath);
    
    if (alreadyInitialized) {
      console.error('📋 Existing crystallization detected - preserving analysis and index');
      
      // Ensure infrastructure files exist, but don't overwrite analysis
      await this.ensureInfrastructure(repoPath);
      
      // Initialize components to work with existing data
      await this.initializeComponents(repoPath, exclude);
      
      // Get current queue status
      const queueStatus = this.queueManager?.getProgress();
      const filesQueued = queueStatus?.totalFiles || 0;
      
      console.error(`✓ Reinitialized with ${filesQueued} files (${queueStatus?.processedFiles || 0} already processed)`);
      return { filesQueued, reinitialized: true };
    } else {
      console.error('🆕 Fresh crystallization initialization');
      return await this.performFreshInitialization(repoPath, exclude);
    }
  }

  private async isAlreadyInitialized(repoPath: string): Promise<boolean> {
    const criticalPaths = [
      path.join(repoPath, '.context-crystallizer', 'ai-index.md'),
      path.join(repoPath, '.context-crystallizer', 'context'),
      path.join(repoPath, '.context-crystallizer', 'ai-metadata'),
    ];
    
    // Check if any critical crystallization files exist
    for (const criticalPath of criticalPaths) {
      try {
        await fs.access(criticalPath);
        return true; // Found existing crystallization
      } catch {
        // Continue checking other paths
      }
    }
    
    return false;
  }

  private async ensureInitialized(repoPath?: string): Promise<void> {
    // If already initialized, nothing to do
    if (this.contextSearch && this.contextStorage && this.queueManager) {
      return;
    }

    // Use provided path or current working directory
    const targetPath = repoPath || process.cwd();
    
    // Check if repository has existing crystallization
    const hasExistingCrystallization = await this.isAlreadyInitialized(targetPath);
    
    if (!hasExistingCrystallization) {
      throw new Error(`No crystallization found in ${targetPath}. Please run init_crystallization first to set up the repository.`);
    }

    // Auto-initialize components for existing crystallization
    console.error(`🔄 Auto-initializing components for existing crystallization in ${targetPath}`);
    await this.initializeComponents(targetPath, ['node_modules', '.git', 'dist', 'build']);
  }

  private async ensureInfrastructure(repoPath: string): Promise<void> {
    // Create directory structure if missing
    const baseDir = path.join(repoPath, '.context-crystallizer');
    await fs.mkdir(baseDir, { recursive: true });
    await fs.mkdir(path.join(baseDir, 'context'), { recursive: true });
    await fs.mkdir(path.join(baseDir, 'ai-metadata'), { recursive: true });
    
    // Create template files (already protected against overwrite)
    await this.createTemplateFiles(repoPath);
    
    // Create timeout configuration (already protected against overwrite)
    await this.createTimeoutConfigFile(repoPath);
  }

  private async initializeComponents(repoPath: string, exclude: string[]): Promise<void> {
    this.fileScanner = new FileScanner(repoPath, exclude);
    this.contextStorage = new ContextStorage(repoPath);
    this.queueManager = new QueueManager();
    this.contextSearch = new ContextSearch(repoPath);
    this.contextValidator = new ContextValidator(repoPath);
    this.changeDetector = new ChangeDetector(repoPath);
    this.contextUpdater = new ContextUpdater(repoPath, this.fileScanner, this.contextStorage, this.changeDetector, this.queueManager);

    // Initialize queue with session recovery (preserves existing state)
    const files = await this.fileScanner.scanRepository();
    await this.queueManager.initializeQueue(files, repoPath, exclude);
    
    // Initialize context storage with all file paths (safe for existing data)
    const allFilePaths = files.map(f => f.path);
    await this.contextStorage.initialize(allFilePaths);
  }

  private async performFreshInitialization(repoPath: string, exclude: string[]): Promise<{ filesQueued: number; reinitialized?: boolean }> {
    // Ensure infrastructure files exist for fresh setup
    await this.ensureInfrastructure(repoPath);
    
    // Initialize components for fresh setup
    await this.initializeComponents(repoPath, exclude);

    // Get queue status after fresh initialization
    const queueStatus = this.queueManager?.getProgress();
    const filesQueued = queueStatus?.totalFiles || 0;
    
    console.error(`✓ Fresh initialization complete with ${filesQueued} files to process`);
    return { filesQueued };
  }

  private async createTemplateFiles(repoPath: string): Promise<void> {
    const templatesDir = path.join(repoPath, '.context-crystallizer', 'templates');
    await fs.mkdir(templatesDir, { recursive: true });
    
    // Create guidance and output directories
    const guidanceDir = path.join(templatesDir, 'guidance');
    const outputDir = path.join(templatesDir, 'output');
    await fs.mkdir(guidanceDir, { recursive: true });
    await fs.mkdir(outputDir, { recursive: true });

    // Copy template files from the package templates directory
    const packageTemplatesDir = path.resolve(__dirname, '../../templates');

    // Copy system guidance file first
    const systemGuidanceSource = path.join(packageTemplatesDir, 'guidance', 'system-guidance.md');
    const systemGuidanceDest = path.join(guidanceDir, 'system-guidance.md');
    await this.copyTemplateFile(systemGuidanceSource, systemGuidanceDest, 'system-guidance.md');

    // Define template files to copy (split into guidance and output files)
    const templateFiles = [
      { guidance: 'overview-guidance.md', output: 'overview-output.mustache' },
      { guidance: 'standard-guidance.md', output: 'standard-output.mustache' },
      { guidance: 'detailed-guidance.md', output: 'detailed-output.mustache' }
    ];
    
    for (const { guidance, output } of templateFiles) {
      // Copy guidance file
      const guidanceSourcePath = path.join(packageTemplatesDir, 'guidance', guidance);
      const guidanceDestPath = path.join(guidanceDir, guidance);
      await this.copyTemplateFile(guidanceSourcePath, guidanceDestPath, guidance);
      
      // Copy output template file
      const outputSourcePath = path.join(packageTemplatesDir, 'output', output);
      const outputDestPath = path.join(outputDir, output);
      await this.copyTemplateFile(outputSourcePath, outputDestPath, output);
    }
  }

  private async copyTemplateFile(sourcePath: string, destPath: string, fileName: string): Promise<void> {
    // Only create if it doesn't exist (don't overwrite user customizations)
    try {
      await fs.access(destPath);
      // File exists, skip
    } catch {
      // File doesn't exist, copy it
      try {
        const templateContent = await fs.readFile(sourcePath, 'utf-8');
        await fs.writeFile(destPath, templateContent);
      } catch (error) {
        throw new Error(`Failed to copy required template file '${fileName}' from ${sourcePath} to ${destPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }


  private async createTimeoutConfigFile(repoPath: string): Promise<void> {
    const timeoutConfigPath = path.join(repoPath, '.context-crystallizer', 'crystallization_timeout.txt');
    
    // Only create if it doesn't exist (don't overwrite user customizations)
    try {
      await fs.access(timeoutConfigPath);
      // File exists, skip
    } catch {
      // File doesn't exist, create it with default 15 minutes (900 seconds)
      await fs.writeFile(timeoutConfigPath, '900');
    }
  }

  async getNextFileForCrystallization() {
    await this.ensureInitialized();

    const nextFile = await this.queueManager!.getNextFile();
    if (!nextFile) {
      return null; // No more files to crystallize
    }

    const content = await this.fileScanner!.readFile(nextFile.path);
    return {
      path: nextFile.path,
      relativePath: nextFile.relativePath,
      content,
      metadata: {
        size: nextFile.size,
        priority: nextFile.priority,
        fileType: nextFile.fileType,
        estimatedTokens: nextFile.estimatedTokens,
        category: nextFile.category,
        lastModified: nextFile.lastModified,
      },
    };
  }

  async storeCrystallizedContext(filePath: string, context: CrystallizerContext, fileContent?: string, fileMetadata?: Partial<FileMetadata>) {
    await this.ensureInitialized();

    // Convert partial metadata to complete metadata if provided
    const completeMetadata = fileMetadata ? {
      category: fileMetadata.category || 'other' as const,
      estimatedTokens: fileMetadata.estimatedTokens || 1000
    } : undefined;

    try {
      await this.contextStorage!.storeContext(filePath, context, fileContent, completeMetadata);
    } finally {
      // Always release file claim, even if storage fails
      await this.queueManager!.markProcessed(filePath);
    }

    const stats = await this.contextStorage!.getContextStatistics();
    return {
      filePath,
      totalContexts: stats.totalContexts,
      totalTokens: stats.totalTokens
    };
  }

  async getCrystallizationProgress() {
    await this.ensureInitialized();

    const progress = this.queueManager!.getProgress();
    const stats = await this.contextStorage!.getContextStatistics();
    const sessionInfo = this.queueManager!.getSessionInfo();

    return {
      ...progress,
      contextStats: stats,
      session: sessionInfo,
      completionPercentage: progress.totalFiles > 0 ? Math.round((progress.processedFiles / progress.totalFiles) * 100) : 0,
      estimatedCompletionTime: progress.estimatedTimeRemaining ? new Date(Date.now() + progress.estimatedTimeRemaining).toISOString() : null,
    };
  }

  async searchCrystallizedContexts(query: string, maxTokens: number = 4000, category?: string) {
    await this.ensureInitialized();

    const results = await this.contextSearch!.searchContexts(query, maxTokens, category);
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
        keyTerms: r.context.keyTerms,
      })),
    };
  }

  async getCrystallizedBundle(files: string[], maxTokens: number = 8000) {
    await this.ensureInitialized();

    const bundle = await this.contextSearch!.getContextBundle(files, maxTokens);
    return {
      requestedFiles: files.length,
      includedFiles: bundle.contexts.length,
      totalTokens: bundle.totalTokens,
      contexts: bundle.contexts.map(ctx => ({
        file: ctx.relativePath,
        purpose: ctx.purpose,
        keyTerms: ctx.keyTerms,
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
    await this.ensureInitialized();

    const results = await this.contextSearch!.findRelatedContexts(filePath, maxResults);
    return {
      sourceFile: filePath,
      relatedContexts: results.length,
      matches: results.map(r => ({
        file: r.context.relativePath,
        relevance: r.relevanceScore,
        category: r.context.category,
        purpose: `${r.context.purpose.substring(0, 100)}...`,
        keyTerms: r.context.keyTerms,
        relationship: r.highlights.join(', '),
      })),
    };
  }

  async searchByComplexity(complexity: 'low' | 'medium' | 'high', maxResults: number = 10) {
    await this.ensureInitialized();

    const results = await this.contextSearch!.searchByComplexity(complexity, maxResults);
    return {
      complexity,
      totalFound: results.length,
      contexts: results.map(r => ({
        file: r.context.relativePath,
        category: r.context.category,
        purpose: `${r.context.purpose.substring(0, 100)}...`,
        keyTerms: r.context.keyTerms,
        tokenCount: r.context.tokenCount,
      })),
    };
  }

  async validateCrystallizationQuality(filePath?: string, generateReport: boolean = false) {
    await this.ensureInitialized();

    if (generateReport) {
      const report = await this.contextValidator!.generateProjectQualityReport();
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

      const validation = await this.contextValidator!.validateContext(context);
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
    await this.ensureInitialized();

    const {
      forceUpdate = false,
      includeUnchanged = false,
      cleanupDeleted = true,
      checkOnly = false,
      generateReport = false
    } = options;

    if (generateReport) {
      const report = await this.contextUpdater!.generateUpdateReport();
      return { type: 'update_report', report };
    }

    if (checkOnly) {
      const status = await this.contextUpdater!.getUpdateStatus();
      return {
        type: 'update_status',
        ...status,
      };
    }

    // Perform the update
    const updateResult = await this.contextUpdater!.updateContexts({
      forceUpdate,
      includeUnchanged,
      cleanupDeleted,
    });

    return {
      type: 'update_result',
      ...updateResult,
    };
  }

  async getCrystallizationGuidance(repoPath?: string): Promise<any> {
    // Use provided repo path or try to determine from initialized context storage
    const targetRepoPath = repoPath || (this.contextStorage ? this.contextStorage['repoPath'] : null);
    
    if (!targetRepoPath) {
      throw new Error('Repository path not available. Ensure repository is initialized or provide repoPath parameter.');
    }

    const templatesDir = path.join(targetRepoPath, '.context-crystallizer', 'templates');
    
    // Load system guidance
    const systemGuidance = await this.loadSystemGuidance(templatesDir);
    
    // Load template-specific guidance
    const templateGuidance = await this.loadGuidanceFromFiles(templatesDir);

    return {
      systemGuidance,
      templateGuidance
    };
  }

  private async loadSystemGuidance(templatesDir: string): Promise<string> {
    const systemGuidancePath = path.join(templatesDir, 'guidance', 'system-guidance.md');
    try {
      return await fs.readFile(systemGuidancePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to load required system guidance from ${systemGuidancePath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadGuidanceFromFiles(templatesDir: string): Promise<any> {
    const guidanceContent: any = {};
    
    const guidanceFiles = [
      { name: 'overview', file: 'overview-guidance.md' },
      { name: 'standard', file: 'standard-guidance.md' },
      { name: 'detailed', file: 'detailed-guidance.md' }
    ];

    for (const { name, file } of guidanceFiles) {
      const guidancePath = path.join(templatesDir, 'guidance', file);
      try {
        const content = await fs.readFile(guidancePath, 'utf-8');
        guidanceContent[name] = {
          name,
          guidance: content,
          source: guidancePath
        };
      } catch (error) {
        throw new Error(`Failed to load required guidance file '${name}' from ${guidancePath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    return guidanceContent;
  }

}