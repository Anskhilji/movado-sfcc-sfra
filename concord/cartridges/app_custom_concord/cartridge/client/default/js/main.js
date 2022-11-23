var processInclude = require('base/util');
processInclude(require('movado/main'));

$(document).ready(function () {
    processInclude(require('./components/mainLogo'));
    processInclude(require('movado/utilities/gtm-custom-event'));
});

