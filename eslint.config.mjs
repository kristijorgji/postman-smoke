import { createTypescriptConfig } from '@kristijorgji/eslint-config-typescript';

const baseline = createTypescriptConfig({
    tsconfigRootDir: import.meta.dirname,
    prettier: 'prettierrc',
    codeQuality: true,
    explicitTypes: true,
    ignores: ['dist/', 'coverage/', 'node_modules/', '.scratch/'],
    importOrder: {
        pathGroups: [{ pattern: '@src/**', group: 'internal', position: 'before' }],
        pathGroupsExcludedImportTypes: ['builtin'],
    },
});

export default [
    ...baseline,
    // Prefer the eslint-wide tsconfig (includes tests + vitest configs).
    {
        files: ['**/*.{ts,tsx}'],
        languageOptions: {
            parserOptions: {
                projectService: false,
                project: './tsconfig.eslint.json',
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    // Allow Vitest and other devDependencies in test files.
    {
        files: ['**/*.{test,spec}.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
        rules: {
            'import-x/no-extraneous-dependencies': [
                'error',
                { devDependencies: true, optionalDependencies: false, peerDependencies: true },
            ],
        },
    },
];
