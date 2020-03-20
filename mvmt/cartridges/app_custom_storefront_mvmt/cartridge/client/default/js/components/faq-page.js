'use strict';

var $formValidation = require('base/components/formValidation');

function toggleIcon(e) {
    $(e.target).prev('.faq-main-panel-heading').find('.faq-main-panel-title-more-less').toggleClass('faq-main-panel-title-expand faq-main-panel-title-shrink');
}

module.exports = function () {
    var $contactTab = $('#faq-page-contact-tab');
    var $footer = $('footer');
    
    var $header = $('header');
    var $helpContainer = $('.help-wrapper');
    var $footerHelpContainer = $helpContainer.clone().removeClass('help-wrapper').addClass('help-wrapper-footer');
    var $headerHeight = $header.height();
    var $returnsTab = $('#faq-page-returns-tab');
    var headerHeight = $('header').height();
    var heroBannerWidth = $('.hero').height();
    
    $footer.addClass('position-relative');
    $footer.append($footerHelpContainer);
    
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
//        $($id).show();
        $($id).removeClass('d-none');
        
        $('.faq-nav-control-bar-inner').removeClass('active');
        $('.faq-nav-control-bar-btn span').text($(this).text());
        var showHelpContainer = $(this).data('show-help');
        if (showHelpContainer) {
            $helpContainer.removeClass('d-none');
            $footerHelpContainer.removeClass('d-none');
        } else {
            $helpContainer.addClass('d-none');
            $footerHelpContainer.addClass('d-none');
        }
    });
    
    $(window).scroll(function (event) {
        var $helpWraperBreakPoint = 1100;
        var $scroll = $(window).scrollTop();
        if ($(this).width() >= $helpWraperBreakPoint) {
            
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

        var top = $('.faq-nav-control-bar').position();
        if ($scroll >= top.top) {
            console.log($scroll);
            var top = $('.faq-nav-control-bar').position();
            console.log(headerHeight + heroBannerWidth);
            console.log(top.top);
            $('.faq-nav-control-bar').addClass('sticky');
            $('.faq-nav-control-bar').css('top', headerHeight);
        } else {
            $('.faq-nav-control-bar').removeClass('sticky');
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

