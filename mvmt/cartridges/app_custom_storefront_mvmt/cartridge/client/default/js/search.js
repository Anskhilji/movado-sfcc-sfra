'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./search/jquery-custom-select'));
    processInclude(require('movado/search'));
    processInclude(require('./search/search'));
});
