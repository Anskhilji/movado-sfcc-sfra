'use strict'

window.onSubmitCaptcha = function(token) {
    var $submitForm = document.getElementsByClassName('form-submit');
    var $gCaptchaInput = document.getElementsByClassName('g-recaptcha-token');
    $($gCaptchaInput).val(token);
    $($submitForm).click(); 


}