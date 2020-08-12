'use strict';

var express         = require('express');
var bodyParser      = require('body-parser');
var fs              = require('fs');
var got             = require('got');
var path            = require('path');

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
    try {
        var isChinese = req.header('Accept-Language').includes('zh');
    } catch (error) {
        var isChinese = false;
    }

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

    // force local node
    // if "/local-ips-node" is set
    var rs = null
    var workMode = config.workMode;
    if (req.path.indexOf('/moeart-ips-node') === 0) {
        rs = new RequestSplitter(req.path.replace('/moeart-ips-node', ''), req.query);
        workMode = "node";
    } else {
        rs = new RequestSplitter(req.path, req.query);
    }


    // check domain in while list
    if (config.allowedDomains.length > 0) {
        var destDomain = rs.mapOptions()
            .imagefile
            .replace(/^\w+:\/\//, '')
            .split('/')[0];

        var isDomainAllowed = false;
        config.allowedDomains.forEach((v) => {
            if (destDomain.match(v)) {
                isDomainAllowed = true;
            }
        });
        if (!isDomainAllowed) {
            res.status(403).json({
                status: 403,
                reason: "Destination domain is NOT allowed!"
            });
            res.end();
            log.write(`destination domain [${destDomain}] is not allowed!`, "error");
            return;
        }
    }


    switch (workMode) {
        /** 
         * NODE MODE
         * Work Standalone
         */
        case "node":
            var returned = false;
            var processed = false;

            // wait and return inprogress image
            var startTimer = new Date().getTime();
            var inprogress = setInterval(() => {
                // image has been processed
                if (processed === true) {
                    return ;
                }
                var usedTime = new Date().getTime() - startTimer;
                if (usedTime > config.inprogressWait * 1000) {
                    clearInterval(inprogress);
                    res.header('Access-Control-Allow-Origin', "*");
                    res.header('Access-Control-Allow-Methods', "GET, POST, HEAD, OPTIONS");
                    res.sendFile(__dirname + config.inprogressImage;
                    returned = true;
                }
            }, 100);

            new ResizePlugin.Local(rs, function(o) {
                // breaked by "inprogress"
                if (returned === true) {
                    return ;
                }

                // tell "inprogress" processed
                processed = true;

                // check resize status
                // 1: success, 0: failed
                switch (o.status) {
                    case 1:
                        var now = new Date().getTime();
                        res.header('X-ResizeJobDuration', o.duration);
                        res.header('Expires', new Date(now + config.cacheHeader.expires));
                        res.header('Access-Control-Allow-Origin', config.corsHeader.origin);
                        res.header('Access-Control-Allow-Methods', config.corsHeader.method);
                        res.sendFile(o.file, { maxAge: config.cacheHeader.maxAge });
                        break;

                    case 0:
                        try {
                            res.status(o.code).json(o.message);
                        } catch (e) {
                            res.status(500).json({
                                status: "error",
                                message: "internal server error"
                            });
                        }
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
            var preferredNode = null;

            // do node health test
            cluster.nodes.forEach((node) => {
                (async () => {
                    try {
                        const response = await got(node + '/health');
                        if (response.statusCode === 200) {
                            log.write(`node [${node}] responsed at ${response.body}ms`, "info");
                            if (preferredNode === null) {
                                preferredNode = node;
                            }
                        }
                        else {
                            log.write(`node [${node}] health test failed!`, "error");
                        }
                    } catch (error) {
                        log.write(`node [${node}] health test failed!`, "error");
                    }
                })();
            });
            
            // return 302 to preferred node url
            var waitTime = Date.now() + (cluster.waitNodeTime * 1000);
            var waitHealthTest = setInterval(() => {
                if (preferredNode !== null || Date.now() > waitTime)
                {
                    clearInterval(waitHealthTest);
                    if (preferredNode === null) {
                        preferredNode =  cluster.localNode;
                    }
                    log.write(`preferred node is [${preferredNode}]`, "info");

                    res.writeHead(302, {
                        'Location': `${preferredNode}/moeart-ips-node${req.path}${rs.buildQueryString()}`
                    });
                    res.end();
                }
            }, 100);
            
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
