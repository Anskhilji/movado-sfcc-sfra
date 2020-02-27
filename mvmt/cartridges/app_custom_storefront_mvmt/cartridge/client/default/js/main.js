// This is the main file please add submodules into it
var processInclude = require('base/util');
processInclude(require('movado/main'));

$(document).ready(function () {
    processInclude(require('./header/header'));
    processInclude(require('./clp/clpcustom'));
    processInclude(require('./components/newsLetterSubscription'));
    processInclude(require('./components/miniCart'));
    processInclude(require('./components/dashboard'));
});

