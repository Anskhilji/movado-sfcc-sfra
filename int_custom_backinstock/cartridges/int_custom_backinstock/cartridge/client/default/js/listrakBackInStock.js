'use strict';
// var backInStockNotification = require('backInStockNotification');
var triggerEmail = true; 
var processResponse = function ($selector, data) {
    if (data.success) {
        $selector.find('.back-in-stock-notification-listrak-container, .back-in-stock-notification-marketing-container').addClass('d-none');
        var mediumWidth = 992;
        var $windowWidth = $(window).width();
        if ($windowWidth < mediumWidth) {
            $('.description-and-detail').addClass('description-and-detail-pt');
            $('.description-and-detail').removeClass('description-and-detail-pad');
        } else {
            $('.back-in-stock-notification-container-success').addClass('back-in-stock-notification-container-mb');
        }
        $('.back-in-stock-notification-container-success').removeClass('d-none').focus();
    } else {
        if (!data.success) {
            if (!data.isValidEmail) {
                $selector.find('.back-in-stock-notification-invalid-email').removeClass('d-none');
            } else if (data.isAlreadySubscribed) {
                $selector.find('.back-in-stock-notification-already-subscribed').removeClass("d-none");
            } else {
                $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            }
        }
    }
    triggerEmail = true;
}

var submitBackInStockEmail = function ($selector) {
    $selector.find('.back-in-stock-notification-error').addClass('d-none');
    $selector.spinner().start();
    var url = $selector.data('url');
    var pid = $selector.data('pid');
    var emailAddress = $selector.find('.back-in-stock-notification-email').val();

    var enabledMarketing = false;
    if ($selector.find('#backInStockListrakPreference').length > 0) {
        if ($selector.find('#backInStockListrakPreference').is(':checked')) {
            enabledMarketing = true;
        }
    }

    var form = {
        pid: pid,
        email: emailAddress,
        enabledMarketing: enabledMarketing
    }

    $.ajax({
        url: url,
        data: form,
        method: 'POST',
        success: function (response) {
            if (response.result) {
                processResponse($selector, response.result);
            } else {
                $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            }
            $selector.spinner().stop();
        },
        error: function (response) {
            $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            $selector.spinner().stop();
        }
    });

}

$('.form').submit(function(e) {
    e.preventDefault();
    var $backInStockContainerMain = $('.listrak-back-in-stock-notification-container-main');
    var $form = $('.back-in-stock-notification-form');
    var $pid = $('#productSKU').val();
    var $email = '';
    var $phone = ''
    var $alertCode = $('#alertCode').val();
    var $listrakSuccessMsg= $('.listrak-success-msg');
    var $emailRequired = $('.back-in-stock-notification-error-required'); 
    var $emailInvalid = $('.back-in-stock-notification-error-invalid');
    var $phoneInvalid = $('.back-in-stock-notification-invalid-phone');
    var $backInStockListrakPreference = $('#backInStockListrakPreference');
    $emailRequired.text('');
    $emailInvalid.text('');
    $phoneInvalid.text('');

    if ($form.find('.back-in-stock-notification-email').length > 0) {
        $email = $('.back-in-stock-notification-email').val().trim();
        var $pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i
        var $isValid;

        if ($email) {
            $isValid = $pattern.test($email);
            if ($isValid) {
                if ($backInStockListrakPreference.length > 0) {
                    if (triggerEmail) {
                        e.preventDefault();
                        triggerEmail = false;
                        var $selector;
                        if ($backInStockContainerMain.length > 0) {
                            $selector = $('.listrak-back-in-stock-notification-container-main');
                        } 
                        submitBackInStockEmail($selector);
                    }
                }
            }
        }
        
        if ($form.find('.back-in-stock-notification-phone').length > 0) {
            $phone = $('.back-in-stock-notification-phone').val().trim();
            var $phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            var $isValidPhone;

            if ($phone) {
                $isValidPhone = $phonePattern.test($phone)
            }

            if ($phone == '' || $phone == undefined) {
                if ($email == '' || $email == undefined) {
                    $emailInvalid.text(window.Resources.EMIAL_ADDRESS_REQUIRED);
                    $email = '';
                    $phone = '';
                    return;
                } else if (!$isValid) {
                    $emailInvalid.text(window.Resources.EMIAL_ADDRESS_INVALID);
                    $email = '';
                    $phone = '';
                    return;
                }
            } else if ($phone !== '' && !$isValidPhone && $email !== ''  && !$isValid) {
                $emailInvalid.text(window.Resources.EMIAL_ADDRESS_INVALID);
                $phoneInvalid.text(window.Resources.PHONE_NUMBER_INVALID);
                $email = '';
                $phone = '';
                return;
            } else if ($email == '' && !$isValidPhone) {
                $phoneInvalid.text(window.Resources.PHONE_NUMBER_INVALID);
                $email = '';
                $phone = '';
                return;
            } else if ($isValid && !$isValidPhone) {
                $phoneInvalid.text(window.Resources.PHONE_NUMBER_INVALID);
                $email = '';
                $phone = '';
            } else if (!$isValidPhone && !$isValid) {
                $emailInvalid.text(window.Resources.EMIAL_ADDRESS_INVALID);
                $email = '';
                $phone = '';
            }
        
        } else {
            if ($email == '' || $email == undefined) {
                $emailInvalid.text(window.Resources.EMIAL_ADDRESS_REQUIRED);
                $email = '';
                return;
            } else if (!$isValid) {
                $emailInvalid.text(window.Resources.EMIAL_ADDRESS_INVALID);
                $email = '';
                return;
            }
        }
    } else {
        if ($form.find('.back-in-stock-notification-phone').length > 0) {
            $phone = $('.back-in-stock-notification-phone').val().trim();
            var $phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            var $isValidPhone;
            
            if ($phone) {
                $isValidPhone = $phonePattern.test($phone)
            }

            if ($phone == '' || $phone == undefined) {
                $phoneInvalid.text(window.Resources.PHONE_NUMBER_REQUIRED);
                $phone = '';
                return;
            } else if (!$isValidPhone) {
                $phoneInvalid.text(window.Resources.PHONE_NUMBER_INVALID);
                $phone = '';
                return;
            }
        }
    }
    
    if ($email || $phone) {
        SubmitAlert($email, $phone, $pid, $alertCode);
    }
    
    function SubmitAlert (email, phone, pid, alertCode) {
        var $emailAddress = email;
        var $phoneNumber = phone;
        var $productSKU = pid;
        var $alertCode = alertCode;
        _ltk.Alerts.AddAlertWithIdentifiers({Identifiers:{Email:$emailAddress, PhoneNumber:$phoneNumber}, Sku:$productSKU, AlertCode:$alertCode});
        _ltk.Alerts.Submit();
        $backInStockContainerMain.addClass('d-none');
        $listrakSuccessMsg.text(window.Resources.LISTRAK_SUCCESS_MESSAGE);
        return;
    }
});
