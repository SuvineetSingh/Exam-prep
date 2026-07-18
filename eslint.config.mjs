// ESLint 9 flat config. Next 16 removed `next lint`, so `npm run lint` calls
// eslint directly; eslint-config-next@16 exports flat-config arrays natively.
import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

export default [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'coverage/**',
      'out/**',
      'next-env.d.ts',
      // Dev/verification tooling, intentionally console-heavy
      'scripts/**',
    ],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // TypeScript specific rules
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',

      // React specific rules
      'react/display-name': 'off',
      'react/no-unescaped-entities': 'off',

      // General rules
      'no-console': [
        'warn',
        {
          allow: ['warn', 'error'],
        },
      ],
      'prefer-const': 'warn',

      // New advisory rules in react-hooks v6 (via eslint-config-next 16).
      // The codebase predates them; keep the signal without blocking lint
      // until the flagged patterns are refactored deliberately.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
    },
  },
  {
    // CommonJS is expected in CJS config files
    files: ['*.config.js', 'jest.setup.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
