var fs = require('fs');
var path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var ExtractTextPlugin = require('extract-text-webpack-plugin');
const shell = require('shelljs');

var configs = [];

if (fs.existsSync(path.join(__dirname, './cartridges/app_custom_ob_redesign/cartridge/client/default/scss/'))) {
    var cssFiles = shell.ls(path.join(__dirname, './cartridges/app_custom_ob_redesign/cartridge/client/default/scss/**/*.scss'));
    cssFiles = cssFiles.filter(filename => path.basename(filename).indexOf('_') !== 0);
    var cssEntries = {};
    cssFiles.forEach(filename => {
        var location = path.relative(path.join(__dirname, './cartridges/app_custom_ob_redesign/cartridge/client/default/scss/'), filename);
        var basename = location.substr(0, location.length - (location.length - location.indexOf('.scss')));
        cssEntries[basename] = path.resolve(filename);
    });
    
    configs.push({
        mode: 'none',
        name: 'scss',
        entry: cssEntries,
        output: {
            path: path.resolve(path.join(__dirname, './cartridges/app_custom_ob_redesign/cartridge/static/default/css')),
        },
        module: {
            rules: [{
                test: /\.scss$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            url: false,
                            minimize: true
                        }
                    }, {
                        loader: 'postcss-loader',
                        options: {
                            plugins: [
                                require('autoprefixer')()
                            ]
                        }
                    }, {
                        loader: 'sass-loader',
                        options: {
                            includePaths: []
                        }
                    }
                ]
            }]
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: "[name].css",
                chunkFilename: "[id].css"
            })
        ]
    });
}
module.exports = configs;
