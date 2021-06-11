module.exports = {
    plpTileCarousel: function () {
        $('.product-grid .plp-image-carousel').slick({
            lazyLoad: 'ondemand',
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: false,
            dots: true,
            arrows: false,
        });

        $(document).on('beforeChange', '.product-grid .plp-image-carousel', function (event, slick, currentSlide, nextSlide) {
            var nextSlide = slick.$slides.get(nextSlide);
            var $slideSoureSets = $(nextSlide).find('source');
            $($slideSoureSets).each(function () {
                $(this).attr('srcset', $(this).data('lazy'));
            });
        });
    },
}