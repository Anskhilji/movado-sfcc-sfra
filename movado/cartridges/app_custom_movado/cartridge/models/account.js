'use strict';


var Account = module.superModule;

/**
* extend is use to extend super module
* @param target - super module
* @param source - child module
*/
function extend(target, source) {
    var _source;

    if (!target) {
        return source;
    }

    for (var i = 1; i < arguments.length; i++) {
        _source = arguments[i];
        for (var prop in _source) {
			// recurse for non-API objects
            if (_source[prop] && typeof _source[prop] === 'object' && !_source[prop].class) {
                target[prop] = this.extend(target[prop], _source[prop]);
            } else {
                target[prop] = _source[prop];
            }
        }
    }

    return target;
}

/**
 * Extending account model to add birthdat and add to email list value
 * @param currentCustomer
 * @param addressModel
 * @param orderModel
 * @returns
 */
function account(currentCustomer, addressModel, orderModel) {
    var customAccountHelper = require('*/cartridge/scripts/helpers/customAccountHelpers');
    var accountModel = new Account(currentCustomer, addressModel, orderModel);
    var accountObj;
    if (currentCustomer && currentCustomer.raw && currentCustomer.raw.profile) {
    	accountObj = extend(accountModel, {
        birthdate: currentCustomer.raw.profile.custom.birthdate,
        birthmonth: currentCustomer.raw.profile.custom.birthmonth,
        addresses: customAccountHelper.getAddresses(currentCustomer.raw.addressBook)
    });
    }
    return accountObj;
}


module.exports = account;
