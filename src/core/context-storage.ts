import { promises as fs } from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import { CrystallizedContext } from '../types/index.js';
import { TemplateManager } from './template-manager.js';
import { CrossReferenceAnalyzer } from './cross-reference-analyzer.js';
import { TokenCounter } from '../utils/token-counter.js';

export class ContextStorage {
  private repoPath: string;
  private contextBasePath: string;
  private templateManager: TemplateManager;
  private allFiles: string[] = [];
  
  // Concurrent index operation support
  private indexMutex = pLimit(1); // Mutex: only 1 agent can update index at a time

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
    this.contextBasePath = path.join(this.repoPath, '.context-crystallizer');
    this.templateManager = new TemplateManager();
  }

  async initialize(allFiles: string[]): Promise<void> {
    this.allFiles = allFiles;
    await fs.mkdir(this.contextBasePath, { recursive: true });
    await fs.mkdir(path.join(this.contextBasePath, 'context'), { recursive: true });
    await fs.mkdir(path.join(this.contextBasePath, 'ai-metadata'), { recursive: true });
  }

  async storeContext(
    filePath: string, 
    context: Partial<CrystallizedContext>,
    fileContent?: string,
    fileMetadata?: { category: 'config' | 'source' | 'test' | 'docs' | 'other'; estimatedTokens: number }
  ): Promise<void> {
    // Ensure we always work with relative paths for portability
    const relativePath = path.isAbsolute(filePath) 
      ? path.relative(this.repoPath, filePath)
      : filePath;
    const contextPath = this.getContextPath(relativePath);
    const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.join(this.repoPath, filePath);
    
    // Determine template based on category and estimated tokens (complexity will be determined by AI)
    const template = context.template || this.templateManager.determineTemplateForFile(
      'medium', // Default complexity for template selection, AI will determine actual complexity
      fileMetadata?.category || 'other',
      fileMetadata?.estimatedTokens || 1000
    );

    // Analyze cross-references if file content is provided
    let crossReferences = context.crossReferences || [];
    if (fileContent && this.allFiles.length > 0) {
      crossReferences = CrossReferenceAnalyzer.analyzeFileReferences(absoluteFilePath, fileContent, this.allFiles);
    }
    
    const fullContext: CrystallizedContext = {
      filePath: relativePath, // Store only relative paths for portability
      relativePath,
      purpose: context.purpose || '',
      keyTerms: context.keyTerms || [],
      dependencies: context.dependencies || [],
      patterns: context.patterns || [],
      relatedContexts: context.relatedContexts || [],
      lastModified: new Date(),
      template,
      complexity: (context.complexity as 'low' | 'medium' | 'high') || 'medium',
      category: fileMetadata?.category || 'other',
      crossReferences,
      aiGuidance: context.aiGuidance,
      errorHandling: context.errorHandling,
      integrationPoints: context.integrationPoints,
    };
    
    // Generate markdown and calculate token count
    const markdown = this.templateManager.generateContextMarkdown(fullContext);
    fullContext.tokenCount = TokenCounter.countMarkdownTokens(markdown);
    
    // Validate context
    const validation = this.templateManager.validateContext(fullContext);
    if (!validation.isValid) {
      console.warn(`Context validation failed for ${relativePath}:`, validation.errors);
    }
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(contextPath), { recursive: true });
    
    // Write context as markdown
    await fs.writeFile(contextPath, markdown, 'utf-8');
    
    // Store metadata
    await this.storeMetadata(fullContext);
    
    // Update index
    await this.updateIndex(fullContext);
  }

  async getContext(relativePath: string): Promise<CrystallizedContext | null> {
    const contextPath = this.getContextPath(relativePath);
    
    try {
      const content = await fs.readFile(contextPath, 'utf-8');
      return this.parseMarkdownContext(content, relativePath);
    } catch (_error) {
      return null;
    }
  }

  private async storeMetadata(context: CrystallizedContext): Promise<void> {
    const metadataPath = path.join(this.contextBasePath, 'ai-metadata', `${context.relativePath.replace(/\//g, '_')}.json`);
    
    const metadata = {
      relativePath: context.relativePath,
      template: context.template,
      complexity: context.complexity,
      category: context.category,
      tokenCount: context.tokenCount,
      lastModified: context.lastModified,
      crossReferences: context.crossReferences,
      keyTerms: context.keyTerms,
      dependencies: context.dependencies,
    };
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }

  private getContextPath(relativePath: string): string {
    // Create a directory structure that mirrors the source
    const contextRelativePath = `${relativePath  }.context.md`;
    return path.join(this.contextBasePath, 'context', contextRelativePath);
  }


  private parseMarkdownContext(markdown: string, relativePath: string): CrystallizedContext {
    // Extract metadata from comments
    const templateMatch = markdown.match(/<!-- Template: (\w+) -->/);
    const categoryMatch = markdown.match(/<!-- Category: (\w+) -->/);
    const complexityMatch = markdown.match(/<!-- Complexity: (\w+) -->/);
    const tokenMatch = markdown.match(/<!-- Tokens: (\d+) -->/);
    
    const context: CrystallizedContext = {
      filePath: relativePath, // Store only relative paths for portability
      relativePath,
      purpose: '',
      keyTerms: [],
      dependencies: [],
      patterns: [],
      relatedContexts: [],
      lastModified: new Date(),
      template: (templateMatch?.[1] as 'overview' | 'standard' | 'detailed') || 'standard',
      complexity: (complexityMatch?.[1] as 'low' | 'medium' | 'high') || 'medium',
      category: (categoryMatch?.[1] as 'config' | 'source' | 'test' | 'docs' | 'other') || 'other',
      crossReferences: [],
      tokenCount: tokenMatch ? parseInt(tokenMatch[1]) : undefined,
    };
    
    const sections = markdown.split(/^## /m);
    
    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const title = lines[0]?.toLowerCase();
      
      if (title?.includes('purpose')) {
        context.purpose = lines.slice(1).join('\n').trim();
      } else if (title?.includes('key terms')) {
        context.keyTerms = lines.slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2));
      } else if (title?.includes('dependencies')) {
        context.dependencies = lines.slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2));
      } else if (title?.includes('patterns')) {
        context.patterns = lines.slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2));
      } else if (title?.includes('guidance')) {
        context.aiGuidance = lines.slice(1).join('\n').trim();
      } else if (title?.includes('error')) {
        context.errorHandling = lines.slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2));
      } else if (title?.includes('integration')) {
        context.integrationPoints = lines.slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => line.substring(2));
      } else if (title?.includes('cross references')) {
        context.crossReferences = lines.slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => {
            const match = line.match(/\*\*(\w+)\*\*:\s*`([^`]+)`(.*)/);
            if (match) {
              return {
                type: match[1] as any,
                target: match[2],
                description: match[3]?.replace(/^\s*-\s*/, '').trim(),
              };
            }
            return null;
          })
          .filter(Boolean) as any[];
      } else if (title?.includes('related')) {
        context.relatedContexts = lines.slice(1)
          .filter(line => line.startsWith('- '))
          .map(line => {
            const match = line.match(/\[(.*?)\]/);
            return match ? match[1] : '';
          })
          .filter(Boolean);
      }
    });
    
    return context;
  }

  private async updateIndex(_context: CrystallizedContext): Promise<void> {
    // Critical section: only one agent can update index at a time
    return this.indexMutex(async () => {
      // Regenerate the entire index for consistency
      await this.regenerateFullIndex();
    });
  }

  private async regenerateFullIndex(): Promise<void> {
    const indexPath = path.join(this.contextBasePath, 'ai-index.md');
    const metadataDir = path.join(this.contextBasePath, 'ai-metadata');
    
    try {
      const metadataFiles = await fs.readdir(metadataDir);
      const contexts: any[] = [];
      
      for (const file of metadataFiles) {
        if (file.endsWith('.json')) {
          const content = await fs.readFile(path.join(metadataDir, file), 'utf-8');
          contexts.push(JSON.parse(content));
        }
      }
      
      // Generate statistics
      const totalTokens = contexts.reduce((sum, ctx) => sum + (ctx.tokenCount || 0), 0);
      
      // Build compact AI-optimized index
      const lines = [
        `# 🔍 AI Context Index | ${contexts.length} files | ${Math.round(totalTokens/1000)}K tokens`,
        '',
      ];

      // Sort contexts by priority: complexity (high->low) then by token count (high->low)
      const sortedContexts = contexts.sort((a, b) => {
        const complexityOrder: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1 };
        const complexityDiff = (complexityOrder[b.complexity] || 1) - (complexityOrder[a.complexity] || 1);
        if (complexityDiff !== 0) return complexityDiff;
        return (b.tokenCount || 0) - (a.tokenCount || 0);
      });

      // Generate compact entries
      sortedContexts.forEach(ctx => {
        const complexityBadge = ctx.complexity === 'high' ? '🔴' : ctx.complexity === 'medium' ? '🟡' : '🟢';
        const tokens = ctx.tokenCount ? `${ctx.tokenCount}t` : '0t';
        
        // Keep full file path for AI tools to open files correctly
        const fullPath = ctx.relativePath;
        
        // Compress and abbreviate key terms (preserve searchability while saving tokens)
        const compressedTerms = (ctx.keyTerms || [])
          .slice(0, 8) // Limit to 8 most important terms
          .map((term: string) => term
            .replace(/authentication/g, 'auth')
            .replace(/configuration/g, 'config')
            .replace(/database/g, 'db')
            .replace(/middleware/g, 'mw')
            .replace(/management/g, 'mgmt')
            .replace(/application/g, 'app')
            .replace(/endpoint/g, 'ep')
            .replace(/service/g, 'svc'))
          .join(',');
        
        lines.push(`${complexityBadge} [${fullPath}](./context/${fullPath}.context.md) (${tokens}) ${compressedTerms}`);
      });
      
      lines.push('---');
      lines.push(`*Generated: ${new Date().toISOString()}*`);
      
      await fs.writeFile(indexPath, lines.join('\n'), 'utf-8');
    } catch (_error) {
      console.warn('Failed to regenerate index:', _error);
    }
  }

  async getContextStatistics(): Promise<{
    totalContexts: number;
    byCategory: Record<string, number>;
    byTemplate: Record<string, number>;
    totalTokens: number;
    avgTokensPerContext: number;
  }> {
    // Use index mutex to ensure consistent read during potential index updates
    return this.indexMutex(async () => {
      const metadataDir = path.join(this.contextBasePath, 'ai-metadata');
      
      try {
        const metadataFiles = await fs.readdir(metadataDir);
        const contexts: any[] = [];
        
        for (const file of metadataFiles) {
          if (file.endsWith('.json')) {
            const content = await fs.readFile(path.join(metadataDir, file), 'utf-8');
            contexts.push(JSON.parse(content));
          }
        }
        
        const byCategory: Record<string, number> = {};
        const byTemplate: Record<string, number> = {};
        let totalTokens = 0;
        
        contexts.forEach(ctx => {
          byCategory[ctx.category] = (byCategory[ctx.category] || 0) + 1;
          byTemplate[ctx.template] = (byTemplate[ctx.template] || 0) + 1;
          totalTokens += ctx.tokenCount || 0;
        });
        
        return {
          totalContexts: contexts.length,
          byCategory,
          byTemplate,
          totalTokens,
          avgTokensPerContext: contexts.length > 0 ? totalTokens / contexts.length : 0,
        };
      } catch (_error) {
        return {
          totalContexts: 0,
          byCategory: {},
          byTemplate: {},
          totalTokens: 0,
          avgTokensPerContext: 0,
        };
      }
    });
  }
}