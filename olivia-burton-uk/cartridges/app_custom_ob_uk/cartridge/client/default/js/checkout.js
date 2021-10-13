'use strict';

var processInclude = require('base/util');


$(document).ready(function () {
    processInclude(require('movado/checkout'));
    processInclude(require('./checkout/autoCompleteAddress'));
    
    $('body').load(function() {
        if (history.state == "shipping") {
            $('body').trigger('checkOutStage:success', history.state);
        } 
    });
});