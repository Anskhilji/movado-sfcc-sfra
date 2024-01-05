'use strict';

/**
 * Create a SOM address model
 * @constructor
 * @classdesc class that represents a address object
 * @param  {Object} Address - Address from SOM API in JSON format
 * @param  {Object} [somAccount] - somAccount from SOM API in JSON format
 */
function SomAddress(Address, somAccount) {
    this.firstName = '-';
    this.lastName = '-';
    this.phone = '-';
    this.email = '-';

    this.street = '-';
    this.city = '-';
    this.state = '-';
    this.postalCode = '-';

    if (somAccount) {
        this.firstName = somAccount.FirstName;
        this.lastName = somAccount.LastName;
        this.phone = somAccount.Phone;
        this.email = somAccount.PersonEmail;
    }
    this.street = Address.street;
    this.city = Address.city;
    this.state = Address.state;
    this.postalCode = Address.postalCode;
}

module.exports = SomAddress;
