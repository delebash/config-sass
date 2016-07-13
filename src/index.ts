import {WebpackConfig, get} from '@easy-webpack/core'
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const autoprefixer = require('autoprefixer')

/**
 * SASS loader support for *.scss
 * filename: name of the extracted file
 * allChunks: should we extract all chunks to the file?
 * sourceMap: do you want a sourceMap generated? (takes longer)
 * extractText: do you want to extract all css to a separate file? boolean, configuration object or instance of ExtractTextPlugin, defaults to true
 * resolveRelativeUrl: boolean or object with parameters
 * autoPrefixer: do you want to run AutoPrefixer on your sass? boolean, defaults to false
 * postcssPlugins: do you want to a postcss plugin(s)? array

 */
export = function sass({ filename = '[name].css', allChunks = false, sourceMap = false, extractText = undefined, resolveRelativeUrl = undefined, autoPrefixer = false, postcssPlugins = undefined } = {}) {
  return function sass(this: WebpackConfig): WebpackConfig {
    const loaders = ['style', `css${sourceMap ? '?sourceMap' : ''}`]

    if (resolveRelativeUrl) {
      loaders.push(`resolve-url${sourceMap ? '?sourceMap' : ''}`)
      sourceMap = true // source maps need to be on for this
    }

    /**
     *  postcss-loader https://github.com/postcss/postcss-loader
     *  NOTE: you will need to npm install the postcss plugin and then require it in your webpack.config.js
     *
     *  Why use postcss with Webpack and Sass? Webpack has many loaders that correspond to a postcss loader so check
     *  for a Webpack loader first, but postcss also has plugins that offer additional functionality.  Postcss plugins
     *  can also be easier to use and offer more functionality than a Sass mixin
     *
     *  NOTE: autoPrefixer  and postcssPlugins are mutually exclusive  -- if autoPrefixer = true then
     *  postcssPlugins array will not be used
     *
     *  postcssPlugins: Array of postcss plugins
     *  autoPrefixer: boolean defaults to false -- passes the AutoPrefixer plugin with preset values to postcss processor

     */
    let postcssLoaders
    if (autoPrefixer === true) {
      loaders.push('postcss-loader')
      postcssLoaders = [
          autoprefixer({ browsers: ['last 2 versions'] })]
    }else if (postcssPlugins instanceof Array && postcssPlugins.length > 0){
      loaders.push('postcss-loader')
      postcssLoaders = postcssPlugins
    }

    loaders.push(`sass${sourceMap ? '?sourceMap' : ''}`)

    const extractCss = extractText === false
    const providedInstance = extractText instanceof ExtractTextPlugin
    if (!providedInstance)
      extractText = extractCss ? new ExtractTextPlugin(filename, extractText instanceof Object ? extractText : { allChunks, sourceMap }) : null
    const config = {
      module: {
        loaders: get(this, 'module.loaders', []).concat([{
          test: /\.scss$/i,
          loaders: extractCss ? extractText.extract(...loaders.slice(1)) : loaders
        }])
      },
      postcss: postcssLoaders
    } as WebpackConfig
    if (extractText && !providedInstance) {
      config.plugins = [
        /**
         * Plugin: ExtractTextPlugin
         * It moves every import "style.css" in entry chunks into a single concatenated css output file. 
         * So your styles are no longer inlined into the javascript, but separate in a css bundle file (styles.css). 
         * If your total stylesheet volume is big, it will be faster because the stylesheet bundle is loaded in parallel to the javascript bundle.
         */
        extractText
      ].concat(get(this, 'plugins', []))
    }
    if (resolveRelativeUrl instanceof Object) {
      config['resolveUrlLoader'] = resolveRelativeUrl
    }
    return config
  }
}