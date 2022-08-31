var server = require('server');
server.extend(module.superModule);


server.append('Show', server.middleware.https, function (req, res, next) {
    var ltkActivityTracking = require('~/cartridge/controllers/ltkActivityTracking.js');
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        ltkActivityTracking.TrackRequest();
    }
    next();
});

module.exports = server.exports();
