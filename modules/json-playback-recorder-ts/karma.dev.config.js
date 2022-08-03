module.exports = function (config) {
    config.set({
        customDebugFile: 'test/custom-karma/debug.html',
        frameworks: ['mocha', 'chai'],
        files: [
            'dist-dev/test/index.browserified.js',
            {pattern: 'dist-dev/test/*.txt', watched: false, included: false, served: true, nocache: false},
            {pattern: 'src/**/*.ts', watched: false, included: false, served: true, nocache: false},
            {pattern: 'test/**/*.ts', watched: false, included: false, served: true, nocache: false},
        ],
        proxies: {
            "/assets/": "/base/dist-dev/",
        },
        reporters: ['progress'],
        port: 9876,  // karma web server port
        colors: true,
        logLevel: config.LOG_INFO,
        browsers: ['Chrome', 'ChromeHeadless'],
        autoWatch: false,
        concurrency: Infinity,
        customLaunchers: {
            Chrome: [
            ],
            ChromeHeadless: [
            ]
        },
        // preprocessors: {
        //     'dist-dev/**/*.js': ['sourcemap']
        // },
        client: {
            args: [
                "--grep",
                ".*",
                //".*RecorderManagerDefaultTest.master-a-list-1000-test",
                //".*RecorderManagerDefaultTest.master-a-wrapper-test",
                //".*RecorderManagerDefaultTest.master-a-list-first-twice-test",
                //".*RecorderManagerDefaultTest.master-lazy-prp-over-sized-test",
                //".*RecorderManagerDefaultTest.master-a-test",
                //".*RecorderManagerDefaultTest.master-min-detail-min-test",
                //".*RecorderManagerDefaultTest.master-a-detail-a-min-test",
                //".*RecorderManagerDefaultTest.master-a-detail-a-test",
                //".*RecorderManagerDefaultTest.master-a-detail-a-record",
                //".*RecorderManagerDefaultTest.poc-observable-just-once-pipe-test",
                //".*RecorderManagerDefaultTest.poc-observable-each-pipe-test",
                //".*RecorderManagerDefaultTest.detail-a-master-a-subscribe-twice",
                //".*RecorderManagerDefaultTest.detail-a-master-a-same-observable-subscribe-twice",
                //".*RecorderManagerDefaultTest.detail-a-arr-master-test",
                //".*RecorderManagerDefaultTest.master-a-test-subs-to-mod",
                //".*RecorderManagerDefaultTest.detail-a-first-secont-second-third",
                //".*RecorderManagerDefaultTest.detail-a-master-a-only-one-request-with-share",
                //".*RecorderManagerDefault",
                //".*FieldProcessorsTest.StringSyncProcessor",
                //".*FieldProcessorsTest.timeoutDecorateRxOpr",
                //".*FieldProcessorsTest.BufferSyncProcessor",
                //".*FieldProcessorsTest.BinaryStreamSyncProcessor",
                //".*FieldProcessorsTest.StringStreamSyncProcessor",
                //".*FieldProcessorsTest.*",
                //".*CacheHandlerTest.CacheHandlerSync",
                //".*FieldProcessorsTest.StringAsyncProcessor",
                //".*FieldProcessorsTest.StringStreamAsyncProcessor",
                //".*FieldProcessorsTest",
                //".*ERR_",
                //".*RecorderManagerDefaultTest.master-[al][-a][zd]",
                //".*rxjs-util-test",
                //".*rxjs-util-test.combineFirstSerial_4-items",
                //".*rxjs-util-test.combineFirstSerial_so-many-items",
                //".*rxjs-util-test.combineFirstSerial_0-items",
                //".*rxjs-util-test.combineAll",
            ]
          },
    })
}