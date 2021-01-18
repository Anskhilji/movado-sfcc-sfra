'use strict';

var Site = require('dw/system/Site');

exports.DEFAULT_COUNTRYCODE = 'US';
exports.NOT_AVAILABILITY_STATUS = 'NOT_AVAILABLE';
exports.SHIPPING_METHODS_UPGRADES_PRECEDENCE = '';

/**
 * This method is used to get shipping methods and return shipping methods precedence in array.
*/
exports.getShippingMethodsPrecedence = function() {
    var SHIPPING_METHODS_UPGRADES_PRECEDENCE =  '';
    SHIPPING_METHODS_UPGRADES_PRECEDENCE =  Site.getCurrent().preferences.custom.shippingMethodUpgradesPrecedence;
    if (SHIPPING_METHODS_UPGRADES_PRECEDENCE != null){
        return SHIPPING_METHODS_UPGRADES_PRECEDENCE.split(":");
    }
    return SHIPPING_METHODS_UPGRADES_PRECEDENCE;
};