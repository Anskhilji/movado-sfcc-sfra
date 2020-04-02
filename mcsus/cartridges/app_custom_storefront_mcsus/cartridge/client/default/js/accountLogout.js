module.exports = function () {
    $('.mcs-account-name').click(function() {
        $(this).addClass('mcs-show');
    });

    $('.navbar-nav').on('click', '.close-button, .back', function (e) {
        e.preventDefault();
        $('.navbar-nav').find('.mcs-show').removeClass('mcs-show');
    });
}

