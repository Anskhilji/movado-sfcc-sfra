'use strict';
var processInclude = require('base/util');
processInclude(require('movado/search'));
$(document).ready(function () {
	processInclude(require('./search/search'));
	processInclude(require('./search/searchresult'));
});
