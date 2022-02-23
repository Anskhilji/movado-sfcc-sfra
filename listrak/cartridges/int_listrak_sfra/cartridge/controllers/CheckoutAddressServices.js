
var server = require('server');
server.extend(module.superModule);
var ltkSendSca = require('~/cartridge/controllers/ltkSendSca.js');
var ltkSignupEmail = require('~/cartridge/controllers/ltkSignupEmail.js');

server.append('AddNewAddress', server.middleware.https, function (req, res, next) {
    if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        ltkSignupEmail.SignupPost();
        ltkSendSca.SendSCAPost();
    }
    next();
});

module.exports = server.exports();
