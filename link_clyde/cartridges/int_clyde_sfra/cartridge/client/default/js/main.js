// New File added from MSS-1671 v2Cartridge

/* global $, document, Clyde, ClydeSitePreferences */

window.jQuery = window.$ = require('jquery');
require('base/main');
var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./components/miniCart'));
});
