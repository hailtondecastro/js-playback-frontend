const path = require('path');

var nodeModuleName = path.basename(module.filename);

exports.argsMap = null;
exports.verbose = false;

//exports.scpSourceMapStorageHost = '10.32.144.37';
//exports.scpSourceMapStoragePath = '/home/63315947368/temp/teste-maps';
//exports.scpSourceMapStorageUser = '63315947368';
//exports.scpSourceMapStoragePassword = '******';

////exports.scpSourceMapStorageHost = 'cedesrvv0012';
//exports.scpSourceMapStorageHost = 'ceflaservd076.fla.serpro';
//exports.scpSourceMapStoragePath =  '/rede/srfde/webanalise/webanalise-frontend-map-files';
//exports.scpSourceMapStorageUser = 'srfde';
//exports.scpSourceMapStoragePassword =  'srfde';

exports.loadDashArgs = function() {
    exports.argsMap = {};
    for (var index = 0; index < process.argv.length; index++) {
        var element = process.argv[index];
        if (element.startsWith('-')) {
            var argKey = element.substr(1, element.length - 1);
            var argValue = process.argv[index + 1];
            exports.argsMap[argKey] = argValue;
        }
    }
}