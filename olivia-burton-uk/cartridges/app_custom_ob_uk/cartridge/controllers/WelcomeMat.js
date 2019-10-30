'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Site = require('dw/system/Site');
var ContentMgr = require('dw/content/ContentMgr');

server.get('Show', server.middleware.https, consentTracking.consent, function (
  req,
  res,
  next
) {
    
    var apiContent = ContentMgr.getContent('welcome-mat-olivia-burton');
    var Cookie = require('*/cartridge/scripts/helpers/cookieWelcomeMat');
    var redirectionHelper = require('*/cartridge/scripts/helpers/redirectionHelper');
    
    var redirectionCookie = Cookie.getCookie('redirectTo');
    var redirection = redirectionHelper.getRedirection(redirectionCookie);
    if (redirection.countryFlag) {
        res.render('welcomeMat/welcomeMatModal', {
             contentBody:
             apiContent && apiContent.custom.body ? apiContent.custom.body: '',
             currentCountry: request.geolocation.countryName,
             currentWebsite: redirection.shippingCountry,
             shippingURL: redirection.shippingURL
        });
    } 
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
