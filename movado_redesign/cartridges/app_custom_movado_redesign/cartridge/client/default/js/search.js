'use strict';
var processInclude = require('base/util');
$(document).ready(function () {
	processInclude(require('./search/jquery-custom-select'));
	processInclude(require('./search/searchresult'));
	processInclude(require('./search/search'));
});
