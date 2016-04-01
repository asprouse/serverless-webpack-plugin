Serverless Webpack Plugin
=============================

Forked from [serverless-optimizer-plugin](https://github.com/serverless/serverless-optimizer-plugin) this plugin uses
webpack to optimize your Serverless Node.js Functions on deployment.

Reducing the file size of your AWS Lambda Functions allows AWS to provision them more quickly, speeding up the response
time of your Lambdas.  Smaller Lambda sizes also helps you develop faster because you can upload them faster.  
This Severless Plugin is absolutely recommended for every project including Lambdas with Node.js.

**Note:** Requires Serverless *v0.5.0*.

### Setup

* Install the plugin and webpack in the root of your Serverless Project:
```
npm install serverless-webpack-plugin webpack --save-dev
```

* Add the plugin to the `plugins` array in your Serverless Project's `s-project.json`, like this:

```
plugins: [
    "serverless-webpack-plugin"
]
```

* In the `custom` property of your `s-project.json`  add a webpack property.

```javascript
{
  "custom": {
    "webpack": {
      "config": "path/relative/to/project-path"
    }
  }
}

```

** You can optimize all your Node.js functions by configuring your `s-project.json`:

```javascript
{
  "custom": {
    "webpack": {
      "config": "path/relative/to/project-path",
      "global": true
    }
  }
}
```

** Or only optimize certain functions by configuring their `s-function.json`:

```javascript
{
  "custom": {
    "webpack": true
  }
}
```

### Webpack config
This fork allows you to completely customize how your code is optimized by specifying your own webpack config. Heres a sample `webpack.config.js`:

```javascript
var webpack = require('webpack');

module.exports = {
  // entry: provided by serverless
  // output: provided by serverless
  target: 'node',
  externals: [
    'aws-sdk'
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  devtool: 'source-map',
  plugins: [
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    new webpack.optimize.DedupePlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        unused: true,
        dead_code: true,
        warnings: false,
        drop_debugger: true
      }
    })
  ],
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel',
        exclude: /node_modules/,
        query: {
          presets: [ 'es2015', 'stage-0' ]
        }
      }
    ]
  }
};
```

### Extended config
Function folders can contain their own `webpack.config.js` to extend the global config.

### Externals
Externals specified in your webpack config will be properly packaged into the deployment.
This is useful when working with modules that have binary dependencies, are incompatible with `webpack.optimize.UglifyJsPlugin`
or if you simply want to improve build performance. Check out [webpack-node-externals](https://github.com/liady/webpack-node-externals)
for an easy way to externalize all node modules.

### Source Maps
Yes using `devtool: 'source-map'` works, include `require('source-map-support').install();` you'll have pretty stacktraces.
