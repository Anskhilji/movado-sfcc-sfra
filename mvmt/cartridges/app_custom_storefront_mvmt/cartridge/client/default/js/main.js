// This is the main file please add submodules into it
var processInclude = require('base/util');
processInclude(require('movado/main'));

$(document).ready(function () {
    processInclude(require('./components/customCartFieldValidation'));
    processInclude(require('./components/newsLetterSubscription'));
});
