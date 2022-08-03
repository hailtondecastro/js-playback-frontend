module.exports = function (config) {
    config.set({
        customDebugFile: 'test/custom-karma/debug.html',
        frameworks: ['mocha', 'chai'],
        files: [
            'dist-test/test/index.browserified.js',
            {pattern: 'dist-test/test/*.txt', watched: false, included: false, served: true, nocache: false},
        ],
        proxies: {
            "/assets/": "/base/dist-test/"
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
        client: {
            args: [
                "--grep",
                ".*"
            ]
          },
    })
}