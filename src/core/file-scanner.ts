import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';
import { FileQueueItem } from '../types/index.js';

export class FileScanner {
  private repoPath: string;
  private ig: ReturnType<typeof ignore>;

  constructor(repoPath: string, excludePatterns: string[] = []) {
    this.repoPath = path.resolve(repoPath);
    this.ig = ignore();
    
    // Add default patterns
    this.ig.add([
      'node_modules/**',
      '.git/**',
      'dist/**',
      'build/**',
      '*.log',
      '*.tmp',
      '.DS_Store',
      ...excludePatterns,
    ]);
  }

  async scanRepository(): Promise<FileQueueItem[]> {
    const gitignorePath = path.join(this.repoPath, '.gitignore');
    
    try {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      this.ig.add(gitignoreContent);
    } catch (error) {
      // .gitignore might not exist
    }

    const files = await glob('**/*', {
      cwd: this.repoPath,
      nodir: true,
      dot: true,
      absolute: false,
    });

    const relevantFiles = files.filter(file => !this.ig.ignores(file));
    
    const fileItems: FileQueueItem[] = [];
    
    for (const file of relevantFiles) {
      const fullPath = path.join(this.repoPath, file);
      const stats = await fs.stat(fullPath);
      
      // Skip very large files (>1MB)
      if (stats.size > 1024 * 1024) continue;
      
      // Skip binary files
      if (await this.isBinaryFile(fullPath)) continue;
      
      fileItems.push({
        path: fullPath,
        relativePath: file,
        size: stats.size,
        priority: this.calculatePriority(file, stats.size),
      });
    }
    
    // Sort by priority (higher priority first)
    return fileItems.sort((a, b) => b.priority - a.priority);
  }

  async readFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf-8');
  }

  private async isBinaryFile(filePath: string): Promise<boolean> {
    const buffer = Buffer.alloc(512);
    const fd = await fs.open(filePath, 'r');
    
    try {
      await fd.read(buffer, 0, 512, 0);
      
      // Check for null bytes (common in binary files)
      for (let i = 0; i < buffer.length; i++) {
        if (buffer[i] === 0) return true;
      }
      
      return false;
    } finally {
      await fd.close();
    }
  }

  private calculatePriority(filePath: string, size: number): number {
    let priority = 50; // Base priority
    
    // Prioritize configuration and main files
    if (filePath.match(/^(package\.json|tsconfig\.json|README\.md|index\.[jt]s)$/)) {
      priority += 40;
    }
    
    // Prioritize source files
    if (filePath.match(/\.(ts|js|py|java|go|rs)$/)) {
      priority += 20;
    }
    
    // Prioritize API/route files
    if (filePath.match(/(api|route|controller|handler|service)/i)) {
      priority += 15;
    }
    
    // Deprioritize test files
    if (filePath.match(/\.(test|spec)\./)) {
      priority -= 20;
    }
    
    // Deprioritize very small files
    if (size < 100) {
      priority -= 10;
    }
    
    return Math.max(0, Math.min(100, priority));
  }
}