#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { FileScanner } from './core/file-scanner.js';
import { ContextStorage } from './core/context-storage.js';
import { QueueManager } from './core/queue-manager.js';
import { ContextSearch } from './core/context-search.js';
import { ContextValidator } from './core/context-validator.js';
import { ChangeDetector } from './core/change-detector.js';
import { ContextUpdater } from './core/context-updater.js';

const server = new Server(
  {
    name: 'context-crystallizer',
    version: '0.1.0',
    description: 'Transform large repositories into crystallized, AI-consumable knowledge. Crystallization systematically analyzes each file to extract purpose, APIs, patterns, and relationships.',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let fileScanner: FileScanner;
let contextStorage: ContextStorage;
let queueManager: QueueManager;
let contextSearch: ContextSearch;
let contextValidator: ContextValidator;
let changeDetector: ChangeDetector;
let contextUpdater: ContextUpdater;

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'init_crystallization',
      description: 'Initialize crystallization process for a repository. Crystallization transforms raw files into AI-optimized, searchable knowledge by systematically analyzing each file to extract its purpose, key concepts, and relationships.',
      inputSchema: {
        type: 'object',
        properties: {
          repoPath: {
            type: 'string',
            description: 'Path to the repository to crystallize',
          },
          exclude: {
            type: 'array',
            items: { type: 'string' },
            description: 'Patterns to exclude from crystallization',
            default: ['node_modules', '.git', 'dist', 'build'],
          },
        },
        required: ['repoPath'],
      },
    },
    {
      name: 'get_next_file_to_crystallize',
      description: 'Get the next file from the repository for crystallization into AI-consumable context. Returns file content and metadata for AI analysis.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'store_crystallized_context',
      description: 'Store the crystallized context (AI-optimized knowledge) extracted from a file. This preserves the AI\'s analysis for future search and retrieval.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Path to the source file',
          },
          context: {
            type: 'object',
            properties: {
              purpose: { type: 'string', description: 'Primary purpose and functionality' },
              keyAPIs: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key APIs, functions, or exports for AI consumption',
              },
              dependencies: {
                type: 'array',
                items: { type: 'string' },
                description: 'Dependencies and imports',
              },
              patterns: {
                type: 'array',
                items: { type: 'string' },
                description: 'Implementation patterns and conventions',
              },
              relatedContexts: {
                type: 'array',
                items: { type: 'string' },
                description: 'Related files and contexts',
              },
              aiGuidance: {
                type: 'string',
                description: 'Specific guidance for AI agents working with this code',
              },
              errorHandling: {
                type: 'array',
                items: { type: 'string' },
                description: 'Error handling patterns and strategies',
              },
              integrationPoints: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key integration points with other systems',
              },
            },
            required: ['purpose', 'keyAPIs'],
          },
          fileContent: {
            type: 'string',
            description: 'Original file content for cross-reference analysis',
          },
          fileMetadata: {
            type: 'object',
            properties: {
              complexity: {
                type: 'string',
                enum: ['low', 'medium', 'high'],
                description: 'File complexity level',
              },
              category: {
                type: 'string',
                enum: ['config', 'source', 'test', 'docs', 'other'],
                description: 'File category',
              },
              estimatedTokens: {
                type: 'number',
                description: 'Estimated token count for the file',
              },
            },
          },
        },
        required: ['filePath', 'context'],
      },
    },
    {
      name: 'get_crystallization_progress',
      description: 'Get the current progress of the crystallization process, including files processed, remaining files, and overall completion status.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'search_crystallized_contexts',
      description: 'Search through crystallized contexts to find relevant knowledge by functionality or purpose. Returns ranked results optimized for AI token limits.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query (e.g., "authentication middleware", "database connection")',
          },
          maxTokens: {
            type: 'number',
            description: 'Maximum tokens to return in results (default: 4000)',
            default: 4000,
          },
          category: {
            type: 'string',
            enum: ['config', 'source', 'test', 'docs', 'other'],
            description: 'Filter by file category',
          },
        },
        required: ['query'],
      },
    },
    {
      name: 'get_crystallized_bundle',
      description: 'Assemble multiple crystallized contexts into a token-aware bundle for comprehensive understanding of related files.',
      inputSchema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of relative file paths to include in bundle',
          },
          maxTokens: {
            type: 'number',
            description: 'Maximum total tokens for the bundle (default: 8000)',
            default: 8000,
          },
        },
        required: ['files'],
      },
    },
    {
      name: 'find_related_crystallized_contexts',
      description: 'Find crystallized contexts related to a specific file to explore code relationships and dependencies.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Relative path to the file to find related contexts for',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of related contexts to return (default: 5)',
            default: 5,
          },
        },
        required: ['filePath'],
      },
    },
    {
      name: 'search_by_complexity',
      description: 'Search crystallized contexts filtered by complexity level for progressive learning and understanding.',
      inputSchema: {
        type: 'object',
        properties: {
          complexity: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'Complexity level to search for',
          },
          maxResults: {
            type: 'number',
            description: 'Maximum number of results (default: 10)',
            default: 10,
          },
        },
        required: ['complexity'],
      },
    },
    {
      name: 'validate_crystallization_quality',
      description: 'Validate the quality of crystallized context and get improvement suggestions for better AI comprehension.',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: {
            type: 'string',
            description: 'Specific file to validate (optional - validates all if omitted)',
          },
          generateReport: {
            type: 'boolean',
            description: 'Generate a comprehensive project quality report',
            default: false,
          },
        },
      },
    },
    {
      name: 'update_crystallized_contexts',
      description: 'Update crystallized contexts for files that have changed since last crystallization, maintaining knowledge freshness.',
      inputSchema: {
        type: 'object',
        properties: {
          forceUpdate: {
            type: 'boolean',
            description: 'Force regeneration of all contexts regardless of changes',
            default: false,
          },
          includeUnchanged: {
            type: 'boolean',
            description: 'Include files that do not have context yet',
            default: false,
          },
          cleanupDeleted: {
            type: 'boolean',
            description: 'Remove contexts for deleted files',
            default: true,
          },
          checkOnly: {
            type: 'boolean',
            description: 'Only check status without performing updates',
            default: false,
          },
          generateReport: {
            type: 'boolean',
            description: 'Generate a detailed update report',
            default: false,
          },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'init_crystallization': {
      const { repoPath, exclude = ['node_modules', '.git', 'dist', 'build'] } = args as {
        repoPath: string;
        exclude?: string[];
      };

      fileScanner = new FileScanner(repoPath, exclude);
      contextStorage = new ContextStorage(repoPath);
      queueManager = new QueueManager();
      contextSearch = new ContextSearch(repoPath);
      contextValidator = new ContextValidator(repoPath);
      changeDetector = new ChangeDetector(repoPath);
      contextUpdater = new ContextUpdater(repoPath, fileScanner, contextStorage, changeDetector, queueManager);

      const files = await fileScanner.scanRepository();
      await queueManager.initializeQueue(files, repoPath, exclude);
      
      // Initialize context storage with all file paths
      const allFilePaths = files.map(f => f.path);
      await contextStorage.initialize(allFilePaths);

      return {
        content: [
          {
            type: 'text',
            text: `✓ Queued ${files.length} relevant files for crystallization`,
          },
        ],
      };
    }

    case 'get_next_file_to_crystallize': {
      if (!queueManager) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized. Run init_crystallization first.',
            },
          ],
        };
      }

      const nextFile = await queueManager.getNextFile();
      if (!nextFile) {
        return {
          content: [
            {
              type: 'text',
              text: 'No more files to crystallize. Crystallization process complete!',
            },
          ],
        };
      }

      const content = await fileScanner.readFile(nextFile.path);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
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
            }),
          },
        ],
      };
    }

    case 'store_crystallized_context': {
      const { filePath, context, fileContent, fileMetadata } = args as {
        filePath: string;
        context: any;
        fileContent?: string;
        fileMetadata?: { complexity: 'low' | 'medium' | 'high'; category: 'config' | 'source' | 'test' | 'docs' | 'other'; estimatedTokens: number };
      };

      if (!contextStorage) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized.',
            },
          ],
        };
      }

      await contextStorage.storeContext(filePath, context, fileContent, fileMetadata);
      await queueManager.markProcessed(filePath);

      const stats = await contextStorage.getContextStatistics();

      return {
        content: [
          {
            type: 'text',
            text: `✓ Crystallized context stored for ${filePath}\n📊 Progress: ${stats.totalContexts} crystallized contexts, ${stats.totalTokens} total tokens`,
          },
        ],
      };
    }

    case 'get_crystallization_progress': {
      if (!queueManager || !contextStorage) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized.',
            },
          ],
        };
      }

      const progress = queueManager.getProgress();
      const stats = await contextStorage.getContextStatistics();
      const sessionInfo = queueManager.getSessionInfo();

      const enhancedStatus = {
        ...progress,
        contextStats: stats,
        session: sessionInfo,
        completionPercentage: progress.totalFiles > 0 ? Math.round((progress.processedFiles / progress.totalFiles) * 100) : 0,
        estimatedCompletionTime: progress.estimatedTimeRemaining ? new Date(Date.now() + progress.estimatedTimeRemaining).toISOString() : null,
      };

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(enhancedStatus, null, 2),
          },
        ],
      };
    }

    case 'search_crystallized_contexts': {
      if (!contextSearch) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized.',
            },
          ],
        };
      }

      const { query, maxTokens = 4000, category } = args as {
        query: string;
        maxTokens?: number;
        category?: string;
      };

      const results = await contextSearch.searchContexts(query, maxTokens, category);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
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
                purpose: `${r.context.purpose.substring(0, 150)  }...`,
                keyAPIs: r.context.keyAPIs.slice(0, 3),
              })),
            }, null, 2),
          },
        ],
      };
    }

    case 'get_crystallized_bundle': {
      if (!contextSearch) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized.',
            },
          ],
        };
      }

      const { files, maxTokens = 8000 } = args as {
        files: string[];
        maxTokens?: number;
      };

      const bundle = await contextSearch.getContextBundle(files, maxTokens);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
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
            }, null, 2),
          },
        ],
      };
    }

    case 'find_related_crystallized_contexts': {
      if (!contextSearch) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized.',
            },
          ],
        };
      }

      const { filePath, maxResults = 5 } = args as {
        filePath: string;
        maxResults?: number;
      };

      const results = await contextSearch.findRelatedContexts(filePath, maxResults);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sourceFile: filePath,
              relatedContexts: results.length,
              matches: results.map(r => ({
                file: r.context.relativePath,
                relevance: r.relevanceScore,
                category: r.context.category,
                purpose: `${r.context.purpose.substring(0, 100)  }...`,
                keyAPIs: r.context.keyAPIs.slice(0, 2),
                relationship: r.highlights.join(', '),
              })),
            }, null, 2),
          },
        ],
      };
    }

    case 'search_by_complexity': {
      if (!contextSearch) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized.',
            },
          ],
        };
      }

      const { complexity, maxResults = 10 } = args as {
        complexity: 'low' | 'medium' | 'high';
        maxResults?: number;
      };

      const results = await contextSearch.searchByComplexity(complexity, maxResults);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              complexity,
              totalFound: results.length,
              contexts: results.map(r => ({
                file: r.context.relativePath,
                category: r.context.category,
                purpose: `${r.context.purpose.substring(0, 100)  }...`,
                keyAPIs: r.context.keyAPIs.slice(0, 3),
                tokenCount: r.context.tokenCount,
              })),
            }, null, 2),
          },
        ],
      };
    }

    case 'validate_crystallization_quality': {
      if (!contextValidator) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized.',
            },
          ],
        };
      }

      const { filePath, generateReport = false } = args as {
        filePath?: string;
        generateReport?: boolean;
      };

      if (generateReport) {
        const report = await contextValidator.generateProjectQualityReport();
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                type: 'project_quality_report',
                ...report,
              }, null, 2),
            },
          ],
        };
      } else if (filePath) {
        // Validate specific context
        const context = await contextSearch?.loadContext?.(filePath);
        if (!context) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Context not found for ${filePath}`,
              },
            ],
          };
        }

        const validation = await contextValidator.validateContext(context);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                type: 'context_validation',
                file: filePath,
                ...validation,
              }, null, 2),
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Either specify a filePath or set generateReport to true',
            },
          ],
        };
      }
    }

    case 'update_crystallized_contexts': {
      if (!contextUpdater) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not crystallized.',
            },
          ],
        };
      }

      const { 
        forceUpdate = false,
        includeUnchanged = false,
        cleanupDeleted = true,
        checkOnly = false,
        generateReport = false
      } = args as {
        forceUpdate?: boolean;
        includeUnchanged?: boolean;
        cleanupDeleted?: boolean;
        checkOnly?: boolean;
        generateReport?: boolean;
      };

      if (generateReport) {
        const report = await contextUpdater.generateUpdateReport();
        return {
          content: [
            {
              type: 'text',
              text: report,
            },
          ],
        };
      }

      if (checkOnly) {
        const status = await contextUpdater.getUpdateStatus();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                type: 'update_status',
                ...status,
              }, null, 2),
            },
          ],
        };
      }

      // Perform the update
      const updateResult = await contextUpdater.updateContexts({
        forceUpdate,
        includeUnchanged,
        cleanupDeleted,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              type: 'update_result',
              ...updateResult,
            }, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Context Crystallizer MCP server running... Ready to transform repositories into crystallized knowledge!');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});