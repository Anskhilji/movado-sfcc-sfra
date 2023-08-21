'use strict';
$(document).ready(function() {
    $('.test.mCustomScrollbar').mCustomScrollbar();
    $('.new-header .dropdown-menu .dropdown-item:first-child').addClass('active');
    $('.new-header .dropdown-menu .submenu-container:first-child').removeClass('d-none').addClass('active');
    
    $('.submenu-control').hover(function(event) {
        $(this).parent().find('.submenu-control').removeClass('active');
        $(this).addClass('active');
        var $currentCategory = $(this).data('category');
        var $activeSubMenu = $('.submenu').find("[data-parentcategory='" + $currentCategory + "']");
        $activeSubMenu.siblings('.submenu-container').addClass('d-none').removeClass('active');
        $activeSubMenu.removeClass('d-none').addClass('active');
    });
});

function showShortText() {
    $('.text-family-truncate-wrapper').each(function () {
        var $moretext = '...';
        var $content = $(this).html();
        var $collectionArray = $content.split(' ');

        if ($collectionArray.length > 3) {
            var $contentUpdated = '';
            for (var i = 0; i <= 3; i++) {
                if (i == 3) {
                    $contentUpdated += $moretext + '</a>';
                } else {
                    $contentUpdated += $collectionArray[i] + ' ';
                }
            }

            var $updateContent = $contentUpdated.split(' ');
            var $html = '<span>' + $updateContent[0] + ' ' + $updateContent[1] +'</span><br/>';
            var $html2 = '<span>' + $updateContent[2] + $updateContent[3] +'</span>';
            $(this).html($html).append($html2);
        }
    });
}

$('.desktop-search-icon').click(function() {
    var $stickyHeader = $('.sticky-header-wrapper');

    $('.desktop-side-search').addClass('desktop-search-active');
    $('.mobile-side-search').addClass('active');
    $('.mobile-side-search .header-search-field').focus();
    $('.clear-text-img').trigger('click');
    $('.search-modal-open').addClass('active');
    if ($('.search-modal-open').hasClass('active')) {
        $('.search-modal-open').addClass('color-or-family');
    }
    if ($stickyHeader.hasClass('fixed-header')){
        $(".search-input-field").addClass('search-input-field-remove');
        $('.desktop-side-search,.mobile-side-search').addClass('search-bar-header-padding');
        showShortText();
    } else {
        $(".search-input-field").addClass('search-input-field-add');
        $('.desktop-side-search,.mobile-side-search').removeClass('search-bar-header-padding');
        showShortText();
    }
    $('.desktop-side-search .header-search-field').focus();

    // Custom:MSS-2034 add class when open search
    $('.home-header-transparent').addClass('solid-header');
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

$('#overlay, .search-modal-open').click(function() {
    var $stickyHeader = $('.sticky-header-wrapper');
    $('.mobile-nav, #overlay, .size-guide').removeClass('size-guide-overlay active');
    var $menuText = $('.header-mobile-categories .active .header-mobile-category-text').data('trigger-menu');
    $('.header-mobile-categories .active .header-mobile-category-text').text($menuText);
    $('.header-mobile-categories .header-mobile-category').removeClass('active');
    $('.desktop-side-search').removeClass('desktop-search-active');
    $('.search-modal-open').removeClass('active');
    $('.search-modal-open').removeClass('color-or-family');
    
    // Custom:MSS-2234 
    setTimeout(function() {
        $('.home-header-transparent').removeClass('solid-header'); 
    }, 300);

    $('.search-field').val('');
    if ($stickyHeader.hasClass('fixed-header')){
        $(".search-input-field").removeClass('search-input-field-remove');
    } else {
        $(".search-input-field").removeClass('search-input-field-add');
    }
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

$('.mobile-search-close-text').click(function() {
    $('.mobile-side-search').removeClass('active');
    $('.search-modal-open').removeClass('active');
    $('.search-modal-open').removeClass('color-or-family');
    $('.content-show').removeClass('d-none');

    // Custom:MSS-2234 
    setTimeout(function() {
        $('.home-header-transparent').removeClass('solid-header'); 
    }, 300);
});

$('.mobile-nav .mobile-subnav-btn').click(function() {
    $(this).toggleClass('active');
});

$('.clear-text-img').click(function() {
    $('.search-field').val('');
    $(".clear-text-img").addClass('d-none');
    $('.content-show').removeClass('d-none');
});

$('.desktop-search-close-text').click(function() {
    $('.suggestions-case-diameter').addClass('case-diameter');
    var $stickyHeader = $('.sticky-header-wrapper');
    $('.desktop-side-search').removeClass('desktop-search-active');
    $('.search-modal-open').removeClass('active');
    $('.search-modal-open').removeClass('color-or-family');
    $('.suggestions-wrapper').addClass('d-none');
    $('.search-field').val('');
    if ($stickyHeader.hasClass('fixed-header')){
        $(".search-input-field").removeClass('search-input-field-remove');
    } else {
        $(".search-input-field").removeClass('search-input-field-add');
    }

    // Custom:MSS-2234 
    setTimeout(function() {
        $('.home-header-transparent').removeClass('solid-header'); 
    }, 400);
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
        $(".clear-text-img").removeClass('d-none');
    } else {
        $(".clear-text-img").addClass('d-none');
    }
    
});

$('.mobile-search-field').focusout(function() {
    var isSearchModel = $('.product-serach-items').length;
    if (isSearchModel) {
        $('.content-show').addClass('d-none');
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

$('.desktop-menu .sub-dropdown').hover(
    function() {
    $('#overlay, .overlay').addClass('active');
    },
    function(){
    $('#overlay, .overlay').removeClass('active');
    }
);

$('body').mouseup(function(e) {
    var container = $('.mobile-menu');

    if (!container.is(e.target) && container.has(e.target).length === 0) 
    {
        $('.mobile-menu .close-button').trigger('click');
    }
});

document.addEventListener('animationstart', function (event) {
    if (event.animationName == 'nodeInserted') {
        var $reviews = $('.total-reviews-search').attr('total-reviews-search');
        if ($reviews < Resources.YOTPO_REVIEW_COUNT) {
            $(".yotpo.bottomLine").remove();
            $(".yotpo.yotpoBottomLine").remove();
            $(".yotpo-main-widget").remove();
            $('.pdp-tab-button[data-tab="Reviews"]').remove();
            $(".pdp-tab-content.Reviews").remove();
        }
    }
}, true);

$(window).scroll(function (event) {
    var $footer = $('.footer');
    if ($footer.length > 0) {
        var $elementOffset = $footer.offset().top - 160,
        $elementOuter = $footer.outerHeight(),
        $windowHeight = $(window).height(),
        $thisScroll = $(this).scrollTop();

        if ($thisScroll > ($elementOffset+$elementOuter-$windowHeight)){
            $('.bottom-sticky-header').addClass('d-none');
            $('.prices-add-to-cart-actions').removeClass('add-cart-bottom-navigation')
        } else {
            $('.bottom-sticky-header').removeClass('d-none');
            $('.prices-add-to-cart-actions').addClass('add-cart-bottom-navigation')
        }
    }

 });

 $(document).ready(function() {
    var $path = window.location.href;
    var $basePath = $('.bottom-navbar-display').data('base-url');
    try {
        if ($basePath !== undefined && $basePath !== '') {
            $('.prices-add-to-cart-actions').addClass('add-cart-bottom-navigation')
            if ($path !== $basePath) {
                $('.bottom-navbar-display > li.active').removeClass('active');
                $('.bottom-navbar-display > li > a > span.active').removeClass('active');
                $('.bottom-navbar-display li a').find('#M09').addClass('bottom-nav-icon-unactive');
                $('.bottom-navbar-display li:nth-child(4) a').find('#M09').addClass('bottom-nav-icon-transparent');
            }
        }
    } catch(err) {
        console.log('error during remove active Class' + err);
    }
    
        $('.bottom-navbar-display > .bottom-sticky-header-item a').each(function() {
            try {
                if (this.href === $path) {
                    $(this).find('span').addClass('active');
                    $(this).find('#M09').addClass('bottom-nav-icon-active');
                    if ($(this).hasClass('nav-bottom-offers')) {
                        $('.bottom-navbar-display li:nth-child(4) a').find('#M09').find('path').addClass('bottom-nav-stroke');
                        $('.bottom-navbar-display li:nth-child(4) a').find('#M09').addClass('bottom-nav-stroke-unactive');
                    }
                }
            } catch(err) {
                console.log('error during add active class to clicked element' + err);
            }
        });
 
    // Custom:MSS-2234 Header tranparent
    var $bannerViewPort = $('.banner-view-port');
    
    if($bannerViewPort.length > 0 ) {

        var $divOffsetTop = $bannerViewPort.offset().top;
        if (!$bannerViewPort.isOnScreen()) { // if on load banner is not in viewPort show 
            if ($(window).scrollTop() > $divOffsetTop) {
                $('.home-header-transparent').removeClass('transparent-header');
            }
        }

        $(window).scroll(function () {
            var $headerViewPort = $bannerViewPort.isOnScreen();
            if ($headerViewPort) { // check if  banner is on screen
                $('.home-header-transparent').addClass('transparent-header');// both bottom and top will hidde
            } else {
                $('.home-header-transparent').removeClass('transparent-header');
            }
        });
    }    
    
    // Custom:MSS-2260 Mobile Quick Shop Links
    var $categoryViewPort = $('.shop-link-view-port');
    var $termsAndConditions = $('.terms-and-conditions');
    
    if($categoryViewPort.length > 0 ) {
        var $divOffsetTop = $categoryViewPort.offset().top;
        if (!$categoryViewPort.isOnScreen()) { // if on load banner is not in viewPort show 
            if ($(window).scrollTop() > $divOffsetTop) {
                $('.bottom-header-sticky').addClass('bottom-header-fixed');
            }
        }
        $(window).scroll(function () {
            var $headerViewPort = $categoryViewPort.isOnScreen();
            var $bottomHeaderHeight = $('.bottom-header-sticky').outerHeight();
            if ($headerViewPort) { // check if  banner is on screen
                $('.bottom-header-sticky').removeClass('bottom-header-fixed');
            } else {
                $('.bottom-header-sticky').addClass('bottom-header-fixed');
            }
            if($(window).width() < 992) {
                $('.terms-and-conditions').css('padding-bottom', $bottomHeaderHeight+'px' )
            }
        });
    }  
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