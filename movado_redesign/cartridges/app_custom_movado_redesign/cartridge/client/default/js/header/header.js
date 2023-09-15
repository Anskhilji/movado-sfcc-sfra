'use strict';
$(document).ready(function() {
    $(window).on("resize", function () {
        var width = $(".desktop-menu .navbar-nav").width();
        $(".desktop-menu .sub-dropdown .menu-content").width(width);
    }).resize();
    if (!$(".minicart").is(":visible")) {
        $('header.new-header .user .popover').addClass('popover-cart-icon-hidden');
    }

    // Custom:MSS-2083 Header tranparent
    var $divOffsetTop = $('.banner-view-port').offset().top;

    if (!$('.banner-view-port').isOnScreen()) { // if on load banner is not in viewPort show 
        if ($(window).scrollTop() > $divOffsetTop) {
            $('.home-header-transparent').removeClass('transparent-header');
        }
    }

     $(window).scroll(function () {
        var $headerViewPort = $('.banner-view-port').isOnScreen();
        if ($headerViewPort) { // check if  banner is on screen
            $('.home-header-transparent').addClass('transparent-header');// both bottom and top will hidde
        } else {
            $('.home-header-transparent').removeClass('transparent-header');
        }
    });
});

$.fn.isOnScreen = function () {
    var $win = $(window);
    var $viewport = {
        top: $win.scrollTop(),
        left: $win.scrollLeft()
    };
    $viewport.right = $viewport.left + $win.width();
    $viewport.bottom = $viewport.top + $win.height();
    var $bounds = this.offset();
    $bounds.right = $bounds.left + this.outerWidth();
    $bounds.bottom = $bounds.top + this.outerHeight();
    return (!($viewport.right < $bounds.left || $viewport.left > $bounds.right || $viewport.bottom < $bounds.top || $viewport.top > $bounds.bottom));
};

$('.minicart .popover').keyup(function(event) {
    if (event.key === 'Escape') {
        $('.minicart .popover').removeClass('show');
    }
});

$('.first-level-category').hover(
    
    function(){
        $('.second-level-sec').removeClass('active');
        $(this).addClass('active');
        $(this).siblings('.second-level-sec').addClass('active');
        $(this).closest('.first-category').addClass('change-color');
        $('.second-level-sec .second-category .second-level').addClass('fadeInLeft fast animated');
    }
);

$('.first-levels-items-category').click(function(){
    $('.second-levls-section').removeClass('active fadeIn animated fast');
    var $categoryId = $(this).data('id');

    $('.second-levls-section').each(function () {
        var $subCategoryContainer = $(this).data('sub-id');
        if ($categoryId == $subCategoryContainer) {
            $(this).addClass('active fadeIn animated fast');
            return;
        }
    });

    $('.mobile-container').removeClass('fadeIn animated fast');
    $('.mobile-accounts').addClass('d-none');
});

$('.back-btn').click(function(){
    $('.second-levls-section').removeClass('active fadeIn animated fast');
    $('.mobile-container').addClass('fadeIn animated fast')
    $('.second-levls-section').fadeOut();
    $('.mobile-container').fadeIn();
    $('.mobile-accounts').removeClass('d-none');
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
    // Custom:MSS-2083 add class when open search
    $(".home-header-transparent").addClass("solid-header");    
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
    },200);
    setTimeout(function(){
        $(".mobile-menu").removeClass("animated");
    },200);
    
    // Custom:MSS-2083 
    setTimeout(function(){
        $(".home-header-transparent").removeClass("solid-header"); 
    },400);
}
$(".search-close").click(function(){
    remove_grayout();
    e.preventDefault();
});

$(".sortby-bar").click(function(e){
    $(".modal-background").addClass("d-block");
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

function resetMenu() {
    $('.second-level-sec').removeClass('active');
    $('.first-category').removeClass('change-color');
    $('.first-level-category').removeClass('active');
    $('.categories-image-container').addClass('d-none');
}

$('.desktop-hamburger svg , .Menu-text').click(function () {
    $('.desktop-slide-up').addClass('desktop-slide-down');
    $('.desktop-slide-up').slideDown('300');
    resetMenu();
    $('body, html').addClass('overflow-hide');

});

$('.desktop-slide-up .close-icons , .close-text').click(function () {
    $('.desktop-slide-up').removeClass('desktop-slide-down');
    resetMenu();
    $('body, html').removeClass('overflow-hide');
});

$('.first-level-category').hover(
    function () {
        $('.second-level-sec').removeClass('active');
        $('.first-level-category').removeClass('active');
        $(this).addClass('active');
        $(this).siblings('.second-level-sec').addClass('active');
        $(this).closest('.first-category').addClass('change-color');
        var $categoryId = $(this).attr('id');
        $('.categories-image-container').addClass('d-none fadeIn fast animated');
        $('.categories-image-container-second').addClass('d-none');

        $('.categories-image-container').each(function () {
            var $imageId = $(this).data('id');
            if ($categoryId == $imageId) {
                $(this).removeClass('d-none');
                return;
            }

        });
    }
);

$('.second-level').hover(
    function () {
        $('.categories-image-container-second').addClass('d-none');
        $(this).addClass('active');
        var $childCategoryId = $(this).data('category-id');

            $('.categories-image-container-second').each(function () {
                var $imageId = $(this).data('cat-image');
                if ($childCategoryId == $imageId) {
                    $('.categories-image-container').addClass('d-none');
                    $(this).removeClass('d-none');
                    $(this).addClass('fadeIn fast animated');
                    return;
                } else {
                    var $parentCatId = $(this).parents('.second-level-sec').data('pararent-id');
                    $('.categories-image-container').each(function () {
                        var $imageId = $(this).data('id');
                        if ($childCategoryId != '' && $parentCatId == $imageId) {
                            $(this).removeClass('d-none');
                            return;
                        }
                
                    });
                }
        
            });
    },
    function () {
        var $parentCatId = $(this).parents('.second-level-sec').data('pararent-id');
        $('.categories-image-container').each(function () {
            var $imageId = $(this).data('id');
            if ($parentCatId == $imageId) {
                $(this).removeClass('d-none');
                return;
            }

        });
        $(this).removeClass('active');
    }
);
// end

$(".mobile-menu .close-button").click(function(){
    $(".mobile-menu").addClass("animated fadeOut delay-point-three");
    $(".mobile-menu .nav-item > a").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    setTimeout(function(){
        $(".mobile-menu").removeClass("animated");
    }, 200);

    setTimeout(function(){
        $(".modal-background").removeClass("d-block").fadeOut();
    }, 200);
});

setTimeout(function(){
    $('.navbar-toggler-custom').removeAttr('disabled');
}, 500);

$(document).ready(function() {
    $('.navbar-toggler-custom').click(function(e){
        e.preventDefault();
        e.stopPropagation();
        var parentElement = e.target.closest('.navbar-toggler-custom');
        if (!parentElement) return;
        if (parentElement) {
        setTimeout(function(){
            $('.mobile-menu .nav-item > a').removeClass('fadeOutLeft fast animated').addClass('fadeInLeft fast animated');
            $('.country-selector-mobile .html-slot-container, .mobile-login .nav-link').removeClass('fadeOutLeft fast animated').addClass('fadeInLeft fast animated');
            $('.mobile-menu').removeClass('fadeOut');
            $('.mobile-menu').removeClass('animated');
            $('.mobile-menu').removeClass('delay-point-three');
            $('.mobile-menu').addClass('in');
            $('.mobile-menu').addClass('animated');
        }, 300);
        var $mobileMenu = document.querySelector('.mobile-menu');
        function checkHamburgerToggeler() {
            if($mobileMenu) {
                $('.modal-background').addClass('d-block');
                $('.mobile-menu').removeClass('fadeOut');
                $('.mobile-menu').removeClass('animated');
                $('.mobile-menu').removeClass('delay-point-three');
                $('.mobile-menu').addClass('in');
                $('.mobile-menu').addClass('animated');
            } else {
                setTimeout(checkHamburgerToggeler, 400);
            }
        }
        setTimeout(checkHamburgerToggeler, 400);
        $('.dropdown-menu .dropdown-item a').removeClass('fadeOutLeft').addClass('animated fast fadeInLeft');
        $('.slick-slider').slick('refresh');
        }
    });
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
    }, 200);

    setTimeout(function(){
        $(".modal-background").removeClass("d-block").fadeOut();
    }, 200);

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

// header hide on scroll
var lastScrollTop = 0;

  $(window).on('scroll',function() {
    var scrollTop = $(this).scrollTop();

    if ((scrollTop > 0 && lastScrollTop > 0) && (scrollTop != 0 && lastScrollTop != 0) && scrollTop >= lastScrollTop) {
      // Scrolling down
        $('.transparent-header , .home-header-transparent').addClass('hide-header');
        $('.transparent-header .minicart .popover-bottom , .home-header-transparent .minicart .popover-bottom').addClass('mini-cart-hide' , '0');
        $('.header-banner-redesign').addClass('header-banner-hide');
        $('.search-results-updated').addClass('sticky-search');
        $('.header-placeholder-sec').addClass('header-section-set');
        $('.search-results-updated .filter-bar-sticky').addClass('filter-bar-updated');
        $('.checkout-header-redesign .sticky-header-wrapper').removeClass('fixed-header');
        $('.accessible-link').css('display','none');
        $('.search-results-updated .left-sec .result-count').css('display','none');
    } else {
      // Scrolling up
      $('.header-placeholder-sec').removeClass('header-section-set');
        $('.transparent-header , .home-header-transparent').removeClass('hide-header');
        $('.header-banner-redesign').removeClass('header-banner-hide');
        $('.checkout-header-redesign .sticky-header-wrapper').addClass('fixed-header');
        $('.search-results-updated .filter-bar-sticky').removeClass('filter-bar-updated');
        $('.search-results-updated').removeClass('sticky-search');
        $('.accessible-link').css('display','block');
        $('.transparent-header .minicart .popover-bottom , .home-header-transparent .minicart .popover-bottom').removeClass('mini-cart-hide');
        $('.search-results-updated .left-sec .result-count').css('display','block');
    }

    lastScrollTop = scrollTop;
    console.log(scrollTop);
  });

// on load scroll on top
  $(window).on('load', function() {
    if ($('.modal-is-open').length == 0) {
        $(window).scrollTop(0);
    }
  });