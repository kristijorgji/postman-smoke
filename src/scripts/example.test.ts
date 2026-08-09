import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { command, runExample } from '@src/scripts/example';

vi.mock('@src/logger', () => ({
    logger: {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('runExample', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'example-test-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('returns correct line count with summaryOnly false', async () => {
        const filePath = path.join(tmpDir, 'sample.txt');
        fs.writeFileSync(filePath, 'line1\nline2\nline3\n');

        const result = await runExample({ inputPath: filePath, summaryOnly: false });

        expect(result.path).toBe(filePath);
        expect(result.lineCount).toBe(4);
    });

    it('returns correct line count with summaryOnly true', async () => {
        const filePath = path.join(tmpDir, 'sample.txt');
        fs.writeFileSync(filePath, 'hello\nworld');

        const result = await runExample({ inputPath: filePath, summaryOnly: true });

        expect(result.path).toBe(filePath);
        expect(result.lineCount).toBe(2);
    });

    it('handles single-line file', async () => {
        const filePath = path.join(tmpDir, 'one.txt');
        fs.writeFileSync(filePath, 'single line');

        const result = await runExample({ inputPath: filePath, summaryOnly: false });

        expect(result.lineCount).toBe(1);
    });

    it('handles empty file', async () => {
        const filePath = path.join(tmpDir, 'empty.txt');
        fs.writeFileSync(filePath, '');

        const result = await runExample({ inputPath: filePath, summaryOnly: false });

        expect(result.lineCount).toBe(1);
    });

    it('throws when file does not exist', async () => {
        const bad = path.join(tmpDir, 'nope.txt');

        await expect(runExample({ inputPath: bad, summaryOnly: false })).rejects.toThrow();
    });
});

describe('example CLI command', () => {
    let tmpDir: string;

    beforeEach(() => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'example-cli-'));
    });

    afterEach(() => {
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('parses inline JSON config via --config', async () => {
        const filePath = path.join(tmpDir, 'data.txt');
        fs.writeFileSync(filePath, 'a\nb\nc');

        const inlineJson = JSON.stringify({ inputPath: filePath, summaryOnly: true });

        await command.parseAsync(['node', 'example', '--config', inlineJson]);
    });

    it('parses file-based config via --config', async () => {
        const dataFile = path.join(tmpDir, 'data.txt');
        fs.writeFileSync(dataFile, 'one\ntwo');

        const configFile = path.join(tmpDir, 'config.json');
        fs.writeFileSync(configFile, JSON.stringify({ inputPath: dataFile }));

        await command.parseAsync(['node', 'example', '--config', configFile]);
    });

    it('exits with code 1 on invalid config JSON', async () => {
        const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit called');
        });

        await expect(command.parseAsync(['node', 'example', '--config', '{bad json}'])).rejects.toThrow(
            'process.exit called',
        );

        expect(exitSpy).toHaveBeenCalledWith(1);
        exitSpy.mockRestore();
    });
});
