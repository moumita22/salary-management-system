import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Clean localStorage & mocks between tests
beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

// Provide a default mock for global.fetch if components make un-spied calls
globalThis.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: [] }),
  })
);
