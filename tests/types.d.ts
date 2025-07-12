// Test type declarations for Jest custom matchers

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidContext(): R;
      toHaveTokenEfficiency(min: number, max: number): R;
      toHaveQualityScore(minScore: number): R;
    }
  }
}

export {};