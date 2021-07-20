var server = require('server');

var page = module.superModule;
server.extend(page);

server.replace('TrackRequest', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var ltk = require('*/cartridge/scripts/objects/ltk.js');
    var ltkHandler = require('*/cartridge/scripts/ltkHandler.js');
    if (Site.getCurrent().getCustomPreferenceValue('Listrak_ActivityTracker_Enabled') &&
        dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var httpParameterMap = request.httpParameterMap;
        if (httpParameterMap.t.stringValue != null || httpParameterMap.title.stringValue != null) { return; }


        var source = httpParameterMap.source.stringValue;
        var pid = httpParameterMap.pid.stringValue;
        var price = httpParameterMap.price.stringValue;
        var format = httpParameterMap.format.stringValue;
        var _ltk = new ltk.LTK();

        if (source != null && source === 'quickview') {
            _ltk.AT.AddProductQuickBrowse(pid);
            return;
        }

        if (pid != null && format === null) {
            _ltk.AT.AddProductBrowse(pid);
            session.privacy.ltkCountryCode = ltkHandler.getCountryCode(req);
            var product = ProductMgr.getProduct(pid);
            var ltkProductPrice = ltkHandler.getProductPrice(product);
            session.privacy.ltkProductPrice = ltkProductPrice;
            return;
        }
    }
    next();
});

server.replace('ClearTracker', function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
	 	session.privacy.ProdBrowse = '';
	 	session.privacy.ltkCountryCode = '';
	 	session.privacy.ltkProductPrice = '';
	    session.privacy.QuickViewSkus = '';
	    session.privacy.SendActivity = false;
    }
});

module.exports = server.exports();