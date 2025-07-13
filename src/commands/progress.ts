import { Command } from 'commander';
import chalk from 'chalk';
import { CrystallizerCore } from '../shared/crystallizer-core.js';

export function createProgressCommand() {
  return new Command('progress')
    .description('Show crystallization progress')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      try {
        const core = new CrystallizerCore();
        const progress = await core.getCrystallizationProgress();
        
        if (options.json) {
          console.log(JSON.stringify(progress, null, 2));
          return;
        }
        
        console.log(chalk.blue('🔮 Crystallization Progress'));
        console.log(chalk.cyan('─'.repeat(40)));
        console.log(chalk.green(`✓ Processed: ${progress.processedFiles}/${progress.totalFiles} files`));
        console.log(chalk.yellow(`📊 Completion: ${progress.completionPercentage}%`));
        console.log(chalk.cyan(`💎 Total contexts: ${progress.contextStats.totalContexts}`));
        console.log(chalk.cyan(`🔢 Total tokens: ${progress.contextStats.totalTokens.toLocaleString()}`));
        
        if (progress.estimatedTimeRemaining) {
          const eta = new Date(progress.estimatedTimeRemaining);
          console.log(chalk.magenta(`⏰ ETA: ${eta.toLocaleTimeString()}`));
        }
        
        if (progress.completionPercentage === 100) {
          console.log(chalk.green('🎉 Crystallization complete!'));
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to get progress:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}