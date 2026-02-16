import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      // Interdire any explicite
      '@typescript-eslint/no-explicit-any': 'error',
      // Interdire dangerouslySetInnerHTML
      'react/no-danger': 'error',
      // Préférer const
      'prefer-const': 'error',
    },
  },
];

export default eslintConfig;
