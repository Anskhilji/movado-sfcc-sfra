'use strict'

var FormField = require('dw/web/FormField');
var FormElementValidationResult = require('dw/web/FormElementValidationResult');
var Resource = require('dw/web/Resource');

var config = JSON.parse(JSON.stringify(require('./addresses')));

function validateAddressForm (form) {
    var success = true;
    var postalCodeField = form.postalCode;
    var phoneField = (form.parent && form.parent.formId == 'billing') ? form.parent.creditCardFields.phone : form.phone;
    var countryField = form.country;
    
    if (!validateFormField (postalCodeField, countryField.value).valid) {
        success = false;
    }
    if (!validateFormField (phoneField, countryField.value).valid){
        success = false;
    }
    
    return new FormElementValidationResult(success);
    
}

function validateFormField (formField, countryCode) {
    var valid = true;
    var countryConfig = config[countryCode];
    if(!countryConfig) {
        countryConfig = config.default;
    }
    var countryFieldConfig = countryConfig[formField.formId];
    if (formField) {
        
        var regex = countryFieldConfig.regex ? new RegExp(countryFieldConfig.regex) : null;
        if (!countryFieldConfig.mandatory && empty(formField.htmlValue)) {
            return new FormElementValidationResult(valid);
        }
        
        if (empty(formField.htmlValue)) {
            formField.invalidateFormElement(Resource.msg(countryFieldConfig.missingError, 'forms', null));
            valid = false;
        } else if (formField.htmlValue.length < countryFieldConfig.min || formField.htmlValue.length > countryFieldConfig.max) {
            formField.invalidateFormElement(Resource.msg(countryFieldConfig.rangeError, 'forms', null));
            valid = false;
        } else if (regex && !regex.test(formField.htmlValue)) {
            formField.invalidateFormElement(Resource.msg(countryFieldConfig.parseError, 'forms', null));
            valid = false;
        }
        
    }
    
    return new FormElementValidationResult(valid);
}

module.exports = {
    validateAddressForm: validateAddressForm
};