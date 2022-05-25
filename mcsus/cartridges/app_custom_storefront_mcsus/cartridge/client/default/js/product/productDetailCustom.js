'use strict';
var mediumWidth = 992;

$(function() {
    $('.smartgiftpopup .close-smart-gift').bind('click', function(e) {
        e.stopPropagation();
        $(this).parents('.custom-tooltipsmart').hide();
        $('.showtooltipSmart').removeClass('active');
    });

    $('.smartgiftpopup .smartgift-btn-popup').on('click', function(e) {
        var $windowWidth = $(window).width();

        if ($windowWidth < mediumWidth) {
            $(this).addClass('active');
            $('.custom-tooltipsmart').show();
        }
    });

    $('.smartgiftpopup .smartgift-btn-popup').hover(
        function () {
            var $windowWidth = $(window).width();

            if ($windowWidth > mediumWidth){
                $('.showtooltipSmart').addClass('active');
                $('.custom-tooltipsmart').show();
            }
        },

        function () {
            var $windowWidth = $(window).width();

            if ($windowWidth > mediumWidth){
                $('.showtooltipSmart').removeClass('active');
                $('.custom-tooltipsmart').hide();
            }
        }
    );
});