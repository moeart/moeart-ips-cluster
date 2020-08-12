'use strict';

var config = {

    appPort: 8060,
    appStdOut: true,

    convertCmd: 'convert',          // ImageMagick 命令名称
    workMode: 'cluster',            // 工作模式 [cluster 集群] [node 节点]

    cacheDirectory: __dirname + '/cache/',
    cacheHeader: {
        maxAge: 2592000000,
        expires: 2592000000
    },

    corsHeader: {                   // CORS 跨域头部配置
        origin: "http://www.acgdraw.com",
        method: "GET"
    },

    allowedDomains: [               // 允许的域名（使用空数组表示不设置）
        "^.*\.acgdraw\.com"
    ]

};

module.exports = config;
