import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockDotenvConfig = vi.fn();

vi.mock('dotenv', () => ({
    default: { config: mockDotenvConfig },
}));

vi.mock('@src/core/findRootDir', () => ({
    default: vi.fn(),
}));

describe('loadEnv', () => {
    let tmpDir: string;

    beforeEach(() => {
        vi.resetModules();
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'loadenv-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('loads .env from root directory when both marker and env file exist', async () => {
        const envPath = path.join(tmpDir, '.env');
        fs.writeFileSync(envPath, 'TEST_VAR=hello');

        const findRootDir = (await import('@src/core/findRootDir')).default as ReturnType<typeof vi.fn>;
        findRootDir.mockReturnValue(tmpDir);

        await import('@src/core/loadEnv');

        expect(mockDotenvConfig).toHaveBeenCalledWith({ path: envPath });
    });

    it('throws when findRootDir cannot locate the marker file', async () => {
        vi.resetModules();

        const findRootDirMod = await import('@src/core/findRootDir');
        (findRootDirMod.default as ReturnType<typeof vi.fn>).mockImplementation(() => {
            throw new Error('Could not find root directory');
        });

        await expect(() => import('@src/core/loadEnv')).rejects.toThrow('Could not find root directory');
    });

    it('throws when .env file does not exist in root directory', async () => {
        vi.resetModules();

        const findRootDirMod = await import('@src/core/findRootDir');
        (findRootDirMod.default as ReturnType<typeof vi.fn>).mockReturnValue(tmpDir);

        await expect(() => import('@src/core/loadEnv')).rejects.toThrow('Could not find env file');
    });
});
