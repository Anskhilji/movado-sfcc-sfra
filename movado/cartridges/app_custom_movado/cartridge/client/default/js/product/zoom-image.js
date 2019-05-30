$('body').on('click', '.js-zoom-image', function (e) {
    e.preventDefault();

    var $zoomEl;
    var pinchZoom;

    var $productImage = $('.primary-images .carousel-item.active').find('img'),
        mobileImageUrl = $productImage.data('zoom-mobile-url'),
        desktopImageUrl = $productImage.data('zoom-desktop-url'),
        imageAlt = $productImage.attr('alt');

    $('#zoomProduct .modal-body').html('<div class="pinchZoom"></div>');
    $('#zoomProduct .modal-body .pinchZoom').html(
        '<picture>'
        + '<source media="(min-width: 992px)" srcset="' + desktopImageUrl + '"/>'
        + '<source media="(max-width: 991px)" srcset="' + mobileImageUrl + '"/>'
        + '<img alt="' + imageAlt + '" src="' + mobileImageUrl + '"/>'
        + '</picture>'
    );

    $zoomEl = document.querySelector('#zoomProduct .pinchZoom');

    $('#zoomProduct').on('shown.bs.modal', function () {
        pinchZoom = new PinchZoom.default($zoomEl);
    });

    $('#zoomProduct').on('hide.bs.modal', function () {
        pinchZoom = null;
    });
});
