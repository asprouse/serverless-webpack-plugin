Serverless Webpack Plugin
=============================
**Warning: This plugin is very experimental use at your own risk.**

Forked from [serverless-optimizer-plugin](https://github.com/serverless/serverless-optimizer-plugin) this plugin uses 
webpack to optimize your Serverless Node.js Functions on deployment.

Reducing the file size of your AWS Lambda Functions allows AWS to provision them more quickly, speeding up the response 
time of your Lambdas.  Smaller Lambda sizes also helps you develop faster because you can upload them faster.  
This Severless Plugin is absolutely recommended for every project including Lambdas with Node.js.

**Note:** Requires Serverless *v0.4.0*. Users are reporting it is NOT compatible with *v0.5.0* but support is forthcoming.

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

* In the `custom` property of either your `s-component.json` or `s-function.json` add an webpack property.

```javascript
{
    "name": "nodejscomponent",
    "runtime": "nodejs",
    "custom": {
        "webpack": {
            "configPath": "path/relative/to/project-path"
        }
    }
}

```


Adding the `custom.webpack.configPath` property in `s-component.json` applies the optimization setting to ALL functions 
in that component.  Adding the `custom.webpack.configPath` property to `s-function.json` applies the optimization 
setting to ONLY that specific function.  You can use `custom.webpack.configPath` in both places.  
The `custom.webpack.configPath` setting in `s-function.json` will override the setting in `s-component.json`.


## Webpack config
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
          presets: ['es2015', 'stage-0']
        }
      }
    ]
  }
};
```
**Note:** Some node modules don't play nicely with `webpack.optimize.UglifyJsPlugin` in this case, you can omit it from 
your config, or add the offending modules to `externals`. For more on externals see below.  
  
Put this file in the component directory, this is also where you should install `babel-loader`, `babel-preset-es2015`, etc. 
In this case assume your component is named `foo` and your config `webpack.config.js` your `s-component.json` will look like: 

```javascript
{
    "name": "nodejscomponent",
    "runtime": "nodejs",
    "custom": {
        "webpack": {
            "configPath": "foo/webpack.config.js"
        }
    }
}
```

### Externals
Externals specified in your webpack config will be properly packaged into the deployment. 
This is useful when working with modules that have binary dependencies, are incompatible with `webpack.optimize.UglifyJsPlugin` 
or if you simply want to improve build performance. Check out [webpack-node-externals](https://github.com/liady/webpack-node-externals) 
for an easy way to externalize all node modules.

### Source Maps
Yes using `devtool: 'source-map'` works, include `require('source-map-support').install();` you'll have pretty stacktraces.
 
### Improving deploy performance
  
If you have a large node_modules or lib directories you can prevent these from being copied using `excludePatterns` in your s-function.json:

```javascript
{
    ...
    "custom": {
        "excludePatterns": [".*"],
        ...
    }
}
```

Since the plugin builds directly from the source files, copying is unnecessary. 
