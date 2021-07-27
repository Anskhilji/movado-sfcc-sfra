
var server = require('server');

server.get('Start', server.middleware.https, function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        var ltkHelper = require('*/cartridge/scripts/ltkHelper.js');
        if (empty(session.privacy.ltkCountryCode)) {
            session.privacy.ltkCountryCode = ltkHelper.getCountryCode(req);
        }
        res.render('ltkInclude.isml');
    }
    next();
});

module.exports = server.exports();
