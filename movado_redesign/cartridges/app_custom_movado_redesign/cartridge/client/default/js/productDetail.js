var processInclude = require('base/util');
processInclude(require('movado/productDetail'));

$(document).ready(function () {
    processInclude(require('./product/zoom'));
    processInclude(require('./product/productDetailCustom'));
});