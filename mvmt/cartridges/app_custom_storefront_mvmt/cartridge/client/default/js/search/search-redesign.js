module.exports = {
    plpTileCarousel: function () {
        $('.plp-image-carousel').slick({
            lazyLoad: 'ondemand',
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: false,
            dots: true,
            arrows: false,
        });
    },
}