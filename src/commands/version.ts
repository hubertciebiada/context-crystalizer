import { Command } from 'commander';
import chalk from 'chalk';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createVersionCommand() {
  return new Command('version')
    .description('Display version information')
    .action(async () => {
      try {
        // Read package.json to get the current version
        // From dist/commands/version.js, go up to project root
        const packageJsonPath = path.resolve(__dirname, '../..', 'package.json');
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        
        console.log(chalk.cyan('Context Crystallizer'));
        console.log(chalk.white(`Version: ${chalk.bold(packageJson.version)}`));
        console.log(chalk.gray(`Node.js: ${process.version}`));
        console.log(chalk.gray(`Platform: ${process.platform} ${process.arch}`));
        
        if (packageJson.homepage) {
          console.log(chalk.blue(`Homepage: ${packageJson.homepage}`));
        }
      } catch (error) {
        console.error(chalk.red('❌ Failed to read version information'));
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });
}