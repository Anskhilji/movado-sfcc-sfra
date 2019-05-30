function createBilling(order) {
    var billingAddres = order.getBillingAddress();
    var billingCompanyName,
        result;

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');

    var RCUtilities = require('~/cartridge/scripts/riskified/util/RCUtilities');

    if (empty(billingAddres.companyName)) {
        billingCompanyName = '';
    }

    result = {
        address1      : RCUtilities.escape(billingAddres.address1, regExp, '', true),
        address2      : RCUtilities.escape(billingAddres.address2, regExp, '', true),
        city          : RCUtilities.escape(billingAddres.city, regExp, '', true),
        company       : RCUtilities.escape(billingCompanyName, regExp, '', true),
        country       : billingAddres.countryCode.displayValue,
        country_code  : billingAddres.countryCode.value,
        first_name    : RCUtilities.escape(billingAddres.firstName, regExp, '', true),
        last_name     : RCUtilities.escape(billingAddres.lastName, regExp, '', true),
        name          : RCUtilities.escape(billingAddres.fullName, regExp, '', true),
        phone         : RCUtilities.escape(billingAddres.phone, regExp, '', true),
        province      : billingAddres.stateCode,
        province_code : billingAddres.stateCode,
        zip           : billingAddres.postalCode
    };

    return result;
}

function createShipping(order) {
    var shipment,
        result,
        orderShipmentIt,
        shippingCompanyName,
        shippingAddress;

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');

    var RCUtilities = require('~/cartridge/scripts/riskified/util/RCUtilities');

    orderShipmentIt = order.getShipments().iterator();

    while (orderShipmentIt.hasNext()) {
        shipment = orderShipmentIt.next();
        shippingAddress = shipment.shippingAddress;
        if (empty(shippingAddress.companyName)) {
            shippingCompanyName = '';
        }

        result = {
            address1      : RCUtilities.escape(shippingAddress.address1, regExp, '', true),
            address2      : RCUtilities.escape(shippingAddress.address2, regExp, '', true),
            city          : RCUtilities.escape(shippingAddress.city, regExp, '', true),
            company       : RCUtilities.escape(shippingCompanyName, regExp, '', true),
            country       : shippingAddress.countryCode.displayValue,
            country_code  : shippingAddress.countryCode.value,
            first_name    : RCUtilities.escape(shippingAddress.firstName, regExp, '', true),
            last_name     : RCUtilities.escape(shippingAddress.lastName, regExp, '', true),
            name          : RCUtilities.escape(shippingAddress.fullName, regExp, '', true),
            phone         : RCUtilities.escape(shippingAddress.phone, regExp, '', true),
            province      : shippingAddress.stateCode,
            province_code : shippingAddress.stateCode,
            zip           : shippingAddress.postalCode
        };
    }

    return result;
}

exports.createBilling = createBilling;
exports.createShipping = createShipping;
