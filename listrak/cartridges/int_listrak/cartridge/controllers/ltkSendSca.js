/**
* Purpose:	Sets a flag to send (or not send) cart information to Listrak via client side scripting.
*
* @input  Basket : dw.order.Basket
*/
var Site = require('dw/system/Site');
var Listrak = require('*/cartridge/scripts/objects/ltk.js');
var ISML = require('dw/template/ISML');
var BasketMgr = require('dw/order/BasketMgr');

exports.SendSCA = function sendSca() {
    var enabled = Site.getCurrent().getCustomPreferenceValue('Listrak_SCA_Enabled') && dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled;
    if (!empty(enabled) && enabled)	{
	    var params = request.httpParameterMap;
	    var format = params.format.stringValue == null ? '' : params.format.stringValue.toLowerCase();
	    session.privacy.SCAFormat = format;
        session.privacy.SendSCA = true;
    }
};

/**
 * Clears privacy variables
 */
function clearFlag() {
    if (!dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)		{ return; }

    session.privacy.SendSCA = false;
    session.privacy.SCAFormat = '';
}
exports.ClearFlag = clearFlag;
exports.ClearFlag.public = true;

/**
 * Renders template for SCA
 */
function renderSca() {
    if (!dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)		{ return; }
    var json = '';
    var _ltk = new Listrak.LTK();

    var Basket = BasketMgr.getCurrentBasket();

    if (Basket !== null && Basket.allProductLineItems !== null && Basket.allProductLineItems.length > 0) {
    	if (_ltk.SCA.LoadBasket(Basket))    	{
    		json = _ltk.SCA.Serialize();
    	}
    } else {
    	_ltk.SCA.ClearCart();
    	json = _ltk.SCA.Serialize();
    }
    ISML.renderTemplate('ltkSendSCA', { SCACart: json });
}
exports.RenderSca = renderSca;
exports.RenderSca.public = true;
