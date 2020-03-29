'use strict';
var ResizeJob = require('../lib/resize').ResizeJob;

/**
 * Local Image Resize
 * BRIDGE
 * @param rs RequestSplitter: splitted requests.
 * @param cb Callback: return the result.
 */
module.exports = function (rs, cb) {
    var jobStartTime,
        jobEndTime,
        jobDuration;
    jobStartTime = new Date().getTime();
    var rj = new ResizeJob(rs.mapOptions(), function (err, file, cached) {
        if (err) {
            return cb.call(this, {
                "status": 0,
                "code": err.status,
                "message": err,
            });
        }

        jobEndTime = new Date().getTime();
        jobDuration = jobEndTime - jobStartTime;

        if (cached) {
            jobDuration = 0;
        }

        return cb.call(this, {
            "status": 1,
            "duration": jobDuration,
            "file": file
        });
    });

    rj.startResize();
};