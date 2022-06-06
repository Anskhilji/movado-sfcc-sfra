var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/zoom'));
    processInclude(require('./product/carouselInitializer'));
    processInclude(require('./product/productDetailCustom'));
});

// added active class & scroll down on reviews widget
$('.ratings > .yotpoBottomLine').on('click', function () {
    var $mainWidget = $('.main-widget > .yotpo-display-wrapper');
    $('html, body').animate({
        scrollTop: $($mainWidget).offset().top
    }, 10);
});