var $mobileMenuGroup = $('.main-menu-mobile .menu-group');

$('body').on('focus, keydown', ".search-field:visible", function (e) {
    if ($(this).val().length > 0) {
        $(".search-recomendation").fadeOut();
        $('.search-recomendation-sidebar').fadeOut();
        $mobileMenuGroup.removeClass('d-none'); 
    } else {
        $(".search-recomendation").fadeIn();
        $('.search-recomendation-sidebar').fadeIn();
        $mobileMenuGroup.addClass('d-none');
        $mobileMenuGroup.hide();
    }
});
$('.search-field-home').on('click', function (e) {
    if ($(this).val() === '') {
        $('.search-recomendation-sidebar').css('visibility', 'hidden');
        $(".search-recomendation").css('visibility', 'visible');
        $(".search-field").css('border-radius', '3px 3px 0 0');
        $(".search-recomendation").fadeIn();
        $mobileMenuGroup.hide();
        e.stopPropagation();
    }
});

$('.search-field-menu').on('click', function (e) {
    if ($(this).val() === '') {
        $('.search-recomendation').css('visibility', 'hidden');
        $('.search-recomendation-sidebar').css('visibility', 'visible');
        $('.search-field').css('border-radius', '3px 3px 0 0');
        $('.search-recomendation').fadeIn();
        $mobileMenuGroup.hide();
        e.stopPropagation();
    }
});

// If you move your mouse away from the search flyout, the search flyout closes
$('.search').on('mouseleave', function(){
    $('.search-recomendation').hide();
    $('.search-recomendation-sidebar').hide();
    $mobileMenuGroup.removeClass('d-none'); //if we need search on mobile
    $(this).focusout();
});
$('.search-recomendation').on('mouseenter', function(e){
    $('.search').unbind("mouseleave");
});
$('.search-recomendation').on('mouseleave', function(e){
    $('.search').on('mouseleave', function(){
        $('.search-recomendation').hide();
        $mobileMenuGroup.show();
        $(this).focusout();
    });
});
// end


$('body').on('click', function (e) {
    $(".search-recomendation").fadeOut();
    $(".search-field").css('border-radius', '3px');
    $('.menu-group').show();
});
$('.navbar-nav').on('click', '.close-button', function (e) {
    $('.modal-background').removeClass('popup-modal');
});
$('.navbar-toggler').click(function (e) {
    $('.modal-background').addClass('popup-modal');
});

// 2220
$('.home-search input').focus(function () {
    $('.home-search').addClass('active');
}).blur(function () {
    $('.home-search').removeClass('active');
});

$('.menu-search input').focus(function () {
    $('.menu-search').addClass('active');
}).blur(function () {
    $('.menu-search').removeClass('active');
});

// overlayey show on on hover for nav-item
$('.nav-item.dropdown').hover(function() {
    $('body').find('.dropdown-overlayer').addClass('active');
}, function() {
    $('body').find('.dropdown-overlayer').removeClass('active');
});

if(!$('.dropdown-best-Seller > .mcs-product-carousel-redesign').length > 0) {
    $('.category-level').addClass('bestseller-disable');
    $('.level-two').addClass('column-three');
    $('.dropdown-best-Seller').hide();
}


$('.new-hamburger').on('click', function (e) {
    $('body').css('overflow','hidden');
    $('.new-header-deign,.sticky-header-wrapper').removeClass('fixed-header')
});

$(document).on('click', '.close-button, .close-icon', function(e) {
    $('body').removeAttr('style');
    $('.new-header-deign,.sticky-header-wrapper').addClass('fixed-header')
});

$(document).ready(function(e) {

    var $slickCarouselSlider = $('.dropdown-best-Seller .js-carousel');

    // Get the data value from the data-carousel-config attribute
    var $slickCarouselConfig = $slickCarouselSlider.data('carousel-config');
    
    // Convert the data value to an object
    $slickCarouselConfig = JSON.stringify($slickCarouselConfig);
    $slickCarouselConfig = JSON.parse($slickCarouselConfig);

    // Reinitialize the slider with the new configuration
    $('.nav-item.dropdown').on('mouseenter', function(){
        // Unslick the slider to reset the configuration
        $slickCarouselSlider.slick('unslick');
        // Reinitialize the slider to reset the configuration
        $slickCarouselSlider.slick($slickCarouselConfig);
    });
});