'use strict'

window.onSubmitCaptcha = function(token) {
    $(document).ready(function () {
        var $submitForm = $('.form-submit');
        var $gCaptchaInput = $('.g-recaptcha-token')
        $($gCaptchaInput).val(token);
        $($submitForm).click(); 
    });
}

if ($('form.login .g-recaptcha').length == 1) {
    

    $('#login-form-email, #login-form-password').on('keydown', function (event) {
        if (event.which === 13) {
            event.preventDefault();
            $('form.login .g-recaptcha').click();
            
        }
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