import { fixupConfigRules, fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import tsParser from '@typescript-eslint/parser'
import _import from 'eslint-plugin-import'
import react from 'eslint-plugin-react'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  { ignores: ['**/dist/'] },
  { files: ['**/*.js', '**/*.ts', '**/*.tsx'] },

  ...fixupConfigRules(
    compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:react-hooks/recommended',
    ),
  ),

  {
    plugins: {
      import: fixupPluginRules(_import),
      react,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },

    languageOptions: {
      globals: { ...globals.browser, ...globals.es2020 },
      parser: tsParser,
    },

    settings: { react: { version: 'detect' } },

    rules: {
      eqeqeq: ['error', 'smart'],
      // handled by prettier
      'no-extra-semi': 'off',
      'no-restricted-globals': [
        'error',
        // https://sindresorhus.com/blog/goodbye-nodejs-buffer
        {
          name: 'Buffer',
          message: 'Use Uint8Array instead.',
        },
      ],

      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-duplicates': 'error',

      'react/jsx-curly-brace-presence': [
        'error',
        { propElementValues: 'always' },
      ],
      'react/self-closing-comp': ['error', { component: true, html: true }],

      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Side effect imports.
            ['^\\u0000'],
            // Node.js builtins prefixed with `node:`.
            ['^node:'],
            // Packages (react first).
            // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
            ['^react$', '^react-dom$', '^@?\\w'],
            // Absolute imports and other imports such as Vue-style `@/foo`.
            // Anything not matched in another group.
            ['^'],
            // Relative imports.
            // Anything that starts with a dot.
            ['^\\.'],
            // Css imports
            ['\\.css$', '\\.module\\.css$'],
          ],
        },
      ],

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          // prefer omitting the binding instead
          // caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          // prefer an empty space between commas
          ignoreRestSiblings: false,
        },
      ],
    },
  },
]
