'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('movado/search'));
    processInclude(require('./search/search'));
});
