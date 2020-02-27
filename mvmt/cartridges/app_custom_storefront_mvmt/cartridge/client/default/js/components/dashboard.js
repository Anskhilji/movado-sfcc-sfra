'use strict';

module.exports = function () {

    $(window).scroll( function (event) {
        var $headerSize = $('.header-menu-wrapper').height();
        var $headerBannerSize = $('.account-dashboard-banner').height();
        var $totalHeaderSize = $headerBannerSize - 30;
        if (!$('.tab-bar-menu').hasClass('dashboard-active')) {
            if ($(this).scrollTop() > $totalHeaderSize) {
                $headerSize = parseInt($headerSize) === 0 ? $('.sticky-header-wrapper').height() : $headerSize;
                $('.tab-bar-main').addClass('account-dashboard-tab-sticky');
                $('.tab-bar-main').css('top', $headerSize);
            } else {
                $('.tab-bar-main').removeClass('account-dashboard-tab-sticky');
                $('.tab-bar-main').css('top', '');
            }
        } else {
            $('.tab-bar-main').removeClass('account-dashboard-tab-sticky');
            $('.tab-bar-main').css('top', '');
        }
    });

    $('.tab-bar-main').on('click', '.tab-bar-menu-open-btn', function () {
        $('.tab-bar-menu').addClass('dashboard-active');
        $('.tab-bar-main').removeClass('account-dashboard-tab-sticky');
        $('.tab-bar-main').css('top', '');
    });

    $('.tab-bar-main').on('click', '.tab-bar-menu-close-btn > svg', function () {
        var $headerSize = $('.sticky-header-wrapper').height();
        if (window.pageYOffset > $headerSize) {
            $('.tab-bar-main').addClass('account-dashboard-tab-sticky');
            $('.tab-bar-main').css('top', $headerSize);
        }
        $('.tab-bar-menu').removeClass('dashboard-active');
    });
};
