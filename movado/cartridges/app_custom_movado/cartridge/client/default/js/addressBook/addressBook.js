'use strict';

var formValidation = require('base/components/formValidation');
var usStateCodes = require("us-state-codes");

var url;
var isDefault;

/**
 * Create an alert to display the error message
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    var errorHtml = '<div class="alert alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

    $('.error-messaging').append(errorHtml);
}
$(function(){
    var $form = $('form.address-form');
    if ($form[0].elements['state']) {
        var stateCode = $form[0].elements['state'].value;
        $form[0].elements['state'].value = usStateCodes.getStateNameByStateCode(stateCode) || stateCode;
    }
})
module.exports = {
    removeAddress: function () {
        $('.remove-address').on('click', function (e) {
            e.preventDefault();
            isDefault = $(this).data('default');
            if (isDefault) {
                url = $(this).data('url')
                    + '?addressId='
                    + $(this).data('id')
                    + '&isDefault='
                    + isDefault;
            } else {
                url = $(this).data('url') + '?addressId=' + $(this).data('id');
            }
            $('.product-to-remove').empty().append($(this).data('id'));
        });
    },

    removeAddressConfirmation: function () {
        $('.delete-confirmation-btn').click(function (e) {
            e.preventDefault();
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    $('#uuid-' + data.UUID).remove();
                    if (isDefault) {
                        var addressId = $('.card .address-heading').first().text();
                        var addressHeading = addressId + ' (' + data.defaultMsg + ')';
                        $('.card .address-heading').first().text(addressHeading);
                        $('.card .card-make-default-link').first().remove();
                        $('.remove-address').data('default', true);
                        if (data.message) {
                            var toInsert = '<div><h3>' +
                                data.message +
                                '</h3><div>';
                            $('.addressList').after(toInsert);
                        }
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    } else {
                        createErrorNotification(err.responseJSON.errorMessage);
                    }
                    $.spinner().stop();
                }
            });
        });
    },

    submitAddress: function () {
        $('form.address-form').submit(function (e) {
            var $form = $(this);
            var stateCode = null;
            e.preventDefault();
            url = $form.attr('action');
            $form.spinner().start();
            $('form.address-form').trigger('address:submit', e);
            if ($form[0].elements['state']) {
                var state = $form[0].elements['state'].value;
                stateCode = usStateCodes.getStateCodeByStateName(state);
                $form[0].elements['state'].value = stateCode || state;
            }
            if ($form[0].elements['country'].value === 'US' && !stateCode) {
                $("#state").next('.invalid-feedback').html(window.Resources.INVALID_STATE);
                $('.invalid-feedback').show();
                $form.spinner().stop();
                return;
            } else {
                $("#state").next('.invalid-feedback').empty();
                $('.invalid-feedback').hide();
            }
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data: $form.serialize(),
                success: function (data) {
                    $form.spinner().stop();
                    if (!data.success) {
                        formValidation($form, data);
                    } else {
                        location.href = data.redirectUrl;
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    $form.spinner().stop();
                }
            });
            return false;
        });
    }
};
