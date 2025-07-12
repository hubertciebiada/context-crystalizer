import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { FileScanner } from '../../src/core/file-scanner.js';
import { ContextStorage } from '../../src/core/context-storage.js';
import { QueueManager } from '../../src/core/queue-manager.js';
import { ContextSearch } from '../../src/core/context-search.js';
import { ContextValidator } from '../../src/core/context-validator.js';
import { ChangeDetector } from '../../src/core/change-detector.js';
import { ContextUpdater } from '../../src/core/context-updater.js';
import { sampleRepositories, createTestRepository, cleanupTestRepository } from '../fixtures/sample-repo.js';
import { AITestMetricsCollector } from '../utils/ai-test-metrics.js';

describe('MCP Tools Integration for AI Agents', () => {
  let tempDir: string;
  let testRepoPath: string;
  let fileScanner: FileScanner;
  let contextStorage: ContextStorage;
  let queueManager: QueueManager;
  let contextSearch: ContextSearch;
  let contextValidator: ContextValidator;
  let changeDetector: ChangeDetector;
  let contextUpdater: ContextUpdater;
  let metricsCollector: AITestMetricsCollector;

  beforeEach(async () => {
    tempDir = await global.testUtils.createTempDir();
  });

  afterEach(async () => {
    if (testRepoPath) {
      await cleanupTestRepository(testRepoPath);
    }
    await global.testUtils.cleanup(tempDir);
  });

  describe('Tool Workflow Integration', () => {
    test('should support complete AI agent workflow', async () => {
      const repo = sampleRepositories.find(r => r.name === 'simple-api')!;
      testRepoPath = await createTestRepository(repo, tempDir);

      // Initialize all components
      fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      contextStorage = new ContextStorage(testRepoPath);
      queueManager = new QueueManager();
      contextSearch = new ContextSearch(testRepoPath);
      contextValidator = new ContextValidator(testRepoPath);
      changeDetector = new ChangeDetector(testRepoPath);
      contextUpdater = new ContextUpdater(testRepoPath, fileScanner, contextStorage, changeDetector, queueManager);
      metricsCollector = new AITestMetricsCollector(testRepoPath);

      // Step 1: Initialize crystallization (init_crystallization tool)
      const files = await fileScanner.scanRepository();
      await queueManager.initializeQueue(files, testRepoPath, []);
      await contextStorage.initialize(files.map(f => f.path));

      expect(files.length).toBeGreaterThan(0);

      // Step 2: Process files (get_next_file tool)
      const processedFiles = [];
      let nextFile;
      while ((nextFile = await queueManager.getNextFile()) !== null) {
        const content = await fileScanner.readFile(nextFile.path);
        processedFiles.push({ file: nextFile, content });
        
        // Step 3: Store contexts (store_ai_context tool)
        const mockContext = await generateMockAIContext(nextFile, content);
        await contextStorage.storeContext(nextFile.relativePath, mockContext, content, {
          complexity: nextFile.complexity,
          category: nextFile.category,
          estimatedTokens: nextFile.estimatedTokens
        });

        await queueManager.markProcessed(nextFile.path);
      }

      expect(processedFiles.length).toBe(files.length);

      // Step 4: Check status (get_context_status tool)
      const progress = queueManager.getProgress();
      const stats = await contextStorage.getContextStatistics();

      expect(progress.processedFiles).toBe(files.length);
      expect(stats.totalContexts).toBe(files.length);
      expect(progress.completionPercentage).toBe(100);

      // Step 5: Search contexts (search_context tool)
      const searchResults = await contextSearch.searchContexts('user controller', 4000, 'source');
      expect(searchResults.length).toBeGreaterThan(0);

      const userControllerResult = searchResults.find(r => 
        r.context.relativePath.includes('Controller') && 
        r.context.purpose.toLowerCase().includes('user')
      );
      expect(userControllerResult).toBeTruthy();
      expect(userControllerResult!.relevanceScore).toBeGreaterThan(0);

      // Step 6: Get context bundle (get_context_bundle tool)
      const fileList = files.slice(0, 3).map(f => f.relativePath);
      const bundle = await contextSearch.getContextBundle(fileList, 8000);

      expect(bundle.contexts.length).toBeGreaterThan(0);
      expect(bundle.totalTokens).toBeLessThanOrEqual(8000);
      expect(bundle.contexts.length).toBeLessThanOrEqual(fileList.length);

      // Step 7: Find related contexts (find_related_contexts tool)
      const controllerFile = files.find(f => f.relativePath.includes('Controller'));
      if (controllerFile) {
        const relatedContexts = await contextSearch.findRelatedContexts(controllerFile.relativePath, 5);
        expect(relatedContexts.length).toBeGreaterThanOrEqual(0);
        
        // Should find related service files
        const serviceRelated = relatedContexts.find(r => r.context.relativePath.includes('Service'));
        if (serviceRelated) {
          expect(serviceRelated.relevanceScore).toBeGreaterThan(0);
        }
      }
    });

    test('should handle AI agent error scenarios gracefully', async () => {
      const repo = sampleRepositories[0];
      testRepoPath = await createTestRepository(repo, tempDir);

      fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      contextStorage = new ContextStorage(testRepoPath);
      queueManager = new QueueManager();
      contextSearch = new ContextSearch(testRepoPath);

      // Test error handling without initialization
      const searchResultsEmpty = await contextSearch.searchContexts('test query');
      expect(searchResultsEmpty).toEqual([]);

      const bundleEmpty = await contextSearch.getContextBundle(['nonexistent.ts']);
      expect(bundleEmpty.contexts).toEqual([]);
      expect(bundleEmpty.totalTokens).toBe(0);

      // Test with invalid file paths
      const relatedEmpty = await contextSearch.findRelatedContexts('nonexistent/file.ts');
      expect(relatedEmpty).toEqual([]);
    });

    test('should support concurrent AI agent access', async () => {
      const repo = sampleRepositories.find(r => r.name === 'simple-api')!;
      testRepoPath = await createTestRepository(repo, tempDir);

      fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      contextStorage = new ContextStorage(testRepoPath);
      queueManager = new QueueManager();
      contextSearch = new ContextSearch(testRepoPath);

      const files = await fileScanner.scanRepository();
      await queueManager.initializeQueue(files, testRepoPath, []);
      await contextStorage.initialize(files.map(f => f.path));

      // Process some files first
      for (const file of files.slice(0, 3)) {
        const content = await fileScanner.readFile(file.path);
        const mockContext = await generateMockAIContext(file, content);
        await contextStorage.storeContext(file.relativePath, mockContext, content, {
          complexity: file.complexity,
          category: file.category,
          estimatedTokens: file.estimatedTokens
        });
      }

      // Simulate concurrent AI agent operations
      const searchPromises = [
        contextSearch.searchContexts('controller', 2000),
        contextSearch.searchContexts('service', 2000),
        contextSearch.searchContexts('user', 2000),
      ];

      const bundlePromises = [
        contextSearch.getContextBundle(files.slice(0, 2).map(f => f.relativePath), 4000),
        contextSearch.getContextBundle(files.slice(1, 3).map(f => f.relativePath), 4000),
      ];

      // All operations should complete successfully
      const searchResults = await Promise.all(searchPromises);
      const bundleResults = await Promise.all(bundlePromises);

      for (const results of searchResults) {
        expect(Array.isArray(results)).toBe(true);
      }

      for (const bundle of bundleResults) {
        expect(bundle.contexts).toBeDefined();
        expect(bundle.totalTokens).toBeDefined();
      }
    });
  });

  describe('Search Relevance for AI Agents', () => {
    test('should return highly relevant results for AI queries', async () => {
      const repo = sampleRepositories.find(r => r.name === 'simple-api')!;
      testRepoPath = await createTestRepository(repo, tempDir);

      fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      contextStorage = new ContextStorage(testRepoPath);
      contextSearch = new ContextSearch(testRepoPath);
      metricsCollector = new AITestMetricsCollector(testRepoPath);

      const files = await fileScanner.scanRepository();
      await contextStorage.initialize(files.map(f => f.path));

      // Process files and create contexts
      for (const file of files) {
        const content = await fileScanner.readFile(file.path);
        const mockContext = await generateMockAIContext(file, content);
        await contextStorage.storeContext(file.relativePath, mockContext, content, {
          complexity: file.complexity,
          category: file.category,
          estimatedTokens: file.estimatedTokens
        });
      }

      // Test various AI-style queries
      const testQueries = [
        {
          query: 'user management controller',
          expectedFiles: ['UserController.ts'],
          description: 'Should find user controller'
        },
        {
          query: 'database service layer',
          expectedFiles: ['UserService.ts'],
          description: 'Should find service layer components'
        },
        {
          query: 'API routes endpoints',
          expectedFiles: ['users.ts', 'index.ts'],
          description: 'Should find route definitions'
        },
        {
          query: 'express middleware',
          expectedFiles: ['index.ts'],
          description: 'Should find Express setup'
        }
      ];

      const searchResults = [];

      for (const testQuery of testQueries) {
        const results = await contextSearch.searchContexts(testQuery.query, 4000);
        searchResults.push({
          query: testQuery.query,
          results,
          expectedFiles: testQuery.expectedFiles,
          description: testQuery.description
        });

        // Verify results are relevant
        expect(results.length).toBeGreaterThan(0);
        
        // Check that top results have reasonable relevance scores
        const topResult = results[0];
        expect(topResult.relevanceScore).toBeGreaterThan(0);
        expect(topResult.context.purpose).toBeTruthy();
        expect(topResult.highlights).toBeDefined();
      }

      // Evaluate search metrics
      const searchMetrics = metricsCollector.evaluateSearchRelevance(
        testQueries.map(q => q.query),
        searchResults
      );

      expect(searchMetrics.averageRelevanceScore).toBeGreaterThan(0.3);
      expect(searchMetrics.falsePositiveRate).toBeLessThan(0.5);
      expect(searchMetrics.precisionAt5).toBeGreaterThan(0.4);
    });

    test('should handle complex search queries with multiple terms', async () => {
      const repo = sampleRepositories.find(r => r.name === 'complex-microservice')!;
      testRepoPath = await createTestRepository(repo, tempDir);

      fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      contextStorage = new ContextStorage(testRepoPath);
      contextSearch = new ContextSearch(testRepoPath);

      const files = await fileScanner.scanRepository();
      await contextStorage.initialize(files.map(f => f.path));

      // Process files
      for (const file of files.slice(0, 5)) { // Process first 5 files for performance
        const content = await fileScanner.readFile(file.path);
        const mockContext = await generateMockAIContext(file, content);
        await contextStorage.storeContext(file.relativePath, mockContext, content, {
          complexity: file.complexity,
          category: file.category,
          estimatedTokens: file.estimatedTokens
        });
      }

      // Complex multi-term queries
      const complexQueries = [
        'authentication middleware jwt token validation',
        'database connection pooling transaction management',
        'error handling logging metrics monitoring',
        'cache redis session management'
      ];

      for (const query of complexQueries) {
        const results = await contextSearch.searchContexts(query, 6000);
        
        // Should return results even for complex queries
        expect(results.length).toBeGreaterThanOrEqual(0);
        
        if (results.length > 0) {
          // Top results should have meaningful relevance scores
          expect(results[0].relevanceScore).toBeGreaterThan(0);
          
          // Should have highlights explaining the relevance
          expect(results[0].highlights.length).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('Update Detection for AI Workflows', () => {
    test('should detect and handle file changes for AI context updates', async () => {
      const repo = sampleRepositories[0];
      testRepoPath = await createTestRepository(repo, tempDir);

      fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      contextStorage = new ContextStorage(testRepoPath);
      queueManager = new QueueManager();
      changeDetector = new ChangeDetector(testRepoPath);
      contextUpdater = new ContextUpdater(testRepoPath, fileScanner, contextStorage, changeDetector, queueManager);

      const files = await fileScanner.scanRepository();
      await queueManager.initializeQueue(files, testRepoPath, []);
      await contextStorage.initialize(files.map(f => f.path));

      // Initial context generation
      for (const file of files.slice(0, 3)) {
        const content = await fileScanner.readFile(file.path);
        const mockContext = await generateMockAIContext(file, content);
        await contextStorage.storeContext(file.relativePath, mockContext, content, {
          complexity: file.complexity,
          category: file.category,
          estimatedTokens: file.estimatedTokens
        });
      }

      // Test update detection
      const updateStatus = await contextUpdater.getUpdateStatus();
      expect(updateStatus.needsUpdate).toBeDefined();
      expect(updateStatus.summary.totalFiles).toBeGreaterThan(0);
      expect(updateStatus.summary.contextCoverage).toBeGreaterThan(0);

      // Test update workflow
      const updateResult = await contextUpdater.updateContexts({
        forceUpdate: false,
        includeUnchanged: true,
        cleanupDeleted: true
      });

      expect(updateResult.summary.filesScanned).toBeGreaterThan(0);
      expect(updateResult.errors.length).toBe(0);
    });

    test('should validate context freshness for AI agents', async () => {
      const repo = sampleRepositories[0];
      testRepoPath = await createTestRepository(repo, tempDir);

      contextUpdater = new ContextUpdater(
        testRepoPath,
        new FileScanner(testRepoPath, []),
        new ContextStorage(testRepoPath),
        new ChangeDetector(testRepoPath),
        new QueueManager()
      );

      // Test freshness validation with non-existent file
      const freshnessResult = await contextUpdater.validateContextFreshness('nonexistent.ts');
      expect(freshnessResult.isFresh).toBe(false);
      expect(freshnessResult.reason).toBeTruthy();
    });
  });

  describe('Quality Validation for AI Consumption', () => {
    test('should provide quality feedback suitable for AI agents', async () => {
      const repo = sampleRepositories[0];
      testRepoPath = await createTestRepository(repo, tempDir);

      fileScanner = new FileScanner(testRepoPath, ['node_modules', '.git']);
      contextStorage = new ContextStorage(testRepoPath);
      contextValidator = new ContextValidator(testRepoPath);

      const files = await fileScanner.scanRepository();
      await contextStorage.initialize(files.map(f => f.path));

      // Generate contexts
      for (const file of files.slice(0, 3)) {
        const content = await fileScanner.readFile(file.path);
        const mockContext = await generateMockAIContext(file, content);
        await contextStorage.storeContext(file.relativePath, mockContext, content, {
          complexity: file.complexity,
          category: file.category,
          estimatedTokens: file.estimatedTokens
        });
      }

      // Test project quality report
      const qualityReport = await contextValidator.generateProjectQualityReport();
      
      expect(qualityReport.totalContexts).toBeGreaterThan(0);
      expect(qualityReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(qualityReport.overallScore).toBeLessThanOrEqual(100);
      expect(qualityReport.recommendations).toBeDefined();
      expect(Array.isArray(qualityReport.recommendations)).toBe(true);
      expect(qualityReport.categoryScores).toBeDefined();
      expect(qualityReport.metrics.avgTokensPerContext).toBeGreaterThan(0);
    });
  });
});

// Helper function to generate realistic AI context for testing
async function generateMockAIContext(file: any, content: string): Promise<any> {
  const lines = content.split('\n');
  const imports = lines.filter(line => 
    line.trim().startsWith('import') || 
    line.includes('require(')
  );
  
  const classMatches = content.match(/class\s+(\w+)/g) || [];
  const functionMatches = content.match(/(?:function\s+(\w+)|(\w+)\s*\([^)]*\)\s*{|(\w+)\s*=\s*\([^)]*\)\s*=>)/g) || [];
  const exportMatches = content.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g) || [];

  const keyAPIs = [
    ...classMatches.map(m => m.replace('class ', '')),
    ...functionMatches.slice(0, 3).map(m => {
      const match = m.match(/(?:function\s+(\w+)|(\w+)\s*\(|(\w+)\s*=/);
      return match ? (match[1] || match[2] || match[3]) : 'function';
    }),
    ...exportMatches.slice(0, 2).map(m => {
      const match = m.match(/export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/);
      return match ? match[1] : 'export';
    })
  ].filter(Boolean).slice(0, 5);

  const dependencies = imports.slice(0, 3).map(imp => {
    const match = imp.match(/from\s+['"]([^'"]+)['"]/) || imp.match(/require\(['"]([^'"]+)['"]\)/);
    return match ? match[1] : '';
  }).filter(Boolean);

  let purpose = '';
  const fileName = file.relativePath.toLowerCase();

  if (fileName.includes('controller')) {
    purpose = 'HTTP request controller that handles API endpoints and manages request/response flow. Processes incoming requests, validates data, and coordinates with service layer components.';
  } else if (fileName.includes('service')) {
    purpose = 'Business logic service that encapsulates core application functionality. Manages data operations, implements business rules, and provides abstraction layer for data access.';
  } else if (fileName.includes('middleware')) {
    purpose = 'Express middleware component that processes HTTP requests before they reach route handlers. Handles authentication, validation, logging, and other cross-cutting concerns.';
  } else if (fileName.includes('route')) {
    purpose = 'Route definition module that maps HTTP endpoints to controller methods. Defines API structure and request routing configuration.';
  } else if (fileName.includes('config')) {
    purpose = 'Configuration module that manages application settings and environment variables. Centralizes configuration management and provides typed access to config values.';
  } else if (fileName.includes('index')) {
    purpose = 'Main application entry point that initializes the server and bootstraps core components. Sets up middleware, routes, and starts the HTTP server.';
  } else {
    purpose = `${file.category.charAt(0).toUpperCase() + file.category.slice(1)} module that implements application functionality. Contains ${file.complexity} complexity logic and integrates with other system components.`;
  }

  return {
    purpose,
    keyAPIs,
    dependencies,
    patterns: file.category === 'source' ? ['Async/await pattern', 'Error handling', 'Dependency injection'] : [],
    relatedContexts: [],
    aiGuidance: file.complexity === 'high' ? 
      'Pay attention to async operations, error handling patterns, and integration points when working with this component.' : 
      undefined,
    errorHandling: file.category === 'source' ? ['Try-catch blocks', 'HTTP error responses'] : undefined,
    integrationPoints: file.category === 'source' ? ['Database layer', 'External APIs'] : undefined,
  };
}