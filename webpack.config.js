const webpack         = require( 'webpack' )
var ExtractTextPlugin = require( 'extract-text-webpack-plugin' );


module.exports = {
    watchOptions: {
        aggregateTimeout: 300,
        ignored:          ["/node_modules/", "files/**/*.js"],
    },

    entry:     [
        './src/all.ts',
        './css/all.scss',
    ],
    output:    {
        path:     __dirname + '/build',
        filename: 'all.js',
    },
    resolve:   {
        extensions: ['.js', '.ts']
    },
    externals: {
        jquery: 'jQuery',
    },
    plugins:   [
        new webpack.ProvidePlugin( {
            $:      "jquery",
            jQuery: "jquery"
        } ),
        new ExtractTextPlugin( {
            filename:  'all.css',
            allChunks: true,
        } ),
    ],
    module:    {
        rules: [
            {
                test:    /\.ts$/,
                loader:  'ts-loader',
                options: {
                    configFileName: './tsconfig.json',
                }
            },
            {
                test:   /\.css$/,
                loader: ExtractTextPlugin.extract( {
                    use: 'css-loader?importLoaders=1',
                } ),
            },
            {
                test:   /\.(sass|scss)$/,
                loader: ExtractTextPlugin.extract( ['css-loader', 'sass-loader'] )
            }
        ]
    },
}