/**
 * Created by aismael on 1/3/14.
 */
'use strict';

var assert = require('assert');


'use strict';


var path = require('path');


var job_queue_1 = require("../lib/index")({
    instanceId: "job_queue_1",
    persistent: false,
    maxSize: 1000,
    heartbeatMillis: 4000,
    consoleLog: true
}, dummyExecutor);
var job_queue_2 = require("../lib/index")({
    instanceId: "job_queue_2",
    persistent: false,
    maxSize: 1000,
    heartbeatMillis: 1000,
    consoleLog: true
}, dummyExecutor);


function dummyExecutor(aJob) {
    //console.log(">>>> dummy executor", aJob.toString());
}
/**
 *
 */
describe('job-queue', function () {


    before(function (done) {
        //


        var appRoot = path.resolve('.');
        var basedir = path.join(appRoot, 'config');

        //confit(basedir).create(function (err, config) {
        //
        //    var appConfig = require("../../lib/util/app_config");
        //    appConfig.init(config);
        //
        //    job_queue.init();
        //
        //    //console.log(config);
        //
        //    done();
        //
        //});

        job_queue_1.init();
        job_queue_2.init(done);
    });


    /**
     *
     */
    after(function () {

    });

    /**
     *
     */
    beforeEach(function () {

    });

    /**
     *
     */
    afterEach(function () {

    });


    /**
     *
     */
    describe('JobQueue Performance test', function () {

        it('should run without error', function (done) {

            var numJobsCreated = 0;
            var numJobsExecuted = 0;

            ++numJobsCreated;
            job_queue_1.pushJob("Job_1_q_1").then(function () {
                numJobsExecuted--;
            });

            ++numJobsCreated;
            job_queue_1.pushJob("Job_2_q_1").then(function () {
                numJobsExecuted--;
            });

            setTimeout(function () {
                ++numJobsCreated;
                job_queue_1.pushJob("q_1_" + new Date().toString()).then(function () {
                    numJobsExecuted--;
                });
            }, 1000);


            ++numJobsCreated;
            job_queue_2.pushJob("Job_2_q_2").then(function () {
                numJobsExecuted--;
            });

            ++numJobsCreated;
            job_queue_2.pushJob("Job_3_q_2").then(function () {
                numJobsExecuted--;
            });

            for (var i = 0; i < 100000; i++) {
                ++numJobsCreated;
                job_queue_2.pushJob("q_2_" + new Date().toString()).then(function () {
                    numJobsExecuted--;
                });
            }

            ++numJobsCreated;
            job_queue_2.pushJob("Job_1_q_2").then(function () {
                numJobsExecuted--;
                console.log(">p>p>p completed job Job_1_q_2");
            });

            setTimeout(function () {
                job_queue_1.shutdown();
                job_queue_2.shutdown();

                console.log("number of jobs created:", numJobsCreated);
                console.log("number of jobs executed:", numJobsExecuted);
                done();
            }, 15000);


        });
    });
});
