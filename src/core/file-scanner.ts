import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';
import { FileQueueItem } from '../types/index.js';

interface FileTypeConfig {
  extensions: string[];
  category: 'config' | 'source' | 'test' | 'docs' | 'other';
  priority: number;
  tokensPerByte: number;
}

export class FileScanner {
  private repoPath: string;
  private ig: ReturnType<typeof ignore>;
  private fileTypeConfigs: Map<string, FileTypeConfig>;

  constructor(repoPath: string, excludePatterns: string[] = []) {
    this.repoPath = path.resolve(repoPath);
    this.ig = ignore();
    this.fileTypeConfigs = this.initializeFileTypeConfigs();
    
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

  private initializeFileTypeConfigs(): Map<string, FileTypeConfig> {
    const configs = new Map<string, FileTypeConfig>();
    
    // Configuration files (highest priority)
    configs.set('config', {
      extensions: ['.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf'],
      category: 'config',
      priority: 90,
      tokensPerByte: 0.4,
    });
    
    // Main entry points and important files
    configs.set('entry', {
      extensions: ['.ts', '.js', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h'],
      category: 'source',
      priority: 80,
      tokensPerByte: 0.3,
    });
    
    // API and service files
    configs.set('api', {
      extensions: ['.ts', '.js', '.py', '.go', '.rs', '.java'],
      category: 'source',
      priority: 75,
      tokensPerByte: 0.3,
    });
    
    // Source files
    configs.set('source', {
      extensions: ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h', '.cs', '.php', '.rb'],
      category: 'source',
      priority: 60,
      tokensPerByte: 0.3,
    });
    
    // Test files (lower priority)
    configs.set('test', {
      extensions: ['.test.ts', '.test.js', '.spec.ts', '.spec.js', '_test.py', '_test.go'],
      category: 'test',
      priority: 30,
      tokensPerByte: 0.3,
    });
    
    // Documentation
    configs.set('docs', {
      extensions: ['.md', '.txt', '.rst', '.adoc'],
      category: 'docs',
      priority: 40,
      tokensPerByte: 0.25,
    });
    
    return configs;
  }

  async scanRepository(): Promise<FileQueueItem[]> {
    const gitignorePath = path.join(this.repoPath, '.gitignore');
    
    try {
      const gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
      this.ig.add(gitignoreContent);
    } catch (_error) {
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
      
      const fileInfo = this.analyzeFile(file, stats);
      
      fileItems.push({
        path: fullPath,
        relativePath: file,
        size: stats.size,
        priority: fileInfo.priority,
        fileType: fileInfo.fileType,
        estimatedTokens: fileInfo.estimatedTokens,
        category: fileInfo.category,
        lastModified: stats.mtime,
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

  private analyzeFile(filePath: string, stats: Awaited<ReturnType<typeof fs.stat>>): {
    priority: number;
    fileType: string;
    estimatedTokens: number;
    category: 'config' | 'source' | 'test' | 'docs' | 'other';
  } {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath);
    
    // Determine file type and base configuration
    const config = this.getFileTypeConfig(filePath, ext);
    let priority = config.priority;
    
    // Special priority adjustments
    if (this.isMainFile(fileName)) {
      priority += 30;
    }
    
    if (this.isAPIFile(filePath)) {
      priority += 20;
    }
    
    if (this.isConfigFile(fileName)) {
      priority += 25;
    }
    
    // Size-based adjustments and token calculation
    const fileSize = Number(stats.size);
    if (fileSize < 100) {
      priority -= 15; // Very small files are less important
    } else if (fileSize > 50000) {
      priority -= 10; // Very large files might be less focused
    }
    
    // Calculate estimated tokens
    const estimatedTokens = Math.ceil(fileSize * config.tokensPerByte);
    
    // Complexity will be determined by AI during crystallization
    
    return {
      priority: Math.max(0, Math.min(100, priority)),
      fileType: ext || 'unknown',
      estimatedTokens,
      category: config.category,
    };
  }

  private getFileTypeConfig(filePath: string, ext: string): FileTypeConfig {
    // Check for test files first
    if (filePath.match(/\.(test|spec)\.(ts|js|py|go|rs)$/) || filePath.includes('__tests__') || filePath.includes('/test/')) {
      return this.fileTypeConfigs.get('test')!;
    }
    
    // Check for API files
    if (this.isAPIFile(filePath)) {
      return this.fileTypeConfigs.get('api')!;
    }
    
    // Check configuration files
    if (this.fileTypeConfigs.get('config')!.extensions.includes(ext)) {
      return this.fileTypeConfigs.get('config')!;
    }
    
    // Check documentation
    if (this.fileTypeConfigs.get('docs')!.extensions.includes(ext)) {
      return this.fileTypeConfigs.get('docs')!;
    }
    
    // Check source files
    if (this.fileTypeConfigs.get('source')!.extensions.includes(ext)) {
      return this.fileTypeConfigs.get('source')!;
    }
    
    // Default to other
    return {
      extensions: [ext],
      category: 'other',
      priority: 20,
      tokensPerByte: 0.3,
    };
  }

  private isMainFile(fileName: string): boolean {
    return /^(index|main|app|server|cli)\.(ts|js|py|go|rs|java)$/.test(fileName) ||
           /^(package\.json|tsconfig\.json|cargo\.toml|go\.mod|requirements\.txt)$/.test(fileName);
  }

  private isAPIFile(filePath: string): boolean {
    return /\/(api|route|controller|handler|service|endpoint)/i.test(filePath) ||
           /\.(api|route|controller|handler|service)\.(ts|js|py|go|rs|java)$/i.test(filePath);
  }

  private isConfigFile(fileName: string): boolean {
    return /^(package\.json|tsconfig\.json|webpack\.config|babel\.config|eslint|prettier|docker|makefile|cargo\.toml|go\.mod|requirements\.txt)/.test(fileName.toLowerCase());
  }

}