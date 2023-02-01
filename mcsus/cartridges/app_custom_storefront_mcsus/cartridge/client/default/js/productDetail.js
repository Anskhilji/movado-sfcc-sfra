var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/zoom'));
    processInclude(require('./product/carouselInitializer'));
    processInclude(require('./product/productDetailCustom'));
    processInclude(require('./product/storePickUpDetail'));
});

// added active class & scroll down on reviews widget
$('.ratings > .yotpoBottomLine').on('click', function () {
    var $mainWidget = $('.main-widget > .yotpo-display-wrapper');
    $('html, body').animate({
        scrollTop: $($mainWidget).offset().top
    }, 10);
});

// 2093 by default open accordion when clicked on plp product rating
var myid = '#yotpo-reviews-top-div'
if(location.hash && location.hash == myid) {
    $('.reviews-accordion').removeClass('collapsed');
    $('#reviews').addClass('show');
}