/**
 * Created by Ali on 7/29/2015.
 */
"use strict";

var EventEmiiter = require("events").EventEmitter,
    Q = require("q");


var configDefaults = {
    instanceId: "defaultJobQueueInstance",
    persistent: false,
    maxSize: 1000,
    heartbeatMillis: 60000,
    consoleLog: true
};


/**
 *
 * @param config
 * @param executor  a function that blocks while executing a job (returns null),
 *     or returns a promise for the execution of a job
 * @returns {EventEmiiter|*}
 */
function createJobQueue(config, executor) {
    var jobQueue;

    var jobExecutionInProgress = false;
    var scheduledJobs = [];

    var hbInterval = null;

    config = config || configDefaults;

    jobQueue = Object.create(EventEmiiter.prototype, {
        "init": {
            value: init
        },
        "shutdown": {
            value: shutdown
        },
        "pushJob": {
            value: pushJob
        }
    });

    /**
     *
     * @param next
     */
    function init(next) {
        if (config.persistent) {
            //TODO: implement mongoDB persistence connection setup
        }

        hbInterval = setInterval(function () {
            //This is just to make sure that the jobs will be executed if an event is missed
            __executeOneJob();
        }, config.heartbeatMillis);


        if (config.consoleLog) {
            console.log("Initialization complete for job queue instance:", config.instanceId);
        }

        if (typeof next === "function") {
            next();
        }
    }


    /**
     *
     */
    function shutdown() {
        clearInterval(hbInterval);
        if (config.consoleLog) {
            console.log("shuting down ..", config.instanceId);
        }
    }

    /**
     *
     * @param newJob
     */
    function pushJob(newJob) {

        var jobWrapper = {};
        jobWrapper.deferred = Q.defer();
        jobWrapper.payload = newJob;

        scheduledJobs.push(jobWrapper);
        jobQueue.emit("jobScheduled");

        return jobWrapper.deferred.promise;
    }


    /**
     *
     * @private
     */
    function __executeOneJob() {
        process.nextTick(function () {
            if (jobExecutionInProgress) {
                return;
            } else {
                var aJob = scheduledJobs.shift();
                if (aJob) {
                    jobExecutionInProgress = true;
                    if (typeof executor === "function") {
                        try {
                            var jobPromise = executor(aJob.payload);
                            if (Q.isPromise(jobPromise)) {
                                jobPromise
                                    .then(aJob.deferred.resolve, aJob.deferred.reject)
                                    .finally(function () {
                                        jobExecutionInProgress = false;
                                        __executeOneJob();
                                    });
                            } else {
                                aJob.deferred.resolve();
                                jobExecutionInProgress = false;
                                __executeOneJob();
                            }
                        } catch (err) {
                            if (config.consoleLog) {
                                console.error(err);
                            }
                            aJob.deferred.reject(err);
                        }
                    } else {
                        jobExecutionInProgress = false;
                        __executeOneJob();
                    }
                }
            }
        });
    }

    jobQueue.on("jobScheduled", __executeOneJob);
    return jobQueue;
}


module.exports = createJobQueue;


