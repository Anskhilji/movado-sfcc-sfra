var processInclude = require('base/util');
processInclude(require('movad_redesign/main'));

$(document).ready(function () {
    processInclude(require('movado/utilities/gtm-custom-event'));
});

