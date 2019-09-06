'use strict';
$(document).ready(function() {
    $(window).on("resize", function () {
var width = $(".desktop-menu .navbar-nav").width();
        $(".desktop-menu .sub-dropdown .menu-content").width(width);
    }).resize();
});

$(".search-icon").click(function(){
    $(".desktop-search").slideDown("fast");
    $(".desktop-search .header-search-field").addClass("fadeIn animated delay-point-three");
});

$(".search-close").click(function(){
    $(".desktop-search").slideUp();
    $(".desktop-search .header-search-field").removeClass("fadeIn animated delay-point-three");
});

$(".desktop-menu .sub-dropdown").hover(
    function() {
        $(window).resize();
        $(this).find(".menu-pane").addClass("animated faster fadeInLeft delay-point-three");
        $(this).find(".featured-promotion").addClass("fadeIn animated delay-point-three");
        $(".overlay").addClass("fadeIn animated faster");
        $(this).find(".dropdown-menu").addClass("fadeIn fast animated");
        $(".shop-by-collection-slide .featured-promotion p").addClass('fadeInRight delay-point-five animated');

        $('.desktop-menu .shop-by-collection-slide .featured-promotion').slick({
            dots: true,
            infinite: true,
            speed: 300,
            slidesToShow: 6,
            slidesToScroll: 1,
            arrows: false,
            autoplay: true,
            centerPadding: '60px',
            responsive: [
                {
                  breakpoint: 1280,
                  settings: {
                    slidesToShow: 4,
                  }
                },
            ]
        });
    },

    function() {
        $(this).find(".menu-pane").removeClass("animated faster  fadeInLeft delay-point-three");
        $(this).find(".featured-promotion").removeClass("fadeIn animated delay-point-three");
        $(".overlay").removeClass("fadeIn animated faster");
        $(this).find(".dropdown-menu").removeClass("fadeIn fast animated");
        $('.desktop-menu .shop-by-collection-slide .featured-promotion').slick("unslick");
        $(".shop-by-collection-slide .featured-promotion p").removeClass('fadeInRight delay-point-five animated');
    }
);

$(".mobile-menu .close-button").click(function(){
    $(".mobile-menu").addClass("animated fadeOut delay-point-three");
    $(".multilevel-dropdown .nav-item > a").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    setTimeout(function(){
        $(".mobile-menu").removeClass("animated");
    },1000);
});

$(".navbar-toggler-custom").click(function(){
    setTimeout(function(){
        $(".multilevel-dropdown .nav-item > a").removeClass("fadeOutLeft fast animated").addClass("fadeInLeft fast animated");
        $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeOutLeft fast animated").addClass("fadeInLeft fast animated");
    },300);
    $(".mobile-menu").removeClass("animated delay-point-three fadeOut").addClass("animated");
});

$(".multilevel-dropdown .dropdown-toggle").click(function(){
    $(this).siblings(".dropdown-menu").addClass("animated faster fadeIn");
    $(this).siblings(".dropdown-menu").find(".dropdown-item a").addClass("animated fast fadeInLeft delay-point-three");
    $(this).siblings(".dropdown-menu").find(".shop-by-collection-slide p").addClass("animated fast fadeInUp delay-point-three");
});

$(document).on('click',".back", function(){
    $(".dropdown-menu .dropdown-item a").removeClass("animated fast fadeInLeft delay-point-three");

    $(".shop-by-collection-slide p").removeClass("animated fast fadeInUp delay-point-three");
    setTimeout(function(){

    },500);
    $(".dropdown-menu").removeClass("animated faster fadeIn");
});

$(document).on('click',".close-button", function(){
    $(".multilevel-dropdown .nav-item > a").removeClass("fadeInLeft fast animated delay-point-three").addClass("fadeOutLeft fast animated");
    $(".dropdown-menu .dropdown-item a").removeClass("animated fast fadeInLeft");
    $(".shop-by-collection-slide p").removeClass("animated fast fadeInUp delay-point-three");
    $(".dropdown-menu").removeClass("animated fadeIn");
});
