var processInclude = require('base/util');
processInclude(require('movado/main'));

$(document).ready(function () {
    processInclude(require('./header/header'));
    processInclude(require('malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.concat.min'));
    processInclude(require('./components/footer'));
});

