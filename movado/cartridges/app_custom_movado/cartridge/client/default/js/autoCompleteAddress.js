'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/autoCompleteAddress'));
    try {
        if (typeof google != 'undefined') {
            google.maps.event.addDomListener(window, 'load', initAutocomplete);
        }
    } catch (error) { }
});

