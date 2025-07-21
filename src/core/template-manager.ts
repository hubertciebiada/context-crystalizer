import { promises as fs } from 'fs';
import path from 'path';
import Mustache from 'mustache';
import { ContextTemplate, CrystallizedContext, ParsedTemplate } from '../types/index.js';
import { TokenCounter } from '../utils/token-counter.js';

export class TemplateManager {
  private templates: Map<string, ContextTemplate>;
  private parsedTemplates: Map<string, ParsedTemplate> = new Map();
  private static readonly TOKEN_PLACEHOLDER = '{{TOKEN_COUNT}}';

  constructor() {
    this.templates = new Map();
    this.initializeTemplates();
  }

  private initializeTemplates(): void {
    // Overview template for ultra-compact analysis (max 50 tokens)
    this.templates.set('overview', {
      name: 'overview',
      maxTokens: 50,
      sections: [
        { name: 'purpose', required: true, maxTokens: 20, format: 'text' },
        { name: 'keyTerms', required: true, maxTokens: 25, format: 'list' },
        { name: 'category', required: true, maxTokens: 5, format: 'text' },
      ],
    });

    // Standard template for regular analysis (max 200 tokens)
    this.templates.set('standard', {
      name: 'standard',
      maxTokens: 200,
      sections: [
        { name: 'purpose', required: true, maxTokens: 55, format: 'text' },
        { name: 'keyTerms', required: true, maxTokens: 45, format: 'list' },
        { name: 'dependencies', required: false, maxTokens: 30, format: 'list' },
        { name: 'patterns', required: false, maxTokens: 40, format: 'list' },
        { name: 'relatedContexts', required: false, maxTokens: 30, format: 'list' },
      ],
    });

    // Detailed template for comprehensive analysis (max 2000 tokens)
    this.templates.set('detailed', {
      name: 'detailed',
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
    const parsedTemplate = this.parsedTemplates.get(context.template);
    
    if (!parsedTemplate) {
      throw new Error(`Template '${context.template}' not found. Ensure templates are loaded from .context-crystallizer/templates/ directory.`);
    }
    
    return this.generateFromMustacheTemplate(context, parsedTemplate);
  }

  private generateFromMustacheTemplate(context: CrystallizedContext, template: ParsedTemplate): string {
    // Prepare data for Mustache with computed properties
    const templateData = {
      ...context,
      lastModified: context.lastModified.toISOString(),
      TOKEN_COUNT: TemplateManager.TOKEN_PLACEHOLDER,
      // Add .length properties for conditional rendering
      keyTerms: context.keyTerms || [],
      dependencies: context.dependencies || [],
      patterns: context.patterns || [],
      relatedContexts: context.relatedContexts || [],
      errorHandling: context.errorHandling || [],
      integrationPoints: context.integrationPoints || [],
      crossReferences: context.crossReferences || []
    };

    // Add computed length properties for conditionals
    (templateData as any)['keyTerms.length'] = templateData.keyTerms.length;
    (templateData as any)['dependencies.length'] = templateData.dependencies.length;
    (templateData as any)['patterns.length'] = templateData.patterns.length;
    (templateData as any)['relatedContexts.length'] = templateData.relatedContexts.length;
    (templateData as any)['errorHandling.length'] = templateData.errorHandling.length;
    (templateData as any)['integrationPoints.length'] = templateData.integrationPoints.length;
    (templateData as any)['crossReferences.length'] = templateData.crossReferences.length;

    // Render with Mustache
    const rendered = Mustache.render(template.outputTemplate, templateData);
    
    // Optimize for token count
    return TokenCounter.optimizeContent(rendered, template.maxTokens);
  }


  replaceTokenPlaceholder(markdown: string, tokenCount: number): string {
    // Replace all instances of the token placeholder with the actual count
    // If placeholder not found, return markdown unchanged (graceful fallback)
    return markdown.replace(new RegExp(TemplateManager.TOKEN_PLACEHOLDER, 'g'), tokenCount.toString());
  }

  async loadTemplatesFromFiles(templatesDir: string): Promise<void> {
    const templateFiles = [
      { name: 'overview', guidanceFile: 'overview-guidance.md', outputFile: 'overview-output.mustache' },
      { name: 'standard', guidanceFile: 'standard-guidance.md', outputFile: 'standard-output.mustache' },
      { name: 'detailed', guidanceFile: 'detailed-guidance.md', outputFile: 'detailed-output.mustache' }
    ];

    for (const { name, guidanceFile, outputFile } of templateFiles) {
      const guidancePath = path.join(templatesDir, 'guidance', guidanceFile);
      const outputPath = path.join(templatesDir, 'output', outputFile);
      
      try {
        const guidanceContent = await fs.readFile(guidancePath, 'utf-8');
        const outputTemplate = await fs.readFile(outputPath, 'utf-8');
        
        const parsed = this.parseTemplate(guidanceContent, outputTemplate, name);
        this.parsedTemplates.set(name, parsed);
      } catch (error) {
        throw new Error(`Failed to load required template '${name}' from ${guidancePath} or ${outputPath}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private parseTemplate(guidanceContent: string, outputTemplate: string, name: string): ParsedTemplate {
    if (!guidanceContent.trim()) {
      throw new Error(`Template '${name}' has empty guidance content. Please provide analysis guidance.`);
    }

    if (!outputTemplate.trim()) {
      throw new Error(`Template '${name}' has empty output template. Please provide a Mustache template.`);
    }

    return {
      name,
      guidance: guidanceContent.trim(),
      outputTemplate: outputTemplate.trim(),
      maxTokens: this.getDefaultMaxTokens(name)
    };
  }

  private getDefaultMaxTokens(templateName: string): number {
    switch (templateName) {
      case 'overview': return 50;
      case 'standard': return 200;
      case 'detailed': return 2000;
      default: return 200;
    }
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
      case 'category': return context.category;
      case 'complexity': return context.complexity;
      default: return null;
    }
  }



  determineTemplateForFile(
    complexity: 'low' | 'medium' | 'high', 
    category: 'config' | 'source' | 'test' | 'docs' | 'other',
    estimatedTokens: number
  ): 'overview' | 'standard' | 'detailed' {
    // Use detailed template for:
    // - High complexity files
    // - Source files that are medium/high complexity  
    // - Files with many estimated tokens (likely complex)
    if (complexity === 'high' || 
        (category === 'source' && complexity === 'medium') ||
        estimatedTokens > 2000) {
      return 'detailed';
    }
    
    // Use standard template for most files
    if (complexity === 'medium' || category === 'source' || estimatedTokens > 500) {
      return 'standard';
    }
    
    // Use overview template for simple files
    return 'overview';
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