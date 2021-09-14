/**
* Purpose: Sends order information to Listrak
*/

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
    this.Status = null;
    this.CouponCodes = null;
    this.TrackingNumbers = null;
    this.OrderItems = [];
}

/**
 * Object used to hold information on each order item.
 * */
function OrderItem() {
    this.Sku = null;
    this.Price = null;
    this.Qty = null;
    this.TrackingNumber = null;
    this.Product = null;
}

/**
 * Object that holds Order information as well as helper methods for
 * getting order data into a format suitable for submission to Listrak.
 * */
function ltkOrder() {
    this.Order = new Order();
}

/* Loads order information into the object. */
ltkOrder.prototype.LoadOrder = function (order) {
	/* Set the order information. */
    this.Order.OrderNumber = order.orderNo;
    this.Order.ItemTotal = order.adjustedMerchandizeTotalNetPrice.value;
    this.Order.TaxTotal = order.getTotalTax().value;
    this.Order.ShipTotal = order.getAdjustedShippingTotalNetPrice().value;
    this.Order.OrderTotal = order.totalGrossPrice.value;
    this.Order.EmailAddress = order.customerEmail;
    this.Order.FirstName = order.billingAddress.firstName;
    this.Order.LastName = order.billingAddress.lastName;
    this.Order.OrderDate = order.creationDate;
    this.Order.Status = order.status.toString();

	/* Grab the coupon codes. */
    var cCodes = [];
    var index = 0;
    var coupons = order.getCouponLineItems();
    for (index = 0; index < coupons.length; index++) {
        var cli = coupons[index];
        cCodes.push(cli.couponCode);
    }


    if (cCodes.length > 0) { this.Order.CouponCodes = cCodes.join(','); }

	/* Grab the tracking numbers. */
    var tNumbers = [];

    index = 0;
    var shipments = order.getShipments();
    for (index = 0; index < shipments.length; index++)	{
        var shipment = shipments[index];
        if (shipment.trackingNumber != null) { tNumbers.push(shipment.trackingNumber); }
    }

    if (tNumbers.length > 0) { this.Order.TrackingNumbers = tNumbers.join(','); }

	/* Load each order item. */
    var orderItems = order.allProductLineItems;
    for (index = 0; index < orderItems.length; index++)	{
        var orderItem = orderItems[index];
		/* Add each item here. */
        var item = this.GetOrderItem(orderItem);
        if (!empty(item.Sku))			{ this.Order.OrderItems.push(item); }
    }
};

/* Helper function to calculate the total order price. */
ltkOrder.prototype.orderTotal = function () {
    return this.itemTotal + this.taxTotal + this.shipTotal;
};

ltkOrder.prototype.Serialize = function () {
    return encodeURI(JSON.stringify(this.Order));
};

/* Function to inflate an order item. */
ltkOrder.prototype.GetOrderItem = function (item) {
    var orderItem = new OrderItem();

	/* Ensure that the item has an associated product. */
    if (!empty(item.product)) {
        orderItem.Sku = item.product.ID;
        orderItem.Price = item.product.getPriceModel().getPrice().value;
    }

    if (!empty(item.shipment) && item.shipment.trackingNumber != null)	{
        orderItem.TrackingNumber = item.shipment.trackingNumber;
    }

    orderItem.Qty = item.quantity.value;
    orderItem.Product = item.product;

    return orderItem;
};


exports.ltkOrder = ltkOrder;
