module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2015, // Allow for parsing of modern ECMAScript features
    sourceType: "commonjs",
  },
  extends: [
    "plugin:@typescript-eslint/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
  ],
  rules: {
    "@typescript-eslint/no-empty-function": "off",
  },
  env: {
    jest: true,
    es6: true,
  },
};
