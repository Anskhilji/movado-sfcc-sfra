var server = require('server');

server.get('Show', server.middleware.https, function (req, res, next) {
    require('dw/system/Site');
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled)	{
        var ISML = require('dw/template/ISML');
        var Logger = require('dw/system/Logger');
        var logger = Logger.getLogger('ListrakLogs', 'LTKLog');
        logger.error('Pre template');
        res.render('ltkVersion.isml');
        logger.error('Post template');
    }
    next();
});

module.exports = server.exports();
