var processInclude = require('base/util');

$(document).ready(function () {
    processInclude(require('./product/zoom'));
    processInclude(require('./product/carouselInitializer'));
    processInclude(require('./product/productDetailCustom'));
    processInclude(require('./product/storePickUpDetail'));
    processInclude(require('./product/detail'));
});

// added active class & scroll down on reviews widget
$('.ratings > .yotpoBottomLine').on('click', function () {
    var $mainWidget = $('.main-widget > .yotpo-display-wrapper');
    $('html, body').animate({
        scrollTop: $($mainWidget).offset().top
    }, 10);
});


$('body').on('click', '.info-icon.info-icon-bopis', function (e) {
    e.preventDefault();
    var $winWidth = $(window).width();
    var $mediumBreakPoint = 544;

    if ($('.tooltip').hasClass('d-block')) {
        $('.tooltip').removeClass('d-block');
        return;
    }

    if ($winWidth < $mediumBreakPoint) {
        $('.tooltip').addClass('d-block');
    }
}); 

$('.info-icon.info-icon-bopis').on('mouseleave focusout', function (e) {
    if (e.type === 'focusout' || e.type === 'mouseleave') {
      e.stopPropagation();
      $('.tooltip').removeClass('d-block');
    }
});
