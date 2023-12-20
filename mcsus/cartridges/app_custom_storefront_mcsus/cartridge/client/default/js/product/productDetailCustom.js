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

$(document).ready(function() {
    if (window.innerWidth < 768) {
        $('header').addClass('sticky-header');
    }
});

module.exports = {
    // Custom Start: [MSS-1341 To Show/Hide More Short Description on PDP]
    showMoreDescription: function () {
        var showChar = 176;  // Characters that are shown by default
        var moretext = ' Show More';
        var lesstext = ' Show Less';
        $('.short-description p').each(function() {
            var content = $(this).html();
            if(content.length > showChar) {
                var c = content.substr(0, showChar);
                var h = content.substr(showChar, content.length - showChar);
                var html = c + '<span style="display:none" class="morecontent-wrapper"><span>' + h + '</span></span><a href="" class="morelink-wrapper" style="text-decoration: underline; display: inline-block">' + moretext + '</a>';
                $(this).html(html);
            }
        });
        $('.setitem-description .content').each(function() {
            var content = $(this).html();
            if(content.length > showChar) {
                var c = content.substr(0, showChar);
                var h = content.substr(showChar, content.length - showChar);
                var html = c + '<span style="display:none" class="morecontent-wrapper"><span>' + h + '</span></span><a href="" class="morelink-wrapper" style="text-decoration: underline; display: inline-block; margin-left: 4px;">' + moretext + '</a>';
                $(this).html(html);
            }
        });
        $('.morelink-wrapper').on('click',function() {
            if($(this).hasClass('less')) {
                $(this).removeClass('less');
                $(this).html(moretext);
                $('.morelink-wrapper').css('margin-left','4px');
                $('.morecontent-wrapper').css('display','none');
            } else {
                $(this).addClass('less');
                $(this).html(lesstext);
                $('.morelink-wrapper').css('margin-left','4px');
                $('.morecontent-wrapper').css('display','inline');
            }
            return false;
        });
    },

    showMoreBottomDescription: function () {
        var showChar = 176;  // Characters that are shown by default
        var moretext = ' show more';
        var lesstext = ' show less';
        $('.bottom-description p').each(function() {
            var content = $(this).html();
            if(content.length > showChar) {
                var c = content.substr(0, showChar);
                var h = content.substr(showChar, content.length - showChar);
                var html = c + '<span style="display:none" class="morecontent"><span>' + h + '</span></span><a href="" class="morelink" style="text-decoration: underline; display: inline-block">' + moretext + '</a>';
                $(this).html(html);
            }
        });
        $('.morelink').on('click',function() {
            if($(this).hasClass('less')) {
                $(this).removeClass('less');
                $(this).html(moretext);
                $('.morelink').css('margin-left','4px');
                $('.morecontent').css('display','none');
            } else {
                $(this).addClass('less');
                $(this).html(lesstext);
                $('.morelink').css('margin-left','4px');
                $('.morecontent').css('display','inline');
            }
            return false;
        });
    },
}

$('.new-header-deign .navbar-toggler').click(function (e) {
    $('.main-menu-top').addClass('main-menu-top-fixed')
});
