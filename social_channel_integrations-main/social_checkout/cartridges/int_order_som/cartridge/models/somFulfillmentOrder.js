'use strict';

var OrderItems = require('~/cartridge/models/somOrderItems');
var somPreferences = require('~/cartridge/config/somPreferences');
var Resource = require('dw/web/Resource');

/**
 * Create a SOM fulfillment order model
 * @constructor
 * @classdesc class that represents a Fulfillment Order object
 *
 * @param  {Object} fulfillmentDetails - details to create somFulfillmentOrder model
 * @property {string} fulfillmentDetails.Id - fulfillmentOrder ID or null if the details is not from a fulfillment
 * @property {string} fulfillmentDetails.orderSummaryId - orderSummary ID
 * @property {string} fulfillmentDetails.fulfillmentStatus - the status of the fulfillmentOrder: Ordered, Inprogress, or Shipped
 * @property {Array} fulfillmentDetails.orderLineItems - an Array of order items for the fulfillment
 */
function SomFulfillmentOrder(fulfillmentDetails) {
    var STATUSORDERED = somPreferences.statusOrdered;
    var STATUSINPROGRESS = somPreferences.statusInProgress;
    var STATUSSHIPPED = somPreferences.statusShipped;
    var STATUSCANCELED = somPreferences.statusCanceled;
    var STATUSRETURNED = somPreferences.statusReturned;

    this.id = null;
    this.orderSummaryId = null;
    this.status = '-';
    this.statusDisplayLabel = '';
    this.orderItems = null;
    this.a11yViewOrderDetailsText = '';

    if (fulfillmentDetails) {
        this.id = fulfillmentDetails.id ? fulfillmentDetails.id : '';
        this.orderSummaryId = fulfillmentDetails.orderSummaryId;
        this.status = fulfillmentDetails.fulfillmentStatus;
        this.orderItems = new OrderItems(fulfillmentDetails.orderLineItems);

        if (this.status === STATUSORDERED) {
            this.statusDisplayLabel = Resource.msg('label.orderhistory.status.ordered', 'account', null);
            this.a11yViewOrderDetailsText = Resource.msgf('label.vieworderdetail.status.ordered', 'account', null, fulfillmentDetails.sfccOrderNumber);
        } else if (this.status === STATUSINPROGRESS) {
            this.statusDisplayLabel = Resource.msg('label.orderhistory.status.inprogress', 'account', null);
            this.a11yViewOrderDetailsText = Resource.msgf('label.vieworderdetail.status.inprogress', 'account', null, fulfillmentDetails.sfccOrderNumber);
        } else if (this.status === STATUSSHIPPED) {
            this.statusDisplayLabel = Resource.msg('label.orderhistory.status.shipped', 'account', null);
            this.a11yViewOrderDetailsText = Resource.msgf('label.vieworderdetail.status.shipped', 'account', null, fulfillmentDetails.sfccOrderNumber);
        } else if (this.status === STATUSCANCELED) {
            this.statusDisplayLabel = Resource.msg('label.orderhistory.status.canceled', 'account', null);
            this.a11yViewOrderDetailsText = Resource.msgf('label.vieworderdetail.status.canceled', 'account', null, fulfillmentDetails.sfccOrderNumber);
        } else if (this.status === STATUSRETURNED) {
            this.statusDisplayLabel = Resource.msg('label.orderhistory.status.returned', 'account', null);
            this.a11yViewOrderDetailsText = Resource.msgf('label.vieworderdetail.status.returned', 'account', null, fulfillmentDetails.sfccOrderNumber);
        }
    }
}

module.exports = SomFulfillmentOrder;
