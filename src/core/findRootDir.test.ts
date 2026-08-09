import fs from 'fs';
import os from 'os';
import path from 'path';

import { describe, expect, it } from 'vitest';

import findRootDir from '@src/core/findRootDir';

function createTempDirTree(): { rootDir: string; nestedDir: string } {
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), 'tax-helper-root-'));
    const rootDir = path.join(tmpBase, 'project-root');
    const nestedDir = path.join(rootDir, 'a', 'b', 'c');

    fs.mkdirSync(nestedDir, { recursive: true });
    fs.writeFileSync(path.join(rootDir, '.root'), '');

    return { rootDir, nestedDir };
}

describe('findRootDir', () => {
    it('finds the directory containing the marker file when searching upwards', () => {
        const { rootDir, nestedDir } = createTempDirTree();

        const found = findRootDir(nestedDir, '.root');

        expect(path.resolve(found)).toBe(path.resolve(rootDir));
    });

    it('throws when no directory in the chain contains the marker file', () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tax-helper-no-root-'));
        const nested = path.join(tmp, 'x', 'y');
        fs.mkdirSync(nested, { recursive: true });

        expect(() => findRootDir(nested, '.does-not-exist')).toThrowError(
            /Could not find root directory containing '.*' starting from/,
        );
    });
});
