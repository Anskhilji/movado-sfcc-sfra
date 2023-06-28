'use strict';

module.exports = function () {
    $('.minicart').off('mouseenter focusin touchstart').on('mouseenter focusin touchstart', function () {
        if ($('.search:visible').length === 0) {
            return;
        }
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text(), 10);
        var windowWidth = $(window).width();
        var mediumWidth = 767;
        
        if (windowWidth > mediumWidth) {
            if (count !== 0 && $('.minicart .popover.show').length === 0) {
                $('.minicart .popover').addClass('show');
                $('.minicart .popover').spinner().start();
                $.ajax({
                    url: url,
                    method: 'GET',
                    success: function (data) {
                        if (data && data.redirectUrl) {
                            $('.minicart .popover').removeClass('show');
                            window.location.href = data.redirectUrl;
                        } else {
                            $('.minicart .popover').empty();
                            $('.minicart .popover').append(data);
                        }
                        $.spinner().stop();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        }
    });    
}

