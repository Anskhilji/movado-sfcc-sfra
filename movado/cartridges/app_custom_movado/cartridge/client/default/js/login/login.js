'use strict';
// overide the file from base to movado for the handling of eswCouponValidation email form

var baseLogin = require('base/login/login');

module.exports = {

    login: baseLogin.login,
    register: baseLogin.register,
    resetPassword: baseLogin.resetPassword,
    clearResetForm: baseLogin.clearResetForm,

    // added eswCouponValidation method to validate the customer email against coupon code
    eswCouponValidation : function () {
        $('form.eswCouponValidation').off('submit').on('submit', function (e) {
            var $currentForm = $(this);
            var $customerEmail = $('#esw-coupon-validation-form').val();
            var $form = {
                customerEmail : $customerEmail
            };
            e.preventDefault();
            var $url = $currentForm.attr('action');
            $('form.eswCouponValidation').trigger('eswCouponValidation:submit', e);
            if ($customerEmail !== '') {
                var pattern = /^(?=[a-zA-Z0-9_-]{1,64}(?!.*?\.\.)+(?!\@)+[a-zA-Z0-9!.#\/$%&'*+-=?^_`{|}~\S+-]{1,64})+[^\\@,;:"[\]()<>\s]{1,64}[^\\@.,;:"[\]\/()<>\s-]+@[^\\@!.,;:#$%&'*+=?^_`{|}()[\]~+<>"\s\-][a-zA-Z0-9\-\.]*[^\\@!,;:#$%&'*+=?^_`{|}()[\]~+<>"\s]*[\.]+(?!.*web|.*'')[a-zA-Z]{1,15}$/i
                if(!pattern.test($customerEmail)) { 
                    $('.esw-invalid-feedback').css('display', 'block');
                    $('.esw-invalid-feedback').text(Resources.INVALID_EMAIL_ERROR);
                    $('.esw-email-validation').addClass("border-danger");
                } else {
                    $.spinner().start();
                    $.ajax({
                        url: $url,
                        type: 'post',
                        dataType: 'json',
                        data: $form,
                        success: function (data) {
                            $.spinner().stop();
                            if (data.success) {
                                location.href = data.redirectUrl;
                            } else {
                                location.href = data.redirectUrl;
                            }
                        },
                        error: function () {
                            $.spinner().stop(); 
                        }
                    });
                    return false;
                }
            } else {
                $('.esw-invalid-feedback').css('display', 'block');
                $('.esw-invalid-feedback').text(Resources.ESW_COUPON_VALIDATION_EMAIL_REQUIRE);
                $('.esw-email-validation').addClass("border-danger");
            }
        }); 
    }
};
