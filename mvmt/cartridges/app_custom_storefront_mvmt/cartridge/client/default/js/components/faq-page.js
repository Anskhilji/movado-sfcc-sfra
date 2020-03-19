'use strict';

var $formValidation = require('base/components/formValidation');

function toggleIcon(e) {
    $(e.target).prev('.faq-main-panel-heading').find('.faq-main-panel-title-more-less').toggleClass('faq-main-panel-title-expand faq-main-panel-title-shrink');
}

module.exports = function () {
    var $contactTab = $('#faq-page-contact-tab');
    var $footer = $('footer');
    var $footerHelpContainer = $('.help-wrapper-footer');
    var $header = $('header');
    var $helpContainer = $('.help-wrapper');
    var $headerHeight = $header.height();
    var $returnsTab = $('#faq-page-returns-tab');
    
    $footer.addClass('position-relative');
    $footer.append($helpContainer.clone().removeClass('help-wrapper').addClass('help-wrapper-footer'));
    
    $('.panel-group').on('hidden.bs.collapse', toggleIcon);
    $('.panel-group').on('shown.bs.collapse', toggleIcon);
    
    $('.tab-pane-control').addClass('d-none');
    $('.tab-pane-control:first').removeClass('d-none');
    
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
        var $id = $(this).attr('href');
        $($id).show();
        $($id).removeClass('d-none');
        
        $('.faq-nav-control-bar-inner').removeClass('active');
        $('.faq-nav-control-bar-btn span').text($(this).text());
        if ($id === '#' + $contactTab.attr('id')) {
            $helpContainer.hide();
            $footerHelpContainer.hide();
        } else {
            $helpContainer.show();
            $footerHelpContainer.show();
        }
    });
    
    $(window).scroll(function (event) {
        var $helpWraperBreakPoint = 1100;
        if ($(this).width() >= $helpWraperBreakPoint) {
            var $scroll = $(window).scrollTop();
            
            if(!$contactTab.is(':visible')) {
                if (typeof $helpContainer !== 'undefined' && typeof $helpContainer.offset() !== 'undefined' && !$helpContainer.hasClass('scroll-warp')  && (($helpContainer.offset().top - $scroll) < $headerHeight)) {
                    $helpContainer.addClass('scroll-warp');
                    $helpContainer.css({'top' : $headerHeight + 'px'});
                } else if (typeof $helpContainer !== 'undefined' && typeof $helpContainer.offset() !== 'undefined' && $helpContainer.offset().top <= ($('.tab-content').offset().top + $headerHeight)) {
                    $helpContainer.removeAttr('style');
                    $helpContainer.removeClass('scroll-warp');
                }
                if ((typeof $helpContainer !== 'undefined' && typeof $helpContainer.offset() !== 'undefined' && $helpContainer.offset().top + $helpContainer.outerHeight()) >= $footer.offset().top) {
                    $helpContainer.hide();
                    $footerHelpContainer.show();
                } else {
                    $footerHelpContainer.hide();
                    $helpContainer.show();
                }
            }
        } else {
            $helpContainer.hide();
            $footerHelpContainer.hide();
        }
    });
    
    $('.faq-main-contact-page-link').on('click', function() {
        var $controlBarLinks = $('.faq-nav-control-bar-link');
        $controlBarLinks.siblings().removeClass('is-active');
        $contactTab.addClass('is-active');
        $('.tab-pane-control').addClass('d-none');
        $contactTab.show();
        $contactTab.removeClass('d-none');
        $('.faq-nav-control-bar-inner').removeClass('active');
        $('.faq-nav-control-bar-btn span').text($contactTab).text();
        $helpContainer.hide();
        $footerHelpContainer.hide();
    });
    
    $('.faq-main-return-page-link').on('click', function() {
        var $controlBarLinks = $('.faq-nav-control-bar-link');
        $controlBarLinks.siblings().removeClass('is-active');
        $returnsTab.addClass('is-active');
        $('.tab-pane-control').addClass('d-none');
        $returnsTab.show();
        $returnsTab.removeClass('d-none');
        $('.faq-nav-control-bar-inner').removeClass('active');
        $('.faq-nav-control-bar-btn span').text($returnsTab).text();
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
                $form.hide();
            },
            error: function (data) {
                $form.spinner().stop();
                if (data.responseJSON.redirectUrl) {
                    window.location.href = data.responseJSON.redirectUrl;
                } else {
                    $messageContainer.show().html(data.responseText);
                }
                $form.hide();
            }
        });
    });
};

