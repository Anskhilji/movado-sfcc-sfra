var processInclude = require('base/util');
processInclude(require('movado/productDetail'));

$(document).ready(function () {
    processInclude(require('movad_redesign/product/zoom'));
    processInclude(require('./product/productDetailCustom'));
}); 