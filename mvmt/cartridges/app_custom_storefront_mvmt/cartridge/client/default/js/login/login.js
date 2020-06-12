'use strict';

var baseLogin = require('base/login/login');

module.exports = function () {

    baseLogin.login();
    baseLogin.resetPassword();
    baseLogin.register();

    $('#forget-password-btn').on('click', function (e) {
        $('#login-section').removeClass('d-block').addClass('d-none');
        $('#forget-password-section').addClass('d-block').removeClass('d-none');
    });

    $('#log-in-btn').on('click', function (e) {
        $('#forget-password-section').removeClass('d-block').addClass('d-none');
        $('#login-section').addClass('d-block').removeClass('d-none');
    });

    $('legacy-reset-password').on('click', function (e) {
        var urlLeg = $(this).data('action-url');
        $.ajax({
            url: urlLeg,
            type: 'post',
            dataType: 'json',
            success: function (data) {
                // if (!data.success) {
                //     formValidation(form, data);
                //     $('form.login').trigger('login:error', data);
                // } else {
                //     $('form.login').trigger('login:success', data);
                //     location.href = data.redirectUrl;
                // }
                var test = '';
            },
            error: function (data) {
                // if (data.responseJSON.redirectUrl) {
                //     window.location.href = data.responseJSON.redirectUrl;
                // } else {
                //     $('form.login').trigger('login:error', data);
                //     form.spinner().stop();
                // }
            }
        });
    }

    $('form.login').off('submit').on('submit', function (e) {
        var form = $(this);
        e.preventDefault();
        var urlLegacy = form.data('legacy-url');
        $.ajax({
            url: urlLegacy,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                var test = data;
                if (data.success && data.legacyCustomer) {
                    var url = form.attr('action');
                    form.spinner().start();
                    $('form.login').trigger('login:submit', e);
                    $.ajax({
                        url: url,
                        type: 'post',
                        dataType: 'json',
                        data: form.serialize(),
                        success: function (data) {
                            form.spinner().stop();
                            if (!data.success) {
                                formValidation(form, data);
                                $('form.login').trigger('login:error', data);
                            } else {
                                $('form.login').trigger('login:success', data);
                                location.href = data.redirectUrl;
                            }
                        },
                        error: function (data) {
                            if (data.responseJSON.redirectUrl) {
                                window.location.href = data.responseJSON.redirectUrl;
                            } else {
                                $('form.login').trigger('login:error', data);
                                form.spinner().stop();
                            }
                        }
                    });

                    return false;
                }
                 else {
                    window.location.href = data.relativeURL;
                }
            }   
        });

        
    });
};


