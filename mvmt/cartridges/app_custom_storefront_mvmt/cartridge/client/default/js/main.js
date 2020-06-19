// This is the main file please add submodules into it
var processInclude = require('base/util');
processInclude(require('movado/main'));

$(document).ready(function () {
    processInclude(require('./components/faq-page'));
    processInclude(require('./header/header'));
    processInclude(require('./clp/clpcustom'));
    processInclude(require('./components/dashboard'));
    processInclude(require('./components/mobileMenu'));
    processInclude(require('./components/search'));
    processInclude(require('./utilities/sticky-header'));
    processInclude(require('./components/miniCart'));
    processInclude(require('./login/login'));
    processInclude(require('./components/newsLetterSubscription'));
});

