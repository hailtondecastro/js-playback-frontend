var path = require('path');
var buildHelperCommons = require('./build-helper-commons');
var includeCwdOnModulePath = require('./include-cwd-on-module-path');

//console.log('[' + nodeModuleName + ']: process.cwd(): ' + process.cwd());
//NAO mude aqui
function preRequires() {
    try {
        buildHelperCommons.loadDashArgs();
        includeCwdOnModulePath(module, buildHelperCommons.argsMap['verbose']);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
//NAO mude aqui
preRequires();

var fs = require('fs-extra');
var path = require('path');

var nodeModuleName = path.basename(module.filename);

function main() {
    try {
        console.log('[' + nodeModuleName + ']: INICIO');
        buildHelperCommons.loadDashArgs();
        var baseDistFolder = buildHelperCommons.argsMap['baseDistFolder'];
        if (!path.isAbsolute(baseDistFolder)) {
            baseDistFolder = path.resolve(process.cwd(), baseDistFolder);
        }

        console.log('[' + nodeModuleName + '] Cleaning ' + baseDistFolder);
        if (fs.existsSync(baseDistFolder)) {
            fs.emptyDirSync(baseDistFolder);
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();