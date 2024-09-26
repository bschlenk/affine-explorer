import { fixupPluginRules } from '@eslint/compat'
import { FlatCompat } from '@eslint/eslintrc'
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import _import from 'eslint-plugin-import'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import prettier from 'eslint-config-prettier'
import globals from 'globals'

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  { ignores: ['**/dist/'] },
  { files: ['**/*.js', '**/*.ts', '**/*.tsx'] },

  js.configs.recommended,

  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  react.configs.flat.recommended,
  react.configs.flat['jsx-runtime'],

  {
    plugins: {
      'react-hooks': reactHooks,
      rules: reactHooks.configs.recommended.rules,
    },
  },

  {
    plugins: {
      import: fixupPluginRules(_import),
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },

    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
      globals: { ...globals.browser, ...globals.es2022 },
    },

    settings: { react: { version: 'detect' } },

    rules: {
      eqeqeq: ['error', 'smart'],
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

  prettier,
]
