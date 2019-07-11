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
var path = require('path');
var glob = require("glob");
var sourceMap = require('source-map');

async function main() {
    try {
        setTimeout(() => {
            console.error('[' + nodeModuleName + ']: timeout');
            process.exit(1);
        }, 10000);
        console.log('[' + nodeModuleName + ']: INICIO');
        // for (let index = 0; index < optionsArr.length; index++) {
        //     const options = optionsArr[index];
        //     const changes = replace.sync(options);
        //     console.log('Modified files:', changes.join(', '));            
        // }

        buildHelperCommons.loadDashArgs();
        var baseFolder = buildHelperCommons.argsMap['baseFolder'];
        var relativeSourceFile = buildHelperCommons.argsMap['relativeSourceFile'];
        var relativeTargetFile = buildHelperCommons.argsMap['relativeTargetFile'];
        if (!path.isAbsolute(baseFolder)) {
            baseFolder = path.resolve(process.cwd(), baseFolder);
        }

        const sourceItem = path.normalize(baseFolder + path.sep + relativeSourceFile);
        const targetItem = path.normalize(baseFolder + path.sep + relativeTargetFile);
        const targetItemDir = path.normalize(path.dirname(targetItem));

        const mvCallback = () => {
            fs.move(sourceItem, targetItem, {overwrite: true}, (err) => {
                if(err) {
                    console.error('[' + nodeModuleName + ']:'+err);
                    process.exit(1);
                } else {
                    if (buildHelperCommons.argsMap['verbose'] === 'true') {
                        console.log('[' + nodeModuleName + ']: mv '+sourceItem+' to '+targetItem);
                    }
                    process.exit(0);
                }
            });
        }

        fs.exists(targetItemDir, (value) => {
            if (!value) {
                fs.mkdirp(targetItemDir, (err) => {
                    if(err) {
                        console.error('[' + nodeModuleName + ']:'+err);
                        process.exit(1);
                    }
                    mvCallback();
                });
            } else {
                mvCallback();
            }
        });
    } catch (err) {
        console.error('[' + nodeModuleName + ']:'+err);
        process.exit(1);
    }
}

main();