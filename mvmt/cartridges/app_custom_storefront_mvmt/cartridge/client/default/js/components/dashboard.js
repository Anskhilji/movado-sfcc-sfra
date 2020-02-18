'use strict';

module.exports = function () {

    $('.tab-bar-menu-open-btn').on('click', function () {
        $('.tab-bar-menu').addClass('dashboard-active');
    });

    $('.tab-bar-menu-close-btn > svg').on('click', function () {
        $('.tab-bar-menu').removeClass('dashboard-active');
    });
};
