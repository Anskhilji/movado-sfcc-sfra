'use strict';

$(document).ready(function () {
    var contactTab = $('#contact-tab');
    var helpContainer = $('.help-wrapper');
    var header = $('header');
    var headerHeight = header.height();
    var footer = $('footer');
    footer.addClass('position-relative');
    footer.append(helpContainer.clone().removeClass('help-wrapper').addClass('help-wrapper-footer'));
    var footerHelpContainer = $('.help-wrapper-footer');
    
    
    function toggleIcon(e) {
        $(e.target)
            .prev('.panel-heading')
            .find(".more-less")
            .toggleClass('fa-plus fa-minus');
    }
    $('.panel-group').on('hidden.bs.collapse', toggleIcon);
    $('.panel-group').on('shown.bs.collapse', toggleIcon);
    $('.tab-pane-control:first').removeClass('fade in');
    
    $('.faq-nav-control-bar-btn').on('click', function() {
        $('.faq-nav-control-bar-inner').addClass('active');
    });
    
    $('.faq-nav-control-bar-inner-btn').on('click', function() {
        $('.faq-nav-control-bar-inner').removeClass('active');
    });
    
    $('.faq-nav-control-bar-link').on('click', function(){
        $(this).siblings().removeClass('is-active');
        $(this).addClass('is-active');
        var id = $(this).attr('href');
        $(id).show();
        $(id).removeClass('d-none');
        $('.faq-nav-control-bar-inner').removeClass('active');
        $('.faq-nav-control-bar-btn span').text($(this).text());
        if(id == '#'+contactTab.attr('id')) {
            helpContainer.hide();
            footerHelpContainer.hide();
        } else {
            helpContainer.show();
            footerHelpContainer.show();
        }
    });
    
    $(window).scroll(function (event) {
        var scroll = $(window).scrollTop();
        
        if(!contactTab.is(':visible')) {
            if (helpContainer.hasClass('scroll-warp') == false  && ((helpContainer.offset().top - $(window).scrollTop()) < headerHeight)) {
                helpContainer.addClass('scroll-warp');
                helpContainer.css({'top' : headerHeight + 'px'});
            } else if(helpContainer.offset().top <= ($('.tab-content').offset().top + headerHeight)) {
                helpContainer.removeAttr('style');
                helpContainer.removeClass('scroll-warp');
            }
            if((helpContainer.offset().top + helpContainer.outerHeight()) >= footer.offset().top) {
                helpContainer.hide();
                footerHelpContainer.show();
            } else {
                footerHelpContainer.hide();
                helpContainer.show();
            }
        }
    });
});

