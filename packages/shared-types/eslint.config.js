const base = require('@ally/eslint-config');

module.exports = [
  ...base,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
];
