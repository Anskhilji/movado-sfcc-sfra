'use strict';
var base = require('./base');

$(document).ready(function() {
    $('.linked-products').slick({
        slidesToShow: 3,
        slidesToScroll: 1,
        focusOnSelect: true,
        infinite: false,
        dots: false,
        arrows: true,
    });

    $(function() {
        var header = $('header').height();
        var productdetail = $('.product-detail').height();
        var stickybar = $('.sticky-bar');
        console.log(productdetail)
        $(window).scroll(function() {
            var scroll = $(window).scrollTop();


            if (scroll >= productdetail) {
                stickybar.css({
                    top: header +'px'
                });
            }

            else {
                stickybar.css("top","-25px")
            }
            // if (scroll >= hieghtThreshold && scroll <=  hieghtThreshold_end ) {
            //     header.addClass('dark');
            //     stickybar.addClass('active');
            //     stickybar.css("top",""+stickybar+"px")
            // } else {
            //     header.removeClass('dark');
            //     menu.removeClass('dark');
            // }
        });
    })
});