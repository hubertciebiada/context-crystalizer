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

const server = new Server(
  {
    name: 'context-crystallizer',
    version: '0.1.0',
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

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'init_crystallization',
      description: 'Initialize AI context generation for a repository',
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
      name: 'get_next_file',
      description: 'Get the next file for AI context generation',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    {
      name: 'store_ai_context',
      description: 'Store AI-generated context for a file with enhanced metadata',
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
      name: 'get_context_status',
      description: 'Get current context generation progress',
      inputSchema: {
        type: 'object',
        properties: {},
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

      const files = await fileScanner.scanRepository();
      await queueManager.initializeQueue(files, repoPath, exclude);
      
      // Initialize context storage with all file paths
      const allFilePaths = files.map(f => f.path);
      await contextStorage.initialize(allFilePaths);

      return {
        content: [
          {
            type: 'text',
            text: `✓ Queued ${files.length} relevant files for AI context generation`,
          },
        ],
      };
    }

    case 'get_next_file': {
      if (!queueManager) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not initialized. Run init_crystallization first.',
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
              text: 'No more files to process. Context generation complete!',
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

    case 'store_ai_context': {
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
              text: 'Error: Repository not initialized.',
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
            text: `✓ Context stored for ${filePath}\n📊 Progress: ${stats.totalContexts} contexts, ${stats.totalTokens} total tokens`,
          },
        ],
      };
    }

    case 'get_context_status': {
      if (!queueManager) {
        return {
          content: [
            {
              type: 'text',
              text: 'Error: Repository not initialized.',
            },
          ],
        };
      }

      const progress = queueManager.getProgress();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(progress),
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
  console.error('Context Crystallizer MCP server running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});