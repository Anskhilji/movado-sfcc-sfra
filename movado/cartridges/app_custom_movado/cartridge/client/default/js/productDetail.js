'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/detail'));
    processInclude(require('./product/zoom-image'));
    processInclude(require('./product/productOptionTextValidator'));
    processInclude(require('./share/sendToFriend'));
    processInclude(require('./product/wishlist'));
    processInclude(require('./utilities/spaceBelowBodyOnFixedButton'));
    processInclude(require('./product/pdpCarouselVideo'));
});
