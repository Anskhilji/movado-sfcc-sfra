'use strict';
var pdpVideoLoaded = false;
function checkPdpVideoStatus() {
    var $slideVideo = $('.slide-video');
    $slideVideo.on('loadeddata', function () {
        pdpVideoLoaded = true;
        $slideVideo.removeClass('d-none');
    });
}

$(document).ready(function () {
    checkPdpVideoStatus();

    $('.primary-images .slick-arrow, .primary-images .slick-dots').on('click', function (event) {
        var $primaryImagesContainer = $('.primary-images');
        var $videoSlide = $primaryImagesContainer.find('.slick-slide.slick-current .slide-video');
        var $zoomButtons = $primaryImagesContainer.find('.quickview.js-zoom-image, .zoom-icon');
        var $imageSlide = $primaryImagesContainer.find('.slick-slide.slick-current .carousel-tile, .slick-slide.slick-current .normal-zoom');
        if ($videoSlide.length > 0 && pdpVideoLoaded) {
            $zoomButtons.addClass('d-none');
            $imageSlide.css('pointer-events','none');
        } else {
            $zoomButtons.removeClass('d-none');
            $imageSlide.css('pointer-events','');
        }
    });

    $('.primary-images .js-carousel').on('beforeChange', function (event, slick, currentSlide, nextSlide) {
        var $primaryImagesContainer = $('.primary-images');
        var $nextSlide = $(slick.$slides[nextSlide]);
        var $videoSlide = $nextSlide.find('.slide-video');
        var $imageSlide = $nextSlide.find('.carousel-tile, .normal-zoom');
        var $zoomButtons = $primaryImagesContainer.find('.quickview.js-zoom-image, .zoom-icon');
        if ($videoSlide.length > 0 && pdpVideoLoaded) {
            $zoomButtons.addClass('d-none');
            $imageSlide.css('pointer-events','none');
        } else {
            $zoomButtons.removeClass('d-none');
            $imageSlide.css('pointer-events','');
        }
    });
});