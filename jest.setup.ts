import '@testing-library/jest-dom';

// Configure React Testing Library
// Note: asyncUtilTimeout has been removed in newer versions of @testing-library/react
// Use waitForOptions in individual test calls if needed

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
class MockIntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor(private callback: IntersectionObserverCallback, options?: IntersectionObserverInit) {}

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
}

global.IntersectionObserver = MockIntersectionObserver as any;

// Suppress specific console errors during tests
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('The current testing environment is not configured to support act(...)')
  ) {
    return;
  }
  originalError.call(console, ...args);
}; 