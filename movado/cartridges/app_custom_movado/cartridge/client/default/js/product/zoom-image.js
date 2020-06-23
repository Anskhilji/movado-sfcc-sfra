var $zoomedImageContainer = $('.zoomedImage');
if($zoomedImageContainer.length > 0) {
    var $zoomedImage = $zoomedImageContainer.find('img');
    var $primaryImageCarousel = $('.primary-images .js-carousel');
    /* eslint-disable  new-cap, no-undef */
    var pinchZoom = PinchZoom;
    var pz = pinchZoom && new pinchZoom.default($zoomedImageContainer[0]);
    /* eslint-enable */
}

$('body').on('click', '.js-zoom-image', function (evt) {
    evt.preventDefault();
    var $activeImage = $primaryImageCarousel.find('.slick-active img');
    var imageUrl = matchMedia('(max-width: 991px)').matches ? $activeImage.data('zoom-mobile-url') : $activeImage.data('zoom-desktop-url');
    if ($zoomedImage.attr('src') !== imageUrl) {
        $zoomedImage.attr('src', imageUrl);
    }
});
