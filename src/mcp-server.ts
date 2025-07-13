import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { CrystallizerCore } from './shared/crystallizer-core.js';

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

let crystallizerCore: CrystallizerCore;

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

  // Initialize crystallizer core if not already done
  if (!crystallizerCore) {
    crystallizerCore = new CrystallizerCore();
  }

  switch (name) {
    case 'init_crystallization': {
      const { repoPath, exclude } = args as { repoPath: string; exclude?: string[] };
      const result = await crystallizerCore.initializeCrystallization(repoPath, exclude);
      return {
        content: [
          {
            type: 'text',
            text: `✓ Queued ${result.filesQueued} relevant files for crystallization`,
          },
        ],
      };
    }

    case 'get_next_file_to_crystallize': {
      const nextFile = await crystallizerCore.getNextFileForCrystallization();
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

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(nextFile),
          },
        ],
      };
    }

    case 'store_crystallized_context': {
      const { filePath, context, fileContent, fileMetadata } = args as any;
      const result = await crystallizerCore.storeCrystallizedContext(filePath, context, fileContent, fileMetadata);
      return {
        content: [
          {
            type: 'text',
            text: `✓ Crystallized context stored for ${result.filePath}\n📊 Progress: ${result.totalContexts} crystallized contexts, ${result.totalTokens} total tokens`,
          },
        ],
      };
    }

    case 'get_crystallization_progress': {
      const progress = await crystallizerCore.getCrystallizationProgress();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(progress, null, 2),
          },
        ],
      };
    }

    case 'search_crystallized_contexts': {
      const { query, maxTokens, category } = args as any;
      const results = await crystallizerCore.searchCrystallizedContexts(query, maxTokens, category);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    case 'get_crystallized_bundle': {
      const { files, maxTokens } = args as any;
      const bundle = await crystallizerCore.getCrystallizedBundle(files, maxTokens);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(bundle, null, 2),
          },
        ],
      };
    }

    case 'find_related_crystallized_contexts': {
      const { filePath, maxResults } = args as any;
      const results = await crystallizerCore.findRelatedCrystallizedContexts(filePath, maxResults);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    case 'search_by_complexity': {
      const { complexity, maxResults } = args as any;
      const results = await crystallizerCore.searchByComplexity(complexity, maxResults);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(results, null, 2),
          },
        ],
      };
    }

    case 'validate_crystallization_quality': {
      const { filePath, generateReport } = args as any;
      const validation = await crystallizerCore.validateCrystallizationQuality(filePath, generateReport);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(validation, null, 2),
          },
        ],
      };
    }

    case 'update_crystallized_contexts': {
      const options = args as any;
      const result = await crystallizerCore.updateCrystallizedContexts(options);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

export async function startMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Context Crystallizer MCP server running... Ready to transform repositories into crystallized knowledge!');
}