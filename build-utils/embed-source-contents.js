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

        var baseDistFolder = buildHelperCommons.argsMap['baseDistFolder'];
        if (!path.isAbsolute(baseDistFolder)) {
            baseDistFolder = path.resolve(process.cwd(), baseDistFolder);
        }
        var consumer;
        var mapArr = glob.sync(baseDistFolder + path.sep + '**' + path.sep +'*.map');
        const filesWriteCountDownRef = { value: mapArr.length };
        const exitIfFilesWriteCountDownEndedFunc = () => {
            if(filesWriteCountDownRef.value === 0) {
                if (consumer && consumer.destroy) {
                    consumer.destroy();
                }
                process.exit(0);
            }
        }
        const filesWriteCountDownStepFunc = () => {
            --filesWriteCountDownRef.value;
            exitIfFilesWriteCountDownEndedFunc();
        }

        exitIfFilesWriteCountDownEndedFunc();
        for (let index = 0; index < mapArr.length; index++) {
            const mapItem = mapArr[index];
            const mapItemDir = path.dirname(mapItem);
            //const myfunction = async sourceMap.SourceMapConsumer;
            consumer = await new sourceMap.SourceMapConsumer(fs.readFileSync(mapItem, "utf8"));
            const generator = sourceMap.SourceMapGenerator.fromSourceMap(consumer);
            filesWriteCountDownRef.value += (consumer.sources.length - 1);
            exitIfFilesWriteCountDownEndedFunc();
            for (let j = 0; j < consumer.sources.length; j++) {
                const sourceItem = consumer.sources[j];
                if (buildHelperCommons.argsMap['verbose']) {
                    console.log('[' + nodeModuleName + ']: embedding source (sourceContent) on: ' + mapItem);
                }
                generator.setSourceContent(sourceItem, fs.readFileSync(path.resolve(mapItemDir, sourceItem), "utf8"));
                fs.writeFile(
                    mapItem,
                    generator.toString(),
                    (err) => {
                        if (err) {
                            console.error('[' + nodeModuleName + ']:'+err);
                            process.exit(1);
                        }
                        filesWriteCountDownStepFunc();
                    }
                );
            }
            exitIfFilesWriteCountDownEndedFunc();
        }

        //process.exit(0);
    } catch (err) {
        console.error('[' + nodeModuleName + ']:'+err);
        process.exit(1);
    }
}

main();