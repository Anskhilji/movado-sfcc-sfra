var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./components/slickCarousel'));
    processInclude(require('./utilities/sticky-header'));
    processInclude(require('./utilities/modal'));
    processInclude(require('./components/menu'));
    processInclude(require('base/components/cookie'));
    processInclude(require('base/components/footer'));
    processInclude(require('./components/miniCart'));
    processInclude(require('./components/newsLetterSubscription'));
    processInclude(require('./components/collapsibleItem'));
    processInclude(require('./components/search'));
    processInclude(require('./productTile'));
    processInclude(require('./components/clientSideValidation'));
    processInclude(require('base/components/countrySelector'));
    processInclude(require('./welcomeMat/welcomeMatModal'));
    processInclude(require('./components/mod_video'));
    processInclude(require('./product/compare'));
    processInclude(require('./utilities/gtm-events'));
    processInclude(require('./product/wishlistHeart'));
    processInclude(require('./utilities/swatches'));
    processInclude(require('./components/emailPopUpSubscription'));
    processInclude(require('./components/rakutenCookieHandler'));
});

require('base/components/spinner');
window.slickSlider = require('./components/slickCarousel');