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
var constant = require('*/cartridge/scripts/helpers/constants');

/**
 * Object used to hold order information.
 * */
function Order() {
    this.HandlingTotal = null;
    this.OrderNumber = null;
    this.ItemTotal = null;
    this.TaxTotal = null;
    this.TaxTotalUSD = null;
    this.ShipTotal = null;
    this.ShipTotalUSD = null;
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
    this.CurrencyCodeUSD = null;
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
    this.CurrencyCode = null;
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
    this.Order.currencyCode = order.currencyCode; 
    /* MSS[1474]. Get Order Prices by FX rates Conversions */
    this.Order.EmailAddress = order.customerEmail;
    this.Order.FirstName = order.billingAddress.firstName;
    this.Order.LastName = order.billingAddress.lastName;
    this.Order.OrderDate = order.creationDate;
    this.Order.custom = order.custom;
    this.Order.Status = order.status.toString();
    this.Order.CurrencyCodeUSD = constant.USD_CURRENCY_CODE;
    var self = this;
    /* Grab the coupon codes. */
    var cCodes = [];
    var getOrderTaxTotalUSD = ltkHelper.getOrderTaxTotal(order) || order.getTotalTax().value;
    var getOrderShipTotalUSD = ltkHelper.getOrderShipTotal(order) || order.getAdjustedShippingTotalNetPrice().value;
    var localPrice = ltkHelper.getOrderItemTotalLocalConvertToUSD(order) || '';
    this.Order.localPrice = ltkHelper.priceConversionUSD(localPrice, order);
    this.Order.TaxTotalUSD = ltkHelper.priceConversionUSD(getOrderTaxTotalUSD, order);
    this.Order.ShipTotalUSD = ltkHelper.priceConversionUSD(getOrderShipTotalUSD, order);
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
    var OrderDiscunt = this.getDiscountAmount(order.getPriceAdjustments(), order);
    this.Order.OrderDiscount = ltkHelper.priceConversionUSD(OrderDiscunt, order);
    // Custom End
};

/* Helper function to calculate the total order price. */
ltkOrder.prototype.orderTotal = function () {
    var orderTotal =  this.Order.ItemTotal + this.Order.TaxTotal + this.Order.ShipTotal;
    var orderTotalUSD = ltkHelper.priceConversionUSD(orderTotal, this.Order);
    return orderTotalUSD;
}

/* Helper function to calculate the total order price and convert into USD. */
ltkOrder.prototype.getOrderTaxTotalUSD = function (order) {
    var orderTotal =  this.Order.ItemTotal + this.Order.TaxTotal + this.Order.ShipTotal;
    var orderTotalUSD = ltkHelper.priceConversionUSD(orderTotal, this.Order);
    return orderTotalUSD;
}
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
        var getESWLineItemTotal = ltkHelper.getESWLineItemTotal(order, lineItemTotal);
        var getESWLineItemTotalUSD =  ltkHelper.priceConversionUSD(getESWLineItemTotal, this.Order);
        return getESWLineItemTotalUSD;
    }

    lineItemTotalUSD = ltkHelper.priceConversionUSD(lineItemTotal.value, this.Order);
    return lineItemTotalUSD;
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
        /* MSS[2017]. Listrak - All Brands - Order Export Job Updates */
        var price = ltkHelper.getItemPrice(item.basePrice.value, this.Order) || item.basePrice.value.toFixed(2);
        var discountedPrice = ltkHelper.getItemPrice(item.adjustedPrice.value, this.Order) || item.adjustedPrice.value.toFixed(2) || ltkHelper.getProductPrice(item.product);
        var localPrice = (item.adjustedPrice.value.toFixed(2) || ltkHelper.getProductPrice(item.product));

        orderItem.Price = ltkHelper.priceConversionUSD(price, this.Order);
        orderItem.DiscountedPrice = ltkHelper.priceConversionUSD(discountedPrice, this.Order);
        orderItem.localPrice = ltkHelper.priceConversionUSD(localPrice, this.Order);

        /* MSS[1474]. Listrak - All Brands - Order Export Job Updates */
    }

    if (!empty(item.shipment) && item.shipment.trackingNumber != null) {
        orderItem.TrackingNumber = item.shipment.trackingNumber;
    }

    orderItem.Qty = item.quantity.value;
    orderItem.Product = item.product;
    // Custom Start: Add logic to get discount amount [MSS-1473]
    var ItemDiscount = this.getDiscountAmount(item.getPriceAdjustments(), order);
    orderItem.ItemDiscount = ltkHelper.priceConversionUSD(ItemDiscount, this.Order);
    orderItem.CurrencyCode = constant.USD_CURRENCY_CODE;
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
