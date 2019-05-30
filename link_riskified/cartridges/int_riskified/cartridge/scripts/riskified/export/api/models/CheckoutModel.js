/**
 * The Checkout object has exactly the same structure as an Order model
 * Only the 'id' field holds the checkout identifier which is used to link between this Checkout model and its matching Order model.
 *
 * @param {Object} riskifiedOrder
 */

function create(riskifiedOrder) {
    var riskifiedCheckout;

    riskifiedCheckout = {
        checkout: riskifiedOrder.order
    };
    var orderId = riskifiedOrder.order.id;
    riskifiedCheckout.checkout.id = riskifiedOrder.order.checkout_id;
    riskifiedCheckout.checkout.order_id = orderId;

    return riskifiedCheckout;
}

exports.create = create;
