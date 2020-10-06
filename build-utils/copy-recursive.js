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
        console.log('[' + nodeModuleName + ']: INICIO');
        // for (let index = 0; index < optionsArr.length; index++) {
        //     const options = optionsArr[index];
        //     const changes = replace.sync(options);
        //     console.log('Modified files:', changes.join(', '));            
        // }

        buildHelperCommons.loadDashArgs();

        setTimeout(() => {
            console.error('[' + nodeModuleName + ']: timeout');
            process.exit(1);
        }, buildHelperCommons.argsMap['timeout']);

        var baseFolder = buildHelperCommons.argsMap['baseFolder'];
        var relativeSourceFolder = buildHelperCommons.argsMap['relativeSourceFolder'];
        var relativeTargetFolder = buildHelperCommons.argsMap['relativeTargetFolder'];
        var extension = buildHelperCommons.argsMap['extension'];
        var filePattern = buildHelperCommons.argsMap['filePattern'];
        var useMove = buildHelperCommons.argsMap['useMove'];
        if (!path.isAbsolute(baseFolder)) {
            baseFolder = path.resolve(process.cwd(), baseFolder);
        }
        var mapArr = [];
        if (extension) {
            mapArr = glob.sync(baseFolder + path.sep + relativeSourceFolder + path.sep + '**' + path.sep +'*.' + extension);
        } else if (filePattern) {
            mapArr = glob.sync(baseFolder + path.sep + relativeSourceFolder + path.sep + '**' + path.sep + filePattern);
        } else {
            throw new Error("'extension' or 'filePattern' must be provided!");
        }
        if (mapArr.length == 0) {
            throw new Error("Files not found!");
        }

        if (buildHelperCommons.argsMap['verbose'] === 'true') {
            console.log('[' + nodeModuleName + ']: mapArr.length: ' + mapArr.length);
            console.log('[' + nodeModuleName + ']: patttern: ' + baseFolder + path.sep + relativeSourceFolder + path.sep + '**' + path.sep + filePattern);
        }

        const filesWriteCountDownRef = { value: mapArr.length };
        const exitIfFilesWriteCountDownEndedFunc = () => {
            if(filesWriteCountDownRef.value === 0) {
                process.exit(0);
            }
        }
        const filesWriteCountDownStepFunc = () => {
            --filesWriteCountDownRef.value;
            exitIfFilesWriteCountDownEndedFunc();
        }
        for (let index = 0; index < mapArr.length; index++) {
            const sourceItem = mapArr[index];
            const targetItem = baseFolder + path.sep + relativeTargetFolder + path.sep + path.relative(baseFolder, sourceItem);
            const targetItemDir = path.dirname(targetItem);
            fs.mkdirp(targetItemDir, (err) => {
                if (err) {
                    console.error('[' + nodeModuleName + ']:'+err);
                    process.exit(1);
                }
                var copyOrMoveCallback = fs.copyFile;
                if (useMove) {
                    copyOrMoveCallback = fs.move;
                }
                if (fs.lstatSync(sourceItem).isDirectory()) {
                    filesWriteCountDownStepFunc();
                    if (buildHelperCommons.argsMap['verbose'] === 'true') {
                        console.log('[' + nodeModuleName + ']: is directory '+sourceItem+' to '+targetItem);
                    }
                } else {
                    copyOrMoveCallback(sourceItem, targetItem, {overwrite: true}, (err) => {
                        if (err) {
                            console.error('[' + nodeModuleName + ']:'+err);
                            process.exit(1);
                        }
                        filesWriteCountDownStepFunc();
                        if (buildHelperCommons.argsMap['verbose'] === 'true') {
                            console.log('[' + nodeModuleName + ']: copy '+sourceItem+' to '+targetItem);
                        }
                    });
                }
            });
        }

        //process.exit(0);
    } catch (err) {
        console.error('[' + nodeModuleName + ']:'+err);
        process.exit(1);
    }
}

main();