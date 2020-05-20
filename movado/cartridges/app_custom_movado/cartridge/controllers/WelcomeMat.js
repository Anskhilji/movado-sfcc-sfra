'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.get('Show', server.middleware.https, consentTracking.consent, function (
  req,
  res,
  next
) {
    res.render('welcomeMat/welcomeMatModal');
    next();
});

server.get(
  'SetWelcomeMatHide',
  server.middleware.https,
  consentTracking.consent,
  function (req, res, next) {
      req.session.raw.custom.welcomeMat = false;
  }
);

module.exports = server.exports();
