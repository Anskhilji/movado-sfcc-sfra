/**
* Purpose:	Submits Order data to Listrak.
* @input Order 				: dw.order.Order
* @output SCACart : String
* @output OrderCart	: String
*/
var server = require('server');

var page = module.superModule;
server.extend(page);

var ltk = require('*/cartridge/scripts/objects/ltk.js');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Site = require('dw/system/Site');

server.replace('Send', function (req, res, next) {
    require('dw/system/Site');
    var ltkHelper = require('*/cartridge/scripts/helper/ltkHelper.js');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        var orderJSON = '';
        var scaJSON = '';


        var OrderMgr = require('dw/order/OrderMgr');
        var orderNumber = session.privacy.OrderNumber;
        var order = OrderMgr.getOrder(orderNumber);

        if (order) {
            var _ltk = new ltk.LTK();
            _ltk.Order.LoadOrder(order);
            orderJSON = _ltk.Order.Serialize();

            var enabled = Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled');
            if (!empty(enabled) && enabled) {
                _ltk.SCA.Cart.OrderNumber = order.orderNo;
                _ltk.SCA.LoadBasket(order);
                scaJSON = _ltk.SCA.Serialize();
            }
        }
        //Custom Start [MSS-1450]: Store countryCode in session
        session.privacy.ltkCountryCode = ltkHelper.getCountryCode(req);
        //Custom End:
        res.render('ltkSendOrder.isml', { SCACart: scaJSON, OrderCart: orderJSON });
    }
    next();
});

server.replace('Clear', function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        session.privacy.SendOrder = false;
        session.privacy.OrderNumber = null;
        session.privacy.OrderNumber = null;
        session.privacy.ltkCountryCode = ''; //Remove session value [MSS-1450]
    }
});

module.exports = server.exports();

