'use strict';
var pdpVideoLoaded = false;

function checkVideoStatus() {
    var $slideVideo = $('.slide-video');
    var firstVideoSlide = $slideVideo[0];
    if (firstVideoSlide && firstVideoSlide.readyState == '4') {
        if ($slideVideo.get(0).paused) {
            $slideVideo.get(0).play();
        }
        pdpVideoLoaded = true;
        $slideVideo.removeClass('d-none');
        clearInterval(videoStatusChecker);
    } else if (document.readyState == 'complete') {
        clearInterval(videoStatusChecker);
    }
}

var videoStatusChecker = setInterval(function () {
    checkVideoStatus();
}, 3000);


$(document).ready(function () {
    var $slideVideo = $('.slide-video');
    if ($slideVideo.length > 0) {
        if (document.documentMode && document.documentMode != 'undefined') {
            $slideVideo.addClass('slide-video-ie');
        }
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
    }
});