'use strict';

module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended', 'prettier'],
  plugins: ['security'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 8,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  rules: {
    indent: ['error', 2, { SwitchCase: 1, flatTernaryExpressions: true }],
    'linebreak-style': ['off', 'windows'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-console': 0,
  },
};
