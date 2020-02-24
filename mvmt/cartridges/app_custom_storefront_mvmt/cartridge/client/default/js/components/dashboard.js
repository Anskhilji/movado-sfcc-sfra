'use strict';

module.exports = function () {

    $('.tab-bar-main').on('click', '.tab-bar-menu-open-btn', function () {
        $('.tab-bar-menu').addClass('dashboard-active');
    });

    $('.tab-bar-main').on('click', '.tab-bar-menu-close-btn > svg', function () {
        $('.tab-bar-menu').removeClass('dashboard-active');
    });
};