import { Command } from 'commander';
import chalk from 'chalk';

export function createMcpCommand() {
  return new Command('mcp')
    .description('Start MCP server for AI agent integration')
    .action(async () => {
      console.log(chalk.blue('🚀 Starting Context Crystallizer MCP server...'));
      
      // Import and start the MCP server
      const { startMcpServer } = await import('../mcp-server.js');
      await startMcpServer();
    });
}