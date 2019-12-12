var fs = require('fs');
var customJSON = {
    "root": "./"
}
fs.writeFile('dw.json', JSON.stringify(customJSON), (err) => {
    if (!err) {
        console.log('dw.json file created on root path');
    }
});