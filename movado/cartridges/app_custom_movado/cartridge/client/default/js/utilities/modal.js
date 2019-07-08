(function ($) {
    var $html = $('html');
    $('body').on('show.bs.modal', function () {
        $html.addClass('modal-is-open');
    }).on('hide.bs.modal', function () {
        $html.removeClass('modal-is-open');
    });
}(jQuery));
