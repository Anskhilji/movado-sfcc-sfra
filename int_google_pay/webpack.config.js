var fs = require('fs');
var path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var ExtractTextPlugin = require('extract-text-webpack-plugin');
const shell = require('shelljs');

var configs = [];

if (fs.existsSync(path.join(__dirname, './cartridges/int_google_pay/cartridge/client/default/js/'))) {
    var jsFiles = shell.ls(path.join(__dirname, './cartridges/int_google_pay/cartridge/client/default/js/*.js'));
    jsFiles = jsFiles.filter(filename => path.basename(filename).indexOf('_') !== 0);
    var jsEntries = {};
    jsFiles.forEach(filename => {
        var basename = path.basename(filename, '.js');
        jsEntries[basename] = path.resolve(filename);
    });

    configs.push({
        mode: 'production',
        name: 'js',
        entry: jsEntries,
        output: {
            path: path.resolve(path.join(__dirname, './cartridges/int_google_pay/cartridge/static/default/js')),
            filename: '[name].js'
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/env'],
                            plugins: ['@babel/plugin-proposal-object-rest-spread'],
                            cacheDirectory: true
                        }
                    }
                }
            ]
        }
    });
}

module.exports = configs;
