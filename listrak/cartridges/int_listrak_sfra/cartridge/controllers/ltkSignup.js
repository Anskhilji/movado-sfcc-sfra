
var server = require('server');

server.get('Start', server.middleware.https, function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var Site = require('dw/system/Site');
        var subpoints = Site.getCurrent().getCustomPreferenceValue('Listrak_Signup');
        var subpointList = [];
        for (var i = 0; i < subpoints.length; i++) { subpointList[i] = subpoints[i]; }
        res.render('ltkSubPoints.isml', { subpointcode: subpointList });
    }
    next();
});

module.exports = server.exports();
