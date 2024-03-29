// This is the main file please add submodules into it
var processInclude = require('base/util');

processInclude(require('./components/eswFooter'));
processInclude(require('movado/utilities/modal'));
processInclude(require('movado/components/menu'));
processInclude(require('base/components/cookie'));
processInclude(require('base/components/footer'));
processInclude(require('movado/components/miniCart'));
processInclude(require('movado/components/search'));
processInclude(require('movado/components/clientSideValidation'));
processInclude(require('base/components/countrySelector'));
processInclude(require('movado/welcomeMat/welcomeMatModal'));
processInclude(require('movado/components/mod_video'));
processInclude(require('movado/utilities/swatches'));
processInclude(require('movado/components/emailPopUpSubscription'));
processInclude(require('movado/components/googleRecaptcha'));

$(document).ready(function () {
    processInclude(require('./components/slickCarousel'));
    processInclude(require('./components/collapsibleItem'));
    processInclude(require('./components/faq-page'));
    processInclude(require('./header/header'));
    processInclude(require('./clp/clpcustom'));
    processInclude(require('./components/dashboard'));
    processInclude(require('./components/mobileMenu'));
    processInclude(require('./components/plpVariations'));
    processInclude(require('./components/search'));
    processInclude(require('./utilities/sticky-header'));
    processInclude(require('./utilities/gtm-events'));
    processInclude(require('./components/miniCart'));
    processInclude(require('./login/login'));
    processInclude(require('./components/newsLetterSubscription'));
    processInclude(require('./videoPopup'));
    processInclude(require('./components/miniCartRecommendations'));
    processInclude(require('movado/components/rakutenCookieHandler'));
    processInclude(require('googlePay/googlePay'));
    processInclude(require('movado/components/Coupon'));
    processInclude(require('./product/slickSearch'));
});

require('base/components/spinner');
window.slickSlider = require('./components/slickCarousel');