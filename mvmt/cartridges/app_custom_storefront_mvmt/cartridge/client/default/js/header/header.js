'use strict';
$(document).ready(function() {

});

$(".desktop-search-icon").click(function(){
    $(this).toggleClass('active');
    $('.desktop-side-search').toggleClass('desktop-search-active');
    $('.header-search-field').focus();
});
/* $(".header-search-field").focusin(function(){
    $('.search-recomendation').fadeIn();
    if (!$(".header-search-field").val()) { 
        $(".search-recomendation").fadeIn();
        console.log("this is empaty")
    } else{
        $(".search-recomendation").fadeOut();
    }
}); */

$(".header-search-field").focusout(function(){
    if (!$(".header-search-field").val()) { 
        $(".search-recomendation").fadeIn();
        console.log("this is empaty")
    } else{
        $(".search-recomendation").fadeOut();
    }
});

const $menu = $('.search-icon, .desktop-search, .desktop-menu, .mobile-menu, .navbar-toggler-custom, .refinement-bar, .filter-btn');
$(document).mouseup(e => {

    if (!$menu.is(e.target) // if the target of the click isn't the container...
    && $menu.has(e.target).length === 0) // ... nor a descendant of the container
    {

    }
});

$('.header-search-field').on('change keypress paste keyup', function() {
    $(".search-recomendation").fadeOut();
    
    setTimeout(function(){
        if (!$(".header-search-field").val()) { 
            $(".search-recomendation").fadeIn();
            console.log("this is empaty")
        } else{
            $(".search-recomendation").fadeOut();
        }
    },1000);
});


if ($(".header-search-field").is(':empty')) { 
    $(".search-recomendation").show();
}


