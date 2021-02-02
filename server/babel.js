require('ignore-styles');
require('asset-require-hook')({
  extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp'],
  name: '/static/media/[name].[hash:8].[ext]',
  limit: 10000,
});
require('asset-require-hook')({
  extensions: ['svg'],
  name: '/static/media/[name].[hash:8].[ext]',
});
require('url-loader');
require('file-loader');
require('@babel/register')({
  ignore: [/(build|node_modules|worker|api)/],
  only: ['server/components/client', 'src'],
  presets: ['@babel/preset-env', 'react-app-babel-7'],
  plugins: ['@babel/plugin-syntax-dynamic-import', 'dynamic-import-node', 'react-loadable/babel'],
});
