var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('movado/productDetail'));
    processInclude(require('./product/zoom'));
    processInclude(require('./product/productDetailCustom'));
    processInclude(require('./product/detail'));
});
