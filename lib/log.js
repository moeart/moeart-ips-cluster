'use strict';

var config = require('../config');
var colors = require('colors');

function log(str, level = "info") {
    if (config.appStdOut !== true) {
       return ;
    }
    switch (level) {
        case "debug":
            console.debug(`[${new Date().toISOString()}] - DEBUG - ${str}`.blue);
            break;

        default: case "info":
            console.info(`[${new Date().toISOString()}] - INFO - ${str}`);
            break;

        case "warn":
            console.warn(`[${new Date().toISOString()}] - WARN - ${str}`.yellow);
            break;

        case "error":
            console.error(`[${new Date().toISOString()}] - ERROR - ${str}`.red);
            break;
    }
}

module.exports = {
    'write': log
};
