const path = require('path');

module.exports = {
    mode: 'production',
    entry: './index.js',
    output: {
        filename: 'agora_rtm.js',
        path: path.resolve(__dirname, '.'),
    },
    devServer: {
        compress: true,
        port: 9000
    }
};