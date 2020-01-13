'use strict';

$(document).ready(function () {
    function toggleIcon(e) {
        $(e.target)
            .prev('.panel-heading')
            .find(".more-less")
            .toggleClass('fa-plus fa-minus');
    }
    $('.panel-group').on('hidden.bs.collapse', toggleIcon);
    $('.panel-group').on('shown.bs.collapse', toggleIcon);
    $('.tab-pane-control:first').removeClass('fade in');
    $('.faq-control-bar-inner li').on('click', function(){
        $(this).siblings().removeClass('is-active');
        $(this).addClass('is-active');
        
        $('.tab-pane-control').hide();
        
        var id = $(this).children().attr('href');
        $(id).show();
        $(id).removeClass('fade');
    });
    $(window).scroll(function (event) {
        var scroll = $(window).scrollTop();
        var header = $('header');
        var headerHeight = header.height();
        var helpContainer = $('.help-wrapper');
        
        if (helpContainer.hasClass('scroll-warp') == false  && ((helpContainer.offset().top - $(window).scrollTop()) < headerHeight)) {
            helpContainer.addClass('scroll-warp');
            helpContainer.css({'top' : headerHeight + 'px'});
        } else if(helpContainer.offset().top <= ($('.tab-content').offset().top + headerHeight)) {
            helpContainer.removeAttr('style');
            helpContainer.removeClass('scroll-warp');
        }
        
        var footer = $('footer');
        
        if((helpContainer.offset().top + 148) > $('footer').offset().top) {
            helpContainer.css({'bottom' : 0 + 'px', 'top':'unset'});
        }
    });
});

