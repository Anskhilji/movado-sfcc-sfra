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
            var $slideSourceSets = $(nextSlide).find('source');
            if ($slideSourceSets.length) {
                var $slideImage = $(nextSlide).find('img');
                $slideImage.attr('src', $($slideSourceSets[0]).data('lazy'))
            }
            $($slideSourceSets).each(function () {
                $(this).attr('srcset', $(this).data('lazy'));
            });
        });
    },
}