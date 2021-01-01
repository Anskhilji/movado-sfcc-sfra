'use strict';
$(document).ready(function() {
    $(window).on("resize", function () {
        var width = $(".desktop-menu .navbar-nav").width();
        $(".desktop-menu .sub-dropdown .menu-content").width(width);
    }).resize();
    if (!$(".minicart").is(":visible")) {
        $('header.new-header .user .popover').addClass('popover-cart-icon-hidden');
    }
});
$('.minicart .popover').keyup(function(event) {
    if (event.key === 'Escape') {
        $('.minicart .popover').removeClass('show');
    }
});

$(".search-icon").click(function(e){
    $(".desktop-search").slideDown("fast");
    $(".header-search-field").val("");
    $(".search-recomendation").fadeIn();
    $(".desktop-search .header-search-field").addClass("fadeIn animated delay-point-three");
    $(".desktop-search .category-slot a").addClass("fadeInLeft animated delay-point-three");
    $(".desktop-search .product").addClass("fadeIn animated delay-point-three");
    $(".modal-background").addClass("show-overlay").fadeIn();
    $(".desktop-search input").focus();
    e.preventDefault();
});

function remove_grayout (){
    $(".desktop-search").slideUp();
    $(".desktop-search .category-slot a").removeClass("fadeInLeft animated delay-point-three");
    $(".desktop-search .product").removeClass("fadeIn animated delay-point-three");
    $(".desktop-search .header-search-field").removeClass("fadeIn animated delay-point-three");

    $(".modal-background").removeClass("show-overlay").fadeOut();
    $(".modal-background").removeClass("d-block").fadeOut();
    $(".mobile-menu .nav-item > a").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    setTimeout(function(){
        $(".mobile-menu").removeClass("in");
        $(".mobile-menu").addClass("fadeOut");
    },500);
    setTimeout(function(){
        $(".mobile-menu").removeClass("animated");
    },1000);
}
$(".search-close").click(function(){
    remove_grayout();
    e.preventDefault();
});

const $menu = $('.search-icon, .desktop-search, .desktop-menu, .mobile-menu, .navbar-toggler-custom, .refinement-bar, .filter-btn');
$(document).mouseup(e => {

    if (!$menu.is(e.target) // if the target of the click isn't the container...
    && $menu.has(e.target).length === 0) // ... nor a descendant of the container
    {
        remove_grayout();
    }
  });

$(".desktop-menu .sub-dropdown").hover(
    function() {
        $(window).resize();
        $(this).find(".menu-pane").addClass("animated faster fadeInLeft delay-point-three");
        $(this).find(".featured-promotion").addClass("fadeIn animated delay-point-three");
        $(".overlay").addClass("fadeIn animated faster");
        $(this).find(".dropdown-menu").addClass("fadeIn fast animated show");
        $(".shop-by-collection-slide .featured-promotion p").addClass('fadeInRight delay-point-five animated');
        var leftmargin = $(".header-menu-wrapper .desktop-menu > div").position().left - 15;
        $(".desktop-menu .sub-dropdown .menu-content").css("margin-left", leftmargin + "px");
        $('.slick-slider').slick("refresh");

        $('.desktop-menu .shop-by-collection-slide .featured-promotion').slick({
            dots: true,
            infinite: true,
            speed: 300,
            slidesToShow: 6,
            slidesToScroll: 1,
            arrows: true,
            autoplay: true,
            centerPadding: '60px',
            responsive: [
                {
                    breakpoint: 4000,
                    settings: {
                        slidesToShow: 10,
                    }
                },
                {
                    breakpoint: 3000,
                    settings: {
                        slidesToShow: 8,
                    }
                },
                {
                    breakpoint: 2500,
                    settings: {
                        slidesToShow: 6,
                    }
                },
                {
                    breakpoint: 1500,
                    settings: {
                        slidesToShow: 4,
                    }
                }
            ]
        });

        var imagesLength = $(this).find('.movado-header-dropdown .featured-promotion a img').length;
        if (imagesLength > 3) {
            $(this).find('.movado-header-dropdown .featured-promotion .header-tiles').slick({
                dots: true,
                infinite: true,
                speed: 300,
                slidesToShow: 3,
                slidesToScroll: 1,
                arrows: false,
                autoplay: false,
            });
        }
    },

    function() {
        $(this).find(".menu-pane").removeClass("animated faster  fadeInLeft delay-point-three");
        $(this).find(".featured-promotion").removeClass("fadeIn animated delay-point-three");
        $(".overlay").removeClass("fadeIn animated faster");
        $(this).find(".dropdown-menu").removeClass("fadeIn fast animated show");
        $('.desktop-menu .shop-by-collection-slide .featured-promotion').slick("unslick");
        $(".shop-by-collection-slide .featured-promotion p").removeClass('fadeInRight delay-point-five animated');
    }
);

function hideCollectionSlider(container){
    $('.desktop-menu .shop-by-collection-slide .featured-promotion').slick("unslick");
    $(container).find(".featured-promotion").removeClass("fadeIn animated delay-point-three");
    $(".shop-by-collection-slide .featured-promotion p").removeClass('fadeInRight delay-point-five animated');
}

function showCollectionSlider(container){
    $(".shop-by-collection-slide .featured-promotion p").addClass('fadeInRight delay-point-five animated');
    $('.slick-slider').slick("refresh");
    $(container).find(".featured-promotion").addClass("fadeIn animated delay-point-three");
    $('.desktop-menu .shop-by-collection-slide .featured-promotion').slick({
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: 6,
        slidesToScroll: 1,
        arrows: true,
        autoplay: true,
        centerPadding: '60px',
        responsive: [
            {
                breakpoint: 4000,
                settings: {
                    slidesToShow: 10,
                }
            },
            {
                breakpoint: 3000,
                settings: {
                    slidesToShow: 8,
                }
            },
            {
                breakpoint: 2500,
                settings: {
                    slidesToShow: 6,
                }
            },
            {
                breakpoint: 1500,
                settings: {
                    slidesToShow: 4,
                }
            }
        ]
    });
}
$(".desktop-menu .sub-dropdown").keydown(function(e) {
    switch(e.which) {
        case 37: // left
        break;

        case 38: // up
            hideCollectionSlider(this);
        break;

        case 39: // right
        break;

        case 40:
            showCollectionSlider(this);
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});


$(".mobile-menu .close-button").click(function(){
    $(".mobile-menu").addClass("animated fadeOut delay-point-three");
    $(".mobile-menu .nav-item > a").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    setTimeout(function(){
        $(".mobile-menu").removeClass("animated");
    }, 1000);

    setTimeout(function(){
        $(".modal-background").removeClass("d-block").fadeOut();
    }, 300);
});

$(".navbar-toggler-custom").click(function(){
    setTimeout(function(){
        $(".mobile-menu .nav-item > a").removeClass("fadeOutLeft fast animated").addClass("fadeInLeft fast animated");
        $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeOutLeft fast animated").addClass("fadeInLeft fast animated");
    },300);
    $(".dropdown-menu .dropdown-item a").removeClass("fadeOutLeft").addClass("animated fast fadeInLeft");
    $(".modal-background").addClass("d-block").fadeIn();
    $(".mobile-menu").removeClass("animated delay-point-three fadeOut").addClass("animated");
    $('.slick-slider').slick("refresh");
});

$(document).on('click',".back", function(){
    $(".dropdown-menu .dropdown-item a").removeClass("animated fast fadeInLeft delay-point-three");

    $(".shop-by-collection-slide p").removeClass("animated fast fadeInUp delay-point-three");
    setTimeout(function(){

    },500);
    
    $(".dropdown-menu").removeClass("animated faster fadeIn");
});

$(document).on('click',".close-button", function(){
    $(".mobile-menu").addClass("animated fadeOut delay-point-three");
    $(".mobile-menu .nav-item > a").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");

    setTimeout(function(){
        $(".mobile-menu").removeClass("animated");
    }, 1000);

    setTimeout(function(){
        $(".modal-background").removeClass("d-block").fadeOut();
    }, 300);

    setTimeout(function(){
        $(".dropdown-menu").removeClass("animated fadeIn");
        $(".mobile-menu .nav-item > a").removeClass("fadeInLeft fast animated delay-point-three").addClass("fadeOutLeft fast animated");
        $(".dropdown-menu .dropdown-item a").removeClass("animated fast fadeInLeft");
        $(".shop-by-collection-slide p").removeClass("animated fast fadeInUp delay-point-three");
    }, 500);

});
$(document).on('click',".dropdown-toggle", function(){
    $('.slick-slider').slick("refresh");
});

$(window).on("load resize scroll", function(e) {

});

$('.header-search-field').on('change keypress paste keyup', function() {
    $(".search-recomendation").fadeOut();
    
    setTimeout(function(){
        if (!$(".header-search-field").val()) { 
            $(".search-recomendation").fadeIn();
        }else{
            $(".search-recomendation").fadeOut();
        }
    },1000);
});

if ($(".header-search-field").is(':empty')) { 
    $(".search-recomendation").show();
}

$(".new-header .multilevel-dropdown .dropdown-toggle").click(function(){
    $(this).siblings(".dropdown-menu").addClass("animated faster fadeIn");
    $(this).siblings(".dropdown-menu").find(".dropdown-item a").removeClass('fadeOutLeft');
    $(this).siblings(".dropdown-menu").find(".dropdown-item a").addClass("animated fast fadeInLeft delay-point-three");
    $(this).siblings(".dropdown-menu").find(".shop-by-collection-slide p").addClass("animated fast fadeInUp delay-point-three");
 
    $(".slick-slider").resize();
});

$(document).ready(function() {
    $(".navbar-toggler-custom").click(function(){
        $(".slick-slider").resize();
    });
    $('.mobile-menu .movado-header-dropdown .header-tiles').slick({
        dots: true,
        infinite: true,
        speed: 300,
        slidesToShow: 2,
        slidesToScroll: 1,
        arrows: false,
        autoplay: false,
        centerPadding: '60px',
    });

    var hoverTimeout; 
    $('.desktop-menu .sub-dropdown').mouseenter(function () {

        hoverTimeout = setTimeout(function () {
        $(".modal-background").addClass("show-overlay").fadeIn();
        }, 200);
    }).mouseleave(function () {
        clearTimeout(hoverTimeout);
        $(".modal-background").removeClass("show-overlay").fadeOut();
    });

 });

$(document).ready(function(event) {
    renderRecommendationSlots();
    $('.mobile-menu .submenu-recommendations .html-slot-container ').parent().removeClass('w-75');
});

function renderRecommendationSlots() {
    if (document.readyState === 'complete') {
        $('.desktop-menu .trending-category-recommendation').each( function() {
            attachCarousel(this, 3);
        });
    } else {
        setTimeout(function() {
            renderRecommendationSlots(); 
        }, 3000);
    }
}

function attachCarousel(selector, minimumTiles) {
    var availableTiles = $(selector).find('.carousel-tile').length;
    cloneRecommendationSlot(selector);
    if(availableTiles > minimumTiles) {
        window.slickSlider.initCarousel($(selector));
    } else {
        $(selector).find('.cs-carousel').addClass('d-flex');
        $(selector).find('.cs-carousel').slick('unslick');
    }
}

function cloneRecommendationSlot(selector) {
    var recommendationSlot = $(selector).parent();
    $('#sg-navbar-collapse.mobile-menu .submenu-recommendations').removeClass('w-75');
    recommendationSlot.find(selector).clone().appendTo('#sg-navbar-collapse.mobile-menu #' + recommendationSlot.attr('id'));
    window.slickSlider.initCarousel($('#sg-navbar-collapse.mobile-menu #' + recommendationSlot.attr('id') + ' .trending-category-recommendation'));
}

 
