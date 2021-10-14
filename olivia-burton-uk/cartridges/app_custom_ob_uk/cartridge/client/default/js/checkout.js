'use strict';

var processInclude = require('base/util');


$(document).ready(function () {
    processInclude(require('movado/checkout'));

    if (Resources.GOOGLE_AUTO_COMPLETE_ENABLED) {
        processInclude(require('./checkout/autoCompleteAddress'));
        processInclude(require('./checkout/autoCompleteBillingAddress'));
    }
    
    $('body').load(function() {
        if (history.state == "shipping") {
            $('body').trigger('checkOutStage:success', history.state);
        } 
    });
});