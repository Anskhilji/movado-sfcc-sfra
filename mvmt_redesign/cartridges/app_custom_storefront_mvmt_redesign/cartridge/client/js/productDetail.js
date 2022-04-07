'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('movado/productDetail'));
    processInclude(require('mvmt/product/zoom'));
    processInclude(require('mvmt/cart/cart'));
    processInclude(require('./product/detail'));
});
