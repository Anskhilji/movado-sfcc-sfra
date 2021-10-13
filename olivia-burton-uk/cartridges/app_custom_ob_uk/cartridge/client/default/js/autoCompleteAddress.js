'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./checkout/autoCompleteAddress'));
    google.maps.event.addDomListener(window, 'load', initAutocomplete);
});