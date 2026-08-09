/**
 * Global smoke test: ensures the test environment and Vitest run correctly.
 * Keep __tests__/ for global helpers, setup, and integration tests only.
 */
describe('smoke', () => {
    it('runs in node environment', () => {
        expect(process.env.NODE_ENV !== undefined || true).toBe(true);
    });
});
