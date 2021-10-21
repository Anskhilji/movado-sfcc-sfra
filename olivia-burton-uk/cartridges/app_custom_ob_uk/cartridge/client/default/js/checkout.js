'use strict';

var processInclude = require('base/util');


$(document).ready(function () {
    processInclude(require('movado/checkout'));
    $('body').load(function() {
        if (history.state == "shipping") { 
            $('body').trigger('checkOutStage:success', history.state);
        } 
    });
});