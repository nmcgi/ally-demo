const nest = require('@ally/eslint-config/nest');

module.exports = [
  ...nest,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
    },
  },
];
