'use strict';

var baseLogin = require('base/login/login');

module.exports = function () {

    baseLogin.login();
    baseLogin.resetPassword();

    $('form.registration').submit(function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('form.registration').trigger('login:register', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    formValidation(form, data);
                } else {
                    $('form.registration').trigger('registration:success', data);
                    location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
                }

                form.spinner().stop();
            }
        });
        return false;
    });

    $('#forget-password-btn').on('click', function (e) {
        $('#login-section').removeClass('d-block').addClass('d-none');
        $('#forget-password-section').addClass('d-block').removeClass('d-none');
    });

    $('#log-in-btn').on('click', function (e) {
        $('#forget-password-section').removeClass('d-block').addClass('d-none');
        $('#login-section').addClass('d-block').removeClass('d-none');
    });

    $('body').on('click', '.legacy-reset-password a',  function (e) {
        e.preventDefault();
        var resetLegacyURL = $(this).data('action-url');
        $.ajax({
            url: resetLegacyURL,
            type: 'get',
            dataType: 'json',
            success: function (data) {
                if (data.success) {
                    $('.legacy-reset-password').text(data.successMessage);
                } else {
                    $('.legacy-reset-password').text(data.errorMessage);
                }
            }
        });
    });
};
