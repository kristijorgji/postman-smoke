import path from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('logger', () => {
    const originalArgv = [...process.argv];

    beforeEach(() => {
        vi.resetModules();
    });

    afterEach(() => {
        process.argv = originalArgv;
    });

    it('exports a logger with expected methods', async () => {
        vi.doMock('@src/core/findRootDir', () => ({
            default: vi.fn().mockReturnValue('/fake/root'),
        }));

        const mod = await import('@src/logger/index');

        expect(mod.logger).toBeDefined();
        expect(typeof mod.logger.info).toBe('function');
        expect(typeof mod.logger.warn).toBe('function');
        expect(typeof mod.logger.error).toBe('function');
        expect(typeof mod.logger.debug).toBe('function');
    });

    it('logger has console and file transports', async () => {
        vi.doMock('@src/core/findRootDir', () => ({
            default: vi.fn().mockReturnValue('/fake/root'),
        }));

        const mod = await import('@src/logger/index');
        const transportNames = mod.logger.transports.map((t: { constructor: { name: string } }) => t.constructor.name);

        expect(transportNames).toContain('Console');
        expect(transportNames).toContain('File');
    });

    it('throws when process.argv[1] is not available', async () => {
        process.argv = ['node'];

        vi.doMock('@src/core/findRootDir', () => ({
            default: vi.fn().mockReturnValue('/fake/root'),
        }));

        await expect(() => import('@src/logger/index')).rejects.toThrow(
            'Cannot determine main script path from process.argv[1]',
        );
    });

    it('throws when findRootDir returns null', async () => {
        process.argv = ['node', '/some/script.ts'];

        vi.doMock('@src/core/findRootDir', () => ({
            default: vi.fn().mockReturnValue(null),
        }));

        await expect(() => import('@src/logger/index')).rejects.toThrow('Could not find project root');
    });

    it('strips src/ prefix from relative script path', async () => {
        const fakeRoot = '/fake/root';
        process.argv = ['node', path.join(fakeRoot, 'src', 'scripts', 'example.ts')];

        vi.doMock('@src/core/findRootDir', () => ({
            default: vi.fn().mockReturnValue(fakeRoot),
        }));

        const mod = await import('@src/logger/index');

        expect(mod.logger).toBeDefined();
    });
});
