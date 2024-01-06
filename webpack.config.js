const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyFilePlugin = require("copy-webpack-plugin");

module.exports = () => ({
    entry: {
        index: './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: `./js/[name].js`,
    },
    mode: 'development',
    devServer: {
        static: {
          directory: path.join(__dirname, "dist"),
        },
        compress: true,
        host: '0.0.0.0',
        port: 3000,
        open: true,
    },
    module: {
        rules: [
            {
                test: /\.html$/,
                loader: 'html-loader'
            },
            {
                test: /\.css$/,
                use: [
                    'style-loader', 'css-loader'
                ]
            },
            // {
            //     test: /\.(png|svg|jpg|jpeg|gif)$/,
            //     use: [
            //         {
            //             loader: 'file-loader',
            //             options: {
            //                 name: '[name].[ext]',
            //                 outputPath: 'images/',
            //                 esModule: false
            //             }
            //         }
            //     ]
            // }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            inject: 'body',
            filename: 'index.html',
            template: './src/index.html',
            chunks: ['index'],
        }),
    ]
});
