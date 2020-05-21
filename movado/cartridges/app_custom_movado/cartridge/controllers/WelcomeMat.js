'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.get('Show', server.middleware.https, consentTracking.consent, function (
  req,
  res,
  next
) {
    var ContentMgr = require('dw/content/ContentMgr');
    var apiContent = ContentMgr.getContent('welcome-mat');
    res.render('welcomeMat/welcomeMatModal', {
        contentBody:
      apiContent && apiContent.custom.body ? apiContent.custom.body : '',
        currentCountry: request.geolocation.countryName
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
