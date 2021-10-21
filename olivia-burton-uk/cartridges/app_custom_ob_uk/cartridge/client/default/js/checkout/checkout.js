'use strict';

$(document).ready(function () { 
    if (Resources.CURRENT_SITE === 'OliviaBurtonUK') {
        $('#shippingState').attr("id", "shippingCounty");
        $('#billingState').attr("id", "billingCounty");
    }
});