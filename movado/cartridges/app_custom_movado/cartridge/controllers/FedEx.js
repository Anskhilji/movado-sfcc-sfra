'use strict';

var server = require('server');
// server.extend(module.superModule);
var fedExAPI = require('*/cartridge/scripts/api/fedExAPI');
var fedExAPIHelper = require('~/cartridge/scripts/helpers/fedExAPIHelper');
var cache = require('*/cartridge/scripts/middleware/cache');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');


server.post('AddressValidation',cache.applyShortPromotionSensitiveCache, function (req, res, next) {
    // var stage  = req.form.form;
    // var addressForm = JSON.parse(stage);
    // var formErrors = COHelpers.validateShippingForm(stage);

    // if (Object.keys(formErrors).length > 0) {
    //     res.json({
    //         form: stage,
    //         fieldErrors: [formErrors],
    //         serverErrors: [],
    //         error: true
    //     });
    //     return next();
    // };
    // if(stage == 'shipping'){
    //     addressForm = addressForm.shippingAddress;
    // }
    // var address = {
    //     streetLines: addressForm.addressFields.address1.htmlValue,
    //     city:  addressForm.addressFields.city.htmlValue,
    //     state: addressForm.addressFields.states.stateCode.htmlValue,
    //     postalCode:  addressForm.addressFields.postalCode.htmlValue,
    //     countryCode: addressForm.addressFields.country.htmlValue,
    // }
    var address = {
        streetLines:  "7372 PARKRIDGE BLVD",
        city:  "IRVING",
        state: "TX",
        postalCode: "750638659",
        countryCode: "US",
    }
    var fedExApiAddress = fedExAPI.fexExAddressValidationAPI(address);
    var fedExAddressValidationAPI = fedExAPIHelper.fedExAddressValidation(fedExApiAddress);
    fedExAddressValidationAPI.userAddress = address;
    res.json({
        fedExAddressValidationAPI: fedExAddressValidationAPI
    });

    return next();
});
module.exports = server.exports();
