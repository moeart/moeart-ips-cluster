'use strict';

var express         = require('express');
var bodyParser      = require('body-parser');
var fs              = require('fs');

var log             = require('./lib/log');
var RequestSplitter = require('./lib/requestsplitter');
var ResizePlugin    = require('./plugin/autoload');

var config          = require('./config');
var cluster         = require('./cluster');

if (!fs.existsSync(config.cacheDirectory)) {
    fs.mkdirSync(config.cacheDirectory);
}

var app = express();
app.use(bodyParser.urlencoded({ extended: true }))
    .set('view engine', 'pug')
    .set('views', __dirname + '/views');

app.use(function (req, res, next) {
    res.removeHeader('X-Powered-By');
    next();
});


/**
 * Node Health Check
 */
app.get('/health', function (req, res) {
    var startTime, endTime, spendTime;
    startTime = new Date().getTime();
    for(var i=0; i<1000000; i++) { i * i }
    endTime = new Date().getTime();
    spendTime = endTime - startTime;
    res.send(spendTime.toString()).end();
});

/**
 * Print Help Page
 */
app.get('/', function (req, res) {
    var isChinese = req.header('Accept-Language').includes('zh');
    switch (config.workMode) {
        case "node":
            var modename = isChinese ? "节点" : "Node";
            break;

        case "cluster":
            var modename = isChinese ? "集群" : "Cluster";
            break;

        default:
            var err = "Invalid configuration: workMode";
            res.send(err).end();
            log.write(err, "error");
    }

    var params = {
        layout: false,
        hostname: req.headers.host,
        modename: modename
    };

    if (isChinese) {
        res.render('help', params);
    } else {
        res.render('help_en', params);
    }
});

/**
 * Image Process
 */
app.get(RequestSplitter.urlMatch, function (req, res) {
    
    var rs = new RequestSplitter(req.path, req.query);

    switch (config.workMode) {
        /** 
         * NODE MODE
         * Work Standalone
         */
        case "node":
            new ResizePlugin.Local(rs, function(o) {
                // check resize status
                // 1: success, 0: failed
                switch (o.status) {
                    case 1:
                        var now = new Date().getTime();
                        res.header('X-ResizeJobDuration', o.duration);
                        res.header('Expires', new Date(now + config.cacheHeader.expires));
                        res.sendfile(o.file, { maxAge: config.cacheHeader.maxAge });
                        break;

                    case 0:
                        res.status(o.code).json(o.message);
                        res.end();
                        break;
                }
            });
            break;
        
        /**
         * CLUSTER
         * Distributed Resource Scheduler
         */
        case "cluster":
            //..TODO..
            // Ping all nodes in `cluster.js` defined as `cluster`
            // send task to fast responed host
            // store file come from node to cache
            // and send file to client
            //
            // the url format is same between node and cluster
            // so just send original url `req.path+req.query` to node
            // and download file from node save to cache
            // and send to client
            break;
        
        /**
         * UNSUPPORTS MODE
         */
        default:
            var errMsg = "Work mode '"+config.workMode+"' not support!";
            res.send(errMsg).end();
            log.write(errMsg, "error");
    }
});

log.write('MoeART IPS listening on ' + config.appPort);
app.listen(config.appPort);
