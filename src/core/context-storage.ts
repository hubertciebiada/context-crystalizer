import { promises as fs } from 'fs';
import path from 'path';
import { CrystallizedContext } from '../types/index.js';
import { TemplateManager } from './template-manager.js';
import { CrossReferenceAnalyzer } from './cross-reference-analyzer.js';
import { TokenCounter } from '../utils/token-counter.js';

export class ContextStorage {
  private repoPath: string;
  private contextBasePath: string;
  private templateManager: TemplateManager;
  private allFiles: string[] = [];

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
    this.contextBasePath = path.join(this.repoPath, '.context-crystalizer');
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
      keyAPIs: context.keyAPIs || [],
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
      keyAPIs: context.keyAPIs,
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
      keyAPIs: [],
      dependencies: [],
      patterns: [],
      relatedContexts: [],
      lastModified: new Date(),
      template: (templateMatch?.[1] as 'short' | 'extended') || 'short',
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
      } else if (title?.includes('key apis')) {
        context.keyAPIs = lines.slice(1)
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
    // Regenerate the entire index for consistency
    await this.regenerateFullIndex();
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
      
      // Group by category
      const byCategory: Record<string, any[]> = {};
      contexts.forEach(ctx => {
        if (!byCategory[ctx.category]) byCategory[ctx.category] = [];
        byCategory[ctx.category].push(ctx);
      });
      
      // Generate statistics
      const totalTokens = contexts.reduce((sum, ctx) => sum + (ctx.tokenCount || 0), 0);
      const categoryStats = Object.entries(byCategory).map(([cat, ctxs]) => `${cat}: ${ctxs.length}`).join(', ');
      const templateStats = contexts.reduce((acc, ctx) => {
        acc[ctx.template] = (acc[ctx.template] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const templateStatsStr = Object.entries(templateStats).map(([template, count]) => `${template}: ${count}`).join(', ');
      
      // Build index content
      const lines = [
        '# Crystallized Context Index',
        '',
        '## Overview',
        'This index provides an AI-optimized overview of all crystallized contexts in this repository.',
        '',
        '## Statistics',
        `- Total contexts: ${contexts.length}`,
        `- By category: ${categoryStats}`,
        `- By template: ${templateStatsStr}`,
        `- Total tokens: ${totalTokens}`,
        '',
        '## Complexity Legend',
        '- 🟢 **Low complexity**: Simple files, easy to understand',
        '- 🟡 **Medium complexity**: Moderate complexity, standard logic',
        '- 🔴 **High complexity**: Complex files requiring careful analysis',
        '',
        '## Contexts by Category',
        '',
      ];
      
      // Add contexts grouped by category
      Object.entries(byCategory).forEach(([category, ctxs]) => {
        lines.push(`### ${category.charAt(0).toUpperCase() + category.slice(1)}`);
        lines.push('');
        
        ctxs.forEach(ctx => {
          const contextPath = `./context/${ctx.relativePath}.context.md`;
          const tokenInfo = ctx.tokenCount ? ` (${ctx.tokenCount} tokens)` : '';
          const complexityBadge = ctx.complexity === 'high' ? '🔴' : ctx.complexity === 'medium' ? '🟡' : '🟢';
          lines.push(`- ${complexityBadge} [${ctx.relativePath}](${contextPath})${tokenInfo}`);
          
          if (ctx.keyAPIs?.length > 0) {
            lines.push(`  - APIs: ${ctx.keyAPIs.slice(0, 3).join(', ')}${ctx.keyAPIs.length > 3 ? '...' : ''}`);
          }
        });
        lines.push('');
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
  }
}