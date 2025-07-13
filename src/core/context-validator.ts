import { promises as fs } from 'fs';
import path from 'path';
import { CrystallizedContext, ValidationResult, ValidationIssue, QualityMetrics } from '../types/index.js';

export interface ProjectQualityReport {
  overallScore: number;
  totalContexts: number;
  categoryScores: Record<string, number>;
  commonIssues: { issue: string; count: number }[];
  recommendations: string[];
  metrics: {
    avgTokensPerContext: number;
    tokenEfficiencyRating: 'excellent' | 'good' | 'fair' | 'poor';
    coverageCompleteness: number;
    crossReferenceRatio: number;
  };
}

export class ContextValidator {
  private repoPath: string;
  private contextBasePath: string;

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
    this.contextBasePath = path.join(this.repoPath, '.context-crystalizer');
  }

  async validateContext(context: CrystallizedContext): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    const metrics: QualityMetrics = {
      completeness: 0,
      specificity: 0,
      aiReadability: 0,
      tokenEfficiency: 0,
      crossReferenceQuality: 0,
    };

    // Check completeness
    metrics.completeness = this.assessCompleteness(context, issues);
    
    // Check specificity and usefulness
    metrics.specificity = this.assessSpecificity(context, issues);
    
    // Check AI readability
    metrics.aiReadability = this.assessAIReadability(context, issues);
    
    // Check token efficiency
    metrics.tokenEfficiency = this.assessTokenEfficiency(context, issues);
    
    // Check cross-reference quality
    metrics.crossReferenceQuality = this.assessCrossReferences(context, issues);

    // Calculate overall score
    const score = Math.round(
      (metrics.completeness * 0.25) +
      (metrics.specificity * 0.25) +
      (metrics.aiReadability * 0.25) +
      (metrics.tokenEfficiency * 0.15) +
      (metrics.crossReferenceQuality * 0.10)
    );

    // Generate suggestions
    const suggestions = this.generateSuggestions(context, metrics, issues);

    return {
      isValid: issues.filter(i => i.severity === 'error').length === 0,
      score,
      issues,
      suggestions,
      metrics,
    };
  }

  async generateProjectQualityReport(): Promise<ProjectQualityReport> {
    const metadataDir = path.join(this.contextBasePath, 'ai-metadata');
    
    try {
      const metadataFiles = await fs.readdir(metadataDir);
      const results: ValidationResult[] = [];
      const categoryScores: Record<string, number[]> = {};
      const issueFrequency: Record<string, number> = {};
      
      for (const file of metadataFiles) {
        if (!file.endsWith('.json')) continue;
        
        const metadataPath = path.join(metadataDir, file);
        const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));
        
        // Load full context for validation
        const context = await this.loadContext(metadata.relativePath);
        if (context) {
          const result = await this.validateContext(context);
          results.push(result);
          
          // Track category scores
          if (!categoryScores[context.category]) {
            categoryScores[context.category] = [];
          }
          categoryScores[context.category].push(result.score);
          
          // Track issue frequency
          result.issues.forEach(issue => {
            const key = `${issue.category}: ${issue.message}`;
            issueFrequency[key] = (issueFrequency[key] || 0) + 1;
          });
        }
      }
      
      // Calculate averages
      const overallScore = results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length)
        : 0;
      
      const categoryAvgs: Record<string, number> = {};
      Object.entries(categoryScores).forEach(([category, scores]) => {
        categoryAvgs[category] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      });
      
      // Find common issues
      const commonIssues = Object.entries(issueFrequency)
        .map(([issue, count]) => ({ issue, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      
      // Calculate metrics
      const avgTokens = results.length > 0
        ? results.reduce((sum, r) => sum + (r.metrics.tokenEfficiency * 20), 0) / results.length // Rough estimate
        : 0;
      
      const tokenEfficiencyRating = this.getTokenEfficiencyRating(avgTokens);
      
      const crossReferenceRatio = results.length > 0
        ? results.reduce((sum, r) => sum + r.metrics.crossReferenceQuality, 0) / results.length / 100
        : 0;

      // Generate recommendations
      const recommendations = this.generateProjectRecommendations(results, commonIssues, overallScore);

      return {
        overallScore,
        totalContexts: results.length,
        categoryScores: categoryAvgs,
        commonIssues,
        recommendations,
        metrics: {
          avgTokensPerContext: Math.round(avgTokens),
          tokenEfficiencyRating,
          coverageCompleteness: this.calculateCoverageCompleteness(results),
          crossReferenceRatio: Math.round(crossReferenceRatio * 100) / 100,
        },
      };
    } catch (_error) {
      console.error('Error generating quality report:', _error);
      return {
        overallScore: 0,
        totalContexts: 0,
        categoryScores: {},
        commonIssues: [],
        recommendations: ['Unable to generate report - check context storage'],
        metrics: {
          avgTokensPerContext: 0,
          tokenEfficiencyRating: 'poor',
          coverageCompleteness: 0,
          crossReferenceRatio: 0,
        },
      };
    }
  }

  private assessCompleteness(context: CrystallizedContext, issues: ValidationIssue[]): number {
    let score = 100;
    
    if (!context.purpose || context.purpose.length < 20) {
      issues.push({
        severity: 'error',
        category: 'completeness',
        message: 'Purpose is missing or too brief (minimum 20 characters)',
        field: 'purpose',
      });
      score -= 30;
    }
    
    if (context.keyAPIs.length === 0) {
      issues.push({
        severity: 'warning',
        category: 'completeness',
        message: 'No key APIs defined - consider adding main functions/exports',
        field: 'keyAPIs',
      });
      score -= 20;
    }
    
    if (context.template === 'extended') {
      if (!context.aiGuidance) {
        issues.push({
          severity: 'warning',
          category: 'completeness',
          message: 'Extended template should include AI guidance',
          field: 'aiGuidance',
        });
        score -= 15;
      }
      
      if (context.patterns.length === 0) {
        issues.push({
          severity: 'info',
          category: 'completeness',
          message: 'Consider adding implementation patterns for AI guidance',
          field: 'patterns',
        });
        score -= 10;
      }
    }
    
    return Math.max(0, score);
  }

  private assessSpecificity(context: CrystallizedContext, issues: ValidationIssue[]): number {
    let score = 100;
    
    // Check for generic/vague descriptions
    const genericTerms = ['handles', 'manages', 'deals with', 'contains', 'provides'];
    const purposeLower = context.purpose.toLowerCase();
    
    if (genericTerms.some(term => purposeLower.includes(term)) && context.purpose.length < 100) {
      issues.push({
        severity: 'warning',
        category: 'usefulness',
        message: 'Purpose uses generic terms - be more specific about functionality',
        field: 'purpose',
      });
      score -= 20;
    }
    
    // Check API specificity
    const vagueAPIs = context.keyAPIs.filter(api => 
      api.length < 10 || /^(function|method|class)\s*$/i.test(api)
    );
    
    if (vagueAPIs.length > 0) {
      issues.push({
        severity: 'warning',
        category: 'usefulness',
        message: `${vagueAPIs.length} API descriptions are too vague`,
        field: 'keyAPIs',
      });
      score -= 15;
    }
    
    return Math.max(0, score);
  }

  private assessAIReadability(context: CrystallizedContext, issues: ValidationIssue[]): number {
    let score = 100;
    
    // Check sentence structure
    const sentences = context.purpose.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length === 1 && context.purpose.length > 200) {
      issues.push({
        severity: 'info',
        category: 'format',
        message: 'Purpose is one long sentence - consider breaking into multiple sentences',
        field: 'purpose',
      });
      score -= 10;
    }
    
    // Check for code in purpose (should be in separate sections)
    if (/```|`\w+`/.test(context.purpose)) {
      issues.push({
        severity: 'info',
        category: 'format',
        message: 'Code found in purpose - consider moving to patterns or examples',
        field: 'purpose',
      });
      score -= 5;
    }
    
    // Check API formatting
    const poorlyFormattedAPIs = context.keyAPIs.filter(api => 
      !api.includes('(') && !api.includes(':') && api.length > 20
    );
    
    if (poorlyFormattedAPIs.length > 0) {
      issues.push({
        severity: 'info',
        category: 'format',
        message: 'Some APIs lack function signatures or type information',
        field: 'keyAPIs',
      });
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  private assessTokenEfficiency(context: CrystallizedContext, issues: ValidationIssue[]): number {
    let score = 100;
    
    if (!context.tokenCount) return 50; // Unknown efficiency
    
    const template = context.template;
    const maxTokens = template === 'short' ? 200 : 2000;
    const efficiency = (context.tokenCount / maxTokens) * 100;
    
    if (efficiency > 120) {
      issues.push({
        severity: 'warning',
        category: 'format',
        message: `Context exceeds template limit (${context.tokenCount}/${maxTokens} tokens)`,
      });
      score -= 30;
    } else if (efficiency < 30) {
      issues.push({
        severity: 'info',
        category: 'usefulness',
        message: 'Context is very brief - could include more detail',
      });
      score -= 10;
    }
    
    // Optimal range is 60-90% of template limit
    if (efficiency >= 60 && efficiency <= 90) {
      score = 100;
    } else if (efficiency >= 40 && efficiency <= 110) {
      score = 85;
    } else {
      score = Math.max(40, 100 - Math.abs(efficiency - 75));
    }
    
    return score;
  }

  private assessCrossReferences(context: CrystallizedContext, issues: ValidationIssue[]): number {
    let score = 100;
    
    if (context.crossReferences.length === 0 && context.category === 'source') {
      issues.push({
        severity: 'info',
        category: 'usefulness',
        message: 'No cross-references found - file may be isolated or analysis incomplete',
      });
      score -= 20;
    }
    
    // Check for broken or unclear references
    const vagueReferences = context.crossReferences.filter(ref => 
      !ref.description || ref.description.length < 5
    );
    
    if (vagueReferences.length > 0) {
      issues.push({
        severity: 'info',
        category: 'usefulness',
        message: `${vagueReferences.length} cross-references lack descriptions`,
      });
      score -= 10;
    }
    
    return Math.max(0, score);
  }

  private generateSuggestions(context: CrystallizedContext, metrics: QualityMetrics, _issues: ValidationIssue[]): string[] {
    const suggestions: string[] = [];
    
    if (metrics.completeness < 80) {
      suggestions.push('Add more detail to the purpose section explaining the specific functionality');
      if (context.keyAPIs.length < 3 && context.category === 'source') {
        suggestions.push('Include more key APIs, functions, or exported elements');
      }
    }
    
    if (metrics.specificity < 70) {
      suggestions.push('Replace generic terms with specific technical details');
      suggestions.push('Include parameter types, return values, or usage examples for APIs');
    }
    
    if (metrics.tokenEfficiency < 60) {
      if (context.tokenCount && context.tokenCount < 50) {
        suggestions.push('Consider adding implementation patterns or error handling details');
      } else {
        suggestions.push('Optimize content to fit within template token limits');
      }
    }
    
    if (metrics.crossReferenceQuality < 50 && context.category === 'source') {
      suggestions.push('Add cross-references to related files and dependencies');
    }
    
    // Specific suggestions based on category
    if (context.category === 'config' && !context.patterns.length) {
      suggestions.push('Document configuration patterns and required/optional settings');
    }
    
    if (context.category === 'test' && !context.integrationPoints?.length) {
      suggestions.push('Describe what functionality is being tested and test patterns');
    }
    
    return suggestions;
  }

  private generateProjectRecommendations(results: ValidationResult[], commonIssues: { issue: string; count: number }[], overallScore: number): string[] {
    const recommendations: string[] = [];
    
    if (overallScore < 70) {
      recommendations.push('Focus on improving context completeness and specificity across the project');
    }
    
    if (commonIssues.length > 0) {
      const topIssue = commonIssues[0];
      if (topIssue.count > results.length * 0.3) {
        recommendations.push(`Address common issue: ${topIssue.issue} (affects ${topIssue.count} contexts)`);
      }
    }
    
    const avgCompleteness = results.reduce((sum, r) => sum + r.metrics.completeness, 0) / results.length;
    if (avgCompleteness < 75) {
      recommendations.push('Improve context completeness by adding more detailed purposes and API descriptions');
    }
    
    const avgEfficiency = results.reduce((sum, r) => sum + r.metrics.tokenEfficiency, 0) / results.length;
    if (avgEfficiency < 60) {
      recommendations.push('Optimize token usage - some contexts are too brief or too verbose');
    }
    
    const highComplexityContexts = results.filter(r => 
      r.metrics.specificity < 60 && r.score < 70
    ).length;
    
    if (highComplexityContexts > results.length * 0.2) {
      recommendations.push('Review contexts for complex files to ensure they provide clear AI guidance');
    }
    
    return recommendations;
  }

  private getTokenEfficiencyRating(avgTokens: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (avgTokens >= 80 && avgTokens <= 150) return 'excellent';
    if (avgTokens >= 60 && avgTokens <= 200) return 'good';
    if (avgTokens >= 40 && avgTokens <= 300) return 'fair';
    return 'poor';
  }

  private calculateCoverageCompleteness(results: ValidationResult[]): number {
    const completenessScores = results.map(r => r.metrics.completeness);
    const avgCompleteness = completenessScores.reduce((a, b) => a + b, 0) / completenessScores.length;
    return Math.round(avgCompleteness);
  }

  private async loadContext(relativePath: string): Promise<CrystallizedContext | null> {
    try {
      const contextPath = path.join(this.contextBasePath, 'context', `${relativePath  }.context.md`);
      const markdown = await fs.readFile(contextPath, 'utf-8');
      
      // Use the same parser as in context-search.ts
      return this.parseContextFromMarkdown(markdown, relativePath);
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
      } else if (title?.includes('guidance')) {
        context.aiGuidance = lines.slice(1).join('\n').trim();
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
}