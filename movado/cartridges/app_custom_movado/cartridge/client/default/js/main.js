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
});


$('.plp-show-more .show-more-results').on('click', function() {
    var $pageSize = $(this).data('page-number');
    var $plpName =  $(this).data('category-id');

    if ($pageSize !== undefined) {
        dataLayer.push({
          event: 'Load More Results',
          eventCategory: 'Load More Results - See More',
          eventAction: $plpName,
          eventLabel: $pageSize
        });
    }
});

require('base/components/spinner');
window.slickSlider = require('./components/slickCarousel');