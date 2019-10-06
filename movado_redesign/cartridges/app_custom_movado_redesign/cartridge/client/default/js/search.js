'use strict';
var processInclude = require('base/util');
processInclude(require('movado/search'));
$(document).ready(function () {
	processInclude(require('./search/jquery-custom-select'));
	processInclude(require('./search/searchresult'));
	processInclude(require('./search/search'));
});
