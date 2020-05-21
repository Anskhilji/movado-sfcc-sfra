'use strict';
$(document).ready(function() {
    $('.new-header .dropdown-menu .dropdown-item:first-child').addClass('active');
    $('.submenu-control').hover(function(event) {
        $(this).parent().find('.submenu-control').removeClass('active');
        $(this).addClass('active');
        var $currentCategory = $(this).data('category');
        var $activeSubMenu = $('.submenu').find("[data-parentcategory='" + $currentCategory + "']");
        $activeSubMenu.siblings('.submenu-container').addClass('d-none').removeClass('active');
        $activeSubMenu.removeClass('d-none').addClass('active');
    });
});

$('.desktop-search-icon').click(function() {
    $('.desktop-side-search').addClass('desktop-search-active');
    $('.desktop-side-search .header-search-field').focus();
    $('body').addClass('search-suggestion-model-open');
    $('.mobile-side-search').addClass('active');
    $('.mobile-side-search .header-search-field').focus();
    var $stickyHeader = $('.sticky-header-wrapper');
    if ($stickyHeader.hasClass('fixed-header')){
        $(".search-input-field").addClass('search-input-field-remove');
    } else {
        $(".search-input-field").addClass('search-input-field-add');
    }
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
    $('body').addClass('search-suggestion-model-open');
});

$(window).on("load resize", function(e) {
    var $navWidth = $('header .nav-right').width();
    $('.mobile-search-close').width($navWidth);
});

$('.mobile-search-close-text').click(function() {
    $('.mobile-side-search').removeClass('active');
    $('body').removeClass('search-suggestion-model-open');
});

$('.mobile-nav .mobile-subnav-btn').click(function() {
    $(this).toggleClass('active');
});

$('.clear-text-img').click(function() {
    $(".search-input-field").val('');
});

$('.desktop-search-close-text').click(function() {
    $('.desktop-side-search').removeClass('desktop-search-active');
    $('body').removeClass('search-suggestion-model-open');
    var $stickyHeader = $('.sticky-header-wrapper');
    if ($stickyHeader.hasClass('fixed-header')){
        $(".search-input-field").removeClass('search-input-field-remove');
    } else {
        $(".search-input-field").removeClass('search-input-field-add');
    }
});

$('.header-search-field').focusout(function() {
    if (!$('.header-search-field').val()) {
        $('.search-recomendation').fadeIn();
    } else {
        $('.search-recomendation').fadeOut();
    }
});

$(".mobile-search-field").keydown(function() { 
    if($(this).length && $(this).val().length) {
        $(".header-search-field").addClass('header-search-field-add');
    } else {
        $(".header-search-field").addClass('header-search-field-remove');
    }
    
});
$(window).on('load resize', function() {
    var $headerHeight = $('.new-header').height();
    $('.mobile-nav').css('top', $headerHeight + 'px');
});
$('.dropdown-menu').on('click', '.submenu-container.active .tab-list button', function() {
    var t = $(this).data('tab');
    $('.submenu-container.active .tab-list button').removeClass('active');
    $(this).addClass('active');

    $('.submenu-container.active .tab-content-list').removeClass('active');
    $('.submenu-container.active .'+ t +'').addClass('active');
});


$('.desktop-menu .sub-dropdown').hover(function() {
    $('#overlay, .overlay').addClass('active');
  },
  function(){
    $('#overlay, .overlay').removeClass('active');
});