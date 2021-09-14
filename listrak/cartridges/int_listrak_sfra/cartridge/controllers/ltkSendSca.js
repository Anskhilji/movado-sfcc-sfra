/**
/* Purpose:    Sets a flag to send (or not send) cart information to Listrak via client side scripting.
*
* @input  Basket : dw.order.Basket
*/
var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.post('SendSCAPost', csrfProtection.generateToken, server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    if (Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled') &&
	   dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var params = request.httpParameterMap;
        var format = params.format.stringValue == null ? '' : params.format.stringValue.toLowerCase();
        session.privacy.SCAFormat = format;
        session.privacy.SendSCA = true;
    }
});

server.get('SendSCA', function (req, res, next) {
    var Site = require('dw/system/Site');
    if (Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled') &&
	   dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var params = request.httpParameterMap;
        var format = params.format.stringValue == null ? '' : params.format.stringValue.toLowerCase();
        session.privacy.SCAFormat = format;
        session.privacy.SendSCA = true;
    }
});

server.get('RenderSca', function (req, res, next) {
    var Site = require('dw/system/Site');
    if (Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled') &&
	   dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var Listrak = require('*/cartridge/scripts/objects/ltk.js');

	    var BasketMgr = require('dw/order/BasketMgr');

	    var json = '';
	    var _ltk = new Listrak.LTK();

	    var Basket = BasketMgr.getCurrentBasket();

	    if (Basket == null) { return; }

	    if (Basket.allProductLineItems.length > 0) {
	        if (_ltk.SCA.LoadBasket(Basket)) {//eslint-disable-line
	            json = _ltk.SCA.Serialize();//eslint-disable-line
	        }
	    } else {
	        _ltk.SCA.ClearCart();//eslint-disable-line
	        json = _ltk.SCA.Serialize();//eslint-disable-line
	    }
	    res.render('ltkSendSCA', { SCACart: json });
    }
    next();
});

server.get('ClearFlag', function (req, res, next) {
    var Site = require('dw/system/Site');
    if (Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled') &&
	   dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        session.privacy.SendSCA = false;
	    session.privacy.SCAFormat = '';
    }
});


module.exports = server.exports();
