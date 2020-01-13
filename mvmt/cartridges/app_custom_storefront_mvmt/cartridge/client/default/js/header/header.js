'use strict';
$(document).ready(function() {
    $('.new-header .dropdown-menu .dropdown-item:first-child').addClass('active');
    $('.submenu-control').hover(function(event) {
        var currentCategory = $(this).data('category');
        var activeSubMenu = $(".submenu").find("[data-parentcategory='" + currentCategory + "']");
        activeSubMenu.siblings('.submenu-container').addClass('d-none');
        activeSubMenu.removeClass('d-none');
    });
});

$(".desktop-search-icon").click(function(){
    $(this).toggleClass('active');
    $('.desktop-side-search').toggleClass('desktop-search-active');
    $('.header-search-field').focus();
});

$('.header-mobile-categories .header-mobile-category').click(function() {
    var menuText = $(this).find('.header-mobile-category-text').attr('data-trigger-menu');
    $(this).toggleClass('active');

    if ($(this).hasClass('active')) {
        var siblingmenuText = $(this).siblings().find('.header-mobile-category-text').attr('data-trigger-menu');
        $(this).siblings().removeClass('active');
        $(this).siblings().find('.header-mobile-category-text').text(siblingmenuText);
        $(this).find('.header-mobile-category-text').text('+');
    } else {
        $(this).find('.header-mobile-category-text').text(menuText);
    }
});

/* $(".header-search-field").focusin(function(){
    $('.search-recomendation').fadeIn();
    if (!$(".header-search-field").val()) { 
        $(".search-recomendation").fadeIn();
        console.log("this is empaty")
    } else{
        $(".search-recomendation").fadeOut();
    }
}); */

$(".header-search-field").focusout(function(){
    if (!$(".header-search-field").val()) {
        $(".search-recomendation").fadeIn();
        console.log("this is empaty")
    } else {
        $(".search-recomendation").fadeOut();
    }
});

$('.header-search-field').on('change keypress paste keyup', function() {
    $(".search-recomendation").fadeOut();

    setTimeout(function(){
        if (!$(".header-search-field").val()) {
            $(".search-recomendation").fadeIn();
        } else {
            $(".search-recomendation").fadeOut();
        }
    }, 1000);
});

$('.new-header .dropdown-menu .dropdown-item').hover(function() {
    $('.new-header .dropdown-menu .dropdown-item').removeClass('active');
    $(this).addClass('active');
});


if ($(".header-search-field").is(':empty')) {
    $(".search-recomendation").show();
}


