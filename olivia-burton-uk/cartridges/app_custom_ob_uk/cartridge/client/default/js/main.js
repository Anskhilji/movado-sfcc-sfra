var $ = window.jQuery;

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('movado/components/slickCarousel'));
    processInclude(require('movado/utilities/sticky-header'));
    processInclude(require('movado/utilities/modal'));
    processInclude(require('movado/components/menu'));
    processInclude(require('./components/cookie'));
    processInclude(require('base/components/footer'));
    processInclude(require('movado/components/miniCart'));
    processInclude(require('movado/components/newsLetterSubscription'));
    processInclude(require('movado/components/collapsibleItem'));
    processInclude(require('movado/components/search'));
    processInclude(require('movado/productTile'));
    processInclude(require('base/components/clientSideValidation'));
    processInclude(require('base/components/countrySelector'));
    processInclude(require('movado/welcomeMat/welcomeMatModal'));
    processInclude(require('movado/components/mod_video'));
    processInclude(require('movado/product/compare'));
    processInclude(require('movado/utilities/gtm-events'));
    processInclude(require('movado/product/wishlistHeart'));
});

require('base/components/spinner');
