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

function showShortText(charLength) {
    $('.text-family-truncate-wrapper').each(function() {
        var $showChar = charLength;  // Characters that are shown by default
        var $moretext = '...';
        var $content = $(this).html();
        if($content.length > $showChar) {
            var $c = $content.substr(0, $showChar);
            var $html = $c + $moretext + '</a>';
            $(this).html($html);
        }
    });
}

$('.desktop-search-icon').click(function() {
    var $stickyHeader = $('.sticky-header-wrapper');
    var $screenWidth = 1175;
    var $currentWidth = $(window).width();
    var $charLengthMax = 9;
    var $charLengthMin = 7;

    $('.desktop-side-search').addClass('desktop-search-active');
    $('.mobile-side-search').addClass('active');
    $('.mobile-side-search .header-search-field').focus();
    $('.clear-text-img').trigger('click');
    $('.search-modal-open').addClass('active');
    if ($stickyHeader.hasClass('fixed-header')){
        $(".search-input-field").addClass('search-input-field-remove');
        $('.desktop-side-search,.mobile-side-search').addClass('search-bar-header-padding');
    } else {
        $(".search-input-field").addClass('search-input-field-add');
        $('.desktop-side-search,.mobile-side-search').removeClass('search-bar-header-padding');

        if ($currentWidth > $screenWidth) {
            showShortText($charLengthMax);
        } else {
            showShortText($charLengthMin);
        }
    }
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

$('#overlay, .search-modal-open').click(function() {
    var $stickyHeader = $('.sticky-header-wrapper');
    $('.mobile-nav, #overlay, .size-guide').removeClass('size-guide-overlay active');
    var $menuText = $('.header-mobile-categories .active .header-mobile-category-text').data('trigger-menu');
    $('.header-mobile-categories .active .header-mobile-category-text').text($menuText);
    $('.header-mobile-categories .header-mobile-category').removeClass('active');
    $('.desktop-side-search').removeClass('desktop-search-active');
    $('.search-modal-open').removeClass('active');
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
});

$('.mobile-nav .mobile-subnav-btn').click(function() {
    $(this).toggleClass('active');
});

$('.clear-text-img').click(function() {
    $('.search-field').val('');
    $(".clear-text-img").addClass('d-none');
});

$('.desktop-search-close-text').click(function() {
    $('.suggestions-case-diameter').addClass('case-diameter');
    var $stickyHeader = $('.sticky-header-wrapper');
    $('.desktop-side-search').removeClass('desktop-search-active');
    $('.search-modal-open').removeClass('active');
    $('.search-field').val('');
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
        $(".clear-text-img").removeClass('d-none');
    } else {
        $(".clear-text-img").addClass('d-none');
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
 
});

