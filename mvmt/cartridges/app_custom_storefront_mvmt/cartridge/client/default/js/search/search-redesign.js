module.exports = {
    plpTileCarousel: function () {
        $('.plp-image-carousel').slick({
            slidesToShow: 1,
            slidesToScroll: 1,
            infinite: true,
            dots: true,
            arrows: false,
        });
    },
}