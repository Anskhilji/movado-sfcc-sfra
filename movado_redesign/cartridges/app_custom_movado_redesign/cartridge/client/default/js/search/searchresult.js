'use strict';

$(document).ready(function () {
    $(".search-results.plp-new-design .filter-btn").click(function(){
        $(".modal-background").addClass("d-block").fadeIn();
        $("body").addClass("no-overflow");
        $(".search-results.plp-new-design .refinement-bar").removeClass("fast fadeOutRight animated").addClass("faster fadeInRight animated").addClass("d-block");
    });
    $('.search-results.plp-new-design .refinement-bar .selected-value').prepend("<span>Sort By</span> ");
    $(".search-results.plp-new-design .custom-select__dropdown .custom-select__option").click(function(){
        $('.selected-value').prepend("<span>Sort By</span> ");
    });
});

$(document).on("click",".search-results.plp-new-design  .close-refinebar", function (e) {
    e.preventDefault();
    $(".modal-background").removeClass("d-block").fadeOut();
    $("body").removeClass("no-overflow");
    $(".search-results.plp-new-design .refinement-bar").removeClass("faster fadeInRight animated").addClass("fast fadeOutRight animated");
    setTimeout(function(){
        $(".search-results.plp-new-design .refinement-bar").removeClass("d-block");
    },300);
});
const $filter = $('.refinement-bar, .filter-btn, .search-icon, .desktop-search, .desktop-menu, .mobile-menu, .navbar-toggler-custom');
$(document).mouseup(e => {
    if (!$filter.is(e.target) // if the target of the click isn't the container...
    && $filter.has(e.target).length === 0) // ... nor a descendant of the container
    {
        $(".modal-background").fadeOut();
        $("body").removeClass("no-overflow");
        $(".search-results.plp-new-design  .refinement-bar").removeClass("faster fadeInRight").addClass("fast fadeOutRight");
        setTimeout(function(){
            $(".modal-background").removeClass("d-block");
            $(".search-results.plp-new-design  .refinement-bar").removeClass("d-block");
        },500);

        setTimeout(function(){
            $(".refinement-bar").removeClass("animated");
        },700);
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

    if ($(window).width() > 768) {

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

