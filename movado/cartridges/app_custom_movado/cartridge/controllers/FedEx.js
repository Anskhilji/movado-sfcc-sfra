'use strict';

var server = require('server');
var fedExAPI = require('*/cartridge/scripts/api/fedExAPI');
var fedExAPIHelper = require('~/cartridge/scripts/helpers/fedExAPIHelper');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Logger = require('dw/system/Logger').getLogger('FedEx');


server.post('AddressValidation', function (req, res, next) {
    var shippingForm = server.forms.getForm('shipping');
    var shippingFormErrors = COHelpers.validateShippingForm(shippingForm.shippingAddress.addressFields);
    var fedExAddressValidationAPI;
    if (Object.keys(shippingFormErrors).length > 0) {
        res.json({
            form: shippingForm,
            fieldErrors: [shippingFormErrors],
            serverErrors: [],
            error: true
        });
        return next();
    };
    var address = {
        streetLines: shippingForm.shippingAddress.addressFields.address1.value || '',
        city: shippingForm.shippingAddress.addressFields.city.value || '',
        postalCode: shippingForm.shippingAddress.addressFields.postalCode.value || '',
        state: shippingForm.shippingAddress.addressFields.states.stateCode.value || '',
        countryCode: shippingForm.shippingAddress.addressFields.country.value || ''
    };
    try {
        var fedExApiAddress = fedExAPI.fedExAddressValidationAPI(address);
        if (fedExApiAddress.success) {
            fedExAddressValidationAPI = fedExAPIHelper.fedExAddressValidation(fedExApiAddress,address);
            fedExAddressValidationAPI.userAddress = address;
        } else {
            res.json({
                error: true,
                fedExAddressValidationAPI: fedExAddressValidationAPI
            });
            return next();
        }
    } catch (e) {
        Logger.error('Error Occured While Calling FedExAPICall and Error is : {0}', e.toString());
    }

    res.json({
        fedExAddressValidationAPI: fedExAddressValidationAPI
    });

    return next();
});
module.exports = server.exports();
