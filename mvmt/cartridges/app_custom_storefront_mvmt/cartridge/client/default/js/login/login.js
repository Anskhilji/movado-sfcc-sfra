'use strict';

var baseLogin = require('base/login/login');
var formValidation = require('base/components/formValidation');

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
