'use strict';
var formErrors = require('base/checkout/formErrors');
/**
 * Display error messages and highlight form fields with errors.
 * @param {string} parentSelector - the form which contains the fields
 * @param {Object} fieldErrors - the fields with errors
 */
function loadFormErrors(parentSelector, fieldErrors) { // eslint-disable-line
    // Display error messages and highlight form fields with errors.
    $.each(fieldErrors, function (attr) {
        $('*[name=' + attr + ']', parentSelector)
        .addClass('is-invalid')
        .siblings('.invalid-feedback')
        .html(fieldErrors[attr]);
        if($('*[name=' + attr + ']').hasClass('is-invalid')) {
            $('*[name=' + attr + ']').closest('.mx-field-wrapper').find('.info-icon.info-icon-email').addClass('icon-right-wrapper');
        }     
    });
}
module.exports = {
    loadFormErrors: loadFormErrors,
    clearPreviousErrors: formErrors.clearPreviousErrors
};
