'use strict';

var fs = require('fs');
var url = require('url');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var request = require('request');
var log = require('./log');
var config = require('../config');
var ImageMagickCommand = require('./imagemagickcommand');

function ResizeJob(options, callback) {
    this.options = options || {};
    this.callback = callback;

    this.cacheFileName = this.generateCacheFilename();
    this.tmpFileName = this.cacheFileName + '_tmp' + this.options.suffix;
    this.cacheFilePath = config.cacheDirectory + this.cacheFileName;
    this.tmpFilePath = config.tmpDirectory + this.tmpFileName;
}

ResizeJob.prototype.generateCacheFilename = function () {
    // ignore cdn or aws parameters
    var optionModed = JSON.parse(JSON.stringify(this.options));
    var optionUrlFiltered = optionModed.url
        .replace(/[&\?]AWS[a-zA-Z0-9]*=[^&]*/i, '')
        .replace(/[&\?]Expires=[^&]*/i, '')
        .replace(/[&\?]Signature=[^&]*/i, '')
        .replace(/[&\?]token=[^&]*/i, '')
        .replace(/[&\?]sign=[^&]*/i, '')
        .replace(/[&\?]timestamp=[^&]*/i, '')
        .replace(/[&\?]x-[a-zA-Z0-9\-]*=[^&]*/i, '')
        .replace(/[&\?]t=[^&]*/i, '');
    optionModed.url = optionUrlFiltered;
    
    return crypto.createHash('sha1')
        .update(JSON.stringify(optionModed))
        .digest('hex') + '.' + optionModed.format;
};

ResizeJob.prototype.isAlreadyCached = function (filename, cb) {
    fs.exists(filename, function (exists) {
        if (exists) {
            var fileSizeInBytes = fs.statSync(filename).size;
            if (fileSizeInBytes > 0) {
                cb(true);
            } else {
                cb(false);
            }
        } else {
            cb(false);
        }
    });
};

ResizeJob.prototype.validateRemoteSource = function (cb) {
    // if remote url hast no hostname end with status 400
    if (!url.parse(this.options.url).hostname) {
        return cb(400);
    }

    var options = {
        url: this.options.url,
        timeout: 5000
    };

    request.head(options, function (err, res, body) {
        if (err) {
            // head request returned error
            if (err.code === 'ETIMEDOUT') {
                cb('ETIMEDOUT');
            } else {
                cb(500);
            }
        } else if (res.statusCode !== 200) {
            // huawei obs not support head
            if (res.statusCode === 403 
                && res.headers['server'].toLowerCase() === "obs")
            {
                return cb(200);
            }
            // anything else but 200
            cb(res.statusCode);
        } else if (res.headers['content-type'].split('/')[0] !== 'image') {
            // content-type ist not image
            cb(415);
        } else {
            cb(200);
        }
    });
};

ResizeJob.prototype.resizeStream = function () {
    var source = this.options.url;
    var cacheFileStream = fs.createWriteStream(this.cacheFilePath);
    var im, convert;

    im = new ImageMagickCommand(
        this.options,
        {
            tmp: '-',
            cache: '-'
        },
        config.convertCmd
    );

    convert = spawn(config.convertCmd, im.buildCommandString());
    convert.stdout.pipe(cacheFileStream);
    convert.on('close', function (e) {
        this.callback(null, this.cacheFilePath);
    }.bind(this));

    request(source).pipe(convert.stdin);
};

ResizeJob.prototype.startResize = function () {
    this.validateRemoteSource(function (status) {
        if (status !== 200) {
            log.write(`HTTP ${status}: ` + this.options.imagefile, "warn");
            return this.callback({ status: status, url: this.options.url });
        }

        this.isAlreadyCached(this.cacheFilePath, function (exists) {
            if (exists) {
                log.write('CACHE HIT: ' + this.options.imagefile);
                this.callback(null, this.cacheFilePath, true);
            } else {
                log.write('RESIZE START: ' + this.options.imagefile);
                this.resizeStream();
            }
        }.bind(this));

    }.bind(this));
};

module.exports = {
    'ResizeJob': ResizeJob
};
