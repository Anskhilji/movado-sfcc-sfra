var processInclude = require('base/util');
processInclude(require('movado/main'));

$(document).ready(function () {
    processInclude(require('./miniCartCustom'));
    processInclude(require('./accountLogout'));
    processInclude(require('./header/header'));
    processInclude(require('./product/productDetailCustom'));
    processInclude(require('./product/zoom'));
});

