// @ts-check
const base = require('./index');

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...base,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // NestJS controllers/services idiomatically omit return types on
      // decorated handler methods — keep this off to match that convention.
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
    },
  },
];
