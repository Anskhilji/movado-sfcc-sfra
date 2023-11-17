'use strict';

/* API Includes */
const Logger = require('dw/system/Logger').getLogger('ocapi-hooks', 'basket');
const Status = require('dw/system/Status');

const socialCheckoutHelpers = require('*/cartridge/scripts/util/socialCheckoutHelpers');

exports.afterPATCH = function (basket, basketInput) {
    Logger.debug('dw.ocapi.shop.basket.afterPATCH');
    try {
        var channelType = socialCheckoutHelpers.getChannelType(basketInput.channel_type || null);
        if (channelType) basket.setChannelType(channelType);
    } catch (e) {
        return new Status(Status.ERROR, 'ERROR', e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    return new Status(Status.OK);
};

exports.afterPOST = function (basket) {
    Logger.debug('dw.ocapi.shop.basket.afterPOST');
    try {
        var channelType = Object.hasOwnProperty.call(basket.custom, 'socialChannel') && basket.custom.socialChannel ? socialCheckoutHelpers.getChannelType(basket.custom.socialChannel) : null;
        if (channelType) basket.setChannelType(channelType);
    } catch (e) {
        return new Status(Status.ERROR, 'ERROR', e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    return new Status(Status.OK);
};
