var cookieHandler = require('./cookieHandler');
(function ($) {
    var $html = $('html');
    $('body').on('show.bs.modal', function () {
        $html.addClass('modal-is-open');
    }).on('hide.bs.modal', function () {
        $html.removeClass('modal-is-open');
    });
    
    // Hide email pop up on close button click and save cookie
    $('.email-popup .close').click(function() {
        var emailOptInFrequency = $('.email-popup').data('emailoptinfrequency');
        if (emailOptInFrequency > 0) {
            cookieHandler.saveCookie('emailOptInPopUp', '1', emailOptInFrequency);
        }
        $('.email-popup').hide();
    });

    // Hide Thank you note on click any where
    $(".thankyou-opened").click( function() {
        $('.thankyou-opened').hide();
    });
    
    // Set email pop up position
    var emailPopUpPosition = $('.email-popup').data('emailpopupposition');
    if (emailPopUpPosition) {
        if (emailPopUpPosition == 'leftBottom') {
            $('.email-popup .quick-view-dialog').addClass('email-popup-position-left-bottom');
        } else if (emailPopUpPosition == 'rightBottom') {
            $('.email-popup .quick-view-dialog').addClass('email-popup-position-right-bottom');
        }
    }
    	
    // Show email pop up if cookie not present
    if (!cookieHandler.isEmptyCookie('emailOptInPopUp')) {
        var emailPopUpDelayTime = $('.email-popup').data('emailpopupdelaytime');
        if (emailPopUpDelayTime) {
            setTimeout(function() { 
                if ($('.email-optin-control').children().length > 0) {
                    $('.email-popup').show();
                } else {
                    $('.email-popup').remove();
                }
            },
            (emailPopUpDelayTime*60000));
        } else {
            if ($('.email-optin-control').children().length > 0) {
                $('.email-popup').show();
            } else {
                $('.email-popup').remove();
            }
        }
        $('#welcomeMat').on('shown.bs.modal', function() {
            $(document).off('focusin.modal');
        });
    }
}(jQuery));
