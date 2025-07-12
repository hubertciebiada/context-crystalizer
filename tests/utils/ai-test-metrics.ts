import { CrystallizedContext, ValidationResult } from '../../src/types/index.js';
import { ContextValidator } from '../../src/core/context-validator.js';

export interface AITestMetrics {
  contextGeneration: ContextGenerationMetrics;
  searchRelevance: SearchRelevanceMetrics;
  tokenEfficiency: TokenEfficiencyMetrics;
  qualityAssurance: QualityAssuranceMetrics;
}

export interface ContextGenerationMetrics {
  completenessScore: number; // 0-100
  accuracyScore: number; // 0-100
  consistencyScore: number; // 0-100
  crossReferenceAccuracy: number; // 0-100
  averageGenerationTime: number; // milliseconds
}

export interface SearchRelevanceMetrics {
  precisionAt5: number; // 0-1
  precisionAt10: number; // 0-1
  averageRelevanceScore: number; // 0-1
  queryResponseTime: number; // milliseconds
  falsePositiveRate: number; // 0-1
}

export interface TokenEfficiencyMetrics {
  averageTokensPerContext: number;
  tokenUtilizationRate: number; // 0-1 (how close to template limits)
  compressionRatio: number; // original tokens / context tokens
  tokenWasteScore: number; // 0-100 (lower is better)
}

export interface QualityAssuranceMetrics {
  overallQualityScore: number; // 0-100
  categoryConsistency: number; // 0-100
  aiUsabilityScore: number; // 0-100
  errorRate: number; // 0-1
}

export class AITestMetricsCollector {
  private contextValidator: ContextValidator;
  private startTime: number = 0;
  private endTime: number = 0;

  constructor(repoPath: string) {
    this.contextValidator = new ContextValidator(repoPath);
  }

  startTiming(): void {
    this.startTime = Date.now();
  }

  endTiming(): number {
    this.endTime = Date.now();
    return this.endTime - this.startTime;
  }

  async evaluateContextGeneration(
    contexts: CrystallizedContext[],
    originalFiles: { path: string; content: string; size: number }[]
  ): Promise<ContextGenerationMetrics> {
    let totalCompleteness = 0;
    let totalAccuracy = 0;
    let totalConsistency = 0;
    let totalCrossRefAccuracy = 0;
    const totalGenerationTime = 0;

    for (const context of contexts) {
      // Validate context quality
      const validation = await this.contextValidator.validateContext(context);
      
      totalCompleteness += validation.metrics.completeness;
      totalAccuracy += this.calculateAccuracyScore(context, originalFiles);
      totalConsistency += this.calculateConsistencyScore(context);
      totalCrossRefAccuracy += validation.metrics.crossReferenceQuality;
    }

    const count = contexts.length || 1;

    return {
      completenessScore: totalCompleteness / count,
      accuracyScore: totalAccuracy / count,
      consistencyScore: totalConsistency / count,
      crossReferenceAccuracy: totalCrossRefAccuracy / count,
      averageGenerationTime: totalGenerationTime / count,
    };
  }

  evaluateSearchRelevance(
    queries: string[],
    searchResults: Array<{ query: string; results: any[]; expectedFiles?: string[] }>
  ): SearchRelevanceMetrics {
    let totalPrecision5 = 0;
    let totalPrecision10 = 0;
    let totalRelevance = 0;
    const totalResponseTime = 0;
    let falsePositives = 0;
    let totalResults = 0;

    for (const result of searchResults) {
      const relevantTop5 = this.calculatePrecisionAtK(result.results, result.expectedFiles || [], 5);
      const relevantTop10 = this.calculatePrecisionAtK(result.results, result.expectedFiles || [], 10);
      
      totalPrecision5 += relevantTop5;
      totalPrecision10 += relevantTop10;
      
      // Calculate average relevance score
      const avgRelevance = result.results.reduce((sum, r) => sum + (r.relevanceScore || 0), 0) / 
                          (result.results.length || 1);
      totalRelevance += avgRelevance;

      // Count false positives (low relevance results in top positions)
      const topResults = result.results.slice(0, 5);
      falsePositives += topResults.filter(r => (r.relevanceScore || 0) < 0.3).length;
      totalResults += topResults.length;
    }

    const count = searchResults.length || 1;

    return {
      precisionAt5: totalPrecision5 / count,
      precisionAt10: totalPrecision10 / count,
      averageRelevanceScore: totalRelevance / count,
      queryResponseTime: totalResponseTime / count,
      falsePositiveRate: totalResults > 0 ? falsePositives / totalResults : 0,
    };
  }

  evaluateTokenEfficiency(
    contexts: CrystallizedContext[],
    originalFiles: { path: string; content: string; size: number }[]
  ): TokenEfficiencyMetrics {
    const totalTokens = contexts.reduce((sum, c) => sum + (c.tokenCount || 0), 0);
    const totalOriginalTokens = originalFiles.reduce((sum, f) => sum + this.estimateTokens(f.content), 0);
    
    let totalUtilization = 0;
    let wasteScore = 0;

    for (const context of contexts) {
      const tokens = context.tokenCount || 0;
      const maxTokens = context.template === 'short' ? 200 : 2000;
      const utilization = tokens / maxTokens;
      totalUtilization += Math.min(utilization, 1);

      // Calculate waste (too few or too many tokens)
      const optimalRange = context.template === 'short' ? [120, 180] : [1200, 1800];
      if (tokens < optimalRange[0]) {
        wasteScore += (optimalRange[0] - tokens) / optimalRange[0] * 100;
      } else if (tokens > optimalRange[1]) {
        wasteScore += (tokens - optimalRange[1]) / optimalRange[1] * 100;
      }
    }

    const count = contexts.length || 1;
    const avgTokens = totalTokens / count;

    return {
      averageTokensPerContext: avgTokens,
      tokenUtilizationRate: totalUtilization / count,
      compressionRatio: totalOriginalTokens > 0 ? totalOriginalTokens / totalTokens : 1,
      tokenWasteScore: Math.min(wasteScore / count, 100),
    };
  }

  async evaluateQualityAssurance(
    contexts: CrystallizedContext[]
  ): Promise<QualityAssuranceMetrics> {
    const validations: ValidationResult[] = [];
    let errors = 0;

    for (const context of contexts) {
      try {
        const validation = await this.contextValidator.validateContext(context);
        validations.push(validation);
      } catch (_error) {
        errors++;
      }
    }

    const overallScore = validations.length > 0 
      ? validations.reduce((sum, v) => sum + v.score, 0) / validations.length
      : 0;

    // Calculate category consistency
    const categoryGroups: Record<string, number[]> = {};
    validations.forEach((v, index) => {
      const category = contexts[index]?.category || 'other';
      if (!categoryGroups[category]) categoryGroups[category] = [];
      categoryGroups[category].push(v.score);
    });

    let categoryConsistency = 0;
    for (const scores of Object.values(categoryGroups)) {
      const variance = this.calculateVariance(scores);
      categoryConsistency += Math.max(0, 100 - variance * 10); // Lower variance = higher consistency
    }
    categoryConsistency /= Object.keys(categoryGroups).length || 1;

    // AI usability score based on specific criteria
    const aiUsabilityScore = validations.length > 0
      ? validations.reduce((sum, v) => sum + v.metrics.aiReadability, 0) / validations.length
      : 0;

    return {
      overallQualityScore: overallScore,
      categoryConsistency,
      aiUsabilityScore,
      errorRate: contexts.length > 0 ? errors / contexts.length : 0,
    };
  }

  generateMetricsReport(metrics: AITestMetrics): string {
    return `
# AI Context Quality Test Report

## Context Generation Quality
- Completeness: ${metrics.contextGeneration.completenessScore.toFixed(1)}%
- Accuracy: ${metrics.contextGeneration.accuracyScore.toFixed(1)}%
- Consistency: ${metrics.contextGeneration.consistencyScore.toFixed(1)}%
- Cross-Reference Accuracy: ${metrics.contextGeneration.crossReferenceAccuracy.toFixed(1)}%
- Average Generation Time: ${metrics.contextGeneration.averageGenerationTime.toFixed(0)}ms

## Search Relevance
- Precision@5: ${(metrics.searchRelevance.precisionAt5 * 100).toFixed(1)}%
- Precision@10: ${(metrics.searchRelevance.precisionAt10 * 100).toFixed(1)}%
- Average Relevance Score: ${(metrics.searchRelevance.averageRelevanceScore * 100).toFixed(1)}%
- False Positive Rate: ${(metrics.searchRelevance.falsePositiveRate * 100).toFixed(1)}%

## Token Efficiency
- Average Tokens per Context: ${metrics.tokenEfficiency.averageTokensPerContext.toFixed(0)}
- Token Utilization: ${(metrics.tokenEfficiency.tokenUtilizationRate * 100).toFixed(1)}%
- Compression Ratio: ${metrics.tokenEfficiency.compressionRatio.toFixed(1)}:1
- Token Waste Score: ${metrics.tokenEfficiency.tokenWasteScore.toFixed(1)}% (lower is better)

## Quality Assurance
- Overall Quality Score: ${metrics.qualityAssurance.overallQualityScore.toFixed(1)}%
- Category Consistency: ${metrics.qualityAssurance.categoryConsistency.toFixed(1)}%
- AI Usability Score: ${metrics.qualityAssurance.aiUsabilityScore.toFixed(1)}%
- Error Rate: ${(metrics.qualityAssurance.errorRate * 100).toFixed(1)}%

## Recommendations
${this.generateRecommendations(metrics)}
`;
  }

  private calculateAccuracyScore(context: CrystallizedContext, originalFiles: { path: string; content: string }[]): number {
    const originalFile = originalFiles.find(f => f.path.endsWith(context.relativePath));
    if (!originalFile) return 0;

    // Simple accuracy heuristics
    let score = 100;
    
    // Check if key APIs are actually present in the file
    const content = originalFile.content.toLowerCase();
    const foundAPIs = context.keyAPIs.filter(api => 
      content.includes(api.toLowerCase()) || 
      content.includes(api.split('(')[0].toLowerCase())
    );
    
    if (context.keyAPIs.length > 0) {
      score *= (foundAPIs.length / context.keyAPIs.length);
    }

    // Check dependencies accuracy
    const foundDeps = context.dependencies.filter(dep =>
      content.includes(dep.toLowerCase()) || content.includes(`'${dep}'`) || content.includes(`"${dep}"`)
    );
    
    if (context.dependencies.length > 0) {
      score *= (foundDeps.length / context.dependencies.length);
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateConsistencyScore(context: CrystallizedContext): number {
    let score = 100;

    // Check template consistency
    const expectedTokens = context.template === 'short' ? 200 : 2000;
    const actualTokens = context.tokenCount || 0;
    const tokenRatio = actualTokens / expectedTokens;
    
    if (tokenRatio < 0.3 || tokenRatio > 1.2) {
      score -= 20;
    }

    // Check category-purpose alignment
    const purposeLower = context.purpose.toLowerCase();
    switch (context.category) {
      case 'config':
        if (!purposeLower.includes('config') && !purposeLower.includes('setting')) {
          score -= 15;
        }
        break;
      case 'test':
        if (!purposeLower.includes('test') && !purposeLower.includes('spec')) {
          score -= 15;
        }
        break;
      case 'docs':
        if (!purposeLower.includes('document') && !purposeLower.includes('readme')) {
          score -= 15;
        }
        break;
    }

    return Math.max(0, score);
  }

  private calculatePrecisionAtK(results: any[], expected: string[], k: number): number {
    const topK = results.slice(0, k);
    const relevant = topK.filter(result => 
      expected.some(exp => result.context?.relativePath?.includes(exp) || result.file?.includes(exp))
    );
    return topK.length > 0 ? relevant.length / topK.length : 0;
  }

  private estimateTokens(text: string): number {
    // Simple token estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  private generateRecommendations(metrics: AITestMetrics): string {
    const recommendations: string[] = [];

    if (metrics.contextGeneration.completenessScore < 80) {
      recommendations.push('- Improve context completeness by adding more detailed purposes and API descriptions');
    }

    if (metrics.contextGeneration.accuracyScore < 70) {
      recommendations.push('- Review accuracy of API extraction and dependency detection');
    }

    if (metrics.searchRelevance.precisionAt5 < 0.7) {
      recommendations.push('- Enhance search relevance scoring algorithm');
    }

    if (metrics.tokenEfficiency.tokenWasteScore > 30) {
      recommendations.push('- Optimize token usage to better fit template limits');
    }

    if (metrics.qualityAssurance.overallQualityScore < 75) {
      recommendations.push('- Implement additional quality validation checks');
    }

    if (recommendations.length === 0) {
      recommendations.push('- All metrics are within acceptable ranges. Consider optimizing for edge cases.');
    }

    return recommendations.join('\n');
  }
}