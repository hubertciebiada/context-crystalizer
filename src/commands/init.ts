import { Command } from 'commander';
import chalk from 'chalk';
import { CrystallizerCore } from '../shared/crystallizer-core.js';

export function createInitCommand() {
  return new Command('init')
    .description('Initialize crystallization for a repository. Automatically respects .gitignore patterns.')
    .argument('<repo-path>', 'Path to the repository to crystallize')
    .option('-e, --exclude <patterns...>', 'Additional patterns to exclude (beyond .gitignore and defaults: node_modules, .git, dist, build)', ['node_modules', '.git', 'dist', 'build'])
    .action(async (repoPath: string, options) => {
      try {
        console.log(chalk.blue('🔮 Initializing crystallization...'));
        
        const core = new CrystallizerCore();
        const result = await core.initializeCrystallization(repoPath, options.exclude);
        
        console.log(chalk.green('✓ Crystallization initialized successfully!'));
        console.log(chalk.cyan(`📁 Repository: ${repoPath}`));
        console.log(chalk.cyan(`📊 Files queued: ${result.filesQueued}`));
        console.log(chalk.yellow('💡 Use "context-crystallizer progress" to monitor crystallization'));
      } catch (error) {
        console.error(chalk.red('❌ Failed to initialize crystallization:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}