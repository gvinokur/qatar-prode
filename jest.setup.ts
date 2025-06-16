import '@testing-library/jest-dom';

// Configure React Testing Library
import { configure } from '@testing-library/react';

// Increase the default timeout
configure({ asyncUtilTimeout: 5000 });

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

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