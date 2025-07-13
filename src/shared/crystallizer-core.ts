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

    // Create template files for user customization
    await this.createTemplateFiles(repoPath);

    // Create timeout configuration file for concurrent agent support
    await this.createTimeoutConfigFile(repoPath);

    return { filesQueued: files.length };
  }

  private async createTemplateFiles(repoPath: string): Promise<void> {
    const templatesDir = path.join(repoPath, '.context-crystalizer', 'templates');
    await fs.mkdir(templatesDir, { recursive: true });

    // Define template files to copy
    const templateFiles = [
      'overview-template.md',
      'standard-template.md', 
      'detailed-template.md'
    ];

    // Copy template files from the package templates directory
    const packageTemplatesDir = path.resolve(__dirname, '../../templates');
    
    for (const templateFile of templateFiles) {
      const sourcePath = path.join(packageTemplatesDir, templateFile);
      const destPath = path.join(templatesDir, templateFile);
      
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
          // If we can't read from package templates, create basic versions
          await this.createDefaultTemplate(destPath, templateFile);
        }
      }
    }
  }

  private async createDefaultTemplate(destPath: string, templateFile: string): Promise<void> {
    let content = '';
    
    switch (templateFile) {
      case 'overview-template.md':
        content = `# Overview Template (≤50 tokens)

Extract ultra-compact information for indexing and search.

## Required Fields
- purpose: Single sentence describing what this file does
- keyTerms: Array of 3-5 searchable keywords
- category: File type (config, source, test, docs, other)

Focus on essential identification information for search.`;
        break;

      case 'standard-template.md':
        content = `# Standard Template (≤200 tokens)

Extract regular analysis information for most files.

## Required Fields
- purpose: 2-3 sentences describing file's role and functionality
- keyAPIs: Array of key functions, classes, exports

## Optional Fields
- dependencies: Important imports and dependencies
- patterns: Implementation patterns and conventions
- relatedContexts: Related files that work together

Focus on information useful for AI understanding.`;
        break;

      case 'detailed-template.md':
        content = `# Detailed Template (≤2000 tokens)

Extract comprehensive analysis for complex, high-value files.

## Required Fields
- purpose: Detailed explanation of file's role and architecture
- keyAPIs: Detailed functions, classes, methods with descriptions

## Optional Fields
- dependencies: Comprehensive list of imports with purposes
- patterns: Architectural patterns and design decisions
- aiGuidance: Specific guidance for AI agents
- errorHandling: Error scenarios and handling strategies
- integrationPoints: Connections to external systems
- relatedContexts: Closely related files

Focus on comprehensive understanding for complex files.`;
        break;
    }
    
    await fs.writeFile(destPath, content);
  }

  private async createTimeoutConfigFile(repoPath: string): Promise<void> {
    const timeoutConfigPath = path.join(repoPath, '.context-crystalizer', 'crystallization_timeout.txt');
    
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

  async getCrystallizationGuidance(repoPath?: string): Promise<any> {
    // Use provided repo path or try to determine from initialized context storage
    const targetRepoPath = repoPath || (this.contextStorage ? this.contextStorage['repoPath'] : null);
    
    if (!targetRepoPath) {
      throw new Error('Repository path not available. Ensure repository is initialized or provide repoPath parameter.');
    }

    const templatesDir = path.join(targetRepoPath, '.context-crystalizer', 'templates');
    
    // Load templates from files
    const templates = await this.loadTemplatesFromFiles(templatesDir);

    return {
      whoAmI: "You are a world-class text and code analyzer with exceptional pattern recognition abilities. Your expertise lies in extracting meaningful insights from any type of file or document. You excel at identifying core functionality, relationships, and creating AI-consumable knowledge representations.",
      
      whatAmIDoing: "You are transforming repository files into crystallized, indexed knowledge that enables efficient AI-powered analysis and search. Each file you analyze becomes part of a searchable knowledge base.",
      
      whyItMatters: "This creates a searchable knowledge base where AI agents can quickly locate relevant information without reading entire files. Your analysis enables semantic search and efficient repository understanding.",
      
      goal: "Create token-efficient, indexed contexts that preserve essential information while enabling fast semantic search. Optimize for AI comprehension and searchability.",
      
      templates,
      
      templateSelection: {
        overview: "Generate for every file to create searchable index entries. Ultra-compact for maximum coverage.",
        standard: "Use for config files, utilities, simple components, and medium complexity files. Balance detail with efficiency.",
        detailed: "Use for complex source files, core business logic, APIs, and high-value components. Maximum detail within token limits."
      },
      
      analysisMethodology: {
        step1: "Read and understand the file's primary purpose and role in the system",
        step2: "Identify key APIs, functions, classes, and exports that other code would use",
        step3: "Map important dependencies and relationships to other files",
        step4: "Recognize implementation patterns, architectural decisions, and conventions",
        step5: "Extract AI-specific guidance for working with or modifying this code",
        step6: "Include error handling strategies and integration points where relevant"
      },
      
      qualityStandards: [
        "Focus on functionality over implementation details",
        "Prioritize information useful for AI agents and search",
        "Use consistent terminology across all analyses",
        "Include cross-references to related files when relevant",
        "Maintain token efficiency while preserving essential clarity",
        "Extract searchable keywords and functional descriptions"
      ],
      
      indexingNote: "All crystallized knowledge is automatically indexed for semantic search. Focus on extracting searchable keywords, functional descriptions, and relationships that would help AI agents locate relevant code.",
      
      expectation: "Analyze files systematically and thoroughly. Each analysis contributes to the repository's searchable knowledge base. Maintain consistency and quality across all analyses. Generate overview analysis for every file to ensure complete search coverage.",
      
      templateCustomization: `Templates are stored in ${templatesDir} and can be customized by users. These files define the structure and guidance for each analysis type.`
    };
  }

  private async loadTemplatesFromFiles(templatesDir: string): Promise<any> {
    const templates: any = {};
    
    const templateFiles = [
      { name: 'overview', file: 'overview-template.md' },
      { name: 'standard', file: 'standard-template.md' },
      { name: 'detailed', file: 'detailed-template.md' }
    ];

    for (const { name, file } of templateFiles) {
      try {
        const templatePath = path.join(templatesDir, file);
        const content = await fs.readFile(templatePath, 'utf-8');
        templates[name] = {
          name,
          guidance: content,
          source: templatePath
        };
      } catch (error) {
        // Fallback to basic template definition if file can't be read
        templates[name] = {
          name,
          guidance: `Basic ${name} template - customize by editing template files`,
          source: 'built-in fallback'
        };
      }
    }

    return templates;
  }
}