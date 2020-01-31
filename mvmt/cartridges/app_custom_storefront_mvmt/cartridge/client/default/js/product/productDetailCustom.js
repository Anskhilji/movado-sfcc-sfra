'use strict';

$(document).ready(function() {

    $('.pdp-tabs-nav button').on('click', function(e) {
        var thistab = $(this).data("tab");
        $('.'+thistab+'').addClass('active').siblings().removeClass('active');
        $(this).addClass('active').siblings().removeClass('active');
        console.log($(window).width());
        if ($(window).width() < 786) {
            $('.pdp-mobile-accordian').removeClass('active');
            $(this).find('.pdp-mobile-accordian').addBack('active')
        }

        setTimeout(function(){
            $('.'+thistab+'').addClass('fadeIn').siblings().removeClass('fadeIn');
         }, 300);
    });

    $('.pdp-mobile-accordian').on('click', function(e) {

        $(this).toggleClass('active').siblings().slideToggle();

    });
});


