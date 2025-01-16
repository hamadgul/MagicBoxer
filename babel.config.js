module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      '@babel/plugin-transform-template-literals',
      'react-native-reanimated/plugin',
      ['@babel/plugin-transform-runtime', {
        helpers: true,
        regenerator: true
      }],
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-syntax-dynamic-import'
    ],
  };
};
