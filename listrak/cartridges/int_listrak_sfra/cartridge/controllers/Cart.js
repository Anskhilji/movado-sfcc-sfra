var server = require('server');
server.extend(module.superModule);
var cart = require('app_storefront_base/cartridge/controllers/Cart');
server.extend(cart);
var ltkSendSca = require('~/cartridge/controllers/ltkSendSca');

/**
 * Extension method for AddProduct
 */
server.append('AddProduct', server.middleware.https, function (req, res, next) {
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        ltkSendSca.SendSCAPost();
    }
    next();
});

server.append('RemoveProductLineItem', server.middleware.https, function (req, res, next) {
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        ltkSendSca.SendSCA();
    }
    next();
});

server.append('UpdateQuantity', server.middleware.https, function (req, res, next) {
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        ltkSendSca.SendSCA();
    }
    next();
});

module.exports = server.exports();
