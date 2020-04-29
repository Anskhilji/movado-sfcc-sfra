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
    
    $('.menu-icon-mvmt-hamburger').click(function() {
        $('.third-level-men-menu').addClass('show');
    });
    
    $(".third-level-menu-tab .btn" ).click(function() {
        var tablink = $(this).data('tab');
        $('.tab-content').removeClass('show');
        $('.third-level-menu-tab .btn').removeClass('active');
        $(''+tablink+'').addClass('show');
        $(this).addClass('active');
    });
    
    $(window).on('resize load',function () {
        var height = $(window).height()-212;
        $('.tab-content ul').height(height);
    });
    
};
