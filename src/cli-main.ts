#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { createInitCommand } from './commands/init.js';
import { createProgressCommand } from './commands/progress.js';
import { createSearchCommand } from './commands/search.js';
import { createBundleCommand } from './commands/bundle.js';
import { createRelatedCommand } from './commands/related.js';
import { createValidateCommand } from './commands/validate.js';
import { createUpdateCommand } from './commands/update.js';
import { createMcpCommand } from './commands/mcp.js';
import { createGuidanceCommand } from './commands/guidance.js';

const program = new Command();

program
  .name('context-crystallizer')
  .description('Transform large repositories into crystallized, AI-consumable knowledge')
  .version('1.0.0');

// Add all commands
program.addCommand(createInitCommand());
program.addCommand(createProgressCommand());
program.addCommand(createSearchCommand());
program.addCommand(createBundleCommand());
program.addCommand(createRelatedCommand());
program.addCommand(createValidateCommand());
program.addCommand(createUpdateCommand());
program.addCommand(createGuidanceCommand());
program.addCommand(createMcpCommand());

// Add help examples
program.addHelpText('after', `

Examples:
  ${chalk.cyan('context-crystallizer init ./my-repo')}           Initialize crystallization
  ${chalk.cyan('context-crystallizer progress')}                Check crystallization progress
  ${chalk.cyan('context-crystallizer search "auth"')}           Search for authentication contexts
  ${chalk.cyan('context-crystallizer bundle src/auth src/api')} Bundle related contexts
  ${chalk.cyan('context-crystallizer related src/auth.ts')}     Find related contexts
  ${chalk.cyan('context-crystallizer validate')}               Validate quality
  ${chalk.cyan('context-crystallizer update')}                 Update changed contexts
  ${chalk.cyan('context-crystallizer guidance')}               Get analysis guidance
  ${chalk.cyan('context-crystallizer mcp')}                    Start MCP server

For AI Agent Integration:
  Configure Claude Desktop with MCP to enable conversation-driven crystallization.
  See README.md for setup instructions.
`);

export async function runCli() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(chalk.red('❌ Command failed:'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

// Run CLI if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runCli();
}