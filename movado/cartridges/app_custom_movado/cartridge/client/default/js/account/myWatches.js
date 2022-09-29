'use strict';

var formHelpers = require('../checkout/formErrors');

/**
 * Create an alert to display the error message
 * @param {Object} message - Error message to display
 */
function createErrorNotification(message) {
    if ($('.product-not-added .valid-cart-error').length === 0) {
        var errorHtml = '<div class="alert card alert-danger alert-dismissible valid-cart-error ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + message + '</div>';

        $('.product-not-added').append(errorHtml);
    }
}

$('body').on('click', '.saveWatch', function (e) {
    var form = $('form.register-myWatches-form');
    e.preventDefault();
    var url = form.attr('action');
    form.spinner().start();
    $.ajax({
        url: url,
        type: 'post',
        dataType: 'json',
        data: form.serialize(),
        success: function (data) {
            form.spinner().stop();
            if (data.error) {
            	if (data.fieldErrors.length) {
                data.fieldErrors.forEach(function (error) {
                    if (Object.keys(error).length) {
                        formHelpers.loadFormErrors('.register-myWatches-form', error);
                    }
                });
            }

            	if (data.serverErrors && data.serverErrors.length) {
                $.each(data.serverErrors, function (index, element) {
                    createErrorNotification(element.serverErrors[0]);
                });
            }
            } else {
                location.href = data.redirectUrl;
            }
        },
        error: function (err) {
            form.spinner().stop();
        }
    });
    return false;
});
