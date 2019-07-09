var path = require('path');
var buildHelperCommons = require('./build-helper-commons');
var includeCwdOnModulePath = require('./include-cwd-on-module-path');

var nodeModuleName = path.basename(module.filename);

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
var glob = require("glob");

//nao mude aqui
function main() {
    try {
        console.log('[' + nodeModuleName + ']: INICIO');

        buildHelperCommons.loadDashArgs();
        var baseDistFolder = buildHelperCommons.argsMap['baseDistFolder'];
        if (!path.isAbsolute(baseDistFolder)) {
            baseDistFolder = path.resolve(process.cwd(), baseDistFolder);
        }

        var extensionArr = ['*.js', '*.d.ts'];
        for (let j = 0; j < extensionArr.length; j++) {
            const extensionItem = extensionArr[j];
            var currDir = process.cwd();
            var fileArr = glob.sync(currDir + path.sep + '**' + path.sep + extensionItem);
            for (let i = 0; i < fileArr.length; i++) {
                const fileItem = fileArr[i];
                if (!/node_modules[\\\/]/g.test(fileItem) && !/[\\\/]build\.js/g.test(fileItem)) {
                    var relativeFile = path.relative(currDir, fileItem);
                    var distDir = path.resolve(baseDistFolder, path.dirname(relativeFile));
                    if (!fs.existsSync(distDir)) {
                        if (buildHelperCommons.argsMap['verbose']) {
                            console.log('[' + nodeModuleName + '] mkdirpSync: ' + distDir);
                        }
                        fs.mkdirpSync(distDir);
                    }
                    var distFile = path.resolve(baseDistFolder, relativeFile);
                    if (buildHelperCommons.argsMap['verbose']) {
                        console.log('[' + nodeModuleName + '] copySync: de ' + fileItem + ' para ' + distFile);
                    }
                    fs.copySync(fileItem, distFile, {overwrite: true});
                }
            }     
        }
    } catch (err) {
        console.error('[' + nodeModuleName + ']: ERRO inesperado!');
        console.error('[' + nodeModuleName + ']: ' + err);
        console.error('[' + nodeModuleName + ']: ' + err.stack);
        process.exit(1);
    }
}

main();