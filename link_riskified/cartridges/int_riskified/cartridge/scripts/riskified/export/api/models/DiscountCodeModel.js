function collectPriceAdjustments(priceAdjustmentsIterator) {
    var priceAdjustment,
        accumulator = [];

    while (priceAdjustmentsIterator.hasNext()) {
        priceAdjustment = priceAdjustmentsIterator.next();
        accumulator.push({
            amount : Math.abs(priceAdjustment.price.decimalValue.get()),
            code   : priceAdjustment.basedOnCoupon ? priceAdjustment.couponLineItem.couponCode : priceAdjustment.promotionID
        });
    }

    return accumulator;
}

function create(order) {
    var discounts = [],
        couponLineItemsItr;

    // order level price adjustments
    if (!empty(order.getPriceAdjustments())) {
        discounts.push.apply(discounts, collectPriceAdjustments(order.getPriceAdjustments().iterator()));
    }

    // shipping price adjustments
    if (!empty(order.allShippingPriceAdjustments)) {
        discounts.push.apply(discounts, collectPriceAdjustments(order.allShippingPriceAdjustments.iterator()));
    }

    // product and productshipping priceadjustments
    var productLineItems = order.getAllProductLineItems().iterator();

    while (productLineItems.hasNext()) {
        var productLineItem = productLineItems.next();

        // product price adjustments
        if (productLineItem.priceAdjustments) {
            discounts.push.apply(discounts, collectPriceAdjustments(productLineItem.priceAdjustments.iterator()));
        }

        // product shipping line item price adjustments
        var productShippingLineItem = productLineItem.getShippingLineItem();
        if (!empty(productShippingLineItem)) {
            discounts.push.apply(discounts, collectPriceAdjustments(productShippingLineItem.priceAdjustments.iterator()));
        }
    }
/*
    if (!empty(order.getCouponLineItems())) {
    	couponLineItemsItr = order.getCouponLineItems().iterator();

        while (couponLineItemsItr.hasNext()) {
            var couponLineItem = couponLineItemsItr.next();
            var couponPriceAdjItr = couponLineItem.getPriceAdjustments().iterator();
            while (couponPriceAdjItr.hasNext()){
            	var couponPriceAdj = couponPriceAdjItr.next();
            	discounts.push({
                    amount : getPrice(Math.abs(couponPriceAdj.price.decimalValue.get())),
                    code   : couponLineItem.couponCode
                });
            }
        }
    }
*/
    return discounts;
}

function getPrice (price) {
    return new Number(price).toFixed(2);
}

exports.create = create;
