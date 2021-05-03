'use strict';
var pdpVideoLoaded = false;

function checkVideoStatus() {
    var $slideVideo = $('.slide-video');
    var firstVideoSlide = $slideVideo[0];
    if (firstVideoSlide && firstVideoSlide.readyState == '4') {
        $slideVideo.get(0).play();
        pdpVideoLoaded = true;
        var $primaryImagesContainer = $('.primary-images');
        var $zoomButtons = $primaryImagesContainer.find('.quickview.js-zoom-image, .zoom-icon');
        $zoomButtons.addClass('d-none');
        $primaryImagesContainer.find('.slick-slide.slick-current, .slick-slide.slick-current .carousel-tile, .slick-slide.slick-current .normal-zoom').addClass('cursor-context pointer-none');
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
                $imageSlide.addClass('cursor-context pointer-none');
                $primaryImagesContainer.find('.slick-slide.slick-current').addClass('cursor-context pointer-none');

            } else {
                $zoomButtons.removeClass('d-none');
                $imageSlide.removeClass('cursor-context pointer-none');
                $primaryImagesContainer.find('.slick-slide.slick-current').removeClass('cursor-context pointer-none');
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
                $imageSlide.addClass('cursor-context pointer-none');
                $primaryImagesContainer.find('.slick-slide.slick-current').addClass('cursor-context pointer-none');
            } else {
                $zoomButtons.removeClass('d-none');
                $imageSlide.removeClass('cursor-context pointer-none');
                $primaryImagesContainer.find('.slick-slide.slick-current').removeClass('cursor-context pointer-none');
            }
        });
    }
});