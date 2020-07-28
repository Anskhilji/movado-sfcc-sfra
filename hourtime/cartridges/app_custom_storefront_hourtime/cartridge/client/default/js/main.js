window.jQuery = window.$ = require('jquery');

var processInclude = require('base/util');
processInclude(require('movado/main'));

$(document).ready(function () {
    processInclude(require('./components/cookie'));
});
