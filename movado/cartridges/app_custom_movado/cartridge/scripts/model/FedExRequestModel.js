'use strict';

function generateAuthenticationPayLoad(service) {
    return 'grant_type=client_credentials' + '&client_id=' + service.configuration.credential.user + '&client_secret=' + service.configuration.credential.password
}

function generateFedExAddressValidationAPIPayLoad(address) {
    var payLoad = {
          validateAddressControlParameters: {
            includeResolutionTokens: true //Specify the parameters applied to validate the address
          },
          addressesToValidate: [
            {
              address: {
                streetLines: [address.streetLines],
                city: address.city,
                stateOrProvinceCode: address.state,
                postalCode:  address.postalCode,
                countryCode:  address.countryCode,
              }
            }
          ]
      };
    return JSON.stringify(payLoad);
}
module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad,
    generateFedExAddressValidationAPIPayLoad: generateFedExAddressValidationAPIPayLoad
};