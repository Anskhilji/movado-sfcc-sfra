  var processInclude = require('base/util');
processInclude(require('movado/productDetail'));

$(document).ready(function () {
    processInclude(require('./product/productDetailCustom'));
});
