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
            $.spinner().start();
            $('form.eswCouponValidation').trigger('eswCouponValidation:submit', e);
            $.ajax({
                url: $url,
                type: 'post',
                dataType: 'json',
                data: $form,
                success: function (data) {
                    $.spinner().stop();
                    if (!data.success && data.errorMessage !== undefined && data.errorMessage !== '') {
                        $('.esw-invalid-feedback').css('display', 'block');
                        $('.esw-invalid-feedback').text(data.errorMessage);
                        $('.esw-email-validation').addClass("border-danger");
                        $('form.eswCouponValidation').trigger('eswCouponValidation:error', data);
                        $.spinner().stop();
                    } else if (!data.success) {
                        $('.esw-email-validation').addClass('border-danger');
                        $('form.eswCouponValidation').trigger('eswCouponValidation:error', data);
                        location.href = data.redirectUrl;
                    } else {
                        $('form.eswCouponValidation').trigger('eswCouponValidation:success', data);
                        location.href = data.redirectUrl;
                    }
                },
                error: function (data) {
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    } else {
                        $('.esw-invalid-feedback').text(data.errorMessage);
                        $('.esw-email-validation').addClass("border-danger");
                        $('form.eswCouponValidation').trigger('eswCouponValidation:error', data);
                        $.spinner().stop();
                    }
                }
            });
            return false;
        }); 
    }
};
