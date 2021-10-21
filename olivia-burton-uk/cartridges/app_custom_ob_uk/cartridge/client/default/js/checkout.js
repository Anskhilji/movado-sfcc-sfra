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

$(document).ready(function () { 
        $('#shippingState').attr("id", "shippingCounty");
        $('#billingState').attr("id", "billingCounty");
});