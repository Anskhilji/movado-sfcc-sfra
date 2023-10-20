'use strict'

var $loginForm = $('form.login .g-recaptcha');

window.onSubmitCaptcha = function(token) {
    $(document).ready(function () {
        var $submitForm = $('.form-submit');
        var $gCaptchaInput = $('.g-recaptcha-token')
        $($gCaptchaInput).val(token);
        $($submitForm).click(); 
    });
}

window.onsubmitCaptchaLogin = function (token) {
    $(document).ready(function () {
        var $submitFormButton = $('form.login');
        var $gCaptchaInput = $('.g-recaptcha-token');
        $gCaptchaInput.val(token);
        $submitFormButton.submit();
    });
}

if ($loginForm.length == 1) {
    $('#login-form-email, #login-form-password').on('keydown', function (event) {
        if (event.which === 13) {
            event.preventDefault();
            $loginForm.click();
            
        }
    });
}