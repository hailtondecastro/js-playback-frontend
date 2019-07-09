var fs = require('fs-extra');
var path = require('path');
var glob = require('glob');
var mkdirp = require('mkdirp');

function main() {
    try {
        console.log('clear-all.js: Cleaning dist and dist_dev folder');
        if (fs.existsSync('../../local_modules_dist/ng-js-hb-supersync')) {
            fs.emptyDirSync('../../local_modules_dist/ng-js-hb-supersync');
        }
        fs.emptyDirSync('dist_dev');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();