/**
 * SCRIPT PURPOSE:
 * Example CLI script demonstrating Commander + Zod + structured logging.
 * Reads a JSON config file (or inline JSON), validates it with Zod, and logs a summary.
 * Use this as a template for scripts that need --config, validation, and @src/logger.
 */

import fs from 'fs';

import { Command } from 'commander';
import { z } from 'zod';

import { logger } from '@src/logger';

// --- TYPES ---

export type ExampleConfig = {
    /** Path to a file to summarize (e.g. line count). */
    inputPath: string;
    /** If true, only log a one-line summary. */
    summaryOnly?: boolean;
};

export type ExampleResult = {
    path: string;
    lineCount: number;
};

// --- CONFIGURATION SCHEMA ---

const exampleConfigSchema = z.object({
    inputPath: z.string().min(1).describe('Path to the input file to summarize'),
    summaryOnly: z.boolean().optional().default(false).describe('If true, only log a one-line summary'),
});

type ExampleConfigParsed = z.infer<typeof exampleConfigSchema>;

// --- CLI ---

export const command = new Command();
command
    .name('example')
    .description('Example script: read --config (file or inline JSON), validate with Zod, log with @src/logger.')
    .version('1.0.0')
    .requiredOption('--config <string>', 'path to a config file or inline JSON')
    .action(async (args: { config: string }) => {
        let configRaw: string;
        const input = args.config.trim();

        if (input.startsWith('{')) {
            configRaw = input;
        } else {
            configRaw = fs.readFileSync(input, 'utf-8');
        }

        try {
            const config = exampleConfigSchema.parse(JSON.parse(configRaw));
            await runExample(config);
        } catch (err) {
            logger.error('Failed to parse config: %s', err instanceof Error ? err.message : String(err));
            process.exit(1);
        }
    });

/* v8 ignore next 3 */
if (require.main === module) {
    command.parse(process.argv);
}

// --- MAIN LOGIC ---

/**
 * Reads the file at config.inputPath and returns a small summary (e.g. line count).
 */
export async function runExample(config: ExampleConfigParsed): Promise<ExampleResult> {
    logger.info('=== Example Script ===');
    logger.info('Input path: %s', config.inputPath);
    logger.info('Summary only: %s', config.summaryOnly);
    logger.info('--------------------------------------------------');

    const content = fs.readFileSync(config.inputPath, 'utf-8');
    const lineCount = content.split(/\r?\n/).length;

    const result: ExampleResult = { path: config.inputPath, lineCount };

    if (config.summaryOnly) {
        logger.info('Summary: %s has %d lines', config.inputPath, lineCount);
    } else {
        logger.info('File: %s', config.inputPath);
        logger.info('  Lines: %d', lineCount);
        logger.info('--------------------------------------------------');
        logger.info('Done.');
    }

    return result;
}
