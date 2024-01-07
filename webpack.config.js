const path = require('path');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyFilePlugin = require("copy-webpack-plugin")

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
            {
                test: /\.(png|jpe?g|gif|svg)$/i,
                generator: {
                    filename: `./images/[name][ext]`,
                },
                type: 'asset/resource',
            },
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
        new CopyFilePlugin({
            patterns: [
                {
                    context: "src/assets/images",
                    from: "**/*",
                    to: path.resolve(__dirname, "dist/images")
                },
                {
                    context: "src/assets/movies",
                    from: "**/*",
                    to: path.resolve(__dirname, "dist/movies")
                },
            ],
        }),
    ]
});
