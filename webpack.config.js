const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

// 'production' か 'development' を指定
const MODE = "development";

module.exports = () => ({
    entry: {
        index: './src/index.js',
    },
    output: {
        path: path.resolve(__dirname, './dist'),
        filename: `./js/[name].js`,
    },
    mode: MODE,
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
                test: /\.(css|scss)$/,
                use: [
                    MiniCssExtractPlugin.loader, 
                    "css-loader", 
                    "postcss-loader", 
                    "sass-loader"
                ],
            },
            // {
            //     test: /\.(png|jpe?g|gif|svg)/,
            //     use: [
            //         {
            //             loader: 'file-loader',
            //             options: {
            //                 //[name]は画像名、[ext]は拡張子
            //                 name: '[name].[ext]',
            //                 outputPath : 'images/',
            //                 publicPath : function(path){
            //                   return './images/' + path;
            //                 },
            //                 esModule: false
            //             }
            //         }
            //     ]
            // }
        ],
    },
    // ES5(IE11等)向けの指定（webpack 5以上で必要）
    target: ["web", "es5"],
    plugins: [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: './src/index.html',
            inject: true,
            chunks: ['index'],
        }),
       new MiniCssExtractPlugin({
          filename: 'index.css',
        }),
    ]
});
