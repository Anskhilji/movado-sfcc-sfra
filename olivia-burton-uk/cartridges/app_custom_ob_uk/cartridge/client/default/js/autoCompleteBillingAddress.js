'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/autoCompleteBillingAddress'));
    google.maps.event.addDomListener(window, 'load', initAutocomplete);
});

