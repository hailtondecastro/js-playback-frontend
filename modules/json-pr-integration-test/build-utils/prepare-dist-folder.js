var path = require('path');
var buildHelperCommons = require('./build-helper-commons');
var includeCwdOnModulePath = require('./include-cwd-on-module-path');

var nodeModuleName = path.basename(module.filename);

//console.log('[' + nodeModuleName + ']: process.cwd(): ' + process.cwd());
//NAO mude aqui
function preRequires() {
    try {
        buildHelperCommons.loadDashArgs();
        // includeCwdOnModulePath(module, buildHelperCommons.argsMap['verbose']);
    } catch (err) {
        console.error('[' + nodeModuleName + ']:' + err);
        process.exit(1);
    }
}
//NAO mude aqui
preRequires();

var fs = require('fs-extra');
//var glob = require("glob");

function main() {
    try {
        console.log('[' + nodeModuleName + ']: INICIO');
        var baseDistFolder = buildHelperCommons.argsMap['baseDistFolder'];
        if (!path.isAbsolute(baseDistFolder)) {
            baseDistFolder = path.resolve(process.cwd(), baseDistFolder);
        }

        if (!fs.existsSync(baseDistFolder)) {
            console.log('[' + nodeModuleName + '] Create '+baseDistFolder+' folder');
            fs.mkdirpSync(baseDistFolder)
        } else {
            
        }
        // if (!fs.existsSync('./dist/ts_src')) {
        //     console.log('clear-all.js: Create ./dist/ts_src folder');
        //     fs.mkdirpSync('./dist/ts_src')
        // }

        // console.log('[' + nodeModuleName + '] Copy contents to dist/ts_src');
        // fs.copySync('src', './dist/ts_src/src');

        // console.log('[' + nodeModuleName + '] Copy *.ts to ./dist/ts_src');
        // var tsArr = glob.sync('*.ts');
        // for (let index = 0; index < tsArr.length; index++) {
        //     const tsItem = tsArr[index];
        //     fs.copyFileSync(tsItem, './dist/ts_src/' + tsItem);
        // }

        console.log('[' + nodeModuleName + '] Copy package.json to ' + baseDistFolder);
        fs.copyFileSync('package.json', path.resolve(baseDistFolder, 'package.json'));
        console.log('[' + nodeModuleName + '] Copy README.md to ' + baseDistFolder);
        fs.copyFileSync('README.md', path.resolve(baseDistFolder, 'README.md'));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();