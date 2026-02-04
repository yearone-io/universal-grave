import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock window.lukso for browser provider tests
Object.defineProperty(window, 'lukso', {
  value: {
    request: vi.fn(),
    on: vi.fn(),
    removeListener: vi.fn(),
  },
  writable: true,
});

// Mock global fetch for IPFS tests
global.fetch = vi.fn();

// Mock ResizeObserver (often needed for Chakra UI)
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();
