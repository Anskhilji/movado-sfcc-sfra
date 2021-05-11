'use strict';
var processInclude = require('base/util');
processInclude(require('olivia-burton-uk/productDetail'));

$(document).ready(function () {
    processInclude(require('./product/productDetailCustom'));
});
