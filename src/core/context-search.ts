import { promises as fs } from 'fs';
import path from 'path';
import { SearchResult, ContextBundle, CrystallizedContext } from '../types/index.js';
import { TokenCounter } from '../utils/token-counter.js';

export class ContextSearch {
  private repoPath: string;
  private contextBasePath: string;

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
    this.contextBasePath = path.join(this.repoPath, '.context-crystalizer');
  }

  async searchContexts(query: string, maxTokens: number = 4000, category?: string): Promise<SearchResult[]> {
    const metadataDir = path.join(this.contextBasePath, 'ai-metadata');
    
    try {
      const metadataFiles = await fs.readdir(metadataDir);
      const results: SearchResult[] = [];
      
      for (const file of metadataFiles) {
        if (!file.endsWith('.json')) continue;
        
        const metadataPath = path.join(metadataDir, file);
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        
        // Filter by category if specified
        if (category && metadata.category !== category) continue;
        
        // Calculate relevance score
        const relevanceScore = this.calculateRelevance(query, metadata);
        
        if (relevanceScore > 0) {
          // Load full context
          const context = await this.loadContext(metadata.relativePath);
          if (context) {
            const highlights = this.extractHighlights(query, context);
            results.push({
              context,
              relevanceScore,
              highlights,
            });
          }
        }
      }
      
      // Sort by relevance and filter by token limit
      results.sort((a, b) => b.relevanceScore - a.relevanceScore);
      
      return this.filterByTokenLimit(results, maxTokens);
    } catch (_error) {
      console.error('Error searching contexts:', _error);
      return [];
    }
  }

  async getContextBundle(files: string[], maxTokens: number = 8000): Promise<ContextBundle> {
    const contexts: CrystallizedContext[] = [];
    let totalTokens = 0;
    
    for (const file of files) {
      const context = await this.loadContext(file);
      if (context && context.tokenCount) {
        if (totalTokens + context.tokenCount <= maxTokens) {
          contexts.push(context);
          totalTokens += context.tokenCount;
        } else {
          // Try to fit remaining tokens with a truncated version
          const remainingTokens = maxTokens - totalTokens;
          if (remainingTokens > 100) { // Only include if meaningful space left
            const truncatedContext = this.truncateContext(context, remainingTokens);
            contexts.push(truncatedContext);
            totalTokens = maxTokens;
          }
          break;
        }
      }
    }
    
    return {
      contexts,
      totalTokens,
      query: `Bundle of ${files.length} files`,
    };
  }

  async findRelatedContexts(relativePath: string, maxResults: number = 5): Promise<SearchResult[]> {
    const context = await this.loadContext(relativePath);
    if (!context) return [];
    
    // Build search query from context metadata
    const searchTerms = [
      ...context.keyAPIs.slice(0, 3),
      ...context.dependencies.slice(0, 3),
      ...context.patterns.slice(0, 2),
    ].join(' ');
    
    const results = await this.searchContexts(searchTerms, 2000);
    
    // Filter out the original context and limit results
    return results
      .filter(result => result.context.relativePath !== relativePath)
      .slice(0, maxResults);
  }

  async searchByComplexity(complexity: 'low' | 'medium' | 'high', maxResults: number = 10): Promise<SearchResult[]> {
    const metadataDir = path.join(this.contextBasePath, 'ai-metadata');
    
    try {
      const metadataFiles = await fs.readdir(metadataDir);
      const results: SearchResult[] = [];
      
      for (const file of metadataFiles) {
        if (!file.endsWith('.json')) continue;
        
        const metadataPath = path.join(metadataDir, file);
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        
        if (metadata.complexity === complexity) {
          const context = await this.loadContext(metadata.relativePath);
          if (context) {
            results.push({
              context,
              relevanceScore: 1.0, // All equally relevant for complexity search
              highlights: [],
            });
          }
        }
      }
      
      return results.slice(0, maxResults);
    } catch (_error) {
      console.error('Error searching by complexity:', _error);
      return [];
    }
  }

  private calculateRelevance(query: string, metadata: any): number {
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2);
    
    if (queryTerms.length === 0) return 0;
    
    let score = 0;
    
    // Check relative path (file name is important)
    const pathLower = metadata.relativePath.toLowerCase();
    for (const term of queryTerms) {
      if (pathLower.includes(term)) {
        score += 10;
      }
    }
    
    // Check key APIs (high relevance)
    if (metadata.keyAPIs) {
      for (const api of metadata.keyAPIs) {
        const apiLower = api.toLowerCase();
        for (const term of queryTerms) {
          if (apiLower.includes(term)) {
            score += 8;
          }
        }
      }
    }
    
    // Check dependencies (medium relevance)
    if (metadata.dependencies) {
      for (const dep of metadata.dependencies) {
        const depLower = dep.toLowerCase();
        for (const term of queryTerms) {
          if (depLower.includes(term)) {
            score += 5;
          }
        }
      }
    }
    
    // Check cross-references
    if (metadata.crossReferences) {
      for (const ref of metadata.crossReferences) {
        const targetLower = ref.target.toLowerCase();
        for (const term of queryTerms) {
          if (targetLower.includes(term)) {
            score += 3;
          }
        }
      }
    }
    
    // Bonus for exact matches
    for (const term of queryTerms) {
      if (pathLower === term || metadata.keyAPIs?.some((api: string) => api.toLowerCase() === term)) {
        score += 15;
      }
    }
    
    // Category-based bonuses
    if (queryTerms.some(term => ['config', 'configuration'].includes(term)) && metadata.category === 'config') {
      score += 5;
    }
    if (queryTerms.some(term => ['test', 'testing'].includes(term)) && metadata.category === 'test') {
      score += 5;
    }
    if (queryTerms.some(term => ['api', 'endpoint', 'route'].includes(term))) {
      const pathLower = metadata.relativePath.toLowerCase();
      if (pathLower.includes('api') || pathLower.includes('route') || pathLower.includes('endpoint')) {
        score += 8;
      }
    }
    
    return score;
  }

  private extractHighlights(query: string, context: CrystallizedContext): string[] {
    const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const highlights: string[] = [];
    
    // Highlight matching APIs
    for (const api of context.keyAPIs) {
      for (const term of queryTerms) {
        if (api.toLowerCase().includes(term)) {
          highlights.push(`API: ${api}`);
          break;
        }
      }
    }
    
    // Highlight matching dependencies
    for (const dep of context.dependencies) {
      for (const term of queryTerms) {
        if (dep.toLowerCase().includes(term)) {
          highlights.push(`Dependency: ${dep}`);
          break;
        }
      }
    }
    
    // Highlight purpose if it matches
    const purposeLower = context.purpose.toLowerCase();
    for (const term of queryTerms) {
      if (purposeLower.includes(term)) {
        const sentences = context.purpose.split('.').filter(s => s.trim());
        for (const sentence of sentences) {
          if (sentence.toLowerCase().includes(term)) {
            highlights.push(`Purpose: ${sentence.trim()}`);
            break;
          }
        }
        break;
      }
    }
    
    return highlights.slice(0, 3); // Limit to 3 highlights
  }

  private filterByTokenLimit(results: SearchResult[], maxTokens: number): SearchResult[] {
    const filtered: SearchResult[] = [];
    let totalTokens = 0;
    
    for (const result of results) {
      const contextTokens = result.context.tokenCount || 0;
      if (totalTokens + contextTokens <= maxTokens) {
        filtered.push(result);
        totalTokens += contextTokens;
      } else {
        // Try to fit a truncated version
        const remainingTokens = maxTokens - totalTokens;
        if (remainingTokens > 50) { // Only if meaningful space
          const truncatedContext = this.truncateContext(result.context, remainingTokens);
          filtered.push({
            ...result,
            context: truncatedContext,
          });
        }
        break;
      }
    }
    
    return filtered;
  }

  private truncateContext(context: CrystallizedContext, maxTokens: number): CrystallizedContext {
    // Create a copy and truncate the purpose field primarily
    const truncated = { ...context };
    
    // Keep essential fields and truncate purpose
    if (truncated.purpose) {
      truncated.purpose = TokenCounter.truncateToTokenLimit(truncated.purpose, Math.max(50, maxTokens - 50));
    }
    
    // Limit arrays if needed
    if (maxTokens < 100) {
      truncated.keyAPIs = truncated.keyAPIs.slice(0, 3);
      truncated.dependencies = truncated.dependencies.slice(0, 2);
      truncated.patterns = truncated.patterns.slice(0, 1);
    }
    
    truncated.tokenCount = maxTokens;
    return truncated;
  }

  async loadContext(relativePath: string): Promise<CrystallizedContext | null> {
    try {
      const contextPath = path.join(this.contextBasePath, 'context', `${relativePath  }.context.md`);
      const markdown = await fs.readFile(contextPath, 'utf-8');
      
      // Simple parser - extract key information
      const context = this.parseContextFromMarkdown(markdown, relativePath);
      return context;
    } catch (_error) {
      return null;
    }
  }

  private parseContextFromMarkdown(markdown: string, relativePath: string): CrystallizedContext {
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
    
    // Parse sections
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
}