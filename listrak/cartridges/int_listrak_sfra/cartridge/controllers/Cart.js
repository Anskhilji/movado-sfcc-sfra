var server = require('server');
server.extend(module.superModule);
var cart = require('app_storefront_base/cartridge/controllers/Cart');
server.extend(cart);
var ltkSendSca = require('~/cartridge/controllers/ltkSendSca');
var ltkHelper = require('*/cartridge/scripts/helper/ltkHelper');
var ltkCartHelper = require('*/cartridge/scripts/helper/ltkCartHelper');
var URLUtils = require('dw/web/URLUtils');
/**
 * Extension method for AddProduct
 */
server.append('AddProduct', server.middleware.https, function (req, res, next) {
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        session.privacy.ltkCountryCode = ltkHelper.getCountryCode(req);
        ltkSendSca.SendSCAPost();
        res.setViewData({
            SCACart: ltkCartHelper.ltkLoadBasket(),
            listrakCountryCode: session.privacy.ltkCountryCode
        });
    }
    next();
});

server.append('RemoveProductLineItem', server.middleware.https, function (req, res, next) {
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        session.privacy.ltkCountryCode = ltkHelper.getCountryCode(req);
        ltkSendSca.SendSCA();
        res.setViewData({
            SCACart: ltkCartHelper.ltkLoadBasket(),
            listrakCountryCode: session.privacy.ltkCountryCode
        });
    }
    next();
});

server.append('UpdateQuantity', server.middleware.https, function (req, res, next) {
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        session.privacy.ltkCountryCode = ltkHelper.getCountryCode(req);
        ltkSendSca.SendSCA();
        res.setViewData({
            SCACart: ltkCartHelper.ltkLoadBasket(),
            listrakCountryCode: session.privacy.ltkCountryCode
        });
    }
    next();
});

module.exports = server.exports();
