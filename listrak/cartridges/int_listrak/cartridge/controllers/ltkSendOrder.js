/**
* Purpose:	Submits Order data to Listrak.
* @input Order 				: dw.order.Order
* @output SCACart : String
* @output OrderCart	: String
*/
var ltk = require('*/cartridge/scripts/objects/ltk.js');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var ISML = require('dw/template/ISML');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * Sends SCA order data
 */
function send() {
    if (!dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)		{ return; }

	/* Read the order object from the pipeline dictionary parameter. */
    var orderJSON = '';
    var scaJSON = '';

    var orderNumber = session.privacy.OrderNumber;
    var order = OrderMgr.getOrder(orderNumber);

	/* If we have an order, prepare the data into an object we can consume. */
    if (order)	{
		/* Load the order, serialize it and set it to the argument to be used client side. */
        var _ltk = new ltk.LTK();
        _ltk.Order.LoadOrder(order);
        orderJSON = _ltk.Order.Serialize();

		/* If SCA is enabled, we want to close the session since the cart items were purchased. */
        var enabled = Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled');
        if (!empty(enabled) && enabled)		{
            _ltk.SCA.Cart.OrderNumber = order.orderNo;
            _ltk.SCA.LoadBasket(order);

            scaJSON = _ltk.SCA.Serialize();
        }
    }

	/* Set the order and sca objects for consumption via client side script. */
    ISML.renderTemplate('ltkSendOrder', { SCACart: scaJSON, OrderCart: orderJSON });
}

/**
 * Sets flags to process order sending
 * @param {*} order input order object
 */
function start(order) {
    if (!dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)		{ return; }

	/* Set the flag to denote that order info should be sent.
	 * Set the order number so we can retrieve it from other pipelines. */
    session.privacy.SendOrder = true;
    session.privacy.OrderNumber = order.orderNo;
}

/**
 * Clears privacy variables
 */
function clearFlag() {
    session.privacy.SendOrder = false;
    session.privacy.OrderNumber = null;
}
exports.Clear = clearFlag;
exports.Clear.public = true;
exports.Start = start;
exports.Send = send;
exports.Send.public = true;

