module.exports = {
  target: 'node',
  externals: [
    'aws-sdk'
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json',
      }
    ]
  }
};
