var processInclude = require('base/util');

processInclude(require('movado/storeLocator/storeLocator'));

// function openSotreLocator() {

// }

$('.store-sidebar-link').click(function(){
    $('.store-sidebar').addClass('show');
});