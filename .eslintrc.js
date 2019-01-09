'use strict';

module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },
  extends: ['eslint:recommended', 'plugin:react/recommended'],
  plugins: ['security'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 8,
    ecmaFeatures: {
      experimentalObjectRestSpread: true,
    },
  },
  rules: {
    indent: [2, 2, { SwitchCase: 1 }],
    'linebreak-style': ['off', 'windows'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-console': 0,
  },
};
