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
        
        // Display guidance in a readable format
        console.log(chalk.bold.cyan('WHO AM I:'));
        console.log(chalk.gray(guidance.whoAmI));
        console.log();
        
        console.log(chalk.bold.cyan('WHAT AM I DOING:'));
        console.log(chalk.gray(guidance.whatAmIDoing));
        console.log();
        
        console.log(chalk.bold.cyan('WHY IT MATTERS:'));
        console.log(chalk.gray(guidance.whyItMatters));
        console.log();
        
        console.log(chalk.bold.cyan('GOAL:'));
        console.log(chalk.gray(guidance.goal));
        console.log();
        
        console.log(chalk.bold.cyan('TEMPLATES:'));
        Object.entries(guidance.templates).forEach(([name, template]: [string, any]) => {
          console.log(chalk.yellow(`  ${name.toUpperCase()}:`));
          console.log(chalk.gray(`    Source: ${template.source}`));
          console.log();
        });
        
        console.log(chalk.bold.cyan('TEMPLATE SELECTION:'));
        Object.entries(guidance.templateSelection).forEach(([name, description]) => {
          console.log(chalk.yellow(`  ${name}:`), chalk.gray(description));
        });
        console.log();
        
        console.log(chalk.bold.cyan('ANALYSIS METHODOLOGY:'));
        Object.entries(guidance.analysisMethodology).forEach(([step, description]) => {
          console.log(chalk.yellow(`  ${step}:`), chalk.gray(description));
        });
        console.log();
        
        console.log(chalk.bold.cyan('QUALITY STANDARDS:'));
        guidance.qualityStandards.forEach((standard: string) => {
          console.log(chalk.gray(`  • ${standard}`));
        });
        console.log();
        
        console.log(chalk.bold.cyan('INDEXING NOTE:'));
        console.log(chalk.gray(guidance.indexingNote));
        console.log();
        
        console.log(chalk.bold.cyan('EXPECTATION:'));
        console.log(chalk.gray(guidance.expectation));
        console.log();
        
        console.log(chalk.bold.cyan('TEMPLATE CUSTOMIZATION:'));
        console.log(chalk.gray(guidance.templateCustomization));
        
      } catch (error) {
        console.error(chalk.red('❌ Failed to load crystallization guidance:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}