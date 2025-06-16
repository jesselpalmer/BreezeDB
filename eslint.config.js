import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import markdown from 'eslint-plugin-markdown';

export default [
  // Base JavaScript rules
  js.configs.recommended,

  // TypeScript files
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      prettier: prettier,
    },
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any types for generic key-value storage
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // General code quality rules
      'no-console': 'off', // Allow console.log for debugging
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Code style (handled by Prettier)
      'prettier/prettier': 'error',
    },
  },

  // TypeScript test files (more lenient rules)
  {
    files: ['test/**/*.ts'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
      },
    },
    plugins: {
      prettier: prettier,
    },
    rules: {
      // TypeScript specific rules (relaxed for tests)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off', // Allow ! in tests

      // General code quality rules
      'no-console': 'off',
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-unused-expressions': 'error',
      'prefer-const': 'error',
      'no-var': 'error',

      // Code style (handled by Prettier)
      'prettier/prettier': 'error',
    },
  },

  // JavaScript files (tests, examples, config)
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
      },
    },
    plugins: {
      prettier: prettier,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prettier/prettier': 'error',
      // Disable TypeScript-specific rules for JavaScript files
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },

  // Markdown files
  {
    files: ['**/*.md'],
    plugins: {
      markdown: markdown,
    },
    processor: 'markdown/markdown',
  },

  // JavaScript/TypeScript code blocks in markdown
  {
    files: ['**/*.md/*.js', '**/*.md/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      // Disable rules that don't make sense in documentation examples
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-console': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      'no-unreachable': 'off',
      'no-constant-condition': 'off',
    },
  },

  // Ignore patterns
  {
    ignores: [
      'dist/**/*',
      'dist-test/**/*',
      'node_modules/**/*',
      'coverage/**/*',
      '*.min.js',
      'examples/*.json',
      'examples/*.json.backup',
    ],
  },

  // Prettier integration
  prettierConfig,
];
