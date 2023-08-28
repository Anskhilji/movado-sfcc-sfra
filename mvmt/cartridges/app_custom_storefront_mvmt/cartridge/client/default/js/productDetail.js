'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('movado/productDetail'));
    processInclude(require('./product/zoom'));
    processInclude(require('./cart/cart'));
    processInclude(require('./product/detail'));
});
