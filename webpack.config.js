const path = require('path');

module.exports = {
    mode: 'production',
    entry: './index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, './dist'),
    },
    devServer: {
        compress: true,
        port: 9000
    }
};