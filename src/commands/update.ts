import { Command } from 'commander';
import chalk from 'chalk';
import { CrystallizerCore } from '../shared/crystallizer-core.js';

export function createUpdateCommand() {
  return new Command('update')
    .description('Update crystallized contexts for changed files')
    .option('-f, --force', 'Force regeneration of all contexts regardless of changes')
    .option('-u, --include-unchanged', 'Include files that do not have context yet')
    .option('-c, --cleanup-deleted', 'Remove contexts for deleted files', true)
    .option('-r, --report', 'Generate detailed update report')
    .option('--check-only', 'Only check status without performing updates')
    .option('-j, --json', 'Output as JSON')
    .action(async (options) => {
      try {
        const core = new CrystallizerCore();
        const result = await core.updateCrystallizedContexts({
          forceUpdate: options.force,
          includeUnchanged: options.includeUnchanged,
          cleanupDeleted: options.cleanupDeleted,
          checkOnly: options.checkOnly,
          generateReport: options.report,
        });
        
        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
          return;
        }
        
        console.log(chalk.blue('🔄 Context Update'));
        console.log(chalk.cyan('─'.repeat(25)));
        
        if (result.type === 'update_report') {
          console.log(chalk.green('📊 Update report generated'));
          console.log(chalk.white(result.report));
        } else if (result.type === 'update_status') {
          console.log(chalk.yellow('📋 Update status check completed'));
          console.log(chalk.gray('Use --json to see detailed status information'));
        } else if (result.type === 'update_result') {
          console.log(chalk.green('✓ Context update completed'));
          console.log(chalk.gray('Use --json to see detailed update results'));
        }
        
        console.log();
        console.log(chalk.gray('💡 Use --json flag for complete details'));
      } catch (error) {
        console.error(chalk.red('❌ Update failed:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}