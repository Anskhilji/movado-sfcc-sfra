'use strict';

$(document).ready(function () {
    $(".search-results.plp-new-design .filter-btn,.more-filter-btn").click(function(){
        $(".modal-background").removeClass("fadeOut").addClass("d-block fadeIn fast")
        $("body").addClass("no-overflow");
        $(".search-results.plp-new-design .refinement-bar, .refine-wrapper-sidebar").removeClass("fadeOutRight").addClass("fast fadeInRight animated d-block");
        $(".refine-wrapper-sidebar").addClass("fillterslideinleft");
        $('.search-results.plp-new-design .custom-select__option').focus();
        // Custom:MSS-2073 start
        $(".refine-wrapper-sidebar .movado-refinements-container").addClass("d-block");
        $(".refine-wrapper-sidebar .sort-order-mobile-menu").removeClass("d-block").addClass("d-none");
        $(".close-refinebar .filter-more").removeClass("d-none").addClass("d-block");
        $(".close-refinebar .sort-by").removeClass("d-block").addClass("d-none");
        // Custom:MSS-2073 end
    });

    $('.search-results.plp-new-design .refinement-bar .selected-value').prepend("<span>Sort By</span> ");

    $('.plp-new-design .refine-wrapper .custom-select .custom-select__option').click( function() {
        $('.refinement-bar .selected-value').prepend("<span>Sort By</span> ");
    });

    $('.search-results.plp-new-design .refinement li:last-Child').focusout(function(event) {
        $('.search-results.plp-new-design .refinement').removeClass('active');
        $('.search-results.plp-new-design .refinement > button').attr('aria-expanded', 'false');
    });

    $('.search-results.plp-new-design .refinement > button').on('focus', function() {
        $('.custom-select--active > button').trigger( "click" );
    });

    $('.search-results.plp-new-design .refinement:last-child > button').on('keydown', function(event) {
        if (event.key === 'Enter') {
            $(this).addClass('filter-control');
            $('.search-results.plp-new-design .refinement-bar .refine-wrapper .refinement').find('li').last().focusout(function() {
                $('.search-results.plp-new-design .close-refinebar').focus();
                $('.search-results.plp-new-design .refinement:last-child > button').removeClass('filter-control');
            });
        } else if (event.keyCode == 9) {
            if ($('.search-results.plp-new-design .refinement:last-child > button').hasClass('filter-control')) return;
            $('.search-results.plp-new-design .close-refinebar').focus();
        }
    });

    // Custom:MSS-2073 start
    $('.refinement-box-filter-desktop').on('click', function(){
        $('.refinement-box-filter-desktop').removeClass('active');
        $(this).addClass('active');
        $('.modal-background').addClass('d-block');
        $('.desktop-search-refine-bar-redesing').addClass('active');
        $('.header-menu-wrapper').addClass('header-active');
        $('.dk-fillter-m').addClass('dk-fillter-check');

        $('.dk-fillter-check').on('click', function(e){
            if(!$('.modal-background').hasClass('d-block')) {
                $('.modal-background').addClass('d-block');
            }
         });
    });

    $('.modal-background').on('click', function(e){
       $('.refinement-box-filter-desktop, .desktop-search-refine-bar-redesing').removeClass('active');
       $('.header-menu-wrapper').removeClass('header-active');
       $('.dk-fillter-check').unbind();
       $('.dk-fillter-m').removeClass('dk-fillter-check');
       $(".search-results.plp-new-design  .refinement-bar, .refine-wrapper-sidebar").removeClass("fillterslideinleft");
    });

    $(".mobile-fliter-sort-btn-click").click(function(){
        $(".modal-background").removeClass("fadeOut").addClass("d-block fadeIn fast modal-moblie")
        $("body").addClass("no-overflow");
        $(".search-results.plp-new-design .refinement-bar").removeClass("fadeOutRight").addClass("fast fadeInRight animated d-block");
        $(".search-results.plp-new-design .refinements-sidebar").addClass("d-none");
        $(".search-results.plp-new-design .refinements-sidebar").removeClass("d-block").addClass("d-none");
        $(".refine-wrapper-sidebar .sort-order-mobile-menu").addClass("d-block");
        $(".close-refinebar .sort-by").removeClass("d-none").addClass("d-block");
        $(".close-refinebar .filter-more").removeClass("d-block").addClass("d-none");
        $('.search-results.plp-new-design .custom-select__option').focus(); 
    });

    // Custom:MSS-2073 end
});


$(".search-results.plp-new-design .refinement-bar").keyup(function(event) {
    if (event.key === 'Escape') {
        $(".modal-background").fadeOut();
        $("body").removeClass("no-overflow");
        $(".search-results.plp-new-design  .refinement-bar, .refine-wrapper-sidebar").removeClass("faster fadeInRight fillterslideinleft").addClass("fast fadeOutRight");
        setTimeout(function() {
            $(".modal-background").removeClass("d-block");
            $(".search-results.plp-new-design  .refinement-bar, .refine-wrapper-sidebar").removeClass("d-block fillterslideinleft");
            // Custom:MSS-2073 start
            $('.refinement-box-filter').removeClass('active');
            // Custom:MSS-2073 end
        },300);

        setTimeout(function() {
            $(".refinement-bar,.refine-wrapper-sidebar").removeClass("animated fillterslideinleft");
        }, 200);
        $(".search-results.plp-new-design .filter-btn > button").focus();
    }
});

$(document).on("click",".search-results.plp-new-design  .close-refinebar", function (e) {
    e.preventDefault();
    $(".modal-background").addClass("fadeOut");
    $("body").removeClass("no-overflow");
    $(".search-results.plp-new-design  .refinement-bar").addClass("fadeOutRight");

    setTimeout(function(){
        $(".modal-background").removeClass("d-block");
    }, 300);
});

const $filter = $('.refinement-bar, .filter-btn, more-filter-btn, .search-icon, .desktop-search, .desktop-menu, .mobile-menu, .navbar-toggler-custom');
$(document).mouseup(e => {
    if (!$filter.is(e.target) // if the target of the click isn't the container...
    && $filter.has(e.target).length === 0) // ... nor a descendant of the container
    {
        $("body").removeClass("no-overflow");
        $(".search-results.plp-new-design  .refinement-bar").addClass("fadeOutRight");

        setTimeout(function(){
            $(".modal-background").addClass("fadeOut");
        }, 300);
    }
});

$('.plp-new-design .content-grid-header').keyup(function(event) {
    if (event.key === 'Escape') {
        $('.product-search').trigger( "click" );
        $('.product-search').focus();
    }
});

$(".search-results.plp-new-design  .mobile-menu .close-button").click(function(){
    $(".mobile-menu").addClass("animated fadeOut delay-point-three");
    $(".multilevel-dropdown .nav-item > a").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    setTimeout(function(){
        $(".mobile-menu").removeClass("animated");
    },1000);
});

$('.search-results.plp-new-design #sort-order').customSelect();
$(window).on("load resize scroll", function(e) {
    var width= $(window).width();
    var tileHeight=$('.search-results.plp-new-design .product-tile').height();

    if ($(window).width() > 800) {

        var myTimeout; 
        $('.search-results.plp-new-design .product .product-tile').mouseenter(function () {
            var that=this
            var thatHeight=$(this).height();

            myTimeout = setTimeout(function () {
            $(that).addClass('hovered-tile');
            $(that).find(".tile-btns").addClass("delay-point-five fadeIn fast animated");
            $(that).find(".tile-discription").addClass(" delay-point-five fadeIn fast animated");
                }, 200);
            }).mouseleave(function () {
                clearTimeout(myTimeout);
                $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
                $(".tile-btns").removeClass("fadeIn delay-point-five fadeIn fast animated");
                $(".tile-discription").removeClass("delay-point-five fadeIn fast animated");
                $(".product-tile").css("min-height", "auto");
            });
        
        $('.search-results.plp-new-design .product .product-tile .tile-body').focusin(function (event) {
            if (event.target == event.currentTarget) {
                var productTile=this.closest('.search-results.plp-new-design .product .product-tile');
                var thatHeight=$(productTile).height();
	
                myTimeout = setTimeout(function () {
                $(productTile).addClass('hovered-tile');
                $(productTile).find(".tile-btns").addClass("delay-point-five fadeIn fast animated");
                $(productTile).find(".tile-discription").addClass(" delay-point-five fadeIn fast animated");
                    }, 200);
            }
            }).focusout(function () {
                if (event.target == event.currentTarget || $(event.target).hasClass('add-to-cart')) {
                    clearTimeout(myTimeout);
                    $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
                    $(".tile-btns").removeClass("fadeIn delay-point-five fadeIn fast animated");
                    $(".tile-discription").removeClass("delay-point-five fadeIn fast animated");
                    $(".product-tile").css("min-height", "auto");
                }
            });
    } else {
        $('.search-results.plp-new-design .product .product-tile').mouseenter(function () {
            var that=this
            var thatHeight=$(this).height();

        myTimeout = setTimeout(function () {
            $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
            $(".tile-btns").removeClass("fadeIn delay-point-five fadeIn fast animated");
            $(".tile-discription").removeClass("delay-point-five fadeIn fast animated");
            $(".product-tile").css("min-height", "auto");
            }, 200);
        }).mouseleave(function () {
            clearTimeout(myTimeout);
            $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
            $(".tile-btns").removeClass("fadeIn delay-point-five fadeIn fast animated");
            $(".tile-discription").removeClass("delay-point-five fadeIn fast animated");
            $(".product-tile").css("min-height", "auto");
        });
     }
});
