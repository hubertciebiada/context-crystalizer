import { ContextTemplate, TemplateSection, CrystallizedContext } from '../types/index.js';
import { TokenCounter } from '../utils/token-counter.js';

export class TemplateManager {
  private templates: Map<string, ContextTemplate>;

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Short template for quick crystallized context (max 200 tokens)
    this.templates.set('short', {
      name: 'short',
      maxTokens: 200,
      sections: [
        { name: 'purpose', required: true, maxTokens: 80, format: 'text' },
        { name: 'keyTerms', required: true, maxTokens: 60, format: 'list' },
        { name: 'dependencies', required: false, maxTokens: 40, format: 'list' },
        { name: 'relatedContexts', required: false, maxTokens: 20, format: 'list' },
      ],
    });

    // Extended template for detailed crystallized context (max 2000 tokens)
    this.templates.set('extended', {
      name: 'extended',
      maxTokens: 2000,
      sections: [
        { name: 'purpose', required: true, maxTokens: 200, format: 'text' },
        { name: 'keyTerms', required: true, maxTokens: 400, format: 'list' },
        { name: 'dependencies', required: false, maxTokens: 200, format: 'list' },
        { name: 'patterns', required: false, maxTokens: 400, format: 'list' },
        { name: 'aiGuidance', required: false, maxTokens: 300, format: 'markdown' },
        { name: 'errorHandling', required: false, maxTokens: 200, format: 'list' },
        { name: 'integrationPoints', required: false, maxTokens: 200, format: 'list' },
        { name: 'crossReferences', required: false, maxTokens: 100, format: 'list' },
        { name: 'relatedContexts', required: false, maxTokens: 100, format: 'list' },
      ],
    });
  }

  getTemplate(name: string): ContextTemplate | null {
    return this.templates.get(name) || null;
  }

  generateContextMarkdown(context: CrystallizedContext): string {
    const template = this.getTemplate(context.template) || this.getTemplate('short')!;
    const lines: string[] = [];

    // Header
    lines.push(`# Crystallized Context: ${context.relativePath}`);
    lines.push('');

    // Metadata
    lines.push('<!-- Crystallized Context Metadata -->');
    lines.push(`<!-- Template: ${context.template} -->`);
    lines.push(`<!-- Category: ${context.category} -->`);
    lines.push(`<!-- Complexity: ${context.complexity} -->`);
    lines.push(`<!-- Generated: ${context.lastModified.toISOString()} -->`);
    if (context.tokenCount) {
      lines.push(`<!-- Tokens: ${context.tokenCount} -->`);
    }
    lines.push('');

    // Generate sections based on template
    for (const section of template.sections) {
      const content = this.generateSection(section, context);
      if (content) {
        lines.push(content);
        lines.push('');
      }
    }

    // Footer with references
    if (context.crossReferences.length > 0) {
      lines.push('## Cross References');
      context.crossReferences.forEach(ref => {
        const desc = ref.description ? ` - ${ref.description}` : '';
        lines.push(`- **${ref.type}**: \`${ref.target}\`${desc}`);
      });
      lines.push('');
    }

    lines.push('---');
    lines.push(`*Last updated: ${context.lastModified.toISOString()}*`);
    if (context.tokenCount) {
      lines.push(`*Token count: ${context.tokenCount}*`);
    }

    const markdown = lines.join('\n');
    
    // Optimize for token count
    return TokenCounter.optimizeContent(markdown, template.maxTokens);
  }

  private generateSection(section: TemplateSection, context: CrystallizedContext): string | null {
    const sectionData = this.getSectionData(section.name, context);
    
    if (!sectionData && !section.required) {
      return null;
    }

    const title = this.getSectionTitle(section.name);
    const content = this.formatSectionContent(sectionData, section);
    
    if (!content && section.required) {
      return `## ${title}\n*No ${section.name} information available*`;
    }
    
    if (!content) {
      return null;
    }

    return `## ${title}\n${content}`;
  }

  private getSectionData(sectionName: string, context: CrystallizedContext): any {
    switch (sectionName) {
      case 'purpose': return context.purpose;
      case 'keyTerms': return context.keyTerms;
      case 'dependencies': return context.dependencies;
      case 'patterns': return context.patterns;
      case 'aiGuidance': return context.aiGuidance;
      case 'errorHandling': return context.errorHandling;
      case 'integrationPoints': return context.integrationPoints;
      case 'crossReferences': return context.crossReferences;
      case 'relatedContexts': return context.relatedContexts;
      default: return null;
    }
  }

  private getSectionTitle(sectionName: string): string {
    const titles: Record<string, string> = {
      purpose: 'Purpose',
      keyTerms: 'Key Terms for Search',
      dependencies: 'Context Dependencies',
      patterns: 'AI Implementation Patterns',
      aiGuidance: 'AI Guidance',
      errorHandling: 'Error Handling',
      integrationPoints: 'Integration Points',
      crossReferences: 'Cross References',
      relatedContexts: 'Related Contexts',
    };
    return titles[sectionName] || sectionName;
  }

  private formatSectionContent(data: any, section: TemplateSection): string | null {
    if (!data) return null;

    let content = '';

    switch (section.format) {
      case 'text':
        content = String(data);
        break;
      
      case 'list':
        if (Array.isArray(data) && data.length > 0) {
          content = data.map(item => `- ${item}`).join('\n');
        } else {
          return null;
        }
        break;
      
      case 'markdown':
        content = String(data);
        break;
      
      case 'code':
        content = `\`\`\`\n${String(data)}\n\`\`\``;
        break;
    }

    // Apply token limits if specified
    if (section.maxTokens) {
      content = TokenCounter.truncateToTokenLimit(content, section.maxTokens, section.format === 'code');
    }

    return content;
  }

  determineTemplateForFile(
    complexity: 'low' | 'medium' | 'high', 
    category: 'config' | 'source' | 'test' | 'docs' | 'other',
    estimatedTokens: number
  ): 'short' | 'extended' {
    // Use extended template for:
    // - High complexity files
    // - Source files that are medium/high complexity
    // - Files with many estimated tokens (likely complex)
    if (complexity === 'high' || 
        (category === 'source' && complexity === 'medium') ||
        estimatedTokens > 2000) {
      return 'extended';
    }
    
    return 'short';
  }

  validateContext(context: CrystallizedContext): { isValid: boolean; errors: string[] } {
    const template = this.getTemplate(context.template);
    const errors: string[] = [];

    if (!template) {
      errors.push(`Unknown template: ${context.template}`);
      return { isValid: false, errors };
    }

    // Check required sections
    for (const section of template.sections) {
      if (section.required) {
        const data = this.getSectionData(section.name, context);
        if (!data || (Array.isArray(data) && data.length === 0)) {
          errors.push(`Required section '${section.name}' is missing or empty`);
        }
      }
    }

    // Check token count if available
    if (context.tokenCount && context.tokenCount > template.maxTokens) {
      errors.push(`Token count (${context.tokenCount}) exceeds template limit (${template.maxTokens})`);
    }

    return { isValid: errors.length === 0, errors };
  }
}