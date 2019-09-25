'use strict';
$(document).ready(function () {
    $(".filter-btn").click(function(){
        $(".modal-background").addClass("d-block").show();
        $("body").addClass("no-overflow");
        $(".refinement-bar").addClass("faster fadeInRight animated").addClass("d-block");
        $('.selected-value').prepend("<span>Sort By</span> ");
    });

    $(".custom-select__dropdown .custom-select__option").click(function(){
        $('.selected-value').prepend("<span>Sort By</span> ");
    });
});

$(document).on("click",".close-refinebar", function (e) {
    e.preventDefault();
    $(".modal-background").removeClass("d-block").hide();
    $("body").removeClass("no-overflow");
    $(".refinement-bar").removeClass("faster fadeInRight animated").removeClass("d-block");
});

$(".mobile-menu .close-button").click(function(){
    $(".mobile-menu").addClass("animated fadeOut delay-point-three");
    $(".multilevel-dropdown .nav-item > a").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    $(".country-selector-mobile .html-slot-container, .mobile-login .nav-link").removeClass("fadeInLeft fast animated").addClass("fadeOutLeft fast animated");
    setTimeout(function(){
        $(".mobile-menu").removeClass("animated");
    },1000);
});

$(window).on("load resize scroll", function(e) {
    var width= $(window).width();

    if ($(window).width() > 768) {
        $(document).on("mouseenter", ".search-results .product-grid .product-tile", function() {
            $(this).addClass("hovered-tile");
            $(".modal-background").addClass("d-block fadeIn faster animated").show();
        });

        $(document).on("mouseleave", ".search-results .product-grid .product-tile", function() {
            $(this).removeClass("hovered-tile");
            $(".modal-background").removeClass("d-block fadeIn faster animated").hide();
        });
    }

    else {
        $(document).on("mouseenter", ".search-results .product-grid .product-tile", function() {
            $(this).removeClass("hovered-tile");
            $(".modal-background").removeClass("d-block fadeIn faster animated").hide();
        });
    
        $(document).on("mouseleave", ".search-results .product-grid .product-tile", function() {
            $(this).removeClass("hovered-tile");
            $(".modal-background").removeClass("d-block fadeIn faster animated").hide();
        });
    }
});

$('#sort-order').customSelect();
