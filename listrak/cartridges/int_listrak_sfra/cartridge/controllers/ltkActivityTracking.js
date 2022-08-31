var server = require('server');

server.get('TrackRequest', server.middleware.https, function (req, res, next) {
    var Site = require('dw/system/Site');
    var ltk = require('*/cartridge/scripts/objects/ltk.js');
    if (Site.getCurrent().getCustomPreferenceValue('Listrak_ActivityTracker_Enabled') &&
       dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var httpParameterMap = request.httpParameterMap;
        if (httpParameterMap.t.stringValue != null || httpParameterMap.title.stringValue != null) { return; }


        var source = httpParameterMap.source.stringValue;
        var pid = httpParameterMap.pid.stringValue;
        var format = httpParameterMap.format.stringValue;
        var _ltk = new ltk.LTK();

        if (source != null && source === 'quickview') {
            _ltk.AT.AddProductQuickBrowse(pid);
            return;
        }

        if (pid != null && format === null) {
            _ltk.AT.AddProductBrowse(pid);
            return;
        }
    }
    next();
});

server.get('ClearTracker', function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
	 	session.privacy.ProdBrowse = '';
	    session.privacy.QuickViewSkus = '';
	    session.privacy.SendActivity = false;
    }
});

module.exports = server.exports();
