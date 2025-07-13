import { Command } from 'commander';
import chalk from 'chalk';
import { CrystallizerCore } from '../shared/crystallizer-core.js';

export function createSearchCommand() {
  return new Command('search')
    .description('Search crystallized contexts by functionality')
    .argument('<query>', 'Search query (e.g., "authentication middleware")')
    .option('-t, --max-tokens <number>', 'Maximum tokens to return', '4000')
    .option('-c, --category <category>', 'Filter by category (config, source, test, docs, other)')
    .option('-j, --json', 'Output as JSON')
    .action(async (query: string, options) => {
      try {
        const core = new CrystallizerCore();
        const results = await core.searchCrystallizedContexts(
          query, 
          parseInt(options.maxTokens), 
          options.category
        );
        
        if (options.json) {
          console.log(JSON.stringify(results, null, 2));
          return;
        }
        
        console.log(chalk.blue(`🔍 Search Results for: "${query}"`));
        console.log(chalk.cyan('─'.repeat(50)));
        console.log(chalk.green(`📊 Found ${results.results} matches (${results.totalTokens} tokens)`));
        console.log();
        
        if (results.matches.length === 0) {
          console.log(chalk.yellow('No crystallized contexts found for this query.'));
          console.log(chalk.gray('💡 Try a different search term or check if crystallization is complete.'));
          return;
        }
        
        results.matches.forEach((match, index) => {
          console.log(chalk.bold(`${index + 1}. ${match.file}`));
          console.log(chalk.gray(`   Category: ${match.category} | Complexity: ${match.complexity} | Relevance: ${(match.relevance * 100).toFixed(1)}%`));
          console.log(chalk.white(`   ${match.purpose}`));
          if (match.keyAPIs.length > 0) {
            console.log(chalk.blue(`   APIs: ${match.keyAPIs.join(', ')}`));
          }
          if (match.highlights.length > 0) {
            console.log(chalk.yellow(`   Highlights: ${match.highlights.join(', ')}`));
          }
          console.log();
        });
      } catch (error) {
        console.error(chalk.red('❌ Search failed:'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}