import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';
import { sampleRepositories, createTestRepository, cleanupTestRepository } from '../fixtures/sample-repo.js';
import { AITestMetricsCollector, AITestMetrics } from '../utils/ai-test-metrics.js';

describe('End-to-End AI Context Testing', () => {
  let tempDir: string;
  let testResults: { 
    repo: string; 
    metrics: AITestMetrics; 
    report: string; 
  }[] = [];

  beforeAll(async () => {
    tempDir = await global.testUtils.createTempDir();
  });

  afterAll(async () => {
    await global.testUtils.cleanup(tempDir);
    
    // Generate comprehensive test report
    const finalReport = generateFinalTestReport(testResults);
    console.log('\n' + '='.repeat(80));
    console.log('AI CONTEXT QUALITY TEST REPORT');
    console.log('='.repeat(80));
    console.log(finalReport);
    console.log('='.repeat(80));
  });

  test('should demonstrate full AI context engineering pipeline', async () => {
    const repo = sampleRepositories.find(r => r.name === 'simple-api')!;
    const testRepoPath = await createTestRepository(repo, tempDir);
    
    try {
      // This test demonstrates the complete pipeline an AI agent would use
      const metricsCollector = new AITestMetricsCollector(testRepoPath);
      
      // Simulate the full MCP workflow
      const { FileScanner } = await import('../../src/core/file-scanner.js');
      const { ContextStorage } = await import('../../src/core/context-storage.js');
      const { QueueManager } = await import('../../src/core/queue-manager.js');
      const { ContextSearch } = await import('../../src/core/context-search.js');
      const { ContextValidator } = await import('../../src/core/context-validator.js');
      const { ChangeDetector } = await import('../../src/core/change-detector.js');
      const { ContextUpdater } = await import('../../src/core/context-updater.js');

      const fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      const contextStorage = new ContextStorage(testRepoPath);
      const queueManager = new QueueManager();
      const contextSearch = new ContextSearch(testRepoPath);
      const contextValidator = new ContextValidator(testRepoPath);
      const changeDetector = new ChangeDetector(testRepoPath);
      const contextUpdater = new ContextUpdater(testRepoPath, fileScanner, contextStorage, changeDetector, queueManager);

      // Phase 1: Repository Initialization and Scanning
      console.log('Phase 1: Initializing repository scanning...');
      metricsCollector.startTiming();
      
      const files = await fileScanner.scanRepository();
      await queueManager.initializeQueue(files, testRepoPath, []);
      await contextStorage.initialize(files.map(f => f.path));
      
      const initTime = metricsCollector.endTiming();
      console.log(`Repository initialized in ${initTime}ms, found ${files.length} files`);

      // Phase 2: Context Generation
      console.log('Phase 2: Generating AI contexts...');
      const contexts = [];
      const originalFiles = [];
      
      metricsCollector.startTiming();
      let processedCount = 0;
      
      while (true) {
        const nextFile = await queueManager.getNextFile();
        if (!nextFile) break;
        
        const content = await fileScanner.readFile(nextFile.path);
        originalFiles.push({
          path: nextFile.relativePath,
          content,
          size: nextFile.size
        });
        
        // Generate realistic AI context
        const mockContext = await generateAdvancedAIContext(nextFile, content, files);
        await contextStorage.storeContext(nextFile.relativePath, mockContext, content, {
          complexity: nextFile.complexity,
          category: nextFile.category,
          estimatedTokens: nextFile.estimatedTokens
        });

        const storedContext = await contextStorage.getContext(nextFile.relativePath);
        if (storedContext) {
          contexts.push(storedContext);
        }

        await queueManager.markProcessed(nextFile.path);
        processedCount++;
        
        if (processedCount % 2 === 0) {
          console.log(`  Processed ${processedCount}/${files.length} files...`);
        }
      }
      
      const generationTime = metricsCollector.endTiming();
      console.log(`Context generation completed in ${generationTime}ms`);

      // Phase 3: Search and Retrieval Testing
      console.log('Phase 3: Testing search and retrieval...');
      const searchQueries = [
        'user management API endpoints',
        'express server setup configuration',
        'controller request handling',
        'service business logic',
        'database integration patterns'
      ];

      const searchResults = [];
      metricsCollector.startTiming();
      
      for (const query of searchQueries) {
        const results = await contextSearch.searchContexts(query, 4000);
        searchResults.push({
          query,
          results,
          expectedFiles: inferExpectedFiles(query, files)
        });
      }
      
      const searchTime = metricsCollector.endTiming();
      console.log(`Search testing completed in ${searchTime}ms`);

      // Phase 4: Quality Validation
      console.log('Phase 4: Validating context quality...');
      metricsCollector.startTiming();
      
      const projectReport = await contextValidator.generateProjectQualityReport();
      
      const validationTime = metricsCollector.endTiming();
      console.log(`Quality validation completed in ${validationTime}ms`);

      // Phase 5: Metrics Collection and Analysis
      console.log('Phase 5: Collecting comprehensive metrics...');
      
      const contextMetrics = await metricsCollector.evaluateContextGeneration(contexts, originalFiles);
      const searchMetrics = metricsCollector.evaluateSearchRelevance(searchQueries, searchResults);
      const tokenMetrics = metricsCollector.evaluateTokenEfficiency(contexts, originalFiles);
      const qualityMetrics = await metricsCollector.evaluateQualityAssurance(contexts);

      const fullMetrics: AITestMetrics = {
        contextGeneration: contextMetrics,
        searchRelevance: searchMetrics,
        tokenEfficiency: tokenMetrics,
        qualityAssurance: qualityMetrics
      };

      // Phase 6: Update Detection Testing
      console.log('Phase 6: Testing update detection...');
      const updateStatus = await contextUpdater.getUpdateStatus();
      const updateReport = await contextUpdater.generateUpdateReport();

      // Assertions for pipeline success
      expect(files.length).toBeGreaterThan(0);
      expect(contexts.length).toBe(files.length);
      expect(fullMetrics.contextGeneration.completenessScore).toBeGreaterThan(60);
      expect(fullMetrics.tokenEfficiency.averageTokensPerContext).toBeGreaterThan(50);
      expect(fullMetrics.qualityAssurance.overallQualityScore).toBeGreaterThan(50);
      expect(updateStatus.summary.totalFiles).toBe(files.length);

      // Generate final report
      const report = metricsCollector.generateMetricsReport(fullMetrics);
      testResults.push({
        repo: repo.name,
        metrics: fullMetrics,
        report
      });

      console.log(`\nPipeline completed successfully for ${repo.name}:`);
      console.log(`- Files processed: ${files.length}`);
      console.log(`- Contexts generated: ${contexts.length}`);
      console.log(`- Overall quality score: ${fullMetrics.qualityAssurance.overallQualityScore.toFixed(1)}%`);
      console.log(`- Token efficiency: ${(fullMetrics.tokenEfficiency.tokenUtilizationRate * 100).toFixed(1)}%`);
      console.log(`- Search precision@5: ${(fullMetrics.searchRelevance.precisionAt5 * 100).toFixed(1)}%`);

    } finally {
      await cleanupTestRepository(testRepoPath);
    }
  });

  test('should handle complex microservice repository', async () => {
    const repo = sampleRepositories.find(r => r.name === 'complex-microservice')!;
    const testRepoPath = await createTestRepository(repo, tempDir);
    
    try {
      console.log(`\nTesting complex repository: ${repo.name}`);
      
      const metricsCollector = new AITestMetricsCollector(testRepoPath);
      
      // Import components
      const { FileScanner } = await import('../../src/core/file-scanner.js');
      const { ContextStorage } = await import('../../src/core/context-storage.js');
      const { QueueManager } = await import('../../src/core/queue-manager.js');
      const { ContextSearch } = await import('../../src/core/context-search.js');
      const { ContextValidator } = await import('../../src/core/context-validator.js');

      const fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      const contextStorage = new ContextStorage(testRepoPath);
      const queueManager = new QueueManager();
      const contextSearch = new ContextSearch(testRepoPath);
      const contextValidator = new ContextValidator(testRepoPath);

      // Process repository
      const files = await fileScanner.scanRepository();
      await queueManager.initializeQueue(files, testRepoPath, []);
      await contextStorage.initialize(files.map(f => f.path));

      const contexts = [];
      const originalFiles = [];
      
      // Process all files
      let nextFile;
      while ((nextFile = await queueManager.getNextFile()) !== null) {
        const content = await fileScanner.readFile(nextFile.path);
        originalFiles.push({
          path: nextFile.relativePath,
          content,
          size: nextFile.size
        });
        
        const mockContext = await generateAdvancedAIContext(nextFile, content, files);
        await contextStorage.storeContext(nextFile.relativePath, mockContext, content, {
          complexity: nextFile.complexity,
          category: nextFile.category,
          estimatedTokens: nextFile.estimatedTokens
        });

        const storedContext = await contextStorage.getContext(nextFile.relativePath);
        if (storedContext) {
          contexts.push(storedContext);
        }

        await queueManager.markProcessed(nextFile.path);
      }

      // Test complex queries
      const complexQueries = [
        'authentication middleware jwt security',
        'database connection pooling transactions',
        'microservice cache redis session',
        'error handling logging monitoring'
      ];

      const searchResults = [];
      for (const query of complexQueries) {
        const results = await contextSearch.searchContexts(query, 6000);
        searchResults.push({
          query,
          results,
          expectedFiles: inferExpectedFiles(query, files)
        });
      }

      // Collect metrics
      const contextMetrics = await metricsCollector.evaluateContextGeneration(contexts, originalFiles);
      const searchMetrics = metricsCollector.evaluateSearchRelevance(complexQueries, searchResults);
      const tokenMetrics = metricsCollector.evaluateTokenEfficiency(contexts, originalFiles);
      const qualityMetrics = await metricsCollector.evaluateQualityAssurance(contexts);

      const fullMetrics: AITestMetrics = {
        contextGeneration: contextMetrics,
        searchRelevance: searchMetrics,
        tokenEfficiency: tokenMetrics,
        qualityAssurance: qualityMetrics
      };

      // Complex repositories should still meet minimum thresholds
      expect(fullMetrics.contextGeneration.completenessScore).toBeGreaterThan(55);
      expect(fullMetrics.qualityAssurance.overallQualityScore).toBeGreaterThan(45);
      expect(fullMetrics.tokenEfficiency.compressionRatio).toBeGreaterThan(1.5);

      const report = metricsCollector.generateMetricsReport(fullMetrics);
      testResults.push({
        repo: repo.name,
        metrics: fullMetrics,
        report
      });

      console.log(`Complex repository ${repo.name} completed:`);
      console.log(`- Files: ${files.length}, Contexts: ${contexts.length}`);
      console.log(`- Quality: ${fullMetrics.qualityAssurance.overallQualityScore.toFixed(1)}%`);
      console.log(`- Compression: ${fullMetrics.tokenEfficiency.compressionRatio.toFixed(1)}:1`);

    } finally {
      await cleanupTestRepository(testRepoPath);
    }
  });

  test('should process configuration-heavy repository efficiently', async () => {
    const repo = sampleRepositories.find(r => r.name === 'config-heavy')!;
    const testRepoPath = await createTestRepository(repo, tempDir);
    
    try {
      console.log(`\nTesting config-heavy repository: ${repo.name}`);
      
      const metricsCollector = new AITestMetricsCollector(testRepoPath);
      
      // Import components
      const { FileScanner } = await import('../../src/core/file-scanner.js');
      const { ContextStorage } = await import('../../src/core/context-storage.js');
      const { QueueManager } = await import('../../src/core/queue-manager.js');
      const { ContextSearch } = await import('../../src/core/context-search.js');

      const fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      const contextStorage = new ContextStorage(testRepoPath);
      const queueManager = new QueueManager();
      const contextSearch = new ContextSearch(testRepoPath);

      // Process repository
      const files = await fileScanner.scanRepository();
      await queueManager.initializeQueue(files, testRepoPath, []);
      await contextStorage.initialize(files.map(f => f.path));

      const contexts = [];
      const originalFiles = [];
      
      let nextFile;
      while ((nextFile = await queueManager.getNextFile()) !== null) {
        const content = await fileScanner.readFile(nextFile.path);
        originalFiles.push({
          path: nextFile.relativePath,
          content,
          size: nextFile.size
        });
        
        const mockContext = await generateAdvancedAIContext(nextFile, content, files);
        await contextStorage.storeContext(nextFile.relativePath, mockContext, content, {
          complexity: nextFile.complexity,
          category: nextFile.category,
          estimatedTokens: nextFile.estimatedTokens
        });

        const storedContext = await contextStorage.getContext(nextFile.relativePath);
        if (storedContext) {
          contexts.push(storedContext);
        }

        await queueManager.markProcessed(nextFile.path);
      }

      // Test config-specific queries
      const configQueries = [
        'webpack build configuration',
        'typescript compiler options',
        'eslint code quality rules',
        'project configuration files'
      ];

      const searchResults = [];
      for (const query of configQueries) {
        const results = await contextSearch.searchContexts(query, 3000, 'config');
        searchResults.push({
          query,
          results,
          expectedFiles: inferExpectedFiles(query, files)
        });
      }

      // Collect metrics
      const contextMetrics = await metricsCollector.evaluateContextGeneration(contexts, originalFiles);
      const searchMetrics = metricsCollector.evaluateSearchRelevance(configQueries, searchResults);
      const tokenMetrics = metricsCollector.evaluateTokenEfficiency(contexts, originalFiles);
      const qualityMetrics = await metricsCollector.evaluateQualityAssurance(contexts);

      const fullMetrics: AITestMetrics = {
        contextGeneration: contextMetrics,
        searchRelevance: searchMetrics,
        tokenEfficiency: tokenMetrics,
        qualityAssurance: qualityMetrics
      };

      // Config repositories should have high token efficiency
      expect(fullMetrics.tokenEfficiency.tokenUtilizationRate).toBeGreaterThan(0.4);
      
      // Config contexts should be well-categorized
      const configContexts = contexts.filter(c => c.category === 'config');
      expect(configContexts.length).toBeGreaterThan(0);

      const report = metricsCollector.generateMetricsReport(fullMetrics);
      testResults.push({
        repo: repo.name,
        metrics: fullMetrics,
        report
      });

      console.log(`Config-heavy repository ${repo.name} completed:`);
      console.log(`- Total contexts: ${contexts.length}`);
      console.log(`- Config contexts: ${configContexts.length}`);
      console.log(`- Token utilization: ${(fullMetrics.tokenEfficiency.tokenUtilizationRate * 100).toFixed(1)}%`);

    } finally {
      await cleanupTestRepository(testRepoPath);
    }
  });
});

// Helper functions

async function generateAdvancedAIContext(file: any, content: string, allFiles: any[]): Promise<any> {
  // Enhanced context generation with cross-references and better analysis
  const lines = content.split('\n');
  const imports = extractImports(content);
  const exports = extractExports(content);
  const functions = extractFunctions(content);
  const classes = extractClasses(content);
  
  const category = determineCategory(file);
  const complexity = file.complexity;
  
  let purpose = generatePurpose(file, content, category, complexity);
  
  const keyAPIs = [
    ...classes.slice(0, 2),
    ...functions.slice(0, 4),
    ...exports.slice(0, 3)
  ].filter(Boolean).slice(0, 6);

  const dependencies = imports.slice(0, 5);
  
  const patterns = generatePatterns(content, category, complexity);
  const crossReferences = generateCrossReferences(file, content, allFiles);
  
  let aiGuidance;
  if (complexity === 'high' || keyAPIs.length > 4) {
    aiGuidance = generateAIGuidance(file, content, category, complexity);
  }

  const errorHandling = extractErrorHandling(content);
  const integrationPoints = generateIntegrationPoints(content, category);

  return {
    purpose,
    keyAPIs,
    dependencies,
    patterns,
    relatedContexts: [],
    aiGuidance,
    errorHandling,
    integrationPoints,
    crossReferences
  };
}

function extractImports(content: string): string[] {
  const importRegex = /(?:import\s+.*?\s+from\s+['"]([^'"]+)['"]|require\(['"]([^'"]+)['"]\))/g;
  const imports = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1] || match[2]);
  }
  
  return imports.filter(Boolean);
}

function extractExports(content: string): string[] {
  const exportRegex = /export\s+(?:default\s+)?(?:class|function|const|let|var|interface|type)\s+(\w+)/g;
  const exports = [];
  let match;
  
  while ((match = exportRegex.exec(content)) !== null) {
    exports.push(match[1]);
  }
  
  return exports;
}

function extractFunctions(content: string): string[] {
  const functionRegex = /(?:function\s+(\w+)|(\w+)\s*(?::\s*\w+)?\s*=\s*(?:async\s+)?\([^)]*\)\s*=>|(\w+)\s*\([^)]*\)\s*{)/g;
  const functions = [];
  let match;
  
  while ((match = functionRegex.exec(content)) !== null) {
    functions.push(match[1] || match[2] || match[3]);
  }
  
  return functions.filter(f => f && !['if', 'for', 'while', 'switch'].includes(f));
}

function extractClasses(content: string): string[] {
  const classRegex = /class\s+(\w+)/g;
  const classes = [];
  let match;
  
  while ((match = classRegex.exec(content)) !== null) {
    classes.push(match[1]);
  }
  
  return classes;
}

function determineCategory(file: any): 'config' | 'source' | 'test' | 'docs' | 'other' {
  const path = file.relativePath.toLowerCase();
  
  if (path.includes('test') || path.includes('spec')) return 'test';
  if (path.includes('config') || path.endsWith('.json') || path.includes('webpack') || path.includes('.eslintrc')) return 'config';
  if (path.includes('readme') || path.includes('doc')) return 'docs';
  if (path.endsWith('.ts') || path.endsWith('.js')) return 'source';
  
  return 'other';
}

function generatePurpose(file: any, content: string, category: string, complexity: string): string {
  const fileName = file.relativePath.toLowerCase();
  
  if (category === 'config') {
    if (fileName.includes('webpack')) {
      return 'Webpack build configuration that defines bundling, optimization, and development server settings. Configures module loading, plugins, and output parameters for different environments.';
    } else if (fileName.includes('eslint')) {
      return 'ESLint configuration that defines code quality rules and linting standards. Specifies parser options, extends base configurations, and customizes rules for TypeScript projects.';
    } else if (fileName.includes('tsconfig')) {
      return 'TypeScript compiler configuration that defines compilation options, module resolution, and type checking settings. Specifies target environments and build parameters.';
    } else if (fileName.endsWith('.json')) {
      return 'JSON configuration file that stores structured data and settings for application components. Defines parameters and options in a machine-readable format.';
    }
    return 'Configuration file that manages application settings and build parameters.';
  }
  
  if (category === 'test') {
    return 'Test suite that validates functionality and behavior of application components. Includes test cases, assertions, and mocking to ensure code quality and reliability.';
  }
  
  if (category === 'docs') {
    return 'Documentation file that provides information about project setup, usage, and API references. Contains instructions and examples for developers.';
  }
  
  // Source code category
  if (fileName.includes('controller')) {
    return `HTTP request controller that handles ${complexity === 'high' ? 'complex' : 'standard'} API endpoints and request processing. Manages request validation, business logic coordination, and response formatting with ${complexity === 'high' ? 'advanced error handling and middleware integration' : 'basic CRUD operations'}.`;
  } else if (fileName.includes('service')) {
    return `Business logic service that encapsulates ${complexity === 'high' ? 'sophisticated' : 'core'} application functionality. Implements domain logic, data operations, and ${complexity === 'high' ? 'complex transaction management with caching and optimization' : 'standard data access patterns'}.`;
  } else if (fileName.includes('middleware')) {
    return `Express middleware component that processes HTTP requests with ${complexity === 'high' ? 'advanced security and validation features' : 'standard filtering and transformation'}. Handles authentication, logging, and request preprocessing.`;
  } else if (fileName.includes('route')) {
    return 'Route definition module that maps HTTP endpoints to controller methods. Defines API structure, parameter validation, and request routing configuration.';
  } else if (fileName.includes('index')) {
    return `Main application entry point that initializes server components and ${complexity === 'high' ? 'orchestrates complex service startup with dependency injection and configuration management' : 'sets up basic middleware and routing'}. Bootstraps the application and starts the HTTP server.`;
  } else if (fileName.includes('auth')) {
    return 'Authentication module that manages user identity verification and access control. Implements JWT token handling, session management, and security middleware.';
  } else if (fileName.includes('database') || fileName.includes('db')) {
    return 'Database service module that manages data persistence and query operations. Provides abstraction layer for database connections, transactions, and data access.';
  } else if (fileName.includes('cache')) {
    return 'Caching service that manages temporary data storage and retrieval optimization. Implements Redis integration, cache invalidation, and performance enhancement strategies.';
  }
  
  return `${complexity.charAt(0).toUpperCase() + complexity.slice(1)} complexity source module that implements application functionality. Contains business logic and component integration with ${complexity === 'high' ? 'advanced patterns and optimization' : 'standard implementation approaches'}.`;
}

function generatePatterns(content: string, category: string, complexity: string): string[] {
  const patterns = [];
  
  if (content.includes('async') || content.includes('await')) {
    patterns.push('Async/await pattern for asynchronous operations');
  }
  
  if (content.includes('try') && content.includes('catch')) {
    patterns.push('Try-catch error handling pattern');
  }
  
  if (content.includes('class') && content.includes('constructor')) {
    patterns.push('Class-based object-oriented design');
  }
  
  if (content.includes('express') || content.includes('Router')) {
    patterns.push('Express.js framework integration');
  }
  
  if (content.includes('middleware') || content.includes('next()')) {
    patterns.push('Middleware chain pattern');
  }
  
  if (complexity === 'high') {
    if (content.includes('Promise') || content.includes('.then(')) {
      patterns.push('Promise-based asynchronous programming');
    }
    if (content.includes('singleton') || content.includes('getInstance')) {
      patterns.push('Singleton design pattern');
    }
    if (content.includes('inject') || content.includes('container')) {
      patterns.push('Dependency injection pattern');
    }
  }
  
  if (category === 'config') {
    patterns.push('Configuration management pattern');
    if (content.includes('environment') || content.includes('process.env')) {
      patterns.push('Environment-based configuration');
    }
  }
  
  return patterns.slice(0, 5);
}

function generateCrossReferences(file: any, content: string, allFiles: any[]): any[] {
  const crossRefs = [];
  const imports = extractImports(content);
  
  for (const imp of imports.slice(0, 3)) {
    const relatedFile = allFiles.find(f => 
      f.relativePath.includes(imp) || 
      imp.includes(f.relativePath.replace(/\.[^.]+$/, ''))
    );
    
    if (relatedFile) {
      crossRefs.push({
        type: 'import',
        target: relatedFile.relativePath,
        description: `Imports functionality from ${relatedFile.relativePath}`
      });
    } else {
      crossRefs.push({
        type: 'external',
        target: imp,
        description: `External dependency: ${imp}`
      });
    }
  }
  
  return crossRefs;
}

function generateAIGuidance(file: any, content: string, category: string, complexity: string): string {
  if (complexity === 'high') {
    if (file.relativePath.includes('auth')) {
      return 'Focus on security patterns, token validation, and error handling. Pay attention to async authentication flows and middleware integration points.';
    } else if (file.relativePath.includes('database')) {
      return 'Consider transaction boundaries, connection pooling, and query optimization. Watch for async operations and proper error handling in data access layers.';
    } else if (file.relativePath.includes('service')) {
      return 'This service layer requires attention to business logic isolation, error propagation, and integration with other services. Consider caching and performance implications.';
    }
    return 'Complex component requiring careful attention to async operations, error handling, and integration patterns. Review dependencies and side effects when making changes.';
  }
  
  return 'Standard implementation following established patterns. Focus on maintaining consistency with existing code style and error handling approaches.';
}

function extractErrorHandling(content: string): string[] {
  const errorPatterns = [];
  
  if (content.includes('try') && content.includes('catch')) {
    errorPatterns.push('Try-catch blocks for exception handling');
  }
  
  if (content.includes('throw new Error') || content.includes('throw')) {
    errorPatterns.push('Custom error throwing');
  }
  
  if (content.includes('status(') && content.includes('json({')) {
    errorPatterns.push('HTTP error response formatting');
  }
  
  if (content.includes('logger') || content.includes('console.error')) {
    errorPatterns.push('Error logging and monitoring');
  }
  
  return errorPatterns.slice(0, 3);
}

function generateIntegrationPoints(content: string, category: string): string[] {
  const integrations = [];
  
  if (content.includes('database') || content.includes('db') || content.includes('prisma')) {
    integrations.push('Database layer integration');
  }
  
  if (content.includes('redis') || content.includes('cache')) {
    integrations.push('Cache layer integration');
  }
  
  if (content.includes('express') || content.includes('app.')) {
    integrations.push('Express framework integration');
  }
  
  if (content.includes('auth') || content.includes('jwt')) {
    integrations.push('Authentication system integration');
  }
  
  if (content.includes('api') || content.includes('endpoint')) {
    integrations.push('API endpoint integration');
  }
  
  return integrations.slice(0, 4);
}

function inferExpectedFiles(query: string, files: any[]): string[] {
  const queryLower = query.toLowerCase();
  const expected = [];
  
  for (const file of files) {
    const fileName = file.relativePath.toLowerCase();
    
    if (queryLower.includes('user') && fileName.includes('user')) {
      expected.push(fileName);
    } else if (queryLower.includes('controller') && fileName.includes('controller')) {
      expected.push(fileName);
    } else if (queryLower.includes('service') && fileName.includes('service')) {
      expected.push(fileName);
    } else if (queryLower.includes('config') && (fileName.includes('config') || fileName.endsWith('.json'))) {
      expected.push(fileName);
    } else if (queryLower.includes('express') && fileName.includes('index')) {
      expected.push(fileName);
    }
  }
  
  return expected.slice(0, 3);
}

function generateFinalTestReport(results: { repo: string; metrics: AITestMetrics; report: string }[]): string {
  const sections = [
    '\n## Test Summary',
    `Total repositories tested: ${results.length}`,
    `Test execution completed: ${new Date().toISOString()}`,
    ''
  ];
  
  if (results.length === 0) {
    sections.push('No test results available.');
    return sections.join('\n');
  }
  
  // Calculate averages
  const avgMetrics = results.reduce((acc, result) => ({
    completeness: acc.completeness + result.metrics.contextGeneration.completenessScore,
    accuracy: acc.accuracy + result.metrics.contextGeneration.accuracyScore,
    tokenEfficiency: acc.tokenEfficiency + result.metrics.tokenEfficiency.tokenUtilizationRate,
    qualityScore: acc.qualityScore + result.metrics.qualityAssurance.overallQualityScore,
    searchPrecision: acc.searchPrecision + result.metrics.searchRelevance.precisionAt5
  }), { completeness: 0, accuracy: 0, tokenEfficiency: 0, qualityScore: 0, searchPrecision: 0 });
  
  const count = results.length;
  
  sections.push('## Overall Performance Metrics');
  sections.push(`- Average Completeness Score: ${(avgMetrics.completeness / count).toFixed(1)}%`);
  sections.push(`- Average Accuracy Score: ${(avgMetrics.accuracy / count).toFixed(1)}%`);
  sections.push(`- Average Token Efficiency: ${(avgMetrics.tokenEfficiency / count * 100).toFixed(1)}%`);
  sections.push(`- Average Quality Score: ${(avgMetrics.qualityScore / count).toFixed(1)}%`);
  sections.push(`- Average Search Precision@5: ${(avgMetrics.searchPrecision / count * 100).toFixed(1)}%`);
  sections.push('');
  
  // Individual repository results
  sections.push('## Repository-Specific Results');
  for (const result of results) {
    sections.push(`\n### ${result.repo}`);
    sections.push(`- Context Generation Score: ${result.metrics.contextGeneration.completenessScore.toFixed(1)}%`);
    sections.push(`- Search Relevance: ${(result.metrics.searchRelevance.precisionAt5 * 100).toFixed(1)}%`);
    sections.push(`- Token Utilization: ${(result.metrics.tokenEfficiency.tokenUtilizationRate * 100).toFixed(1)}%`);
    sections.push(`- Overall Quality: ${result.metrics.qualityAssurance.overallQualityScore.toFixed(1)}%`);
  }
  
  // Recommendations
  sections.push('\n## Recommendations');
  
  const lowCompleteness = results.filter(r => r.metrics.contextGeneration.completenessScore < 70);
  if (lowCompleteness.length > 0) {
    sections.push(`- ${lowCompleteness.length} repositories have low completeness scores. Consider improving context generation detail.`);
  }
  
  const lowTokenEfficiency = results.filter(r => r.metrics.tokenEfficiency.tokenUtilizationRate < 0.5);
  if (lowTokenEfficiency.length > 0) {
    sections.push(`- ${lowTokenEfficiency.length} repositories have low token efficiency. Optimize context length and content density.`);
  }
  
  const lowQuality = results.filter(r => r.metrics.qualityAssurance.overallQualityScore < 60);
  if (lowQuality.length > 0) {
    sections.push(`- ${lowQuality.length} repositories have quality issues. Review validation rules and context standards.`);
  }
  
  if (lowCompleteness.length === 0 && lowTokenEfficiency.length === 0 && lowQuality.length === 0) {
    sections.push('- All repositories meet quality thresholds. Consider optimizing for edge cases and performance.');
  }
  
  return sections.join('\n');
}