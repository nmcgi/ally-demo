const next = require('@ally/eslint-config/next');

module.exports = [
  ...next,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'],
  },
];
