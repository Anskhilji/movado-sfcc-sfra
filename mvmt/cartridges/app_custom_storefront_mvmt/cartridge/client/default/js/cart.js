'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./cart/cart'));
    $('.clicked-label').click(function() {
        $('.textarea-container').addClass('text-container');
    });
});
