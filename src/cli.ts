/**
 * SCRIPT PURPOSE:
 * CLI entry for @kristijorgji/postman-smoke.
 * Loads a defineConfig module (--config path to .ts/.js/JSON) and runs the suite.
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

import { Command } from 'commander';

import { resolveConfig, type SmokeConfigInput } from '@src/config';
import { logger } from '@src/logger';
import { runSmoke } from '@src/runner';

export const command = new Command();
command
    .name('postman-smoke')
    .description('Run an ordered Postman collection smoke suite')
    .option('--strict', 'treat WARN as failure', false)
    .option('--report-html <path>', 'write an HTML report to this path')
    .requiredOption('--config <path>', 'path to smoke.config.ts / .js / .json')
    .action(async (args: { strict?: boolean; config: string; reportHtml?: string }) => {
        try {
            const input = await loadConfigModule(path.resolve(args.config));
            const config = resolveConfig(input, Boolean(args.strict), {
                reportHtmlPath: args.reportHtml,
            });
            const code = await runSmoke(config);
            process.exit(code);
        } catch (err) {
            logger.error('Smoke failed: %s', err instanceof Error ? err.message : String(err));
            process.exit(1);
        }
    });

async function loadConfigModule(configPath: string): Promise<SmokeConfigInput> {
    if (!fs.existsSync(configPath)) {
        throw new Error(`Config not found: ${configPath}`);
    }
    if (configPath.endsWith('.json')) {
        return JSON.parse(fs.readFileSync(configPath, 'utf8')) as SmokeConfigInput;
    }
    const mod = (await import(pathToFileURL(configPath).href)) as {
        default?: SmokeConfigInput;
    };
    if (!mod.default) {
        throw new Error(`Config module must default-export defineConfig(...): ${configPath}`);
    }
    return mod.default;
}

/* v8 ignore next 3 */
if (require.main === module) {
    command.parse(process.argv);
}
