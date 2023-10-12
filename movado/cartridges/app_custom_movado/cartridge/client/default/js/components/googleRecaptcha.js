'use strict'

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