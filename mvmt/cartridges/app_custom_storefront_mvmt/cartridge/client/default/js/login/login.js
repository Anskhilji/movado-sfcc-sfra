'use strict';

var baseLogin = require('base/login/login');

var formValidation = require('base/components/formValidation');
var createErrorNotification = require('base/components/errorNotification');

module.exports = function () {

    $('form.login').off('submit').on('submit', function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('form.login').trigger('login:submit', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    $(".email-validation").addClass("border-danger");
                    $(".auauthanicated-error").text(data.error);
                    $('form.login').trigger('login:error', data);
                } else {
                    $('form.login').trigger('login:success', data);
                    location.href = data.redirectUrl;
                }
            },
            error: function (data) {
                if (data.responseJSON.redirectUrl) {
                    window.location.href = data.responseJSON.redirectUrl;
                } else {
                    $(".email-validation").addClass("border-danger");
                    $('form.login').trigger('login:error', data);
                    form.spinner().stop();
                }
            }
        });
        return false;
    });

    $('form.eswCouponValidation').off('submit').on('submit', function (e) {
        var $currentForm = $(this);
        var $customerEmail = $("#esw-coupon-validation-form").val();
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
                    $(".esw-invalid-feedback").css('display', 'block');
                    $(".esw-invalid-feedback").text(data.errorMessage);
                    $(".esw-email-validation").addClass("border-danger");
                    $('form.eswCouponValidation').trigger('eswCouponValidation:error', data);
                    $.spinner().stop();
                } else if (!data.success) {
                    $(".esw-email-validation").addClass("border-danger");
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
                    $(".esw-invalid-feedback").text(data.errorMessage);
                    $(".esw-email-validation").addClass("border-danger");
                    $('form.eswCouponValidation').trigger('eswCouponValidation:error', data);
                    $.spinner().stop();
                }
            }
        });
        return false;
    }); 
    

    $('.reset-password-form').off('submit').on('submit', function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('.reset-password-form').trigger('login:register', e);
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
                    $('.request-password-title').text(data.receivedMsgHeading);
                    $('.request-password-body').empty()
                        .append('<p>' + data.receivedMsgBody + '</p>');
                    if (!data.mobile) {
                        $('#submitEmailButton').text(data.buttonText)
                            .attr('data-dismiss', 'modal');
                    } else {
                        $('.send-email-btn').empty()
                            .html('<a href="'
                                + data.returnUrl
                                + '" class="btn btn-primary btn-block">'
                                + data.buttonText + '</a>'
                            );
                    }
                }
            },
            error: function () {
                form.spinner().stop();
            }
        });
        return false;
    });

    $('form.registration').off('submit').on('submit', function (e) {
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
                    if (data.emailObj) { 
                        $('body').trigger('emailSubscribe:success', data.emailObj);
                    }
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
