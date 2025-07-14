import { Command } from 'commander';
import chalk from 'chalk';
import { CrystallizerCore } from '../shared/crystallizer-core.js';

export function createRelatedCommand() {
  return new Command('related')
    .description('Find crystallized contexts related to a specific file')
    .argument('<file-path>', 'File path to find related contexts for')
    .option('-m, --max-results <number>', 'Maximum number of related contexts', '5')
    .option('-j, --json', 'Output as JSON')
    .action(async (filePath: string, options) => {
      try {
        const core = new CrystallizerCore();
        const results = await core.findRelatedCrystallizedContexts(filePath, parseInt(options.maxResults));
        
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }
        
        console.log(chalk.blue(`🔗 Related Contexts for: ${filePath}`));
        console.log(chalk.cyan('─'.repeat(50)));
        console.log(chalk.green(`📊 Found ${results.relatedContexts} related contexts`));
        console.log();
        
        if (results.matches.length === 0) {
          console.log(chalk.yellow('No related crystallized contexts found.'));
          console.log(chalk.gray('💡 This file might be isolated or not yet crystallized.'));
          return;
        }
        
        results.matches.forEach((match, index) => {
          console.log(chalk.bold(`${index + 1}. ${match.file}`));
          console.log(chalk.gray(`   Category: ${match.category} | Relevance: ${(match.relevance * 100).toFixed(1)}%`));
          console.log(chalk.white(`   ${match.purpose}`));
          
          if (match.keyTerms.length > 0) {
            console.log(chalk.blue(`   Key Terms: ${match.keyTerms.join(', ')}`));
          }
          
          if (match.relationship) {
            console.log(chalk.yellow(`   Relationship: ${match.relationship}`));
          }
          
          console.log();
        });
      } catch (error) {
        console.error(chalk.red('❌ Failed to find related contexts:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}