import { defineConfig, globalIgnores } from 'eslint/config';
import { FlatCompat } from '@eslint/eslintrc';
import prettier from 'eslint-config-prettier/flat';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
// Use Airbnb's actual rules with Next's current ESLint 9-compatible plugins.
// Removing legacy registrations avoids registering React/import twice.
const airbnb = compat.extends('airbnb').map((config) => {
  const adapted = { ...config };
  delete adapted.plugins;
  return { ...adapted, files: ['**/*.{ts,tsx,mjs}'] };
});

const eslintConfig = defineConfig([
  ...airbnb,
  ...nextVitals,
  ...nextTs,
  prettier,
  { files: ['tests/**/*.mjs'], languageOptions: { globals: { globalThis: 'readonly' } } },
  // TypeScript and the automatic JSX runtime replace the corresponding JS rules.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/label-has-associated-control': ['error', { assert: 'either', depth: 3 }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'react/require-default-props': 'off',
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      'import/extensions': ['error', 'ignorePackages', { ts: 'never', tsx: 'never' }],
      'import/prefer-default-export': 'off',
      'no-use-before-define': 'off',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-void': ['error', { allowAsStatement: true }],
      'func-style': ['error', 'expression'],
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      'react/function-component-definition': [
        'error',
        { namedComponents: 'arrow-function', unnamedComponents: 'arrow-function' },
      ],
      '@typescript-eslint/no-use-before-define': ['error', { functions: false, variables: false }],
      'max-lines': ['error', { max: 200 }],
    },
  },
  // These components deliberately forward native/Radix props to their control.
  {
    files: ['components/ui/**', 'components/workbench/Controls.tsx'],
    rules: { 'react/jsx-props-no-spreading': 'off' },
  },
  {
    files: ['*.config.{mjs,ts}', 'tests/**'],
    rules: { 'import/no-extraneous-dependencies': ['error', { devDependencies: true }] },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
