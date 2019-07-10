'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.get('Show', server.middleware.https, consentTracking.consent, function (
  req,
  res,
  next
) {
    var ContentMgr = require('dw/content/ContentMgr');
    var apiContent = ContentMgr.getContent('welcome-olivia-burton-uk');
    res.render('welcomeMat/welcomeMatModal', {
        contentBody:
      apiContent && apiContent.custom.body ? apiContent.custom.body : '',
        currentCountry: request.geolocation.countryName // eslint-disable-line no-undef
    });
    next();
});

server.get(
  'SetWelcomeMatHide',
  server.middleware.https,
  consentTracking.consent,
  function (req, res, next) { // eslint-disable-line no-unused-vars
      req.session.raw.custom.welcomeMat = false; // eslint-disable-line no-param-reassign
  }
);

module.exports = server.exports();
