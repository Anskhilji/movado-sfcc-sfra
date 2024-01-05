'use strict';

var OrderUtilCode = require('*/cartridge/scripts/util/OrderUtilCode');

/**
*   refund the whole order
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be refunded
*   @return {boolean} - return true if no API exceptions
*/
exports.processRefundOrder = function (order, orderInput) { // eslint-disable-line no-unused-vars
    // refund the entire orer
    order.custom.externalChannelOrderStatus = OrderUtilCode.EXTERNAL_ORDER_STATUS.REFUNDED;
    var producLineItems = order.getProductLineItems().iterator();
    while (producLineItems.hasNext()) {
        var currentProductLineItem = producLineItems.next();
        currentProductLineItem.custom.externalLineItemReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.REFUNDED;
    }
    return true;
};
