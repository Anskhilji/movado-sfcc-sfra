var glob = require("glob");
var path = require('path');
var fs = require('fs');

console.log('Scanning for cartridges...');
var projectFiles = glob.sync(".project", {
    matchBase: true,
    ignore: "node_modules"
});

var cartridges = projectFiles.map(f => {
    var dirname = path.dirname(f);
    var cartridge = path.basename(dirname);
    return {
        dest: cartridge,
        src: dirname
    };
});

var cartridgePaths = [];
var cartridgesCount = 0;
//extract cartridges paths and push it in an array
cartridges.forEach(c =>  {
    cartridgePaths.push(c.src);
    console.log(`\t${c.dest}`);
    cartridgesCount++;
});

var filePath = '../dw.json';
var file = require(filePath);
//update cartridge object value in dw.json file
file.cartridge = cartridgePaths;
//update dw.json file to include updated "cartridge" path value.
fs.writeFile('dw.json', JSON.stringify(file, null, 4), function (err) {
    if (err) {
        return console.log(err);
    } else {
        console.log('dw.json file updated to include above ' + cartridgesCount +  ' cartridges paths');
    }
});