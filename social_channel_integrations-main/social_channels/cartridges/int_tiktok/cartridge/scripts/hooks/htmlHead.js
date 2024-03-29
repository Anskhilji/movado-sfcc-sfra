'use strict';

/**
 * Render the pixel code from TikTok
 * @returns {string} The rendered template that shows the pixel if the pixel code is already setup
 */
module.exports.htmlHead = function () {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');
    var customObjectHelper = require('~/cartridge/scripts/customObjectHelper');
    var tikTokSettings = customObjectHelper.getCustomObject(true);

    if (tikTokSettings == null || empty(tikTokSettings.custom.pixelCode)) {
        return '';
    }

    var model = new HashMap();
    model.put('pixelCode', tikTokSettings.custom.pixelCode);
    return new Template('/tiktokPixel').render(model).text;
};
