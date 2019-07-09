//const replace = require('replace-in-file');
var fs = require('fs-extra');
var path = require('path');
var glob = require("glob");
var sourceMap = require('source-map');

async function main() {
    try {
        // for (let index = 0; index < optionsArr.length; index++) {
        //     const options = optionsArr[index];
        //     const changes = replace.sync(options);
        //     console.log('Modified files:', changes.join(', '));            
        // }

        var mapArr = glob.sync('../../local_modules_dist/ng-js-hb-supersync/**/*.map');
        for (let index = 0; index < mapArr.length; index++) {
            const mapItem = mapArr[index];
            const mapItemDir = path.dirname(mapItem);
            //const myfunction = async sourceMap.SourceMapConsumer;
            var consumer = await new sourceMap.SourceMapConsumer(fs.readFileSync(mapItem, "utf8"));
            const generator = sourceMap.SourceMapGenerator.fromSourceMap(consumer);
            for (let j = 0; j < consumer.sources.length; j++) {
                const sourceItem = consumer.sources[j];
                console.log('embed-source-contents.js: embarcando fonte (sourceContent) em: ' + mapItem);
                generator.setSourceContent(sourceItem, fs.readFileSync(path.resolve(mapItemDir, sourceItem), "utf8"));
                fs.writeFileSync(mapItem, generator.toString());
            }
            consumer.destroy();
        }

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

main();