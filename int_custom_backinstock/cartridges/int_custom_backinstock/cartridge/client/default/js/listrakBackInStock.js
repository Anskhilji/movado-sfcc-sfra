'use strict';

// window.Resources && window.Resources.EMIAL_ADDRESS_INVALID

$('.form').submit(function(e) {
    e.preventDefault();
    var bisContainerMain = $('.back-in-stock-notification-container-main');
    var $form = $('.back-in-stock-notification-form');
    var pid = $('#ProductSKU').val();
    var email = '';
    var phone = ''
    var alertCode = $('#alertCode').val();
    var listrakSuccessMsg= $('.listrak-success-msg');
    var emailRequired = $('.back-in-stock-notification-error-required');
    var emailInvalid = $('.back-in-stock-notification-error-invalid');
    var phoneInvalid = $('.back-in-stock-notification-invalid-phone');
    emailRequired.text('');
    emailInvalid.text('');
    phoneInvalid.text('');

    if($form.find('.back-in-stock-notification-email').length > 0) {
        email = $('.back-in-stock-notification-email').val().trim();
        var pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i
        var isValid = pattern.test(email);
        if($form.find('.back-in-stock-notification-phone').length > 0) {
            phone = $('.back-in-stock-notification-phone').val().trim();
            var phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            var isValidPhone = phonePattern.test(phone)

            if(phone == '' || phone == undefined) {
                if (email == '' || email == undefined) {
                    emailInvalid.text(window.Resources.EMIAL_ADDRESS_REQUIRED);
                    email = '';
                    phone = '';
                    return;
                    } else if (!isValid) {
                    emailInvalid.text(window.Resources.EMIAL_ADDRESS_INVALID);
                    email = '';
                    phone = '';
                    return;
                }
            } else if(phone !== '' && !isValidPhone && email !== ''  && !isValid) {
                    emailInvalid.text(window.Resources.EMIAL_ADDRESS_INVALID);
                    phoneInvalid.text(window.Resources.PHONE_NUMBER_INVALID)
                    email = '';
                    phone = '';
                    return;
            } else if(email == '' && !isValidPhone) {
                phoneInvalid.text(window.Resources.PHONE_NUMBER_INVALID)
                email = '';
                phone = '';
                return;
            } else if(isValid && !isValidPhone) {
                phoneInvalid.text(window.Resources.PHONE_NUMBER_INVALID)
                email = '';
                phone = '';
            } else if(isValidPhone && !isValid) {
                emailInvalid.text(window.Resources.EMIAL_ADDRESS_INVALID);
                email = '';
                phone = '';
            }
        
        } else {
            if(email == '' || email == undefined) {
                emailInvalid.text(window.Resources.EMIAL_ADDRESS_REQUIRED);
                email = '';
                return;
                } else if(!isValid) {
                emailInvalid.text(window.Resources.EMIAL_ADDRESS_INVALID);
                email = '';
                return;
            }
        }
    } else {
        if($form.find('.back-in-stock-notification-phone').length > 0) {
            phone = $('.back-in-stock-notification-phone').val().trim();
            var phonePattern = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
            var isValidPhone = phonePattern.test(phone);
            if(phone == '' || phone == undefined) {
                phoneInvalid.text(window.Resources.PHONE_NUMBER_REQUIRED);
                phone = '';
                return;
            } else if(!isValidPhone) {
                phoneInvalid.text(window.Resources.PHONE_NUMBER_INVALID);
                phone = '';
                return;
            }
        }
    }
    
    if(email || phone) {
        SubmitAlert(email, phone, pid, alertCode);
    }
    
    function SubmitAlert (email, phone, pid, alertCode) {
        var emailAddress = email;
        var phoneNumber = phone;
        var productSKU = pid;
        var alertCode = alertCode;
        _ltk.Alerts.AddAlertWithIdentifiers({Identifiers:{Email:emailAddress, PhoneNumber:phoneNumber}, Sku:productSKU, AlertCode:alertCode});
        _ltk.Alerts.Submit();
        bisContainerMain.addClass('d-none');
        listrakSuccessMsg.text(window.Resources.LISTRAK_SUCCESS_MESSAGE);
        return;
    }
});
