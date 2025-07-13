import { Command } from 'commander';
import chalk from 'chalk';
import { CrystallizerCore } from '../shared/crystallizer-core.js';

export function createBundleCommand() {
  return new Command('bundle')
    .description('Combine multiple crystallized contexts for complex understanding')
    .argument('<files...>', 'File paths to include in bundle')
    .option('-t, --max-tokens <number>', 'Maximum total tokens for bundle', '8000')
    .option('-j, --json', 'Output as JSON')
    .action(async (files: string[], options) => {
      try {
        const core = new CrystallizerCore();
        const bundle = await core.getCrystallizedBundle(files, parseInt(options.maxTokens));
        
        if (options.json) {
          console.log(JSON.stringify(bundle, null, 2));
          return;
        }
        
        console.log(chalk.blue('📦 Crystallized Context Bundle'));
        console.log(chalk.cyan('─'.repeat(40)));
        console.log(chalk.green(`📁 Requested files: ${bundle.requestedFiles}`));
        console.log(chalk.green(`✓ Included files: ${bundle.includedFiles}`));
        console.log(chalk.yellow(`🔢 Total tokens: ${bundle.totalTokens.toLocaleString()}`));
        console.log();
        
        if (bundle.contexts.length === 0) {
          console.log(chalk.yellow('No crystallized contexts found for the specified files.'));
          console.log(chalk.gray('💡 Make sure the files exist and have been crystallized.'));
          return;
        }
        
        bundle.contexts.forEach((context, index) => {
          console.log(chalk.bold(`${index + 1}. ${context.file}`));
          console.log(chalk.gray(`   Category: ${context.category} | Complexity: ${context.complexity} | Tokens: ${context.tokenCount}`));
          console.log(chalk.white(`   ${context.purpose}`));
          
          if (context.keyAPIs && context.keyAPIs.length > 0) {
            console.log(chalk.blue(`   Key APIs: ${context.keyAPIs.join(', ')}`));
          }
          
          if (context.dependencies && context.dependencies.length > 0) {
            console.log(chalk.magenta(`   Dependencies: ${context.dependencies.join(', ')}`));
          }
          
          if (context.patterns && context.patterns.length > 0) {
            console.log(chalk.cyan(`   Patterns: ${context.patterns.join(', ')}`));
          }
          
          console.log();
        });
      } catch (error) {
        console.error(chalk.red('❌ Bundle creation failed:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}