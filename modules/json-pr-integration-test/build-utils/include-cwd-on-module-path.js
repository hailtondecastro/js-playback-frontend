var path = require('path');

var nodeModuleName = path.basename(module.filename);

console.warn('WARNING [' + nodeModuleName + ']: Talvez isso nao seja mais necessario pois a pasta "build-utils" ja mantem um "node_modules" permanente!');

var includeCwdOnModulePath = function(moduleParam, verbose) {
    if (verbose) {
        console.log('[' + nodeModuleName + '] ajustando module.paths');
        console.log('[' + nodeModuleName + '] preRequires: module.paths: module.paths: ');
        console.log(moduleParam.paths);
    }
    moduleParam.paths.push(path.resolve(process.cwd(), 'node_modules'));
    if (verbose) {
        console.log('[' + nodeModuleName + '] preRequires: module.paths (Apos): module.paths: ');
        console.log(moduleParam.paths);
    }
}

module.exports = includeCwdOnModulePath;