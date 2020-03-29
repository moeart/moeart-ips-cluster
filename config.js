'use strict';

var config = {

    appPort: process.env.PORT || 5060,
    appStdOut: true,

    convertCmd: 'convert',     // ImageMagick 命令名称
    workMode: 'node',         // 工作模式 [cluster 集群] [node 节点]

    cacheDirectory: __dirname + '/cache/',
    cacheHeader: {
        maxAge: 315360000,
        expires: 1209600000
    }

};

module.exports = config;
