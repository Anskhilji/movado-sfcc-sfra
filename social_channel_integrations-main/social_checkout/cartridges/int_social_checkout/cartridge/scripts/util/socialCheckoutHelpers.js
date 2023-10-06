'use strict';

const LineItemCtnr = require('dw/order/LineItemCtnr');
const Logger = require('dw/system/Logger').getLogger('social-checkout', 'helpers');

/**
 * Returns LineItemCtnr.channelType constant from the social channel
 * @param {string|number} socialChannel - social channel as string (TikTok) or integer (14)
 * @returns {number|null} channel type number or null
 */
var getChannelType = function (socialChannel) {
    var channelType = null;
    if (!socialChannel) return channelType;
    try {
        channelType = parseInt(socialChannel, 10);
        if (channelType) {
            var channel = 'CHANNEL_TYPE_' + new String(socialChannel.toUpperCase())
            channelType = LineItemCtnr[channel];
        }
    } catch (e) {
        channelType = null;
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }
    return channelType;
};

module.exports = {
    getChannelType: getChannelType
};