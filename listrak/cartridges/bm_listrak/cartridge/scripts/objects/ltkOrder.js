/**
* Purpose: Sends order information to Listrak
*/
require('dw/order');
require('dw/net');
require('dw/system');
require('dw/catalog');
require('dw/util');
require('dw/web');
require('dw/content');

var ExportUtil = require('~/cartridge/scripts/sync/ltkExportUtils');
var ltkHelper = require('~/cartridge/scripts/util/ltkHelper');
var Currency = require('dw/util/Currency');

/**
 * Object used to hold order information.
 * */
function Order() {
    this.HandlingTotal = null;
    this.OrderNumber = null;
    this.ItemTotal = null;
    this.TaxTotal = null;
    this.ShipTotal = null;
    this.OrderTotal = null;
    this.EmailAddress = null;
    this.FirstName = null;
    this.LastName = null;
    this.OrderDate = null;
    this.custom = null;
    this.Status = null;
    this.CouponCodes = null;
    this.TrackingNumbers = null;
    this.OrderItems = [];
    this.localPrice = null;
    this.currencyCode = null;
    this.OrderDiscount = null;
}

/**
* Object used to hold information on each order item.
*/
function OrderItem() {
    this.Sku = null;
    this.Price = null;
    this.Qty = null;
    this.TrackingNumber = null;
    this.Product = null;
    this.custom = null;
    this.ItemDiscount = null;
    this.DiscountedPrice = null;
}

/**
 *  Object that holds Order information as well as helper methods for
 * getting order data into a format suitable for submission to Listrak.
 * */
function ltkOrder() {
    this.Order = new Order();
}

/* Loads order information into the object. */
ltkOrder.prototype.LoadOrder = function (order) {
    /* Set the order information. */

     /* MSS[1474]. Get Order Prices by FX rates Conversions */
    this.Order.OrderNumber = order.orderNo;
    this.Order.ItemTotal = ltkHelper.getOrderItemTotal(order) || order.adjustedMerchandizeTotalNetPrice.value;
    this.Order.TaxTotal = ltkHelper.getOrderTaxTotal(order) || order.getTotalTax().value;
    this.Order.ShipTotal = ltkHelper.getOrderShipTotal(order) || order.getAdjustedShippingTotalNetPrice().value;
    this.Order.OrderTotal = ltkHelper.getOrderTotal(order) || order.totalGrossPrice.value;
    this.Order.localPrice = ltkHelper.getOrderItemTotalLocal(order) || ''; 
    this.Order.currencyCode = order.currencyCode; 
    /* MSS[1474]. Get Order Prices by FX rates Conversions */
    this.Order.EmailAddress = order.customerEmail;
    this.Order.FirstName = order.billingAddress.firstName;
    this.Order.LastName = order.billingAddress.lastName;
    this.Order.OrderDate = order.creationDate;
    this.Order.custom = order.custom;
    this.Order.Status = order.status.toString();
    var self = this;
    /* Grab the coupon codes. */
    var cCodes = [];
    order.getCouponLineItems().toArray().forEach(function (cli) {
        cCodes.push(cli.couponCode);
    });
    if (cCodes.length > 0) { this.Order.CouponCodes = cCodes.join(','); }

    /* Grab the tracking numbers. */
    var tNumbers = [];

    order.getShipments().toArray().forEach(function (shipment) {
        if (shipment.trackingNumber != null) { tNumbers.push(shipment.trackingNumber); }
    });

    if (tNumbers.length > 0) { this.Order.TrackingNumbers = tNumbers.join(','); }

    /* Load each order item. */
    order.allProductLineItems.toArray().forEach(function (orderItem) {
        var item = self.GetOrderItem(orderItem, order);
        if (!empty(item.Sku)) { self.Order.OrderItems.push(item); }
    });

    // Custom Start: Added Logic for order discount [MSS-1473]
    this.Order.OrderDiscount = this.getDiscountAmount(order.getPriceAdjustments(), order);
    // Custom End
};

/* Helper function to calculate the total order price. */
ltkOrder.prototype.orderTotal = function () {
    return this.Order.ItemTotal + this.Order.TaxTotal + this.Order.ShipTotal;
};

// Custom Start: Get the Order Line Item Total [MSS-1474]
ltkOrder.prototype.lineItemTotal = function (order) {
    var lineItemAmount = 0;
    var Money = require('dw/value/Money');
    var lineItemTotal = new Money(lineItemAmount, order.currencyCode);
    var lineItemIt = order.getProductLineItems().iterator();
    while (lineItemIt.hasNext()) {
        var lineItem = lineItemIt.next();
        lineItemTotal = lineItemTotal.add(lineItem.adjustedNetPrice);
    }
    if (order.custom.eswRetailerCurrencyCode) {
        return ltkHelper.getESWLineItemTotal(order, lineItemTotal);
    }

    return lineItemTotal.value;
}
// Custom End
ltkOrder.prototype.Serialize = function () {
    return encodeURI(JSON.stringify(this.Order));
};

/* Function to inflate an order item. */
ltkOrder.prototype.GetOrderItem = function (item, order) {
    var orderItem = new OrderItem();

    /* Ensure that the item has an associated product. */
    if (!empty(item.product)) {
        orderItem.Sku = item.product.ID;
        /* MSS[1474]. Get Product Price by FX rates Conversions */
        orderItem.Price = ltkHelper.getItemPrice(item.basePrice.value, this.Order) || item.basePrice.value.toFixed(2);
        orderItem.DiscountedPrice = ltkHelper.getItemPrice(item.adjustedPrice.value, this.Order) || item.adjustedPrice.value.toFixed(2) || ltkHelper.getProductPrice(item.product);
        orderItem.localPrice = ltkHelper.getCurrencySymbol(Currency.getCurrency(this.Order.currencyCode)) + (item.adjustedPrice.value.toFixed(2) || ltkHelper.getProductPrice(item.product));
        /* MSS[1474]. Get Product Price by FX rates Conversions */
    }

    if (!empty(item.shipment) && item.shipment.trackingNumber != null) {
        orderItem.TrackingNumber = item.shipment.trackingNumber;
    }

    orderItem.Qty = item.quantity.value;
    orderItem.Product = item.product;
    // Custom Start: Add logic to get discount amount [MSS-1473]
    orderItem.ItemDiscount = this.getDiscountAmount(item.getPriceAdjustments(), order);
    // Custom End

    return orderItem;
};


// Custom Start: Add logic to get discount [MSS-1473]
ltkOrder.prototype.getDiscountAmount = function (priceAdjustments, order) {
    var priceAdjustmentsItr = priceAdjustments.iterator();
    var discount = 0;
    while(priceAdjustmentsItr.hasNext()) {
        var priceAdjustment = priceAdjustmentsItr.next();
        discount += priceAdjustment.getPriceValue();
    }
    if (order.custom.eswRetailerCurrencyCode) {
        discount = ltkHelper.getESWDiscountAmount(order, discount);
        return discount;
    }
    return discount.toFixed(2);
};
// Custom End
