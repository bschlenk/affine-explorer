import bschlenk, { globals } from '@bschlenk/eslint-config'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['**/dist/'] },
  { files: ['**/*.js', '**/*.ts', '**/*.tsx'] },

  ...bschlenk.configs.typescript,
  ...bschlenk.configs.react,

  {
    plugins: {
      'react-refresh': reactRefresh,
    },

    languageOptions: {
      parserOptions: { project: './tsconfig.json' },
      globals: { ...globals.browser, ...globals.es2022 },
    },

    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
