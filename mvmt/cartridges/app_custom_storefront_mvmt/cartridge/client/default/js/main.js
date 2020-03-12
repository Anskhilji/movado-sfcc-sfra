// This is the main file please add submodules into it
var processInclude = require('base/util');
processInclude(require('movado/main'));

$(document).ready(function () {
    processInclude(require('./components/miniCart'));
    processInclude(require('./components/newsLetterSubscription'));
    processInclude(require('./faq-page'));
    processInclude(require('./header/header'));
    processInclude(require('./clp/clpcustom'));
    processInclude(require('./components/newsLetterSubscription'));
    processInclude(require('./components/miniCart'));
    processInclude(require('./components/dashboard'));
    processInclude(require('custom-yotpo-swell/swell/swell'));
    $(document).trigger('swell:initialized');
});

