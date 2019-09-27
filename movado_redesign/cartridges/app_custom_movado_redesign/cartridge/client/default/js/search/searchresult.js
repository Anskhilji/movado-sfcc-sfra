'use strict';

$(document).ready(function () {
    $(".search-results.plp-new-design .filter-btn").click(function(){
        $(".modal-background").addClass("d-block").show();
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
    $(".modal-background").removeClass("d-block").hide();
    $("body").removeClass("no-overflow");
    $(".search-results.plp-new-design .refinement-bar").removeClass("faster fadeInRight animated").addClass("fast fadeOutRight animated");
    setTimeout(function(){
        $(".search-results.plp-new-design .refinement-bar").removeClass("d-block");
    },300);
});
const $menu = $('.search-results.plp-new-design  .refinement-bar');
$(document).mouseup(e => {
    if (!$menu.is(e.target) // if the target of the click isn't the container...
    && $menu.has(e.target).length === 0) // ... nor a descendant of the container
    {
        $(".modal-background").removeClass("d-block").hide();
        $("body").removeClass("no-overflow");
        $(".search-results.plp-new-design  .refinement-bar").removeClass("faster fadeInRight animated").removeClass("d-block").addClass("fast fadeOutRight animated");
        setTimeout(function(){
            $(".search-results.plp-new-design  .refinement-bar").removeClass("d-block");
        },300);
   
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
            $(".hovered-tile").css("min-height", thatHeight);
            $(that).find(".tile-btns").addClass("delay-point-five fadeIn fast animated");
            $(that).find(".tile-discription").addClass(" delay-point-five fadeIn fast animated");
                }, 500);
            }).mouseleave(function () {
                clearTimeout(myTimeout);
                $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
                $(".tile-btns").removeClass("fadeIn delay-point-five fast animated");
                $(".tile-discription").removeClass("delay-point-five fast animated");
                $(".hovered-tile").css("min-height", "unset");
            });
    }else {
        $('.search-results.plp-new-design .product .product-tile').mouseenter(function () {
            var that=this
            var thatHeight=$(this).height();
            console.log(thatHeight);

            myTimeout = setTimeout(function () {
                $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
                $(".tile-btns").removeClass("fadeIn delay-point-five fast animated");
                $(".tile-discription").removeClass("delay-point-five fast animated");
                $(".hovered-tile").css("min-height", "unset");
                }, 500);
            }).mouseleave(function () {
                clearTimeout(myTimeout);
                $('.search-results.plp-new-design .product-tile').removeClass('hovered-tile');
                $(".tile-btns").removeClass("fadeIn delay-point-five fast animated");
                $(".tile-discription").removeClass("delay-point-five fast animated");
                $(".hovered-tile").css("min-height", "unset");
            });

    }
});

