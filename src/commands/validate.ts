import { Command } from 'commander';
import chalk from 'chalk';
import { CrystallizerCore } from '../shared/crystallizer-core.js';

export function createValidateCommand() {
  return new Command('validate')
    .description('Validate crystallization quality')
    .argument('[file-path]', 'Specific file to validate (optional)')
    .option('-r, --report', 'Generate comprehensive project quality report')
    .option('-j, --json', 'Output as JSON')
    .action(async (filePath: string | undefined, options) => {
      try {
        const core = new CrystallizerCore();
        const validation = await core.validateCrystallizationQuality(filePath, options.report);
        
        if (options.json) {
          console.log(JSON.stringify(validation, null, 2));
          return;
        }
        
        if (validation.type === 'project_quality_report') {
          console.log(chalk.blue('📊 Project Quality Report'));
          console.log(chalk.cyan('─'.repeat(30)));
          
          // Display the quality report in a user-friendly format
          console.log(chalk.green('✓ Quality metrics generated'));
          console.log(chalk.yellow('💡 Check the full JSON output with --json for detailed metrics'));
        } else if (validation.type === 'context_validation') {
          console.log(chalk.blue(`🔍 Validation for: ${filePath || 'unknown'}`));
          console.log(chalk.cyan('─'.repeat(40)));
          
          // Display validation results in a user-friendly format
          console.log(chalk.green('✓ Context validation completed'));
          console.log(chalk.yellow('💡 Check the full JSON output with --json for detailed validation'));
        }
        
        console.log();
        console.log(chalk.gray('Use --json flag to see complete validation details'));
      } catch (error) {
        console.error(chalk.red('❌ Validation failed:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}