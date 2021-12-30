module.exports = {
    plpTileCarousel: function () {
        $('.product-grid .plp-image-carousel').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: false,
            dots: true,
            arrows: false,
        });

        $(document).on('beforeChange', '.product-grid .plp-image-carousel', function (event, slick, currentSlide, nextSlide) {
            var nextSlide = slick.$slides.get(nextSlide);
            var $slideSourceSets = $(nextSlide).find('source');
            $($slideSourceSets).each(function () {
                $(this).attr('srcset', $(this).data('lazy'));
            });
        });
    },
}