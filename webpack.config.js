const path = require('path')
const WebpackModules = require('webpack-modules')
const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = (evn, option)=>{
    return {
        mode: option.mode,
        entry: {
            main: './src/entry.js'
        },
        devtool: 'source-map',
        output: {
            path: path.resolve(__dirname, option.mode === 'production' ? 'prod' : 'dist'),
            filename: './js/[name].bundle.js'
        },
        plugins: [
            new WebpackModules(),
            new HtmlWebpackPlugin({
                template: `./src/template.html`,
                filename: `index.html`,
            }),
        ],
        resolve: {
            extensions: ['.js', '.json', '.css'],
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@assets': path.resolve(__dirname, './src/assets'),
            },
            modules: [
                'node_modules'
            ]
        },
        module: {
            rules: [{
                test: /\.js$/,
                exclude: /\/node_modules\//,
                use: {
                    loader: 'babel-loader'
                }
            }]
        }
    }
    
}