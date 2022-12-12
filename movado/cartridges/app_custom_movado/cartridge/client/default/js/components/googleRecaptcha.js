'use strict'

window.onSubmitCaptcha = function(token) {
    $(document).ready(function () {
        var $submitForm = $('.form-submit');
        var $gCaptchaInput = $('.g-recaptcha-token')
        $($gCaptchaInput).val(token);
        $($submitForm).click(); 
    });
}