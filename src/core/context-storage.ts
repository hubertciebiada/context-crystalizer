import { promises as fs } from 'fs';
import path from 'path';
import { CrystallizedContext } from '../types/index.js';

export class ContextStorage {
  private repoPath: string;
  private contextBasePath: string;

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
    this.contextBasePath = path.join(this.repoPath, '.context-crystal');
  }

  async storeContext(filePath: string, context: Partial<CrystallizedContext>): Promise<void> {
    const relativePath = path.relative(this.repoPath, filePath);
    const contextPath = this.getContextPath(relativePath);
    
    const fullContext: CrystallizedContext = {
      filePath,
      relativePath,
      purpose: context.purpose || '',
      keyAPIs: context.keyAPIs || [],
      dependencies: context.dependencies || [],
      patterns: context.patterns || [],
      relatedContexts: context.relatedContexts || [],
      lastModified: new Date(),
      tokenCount: context.tokenCount,
    };
    
    // Ensure directory exists
    await fs.mkdir(path.dirname(contextPath), { recursive: true });
    
    // Write context as markdown
    const markdown = this.formatContextAsMarkdown(fullContext);
    await fs.writeFile(contextPath, markdown, 'utf-8');
    
    // Update index
    await this.updateIndex(fullContext);
  }

  async getContext(relativePath: string): Promise<CrystallizedContext | null> {
    const contextPath = this.getContextPath(relativePath);
    
    try {
      const content = await fs.readFile(contextPath, 'utf-8');
      return this.parseMarkdownContext(content, relativePath);
    } catch (error) {
      return null;
    }
  }

  private getContextPath(relativePath: string): string {
    const contextFileName = relativePath.replace(/\//g, '_') + '.context.md';
    return path.join(this.contextBasePath, 'context', contextFileName);
  }

  private formatContextAsMarkdown(context: CrystallizedContext): string {
    const lines: string[] = [
      `# AI Context: ${context.relativePath}`,
      '',
      '## Purpose',
      context.purpose,
      '',
    ];
    
    if (context.keyAPIs.length > 0) {
      lines.push('## Key APIs for AI');
      context.keyAPIs.forEach(api => {
        lines.push(`- ${api}`);
      });
      lines.push('');
    }
    
    if (context.dependencies.length > 0) {
      lines.push('## Context Dependencies');
      context.dependencies.forEach(dep => {
        lines.push(`- ${dep}`);
      });
      lines.push('');
    }
    
    if (context.patterns.length > 0) {
      lines.push('## AI Implementation Patterns');
      context.patterns.forEach(pattern => {
        lines.push(`- ${pattern}`);
      });
      lines.push('');
    }
    
    if (context.relatedContexts.length > 0) {
      lines.push('## Related Contexts');
      context.relatedContexts.forEach(related => {
        lines.push(`- [${related}](./${related.replace(/\//g, '_')}.context.md)`);
      });
      lines.push('');
    }
    
    lines.push(`---`);
    lines.push(`*Last updated: ${context.lastModified.toISOString()}*`);
    if (context.tokenCount) {
      lines.push(`*Token count: ${context.tokenCount}*`);
    }
    
    return lines.join('\n');
  }

  private parseMarkdownContext(markdown: string, relativePath: string): CrystallizedContext {
    // Simple parser - in production, use a proper markdown parser
    const context: CrystallizedContext = {
      filePath: path.join(this.repoPath, relativePath),
      relativePath,
      purpose: '',
      keyAPIs: [],
      dependencies: [],
      patterns: [],
      relatedContexts: [],
      lastModified: new Date(),
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

  private async updateIndex(context: CrystallizedContext): Promise<void> {
    const indexPath = path.join(this.contextBasePath, 'ai-index.md');
    
    // Read existing index or create new
    let indexContent = '# AI Context Index\n\n';
    
    try {
      indexContent = await fs.readFile(indexPath, 'utf-8');
    } catch (error) {
      // Index doesn't exist yet
    }
    
    // Add/update entry
    const entry = `- [${context.relativePath}](./context/${context.relativePath.replace(/\//g, '_')}.context.md) - ${context.purpose.split('\n')[0]}`;
    
    if (!indexContent.includes(context.relativePath)) {
      indexContent += entry + '\n';
    } else {
      // Update existing entry
      const lines = indexContent.split('\n');
      const updatedLines = lines.map(line => {
        if (line.includes(context.relativePath)) {
          return entry;
        }
        return line;
      });
      indexContent = updatedLines.join('\n');
    }
    
    await fs.mkdir(this.contextBasePath, { recursive: true });
    await fs.writeFile(indexPath, indexContent, 'utf-8');
  }
}