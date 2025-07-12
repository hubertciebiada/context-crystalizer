import { promises as fs } from 'fs';
import path from 'path';

// Global test setup
beforeAll(async () => {
  // Ensure test directories exist
  const testDataDir = path.join(process.cwd(), 'tests', 'fixtures');
  await fs.mkdir(testDataDir, { recursive: true });
});

// Global test cleanup
afterAll(async () => {
  // Clean up any test artifacts
  const testOutputDir = path.join(process.cwd(), 'tests', 'temp');
  try {
    await fs.rmdir(testOutputDir, { recursive: true });
  } catch {
    // Directory might not exist
  }
});

// Custom matchers for AI context testing
expect.extend({
  toBeValidContext(received: any) {
    const pass = 
      received &&
      typeof received.purpose === 'string' &&
      received.purpose.length > 0 &&
      Array.isArray(received.keyAPIs) &&
      Array.isArray(received.dependencies) &&
      received.relativePath &&
      received.category;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid context`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid context with required fields`,
        pass: false,
      };
    }
  },
  
  toHaveTokenEfficiency(received: any, expectedMin: number, expectedMax: number) {
    const tokenCount = received.tokenCount || 0;
    const pass = tokenCount >= expectedMin && tokenCount <= expectedMax;
    
    if (pass) {
      return {
        message: () => `expected ${tokenCount} not to be between ${expectedMin} and ${expectedMax}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${tokenCount} to be between ${expectedMin} and ${expectedMax}`,
        pass: false,
      };
    }
  },
  
  toHaveQualityScore(received: any, minScore: number) {
    const score = received.score || 0;
    const pass = score >= minScore;
    
    if (pass) {
      return {
        message: () => `expected quality score ${score} not to be at least ${minScore}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected quality score ${score} to be at least ${minScore}`,
        pass: false,
      };
    }
  }
});

// Global test utilities
global.testUtils = {
  createTempDir: async (): Promise<string> => {
    const tempDir = path.join(process.cwd(), 'tests', 'temp', `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    await fs.mkdir(tempDir, { recursive: true });
    return tempDir;
  },
  
  cleanup: async (dirPath: string): Promise<void> => {
    try {
      await fs.rmdir(dirPath, { recursive: true });
    } catch {
      // Directory might not exist or be empty
    }
  }
};

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidContext(): R;
      toHaveTokenEfficiency(min: number, max: number): R;
      toHaveQualityScore(minScore: number): R;
    }
  }
  
  var testUtils: {
    createTempDir(): Promise<string>;
    cleanup(dirPath: string): Promise<void>;
  };
}