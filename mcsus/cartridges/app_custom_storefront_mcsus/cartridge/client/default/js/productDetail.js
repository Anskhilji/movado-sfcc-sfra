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
var yotpoReview = '#yotpo-reviews-top-div'
if(location.hash && location.hash == yotpoReview) {
    $('.reviews-accordion').removeClass('collapsed');
    $('.accordion-reviews').addClass('show');
}

// click
$('.rating-box-redisgn').on('click', function() {
    $('.reviews-accordion').removeClass('collapsed');
    $('.accordion-reviews').addClass('show');
    $(document).scrollTop('.accordion-reviews');
});

$('.accordion-redesign .reviews-accordion .ratings').on('click', function () {
    $([document.documentElement, document.body]).stop().animate({
        scrollTop: $('#accordionPdpMcs').offset().top
    }, 1000);
});
// rating redirect to rating section
$('.pdp-rating-reviews').click(function(){
    $('html, body').animate({
      scrollTop: $('.main-widget').offset().top
    }, 1000);
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
