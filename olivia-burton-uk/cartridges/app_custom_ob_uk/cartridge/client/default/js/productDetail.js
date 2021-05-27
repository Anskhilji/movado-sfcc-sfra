'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/detail'));
    processInclude(require('movado/product/zoom-image'));
    processInclude(require('movado/product/productOptionTextValidator'));
    processInclude(require('movado/share/sendToFriend'));
    processInclude(require('movado/product/wishlist'));
    processInclude(require('movado/utilities/spaceBelowBodyOnFixedButton'));
    processInclude(require('movado/product/pdpCarouselVideo'));
});
