
var server = require('server');

server.get('Start', server.middleware.https, function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        res.render('ltkInclude.isml');
    }
    next();
});

module.exports = server.exports();
