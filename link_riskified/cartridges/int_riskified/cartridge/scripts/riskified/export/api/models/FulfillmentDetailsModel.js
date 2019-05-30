/**
 * Create a Fulfillment Details Model
 * @param {dw.order.Order} order
 * @param {object} params
 */
function create(order, params) {
    var fulfillment,
        currentDate,
        Calendar,
        StringUtils,
        Constants;

    var LineItem = require('./LineItemModel');

    fulfillment = {
        fulfillment_id   : params.fulfillmentId,
        created_at       : params.createdAt,
        status           : params.status,
        tracking_company : params.trackingCompany,
        tracking_numbers : params.trackingNumbers,
        tracking_urls    : params.trackingUrls,
        message          : params.message,
        receipt          : params.receipt,
        line_items       : null
    };

    if (!fulfillment.created_at) {
        Calendar = require('dw/util/Calendar');
        StringUtils = require('dw/util/StringUtils');
        Constants = require('int_riskified/cartridge/scripts/riskified/util/Constants');

        currentDate = new Calendar();
        fulfillment.created_at = StringUtils.formatCalendar(currentDate, Constants.RISKIFIED_DATE_FORMAT);
    }

    fulfillment.line_items = LineItem.createFromContainer(order);

    return fulfillment;
}
exports.create = create;
