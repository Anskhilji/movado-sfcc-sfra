'use strict';
$(document).ready(function() {
    $('.new-header .dropdown-menu .dropdown-item:first-child').addClass('active');
    $('.submenu-control').hover(function(event) {
        $(this).parent().find('.submenu-control').removeClass('active');
        $(this).addClass('active');
        var $currentCategory = $(this).data('category');
        var $activeSubMenu = $('.submenu').find("[data-parentcategory='" + $currentCategory + "']");
        $activeSubMenu.siblings('.submenu-container').addClass('d-none');
        $activeSubMenu.removeClass('d-none');
    });
});

$('.desktop-search-icon').click(function() {
    $(this).toggleClass('active');
    $('.desktop-side-search').toggleClass('desktop-search-active');
    $('.desktop-side-search .header-search-field').focus();
});

$('.header-mobile-categories .header-mobile-category').click(function() {
    var $menuText = $(this).find('.header-mobile-category-text').data('trigger-menu');
    $(this).toggleClass('active');
    $('.mobile-nav .mobile-category-list').removeClass('active');
    $('.mobile-nav, #overlay').addClass('active');
    $('.mobile-nav').find("[data-mobile-category='" + $menuText + "']").addClass('active');

    if ($(this).hasClass('active')) {
        var $siblingmenuText = $(this).siblings().find('.header-mobile-category-text').data('trigger-menu');
        $(this).siblings().removeClass('active');
        $(this).siblings().find('.header-mobile-category-text').text($siblingmenuText);
        $(this).find('.header-mobile-category-text').text('+');
    } else {
        $(this).find('.header-mobile-category-text').text($menuText);
        $('.mobile-nav .mobile-category-list').removeClass('active');
        $('.mobile-nav, #overlay').removeClass('active');
    }
});

$('#overlay').click(function() {
    $('.mobile-nav, #overlay').removeClass('active');
    var $menuText = $('.header-mobile-categories .active .header-mobile-category-text').data('trigger-menu');
    $('.header-mobile-categories .active .header-mobile-category-text').text($menuText);
    $('.header-mobile-categories .header-mobile-category').removeClass('active');
});

$('.mobile-search-button').click(function() {
    var $navWidth = $('header .nav-right').width();
    $('.mobile-search-close').width($navWidth);
    $('.mobile-side-search').addClass('active');
    $('.mobile-side-search .header-search-field').focus();
});

$(window).on("load resize", function(e) {
    var $navWidth = $('header .nav-right').width();
    $('.mobile-search-close').width($navWidth);
});

$('.mobile-search-icon').click(function() {
    $('.mobile-side-search').removeClass('active');
});

$('.mobile-nav .mobile-subnav-btn').click(function() {
    $(this).toggleClass('active');
});

$('.header-search-field').focusout(function() {
    if (!$('.header-search-field').val()) {
        $('.search-recomendation').fadeIn();
    } else {
        $('.search-recomendation').fadeOut();
    }
});

$(window).on('load resize', function() {
    var $headerHeight = $('.new-header').height();
    $('.mobile-nav').css('top', $headerHeight + 'px');
});
