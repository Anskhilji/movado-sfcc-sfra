'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/autoCompleteAddress'));
    try {
        google.maps.event.addDomListener(window, 'load', initAutocomplete);
    } catch (error) { }
});

