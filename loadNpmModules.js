var glob = require("glob")
var fs = require('fs');

glob("bundle/programs/server/npm/*/node_modules/*/package.json", function(er, files) {
    files.forEach(function(filepath) {
        var fileconent = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        process.stdout.write(fileconent.name+'@'+fileconent.version+' ');
    });
})
