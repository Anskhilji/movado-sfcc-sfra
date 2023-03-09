var backInStockNotification = require('../js/backInStockNotification');

function listrakBackInStockFormSubmission() {
    var $backInStockContainerMain = $('.listrak-back-in-stock-notification-container-main');
    var $form = $('.back-in-stock-notification-form');
    var $pid = $('#productSKU').val();
    var $email = '';
    var $phone = '';
    var $alertCode = $('#alertCode').val();
    var $listrakSuccessMsg = $('.listrak-success-msg');
    var $emailRequired = $('.back-in-stock-notification-error-required');
    var $emailInvalid = $('.back-in-stock-notification-error-invalid');
    var $phoneInvalid = $('.back-in-stock-notification-invalid-phone');
    var $backInStockListrakPreference = $('#backInStockMarketingCloudPreference');
    var $backInStockSmsSubscription = $('#backInStockSMSSubscription');
    $emailRequired.text('');
    $emailInvalid.text('');
    $phoneInvalid.text('');
    var $listrackPhoneCode = "+";

    if ($form.find('.back-in-stock-notification-email').length > 0) {
        var $phoneNo = '';

        $('.back-in-stock-notification-email').each(function() {
            if ($(this).val()) {
                $email = $(this).val().trim();
            }
        });
        if ($('.back-in-stock-notification-phone').length > 0) {
            $('.back-in-stock-notification-phone').each(function() {
                if ($(this).val()) {
                    $phoneNo = $(this).val().trim();
                }
            });
        }

        var $pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i
        var smsSubscription = false;
        var $phoneNoPattern;
        var $backinStockselector = $('.listrak-back-in-stock-notification-container-main');
        var $isValid;
        var $isValidPhoneNo;

        if ($backinStockselector.find('#backInStockSMSSubscription').length > 0) {
            if ($backinStockselector.find('#backInStockSMSSubscription').is(':checked')) {
                smsSubscription = true;
            }
        }

        if (smsSubscription) {
            $phoneNo = $listrackPhoneCode + $phoneNo;
            $phoneNoPattern = /^(?!(?=(0000000000)))?[+ (](\(?([0-9]{3})\)?([0-9]{3})?([0-9]{4}))$/;
        } else {
            $phoneNoPattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        }

        if ($email && $phoneNo) {
            $isValid = $pattern.test($email);
            $isValidPhoneNo = $phoneNoPattern.test($phoneNo);
            if ($isValid && $isValidPhoneNo) {
                if ($backInStockListrakPreference.length > 0 && $backInStockSmsSubscription.length > 0) {
                    var $selector;
                    if ($backInStockContainerMain.length > 0) {
                        $selector = $('.listrak-back-in-stock-notification-container-main');
                    }
                    backInStockNotification.submitBackInStockEmail($selector);
                }
            }
        } else if ($email || $phoneNo) {
            $isValid = $pattern.test($email);
            $isValidPhoneNo = $phoneNoPattern.test($phoneNo);
            if ($isValid || $isValidPhoneNo) {
                if ($backInStockListrakPreference.length > 0 || $backInStockSmsSubscription.length > 0) {
                    var $selector;
                    if ($backInStockContainerMain.length > 0) {
                        $selector = $('.listrak-back-in-stock-notification-container-main');
                    }
                    backInStockNotification.submitBackInStockEmail($selector);
                }
            }
        }

        if ($form.find('.back-in-stock-notification-phone').length > 0) {
            var $phonePattern;
            var $isValidPhone;

            $('.back-in-stock-notification-phone').each(function() {

                if ($(this).val().length > 0) {
                    $phone = $(this).val().trim();
                }
            });

            if (smsSubscription) {
                $phone = $listrackPhoneCode + $phone;
                $phonePattern = /^(?!(?=(0000000000)))?[+ (](\(?([0-9]{3})\)?([0-9]{3})?([0-9]{4}))$/;
            } else {
                $phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            }

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

            $('.back-in-stock-notification-phone').each(function() {

                if ($(this).val().length > 0) {
                    $phone = $(this).val().trim();
                }
            });

            var $phonePattern;
            var $isValidPhone;

            if (smsSubscription) {
                $phone = $listrackPhoneCode + $phone;
                $phonePattern = /^(?!(?=(0000000000)))?[+ (](\(?([0-9]{3})\)?([0-9]{3})?([0-9]{4}))$/;
            } else {
                $phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            }

            if ($phone) {
                $isValidPhone = $phonePattern.test($phone)
            }

            if ($isValidPhone) {
                if ($backInStockSmsSubscription.length > 0) {
                    var $selector;
                    if ($backInStockContainerMain.length > 0) {
                        $selector = $('.listrak-back-in-stock-notification-container-main');
                    }
                    backInStockNotification.submitBackInStockEmail($selector);
                }
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
}

$('.form').submit(function(e) {
    e.preventDefault();
    var $listarkSMSReminder = $('.listrak-sms-reminder-msg');
    var $backInStockSmsSubscription = $('#backInStockSMSSubscription');

    if ($backInStockSmsSubscription.length > 0 && $listarkSMSReminder.length > 0) {

        if ($listarkSMSReminder.hasClass('d-none') && ($('.back-in-stock-notification-phone').val()).length > 0 && !$backInStockSmsSubscription.is(':checked')) {
            $listarkSMSReminder.removeClass('d-none');
        } else {
            listrakBackInStockFormSubmission();
        }
    } else {
        listrakBackInStockFormSubmission();
    }
});
