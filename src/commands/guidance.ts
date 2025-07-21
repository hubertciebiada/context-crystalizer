import { Command } from 'commander';
import chalk from 'chalk';
import { CrystallizerCore } from '../shared/crystallizer-core.js';

export function createGuidanceCommand() {
  return new Command('guidance')
    .description('Get comprehensive guidance for analyzing files and creating crystallized contexts')
    .option('-r, --repo-path <path>', 'Repository path (optional - uses current directory if not specified)')
    .action(async (options) => {
      try {
        console.log(chalk.blue('🔮 Loading crystallization guidance...'));
        
        const core = new CrystallizerCore();
        const guidance = await core.getCrystallizationGuidance(options.repoPath);
        
        console.log(chalk.green('✓ Crystallization guidance loaded!\n'));
        
        // Display system guidance
        console.log(chalk.bold.cyan('SYSTEM GUIDANCE:'));
        console.log(chalk.gray(guidance.systemGuidance));
        console.log();
        
        console.log(chalk.bold.cyan('TEMPLATE GUIDANCE:'));
        Object.entries(guidance.templateGuidance).forEach(([name, template]: [string, any]) => {
          console.log(chalk.yellow(`  ${name.toUpperCase()}:`));
          console.log(chalk.gray(`    Source: ${template.source}`));
          console.log(chalk.gray(`    Content Preview: ${template.guidance.substring(0, 100)}...`));
          console.log();
        });
        
      } catch (error) {
        console.error(chalk.red('❌ Failed to load crystallization guidance:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}