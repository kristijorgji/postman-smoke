import { describe, expect, it, vi } from 'vitest';

vi.mock('dotenv', () => ({
    default: { config: vi.fn() },
}));

describe('index', () => {
    it('calls start and logs message', async () => {
        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        await import('@src/index');

        await new Promise(resolve => setTimeout(resolve, 50));

        expect(consoleSpy).toHaveBeenCalledWith('Have fun - Kristi Jorgji');
        consoleSpy.mockRestore();
    });
});
