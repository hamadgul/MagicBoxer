module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'react-native-reanimated/plugin',
      '@babel/plugin-proposal-export-namespace-from',
      '@babel/plugin-syntax-dynamic-import',
      [
        'module-resolver',
        {
          alias: {
            // This needs to be mirrored in tsconfig.json
            buffer: 'buffer',
          },
        },
      ],
    ]
  };
};
