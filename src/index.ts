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
      description: 'Store AI-generated context for a file',
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
              purpose: { type: 'string' },
              keyAPIs: {
                type: 'array',
                items: { type: 'string' },
              },
              dependencies: {
                type: 'array',
                items: { type: 'string' },
              },
              patterns: {
                type: 'array',
                items: { type: 'string' },
              },
              relatedContexts: {
                type: 'array',
                items: { type: 'string' },
              },
            },
            required: ['purpose', 'keyAPIs'],
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
      queueManager.initializeQueue(files);

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
              },
            }),
          },
        ],
      };
    }

    case 'store_ai_context': {
      const { filePath, context } = args as {
        filePath: string;
        context: any;
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

      await contextStorage.storeContext(filePath, context);
      queueManager.markProcessed(filePath);

      return {
        content: [
          {
            type: 'text',
            text: `✓ Context stored for ${filePath}`,
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