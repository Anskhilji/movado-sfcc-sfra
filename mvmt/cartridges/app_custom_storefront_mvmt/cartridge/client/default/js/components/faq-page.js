'use strict';

var $formValidation = require('base/components/formValidation');

function toggleIcon(e) {
    $(e.target).prev('.faq-main-panel-heading').find('.faq-main-panel-title-more-less').toggleClass('faq-main-panel-title-expand faq-main-panel-title-shrink');
}

function activTabOnLoad() {
    var $activeTabSelector = $('#active-tab-selector').val();
    if ($activeTabSelector && $activeTabSelector.length) {
        $($activeTabSelector).trigger('click');
    } else {
        $('.tab-1').trigger('click');
    }
}

$(document).ready(function() {
    activTabOnLoad();
    var $tabsUrl = window.location.href;
    if ($tabsUrl.indexOf('#') > 0) {
        var $URL = $tabsUrl.split('#');
        var $absoluteUrlWithId = '#'+$URL[1];
        var $absoluteUrl = $URL[1];
        $('.faq-nav-control-bar-link').removeClass('is-active');
    
        $('.faq-nav-control-bar-link').each(function(value,element){
            var $this = $(element);
            if ($this.attr('href') == $absoluteUrlWithId) {
                $this.addClass('is-active');
            }
        });
    
        $('.tab-pane-control').addClass('d-none');
    
        $('.tab-pane-control').each(function(value,element){
            
            var $this = $(element);
            var $contentId = $this.attr('id').replace(/"|'/g,'');
            if ($contentId == $absoluteUrl) {
                $this.removeClass('d-none');
            }
        });
    }
});

$(window).on('load', function() {
    var $generaltab = $('.faq-nav-control-bar-link');
    $('html, body').animate({ scrollTop: 0 }, "fast");

    $('.faq-nav-control-bar-inner').removeClass('active');
    $('.faq-nav-control-bar-btn span').text($(this).text());
    var showHelpContainer = $generaltab.data('show-help');
    if (showHelpContainer) {
        $helpContainer.removeClass('d-none');
    } else {
        $helpContainer.addClass('d-none');
    }
    if ($generaltab.length > 0) {
        var $activeTabSelector = $('#active-tab-selector').val();
        $generaltab.forEach(function(value){
            if ($(value.data('current-tab') == $activeTabSelector)) {
                var $id = $(value.attr('href'));
                $id.removeClass('d-none');
            }
        });

        $('html, body').animate({ scrollTop: 0 }, "fast");
        $('.tab-pane-control').addClass('d-none');
        var $id = $($generaltab.attr('href'));
        $id.removeClass('d-none');
        
        $('.faq-nav-control-bar-inner').removeClass('active');
        $('.faq-nav-control-bar-btn span').text($(this).text());
        var showHelpContainer = $generaltab.data('show-help');
        if (showHelpContainer) {
            $helpContainer.removeClass('d-none');
            $footerHelpContainer.removeClass('d-none');
        } else {
            $helpContainer.addClass('d-none');
            $footerHelpContainer.addClass('d-none');
        }
    }
});

module.exports = function () {
    var $contactTab = $('#faq-page-contact-tab');
    var $footer = $('footer');
    var $header = $('header');
    var $headerHeight = $header.height();
    var $helpContainer = $('.help-wrapper');

    $footer.addClass('position-relative');

    $('.form-control-textarea').val(function(_, v){
        return v.replace(/\s+/g, '');
    });

    $('.panel-group').on('hidden.bs.collapse', toggleIcon);
    $('.panel-group').on('shown.bs.collapse', toggleIcon);
    
    $('.tab-pane-control').addClass('d-none');
    
    $('.faq-nav-control-bar-btn').on('click', function() {
        $('.faq-nav-control-bar-inner').addClass('active');
    });
    
    $('.faq-nav-control-bar-inner-btn').on('click', function() {
        $('.faq-nav-control-bar-inner').removeClass('active');
    });
    
    $('.faq-nav-control-bar-link').on('click', function() {
        $('html, body').animate({ scrollTop: 0 }, "fast");
        $(this).siblings().removeClass('is-active');
        $(this).addClass('is-active');
        $('.tab-pane-control').addClass('d-none');
        var $id = $($(this).attr('href'));
        $id.removeClass('d-none');

        $('.faq-nav-control-bar-inner').removeClass('active');
        $('.faq-nav-control-bar-btn span').text($(this).text());
        var showHelpContainer = $(this).data('show-help');
        if (showHelpContainer) {
            $helpContainer.removeClass('d-none');
        } else {
            $helpContainer.addClass('d-none');
        }
    });

    $(window).scroll(function (event) {
        var $headerBannerSize = $('.hero').height();
        var $headerSize = $('.header-menu-wrapper').height();
        var $helpTop = $headerBannerSize;
        var $helpWrapperBreakPoint = 1100;
        var $scroll = $(window).scrollTop();
        var $totalHeaderSize = $headerBannerSize - 70;
        var elementOffset = $('footer').offset().top - 160,
            elementOuter = $('footer').outerHeight(),
            windowHeight = $(window).height(),
            thisScroll = $(this).scrollTop();

        if ($(this).width() >= $helpWrapperBreakPoint) {
            if(!$contactTab.is(':visible')) {
                if (typeof $helpContainer !== 'undefined' && typeof $helpContainer.offset() !== 'undefined' && !$helpContainer.hasClass('scroll-warp')  && (($helpContainer.offset().top - $scroll) < $headerHeight)) {
                    $helpContainer.addClass('scroll-warp');
                    $helpContainer.css({'top' : $helpTop + 'px'});
                } else if (typeof $helpContainer !== 'undefined' && typeof $helpContainer.offset() !== 'undefined' && $helpContainer.offset().top <= ($('.tab-content').offset().top + $helpTop)) {
                    $helpContainer.removeAttr('style');
                    $helpContainer.removeClass('scroll-warp');
                }
            }
        } else {
            $helpContainer.hide();
        }

        //mini contactus widget stop scrolls when window scroll reach to footer
        if (thisScroll > (elementOffset+elementOuter-windowHeight)){
            $('.scroll-warp').addClass('stop-scroll');
        } else {
            $('.scroll-warp').removeClass('stop-scroll');
        }

        if ($scroll >= $totalHeaderSize) {
            $headerSize = parseInt($headerSize) === 0 ? $('.sticky-header-wrapper').height() - 2 : $headerSize - 2;

            $('.faq-nav-control-bar').addClass('sticky');
            $('.tab-content').addClass('sticky-padding');
            $('.faq-nav-control-bar').css('top', $headerSize + 1);
        } else {
            $('.faq-nav-control-bar').removeClass('sticky');
            $('.tab-content').removeClass('sticky-padding');
            $('.faq-nav-control-bar').css('top', 'auto');
        }
    });

    $('.faq-tab-activator').on('click', function(e) {
        e.preventDefault();
        var $activatingTab = $($(this).data('tab-selector'));
        $activatingTab.trigger('click');
    });

    $('.contact-tab').on('submit', 'form.contactus', function (e) {
        e.preventDefault();
        var $form = $(this);
        var url = $form.attr('action');
        var method = $form.attr('method');
        var data = $form.serialize();
        var $messageContainer = $('.contact-tab-form-message');
        $messageContainer.hide();
        $form.spinner().start();
        $.ajax({
            url: url,
            dataType: 'json',
            type: method,
            data: data,
            success: function (data) {
                $form.spinner().stop();
                if (!data.success) {
                    $formValidation(form, data);
                }
                $messageContainer.show().html(data.message);
                $('html, body').animate({
                    scrollTop: $('.contact-tab-callout-wrapper').offset().top
                }, 250);
                $form.hide();
            },
            error: function (data) {
                $form.spinner().stop();
                if (data.responseJSON.redirectUrl) {
                    window.location.href = data.responseJSON.redirectUrl;
                } else {
                    $messageContainer.show().html(data.responseText);
                }
                $('html, body').animate({
                    scrollTop: $('.contact-tab-callout-wrapper').offset().top
                }, 250);
                $form.hide();
            }
        });
    });
};

