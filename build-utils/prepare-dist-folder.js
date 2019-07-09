var fs = require('fs-extra');
var path = require('path');
var glob = require("glob");

function main() {
    try {
        // if (!fs.existsSync('../../local_modules_dist/ng-js-hb-supersync/ts_src')) {
        //     console.log('clear-all.js: Create ../../local_modules_dist/ng-js-hb-supersync/ts_src folder');
        //     fs.mkdirpSync('../../local_modules_dist/ng-js-hb-supersync/ts_src')
        // }

        // console.log('prepare-dist-folder.js: Copy contents to dist/ts_src');
        // fs.copySync('src', '../../local_modules_dist/ng-js-hb-supersync/ts_src/src');

        // console.log('prepare-dist-folder.js: Copy *.ts to ../../local_modules_dist/ng-js-hb-supersync/ts_src');
        // var tsArr = glob.sync('*.ts');
        // for (let index = 0; index < tsArr.length; index++) {
        //     const tsItem = tsArr[index];
        //     fs.copyFileSync(tsItem, '../../local_modules_dist/ng-js-hb-supersync/ts_src/' + tsItem);
        // }

        console.log('prepare-dist-folder.js: Copy package.json to ../../local_modules_dist/ng-js-hb-supersync/');
        fs.copyFileSync('package.json', '../../local_modules_dist/ng-js-hb-supersync/package.json');
        console.log('prepare-dist-folder.js: Copy README.md to ../../local_modules_dist/ng-js-hb-supersync/');
        fs.copyFileSync('README.md', '../../local_modules_dist/ng-js-hb-supersync/README.md');

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();