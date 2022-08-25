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
    
    $('.close-menu').on('click', '.close-button', function (e) {
        e.preventDefault();
        $('.dropdown-item-mvmt').removeClass('show');
        $('.mvmt-menu-group .sub-dropdown').removeClass('show');
        $('.menu-toggleable-left').removeClass('in');
        $('#overlay').hide();
    });

    $('.mvmt-menu-group .dropdown' ).click(function() {
        $(this).addClass('show');
    });
    
    $('.menu-icon-mvmt-hamburger').click(function() {
        $('.third-level-men-menu').addClass('show');
    });
    
    $('.third-level-menu-tab .btn' ).click(function() {
        var tablink = $(this).data('tab');
        $('.tab-content-submenu').removeClass('show');
        $('.third-level-menu-tab .btn').removeClass('active');
        $(''+tablink+'').addClass('show');
        $(this).addClass('active');
    });
    
    $(window).on('resize load',function () {
        var height = $(window).height()-212;

        var screenSize = $(window).width();
        var mobileScreenSize = 991;

        $('.mobile-menu .tab-content-submenu ul').height(height);

        if (screenSize <= mobileScreenSize) {
            $('.menu-right-aside').remove();
        }
    });

    
	$(document).ready(function() {
        $('.mobile-tabs-container').find('span:nth-child(1)').addClass('current');
        $('.mobile-tabs-container').find('.mobile-menu-tabs li:nth-child(2)').removeClass('current');
    
        $('ul.mobile-menu-tabs li').click(function() {
            var tab_id = $(this).attr('data-tab');
            $('ul.mobile-menu-tabs li').removeClass('current');
            $('.tab-content').removeClass('current');
            $(this).addClass('current');
            $('.'+tab_id).addClass('current');
        });
    });
};