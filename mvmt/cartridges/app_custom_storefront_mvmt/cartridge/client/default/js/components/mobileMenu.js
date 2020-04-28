'use strict';

module.exports = function () {
    $('.navbar-nav').on('click', '.back-menu', function (e) {
        e.preventDefault();
        $('.mvmt-menu-group .sub-dropdown').removeClass('show');
    });

    $('.navbar-nav').on('click', '.back-submenu', function (e) {
        e.preventDefault();
        $('.dropdown-item-mvmt').removeClass('show');
    });

    $(".mvmt-menu-group .dropdown" ).click(function() {
        $(this).addClass('show');
    });
    
    $(".third-level-menu-tab .btn" ).click(function() {
        var tablink = $(this).data('tab');
        $('.tab-content').removeClass('show');
        $('.third-level-menu-tab .btn').removeClass('active');
        $(''+tablink+'').addClass('show');
        $(this).addClass('active');
    });
    
};
