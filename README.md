Serverless Optimizer Plugin (Webpack fork)
=============================
**Warning: This fork is very experimental use at your own risk**

Webpacks your Serverless Node.js Functions on deployment, and more!

Reducing the file size of your AWS Lambda Functions allows AWS to provision them more quickly, speeding up the response time of your Lambdas.  Smaller Lambda sizes also helps you develop faster because you can upload them faster.  This Severless Plugin is absolutely recommended for every project including Lambdas with Node.js.

**Note:** Requires Serverless *v0.4.0* or higher.

### Setup

* Install via npm in the root of your Serverless Project:
```
npm install asprouse/serverless-optimizer-plugin --save
```

* In the `custom` property of either your `s-component.json` or `s-function.json` add an optimize property.

```
"custom": {
	"optimize": true
}
```

* Add the plugin to the `plugins` array in your Serverless Project's `s-project.json`, like this:

```
plugins: [
    "serverless-optimizer-plugin"
]
```

* Add the webpackConfigPath transform to `s-component.json`:

```javascript
{
    "name": "nodejscomponent",
    "runtime": "nodejs",
    "custom": {
        "optimize": {
            "webpackConfigPath": 'path/relative/to/project-path',
        }
    }
}

```


Adding the `custom.optimize.webpackConfigPath` property in `s-component.json` applies the optimization setting to ALL functions in that component.  Adding the `custom.optimize.webpackConfigPath` property to `s-function.json` applies the optimization setting to ONLY that specific function.  You can use `custom.optimize.webpackConfigPath` in both places.  The `custom.optimize.webpackConfigPath` setting in `s-function.json` will override the setting in `s-component.json`.



## Webpack config
This fork allows you completely customize how your code is optimized by specifying your own webpack config. Heres a sample `webpack.config.js`:

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
          presets: ['es2015', 'stage-0']
        }
      }
    ]
  }
};
```
It's probably best to put this file in the component directory, this is also where you should install `webpack`, `babel-loader`, `babel-preset-es2015`, etc. 
In this case assume your component is named `foo` and your config `webpack.config.js` your `s-component.json` will look like: 

```javascript
{
    "name": "nodejscomponent",
    "runtime": "nodejs",
    "custom": {
        "optimize": {
            "webpackConfigPath": 'foo/webpack.config.js',
        }
    }
}
```


### Source Maps
Yes using `devtool: 'source-map'` works, include `require('source-map-support').install();` you'll have pretty stacktraces. 