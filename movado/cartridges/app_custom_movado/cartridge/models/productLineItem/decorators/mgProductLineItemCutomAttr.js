'use strict';

var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');
var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'resources', {
        enumerable: true,
        value: {
        	Model: Resource.msg('label.product.model', 'confirmation', null),
        	Engraved: Resource.msg('label.personalization.engraved', 'confirmation', null),
        	Embossed: Resource.msg('label.personalization.embossed', 'confirmation', null),
        	GiftWrapped: Resource.msg('label.personalization.giftWrapped', 'confirmation', null)
        }
    });

    Object.defineProperty(object, 'customAttributes', {
    	enumerable: true,
    	value: orderCustomHelper.getProductLineItemCustomAttributes(lineItem)
    });
};

