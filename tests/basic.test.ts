import { describe, test, expect } from '@jest/globals';
import { promises as fs } from 'fs';
import path from 'path';

describe('AI Context Testing Framework', () => {
  test('should have basic test infrastructure working', () => {
    expect(true).toBe(true);
  });

  test('should be able to import core modules', async () => {
    const { FileScanner } = await import('../src/core/file-scanner.js');
    const { ContextStorage } = await import('../src/core/context-storage.js');
    const { QueueManager } = await import('../src/core/queue-manager.js');
    
    expect(FileScanner).toBeDefined();
    expect(ContextStorage).toBeDefined();
    expect(QueueManager).toBeDefined();
  });

  test('should be able to create temporary directories', async () => {
    const tempDir = await (global as any).testUtils.createTempDir();
    expect(tempDir).toBeTruthy();
    
    // Verify directory exists
    const stats = await fs.stat(tempDir);
    expect(stats.isDirectory()).toBe(true);
    
    // Cleanup
    await (global as any).testUtils.cleanup(tempDir);
  });

  test('should handle file operations', async () => {
    const tempDir = await (global as any).testUtils.createTempDir();
    const testFile = path.join(tempDir, 'test.txt');
    
    await fs.writeFile(testFile, 'test content');
    const content = await fs.readFile(testFile, 'utf-8');
    
    expect(content).toBe('test content');
    
    await (global as any).testUtils.cleanup(tempDir);
  });

  test('should validate test fixtures structure', async () => {
    const { sampleRepositories } = await import('./fixtures/sample-repo.js');
    
    expect(Array.isArray(sampleRepositories)).toBe(true);
    expect(sampleRepositories.length).toBeGreaterThan(0);
    
    for (const repo of sampleRepositories) {
      expect(repo.name).toBeTruthy();
      expect(repo.description).toBeTruthy();
      expect(repo.expectedComplexity).toMatch(/^(low|medium|high)$/);
      expect(typeof repo.files).toBe('object');
      expect(Object.keys(repo.files).length).toBeGreaterThan(0);
    }
  });

  test('should create and cleanup test repositories', async () => {
    const { sampleRepositories, createTestRepository, cleanupTestRepository } = await import('./fixtures/sample-repo.js');
    const tempDir = await (global as any).testUtils.createTempDir();
    
    const repo = sampleRepositories[0];
    const repoPath = await createTestRepository(repo, tempDir);
    
    expect(repoPath).toBeTruthy();
    
    // Verify files were created
    const stats = await fs.stat(repoPath);
    expect(stats.isDirectory()).toBe(true);
    
    // Check that at least one file exists
    const packageJsonPath = path.join(repoPath, 'package.json');
    const packageStats = await fs.stat(packageJsonPath);
    expect(packageStats.isFile()).toBe(true);
    
    // Cleanup
    await cleanupTestRepository(repoPath);
    await (global as any).testUtils.cleanup(tempDir);
  });

  test('should initialize AI test metrics collector', async () => {
    const { AITestMetricsCollector } = await import('./utils/ai-test-metrics.js');
    const tempDir = await (global as any).testUtils.createTempDir();
    
    const collector = new AITestMetricsCollector(tempDir);
    expect(collector).toBeDefined();
    
    // Test timing functions
    collector.startTiming();
    await new Promise(resolve => setTimeout(resolve, 10));
    const elapsed = collector.endTiming();
    
    expect(elapsed).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(1000); // Should be less than 1 second
    
    await (global as any).testUtils.cleanup(tempDir);
  });

  test('should demonstrate MCP tool integration readiness', async () => {
    const tempDir = await (global as any).testUtils.createTempDir();
    
    try {
      // Test that all core components can be instantiated
      const { FileScanner } = await import('../src/core/file-scanner.js');
      const { ContextStorage } = await import('../src/core/context-storage.js');
      const { QueueManager } = await import('../src/core/queue-manager.js');
      const { ContextSearch } = await import('../src/core/context-search.js');
      const { ContextValidator } = await import('../src/core/context-validator.js');
      const { ChangeDetector } = await import('../src/core/change-detector.js');
      const { ContextUpdater } = await import('../src/core/context-updater.js');

      const fileScanner = new FileScanner(tempDir, ['node_modules']);
      const contextStorage = new ContextStorage(tempDir);
      const queueManager = new QueueManager();
      const contextSearch = new ContextSearch(tempDir);
      const contextValidator = new ContextValidator(tempDir);
      const changeDetector = new ChangeDetector(tempDir);
      const contextUpdater = new ContextUpdater(tempDir, fileScanner, contextStorage, changeDetector, queueManager);

      expect(fileScanner).toBeDefined();
      expect(contextStorage).toBeDefined();
      expect(queueManager).toBeDefined();
      expect(contextSearch).toBeDefined();
      expect(contextValidator).toBeDefined();
      expect(changeDetector).toBeDefined();
      expect(contextUpdater).toBeDefined();

      // Test basic functionality without errors
      const files = await fileScanner.scanRepository();
      expect(Array.isArray(files)).toBe(true);

    } finally {
      await (global as any).testUtils.cleanup(tempDir);
    }
  });
});