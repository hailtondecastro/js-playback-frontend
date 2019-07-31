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
        var relativeSourceFolder = buildHelperCommons.argsMap['relativeSourceFolder'];
        var relativeTargetFolder = buildHelperCommons.argsMap['relativeTargetFolder'];
        if (!path.isAbsolute(baseFolder)) {
            baseFolder = path.resolve(process.cwd(), baseFolder);
        }

        var mapArr = glob.sync(baseFolder + path.sep + relativeSourceFolder + path.sep +'*');
        var asyncCountDown = mapArr.length;
        for (let index = 0; index < mapArr.length; index++) {
            const sourceItem = mapArr[index];
            const targetItem = path.normalize(baseFolder + path.sep + relativeTargetFolder + path.sep + path.relative(baseFolder, sourceItem));
            const targetItemDir = path.normalize(path.dirname(targetItem));

            const mvCallback = () => {
                fs.move(sourceItem, targetItem, {overwrite: true}, (err) => {
                    asyncCountDown--;
                    if(err) {
                        console.error('[' + nodeModuleName + ']:'+err);
                        process.exit(1);
                    } else {
                        if (buildHelperCommons.argsMap['verbose'] === 'true') {
                            console.log('[' + nodeModuleName + ']: mv '+sourceItem+' to '+targetItem);
                        }
                        if (asyncCountDown == 0) {
                            process.exit(0);
                        }
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
        }
        if (asyncCountDown == 0) {
            process.exit(0);
        }
    } catch (err) {
        console.error('[' + nodeModuleName + ']:'+err);
        process.exit(1);
    }
}

main();