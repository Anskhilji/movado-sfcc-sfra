/**
* Purpose:	Submits Order data to Listrak.
* @input Order 				: dw.order.Order
* @output SCACart : String
* @output OrderCart	: String
*/

var server = require('server');
var ltk = require('*/cartridge/scripts/objects/ltk.js');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Site = require('dw/system/Site');

server.post('SendPost', csrfProtection.generateToken, server.middleware.https, function (req, res, next) {
    require('dw/system/Site');

    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var orderJSON = '';
        var scaJSON = '';

        var OrderMgr = require('dw/order/OrderMgr');
	    var orderNumber = session.privacy.OrderNumber;
	    var order = OrderMgr.getOrder(orderNumber);

        if (order)		{
            var _ltk = new ltk.LTK();
            _ltk.Order.LoadOrder(order);
            orderJSON = _ltk.Order.Serialize();

            var enabled = Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled');
            if (!empty(enabled) && enabled)			{
                _ltk.SCA.Cart.OrderNumber = order.orderNo;
                _ltk.SCA.LoadBasket(order);
                scaJSON = _ltk.SCA.Serialize();
            }
        }
        res.render('ltkSendOrder.isml', { SCACart: scaJSON, OrderCart: orderJSON });
    }
});

server.get('Send', function (req, res, next) {
    require('dw/system/Site');


    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var orderJSON = '';
        var scaJSON = '';


        var OrderMgr = require('dw/order/OrderMgr');
	    var orderNumber = session.privacy.OrderNumber;
	    var order = OrderMgr.getOrder(orderNumber);

        if (order)		{
            var _ltk = new ltk.LTK();
            _ltk.Order.LoadOrder(order);
            orderJSON = _ltk.Order.Serialize();

            var enabled = Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled');
            if (!empty(enabled) && enabled)			{
                _ltk.SCA.Cart.OrderNumber = order.orderNo;
                _ltk.SCA.LoadBasket(order);
                scaJSON = _ltk.SCA.Serialize();
            }
        }
        res.render('ltkSendOrder.isml', { SCACart: scaJSON, OrderCart: orderJSON });
    }
    next();
});

server.get('Clear', function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        session.privacy.SendOrder = false;
        session.privacy.OrderNumber = null;
    }
});

module.exports = server.exports();

