var $ = window.jQuery;

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('movado/components/slickCarousel'));
    processInclude(require('movado/utilities/sticky-header'));
    processInclude(require('movado/utilities/modal'));
    processInclude(require('movado/components/menu'));
    processInclude(require('./components/cookie'));
    processInclude(require('base/components/footer'));
    processInclude(require('movado/components/newsLetterSubscription'));
    processInclude(require('movado/components/collapsibleItem'));
    processInclude(require('movado/components/search'));
    processInclude(require('./productTile'));
    processInclude(require('movado/components/clientSideValidation'));
    processInclude(require('base/components/countrySelector'));
    processInclude(require('movado/welcomeMat/welcomeMatModal'));
    processInclude(require('movado/components/mod_video'));
    processInclude(require('movado/product/compare'));
    processInclude(require('movado/utilities/gtm-events'));
    processInclude(require('movado/product/wishlistHeart'));
    processInclude(require('./product/base'));
    processInclude(require('./components/miniCart'));
    processInclude(require('movado/utilities/swatches'));
    processInclude(require('movado/components/emailPopUpSubscription'));
    processInclude(require('./components/mobileMenu'));
});

require('base/components/spinner');
window.slickSlider = require('movado/components/slickCarousel');
