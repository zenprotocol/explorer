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
require('babel-register')({
  ignore: [/(build|node_modules)/],
  presets: ['env', 'react-app'],
  plugins: ['syntax-dynamic-import', 'dynamic-import-node', 'react-loadable/babel'],
});
