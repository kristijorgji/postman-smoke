import path from 'path';

import { createLogger, format, transports } from 'winston';

import findRootDir from '../core/findRootDir';

const IS_CLI_MODE = true;

const scriptRelativePath = getRootCallerScriptRelativePathFromRoot();
const logBaseDir = 'logs';
const scriptLogDir = path.join(logBaseDir, scriptRelativePath);

export const logger = createLogger({
    level: process.env.LOG_LEVEL || 'verbose',
    format: format.combine(
        format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss',
        }),
        format.errors({ stack: true }),
        format.splat(),
        ...(IS_CLI_MODE
            ? [
                  format.printf(({ timestamp, level, message, stack }) => {
                      return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
                  }),
              ]
            : [format.json()]),
    ),
    transports: [
        new transports.Console(),
        new transports.File({ dirname: scriptLogDir, filename: `${getTimestamp()}.log` }),
    ],
});

// yyyy-mm-dd-hh-mm-ss
function getTimestamp(): string {
    const now = new Date();

    const pad = (num: number): string => String(num).padStart(2, '0'); // Ensures two-digit format

    return (
        `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
        `-${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`
    );
}

/**
 * Gets the relative path of the root caller script from the detected project root.
 * Throws an error if process.argv[1] is not available or if the project root cannot be determined.
 */
function getRootCallerScriptRelativePathFromRoot(): string {
    const mainScriptPath = process.argv[1];

    if (!mainScriptPath) {
        throw new Error(
            'Cannot determine main script path from process.argv[1]. ' +
                `Full process.argv: ${JSON.stringify(process.argv)}`,
        );
    }

    // Resolve mainScriptPath to an absolute path first
    const absoluteMainScriptPath = path.resolve(mainScriptPath);

    const projectRoot = findRootDir(path.dirname(absoluteMainScriptPath));
    if (projectRoot === null) {
        throw new Error(
            `Could not find project root (marked by 'package.json') for script: ${absoluteMainScriptPath}. ` +
                "Ensure 'package.json' exists in a parent directory. " +
                `Full process.argv: ${JSON.stringify(process.argv)}`,
        );
    }

    // Get the path of the script relative to the project root
    let relativePathWithExtension = path.relative(projectRoot, absoluteMainScriptPath);

    const srcPrefix = 'src' + path.sep;
    if (relativePathWithExtension.startsWith(srcPrefix)) {
        relativePathWithExtension = relativePathWithExtension.substring(srcPrefix.length);
    }

    // Remove the file extension and join directory with name
    const parsedPath = path.parse(relativePathWithExtension);

    return path.join(parsedPath.dir, parsedPath.name);
}
