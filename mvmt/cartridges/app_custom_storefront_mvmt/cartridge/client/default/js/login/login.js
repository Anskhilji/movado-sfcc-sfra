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
};
