'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var StoreMgr = require('dw/catalog/StoreMgr');

var page = module.superModule;
server.extend(page);

server.prepend(
    'Login',
    server.middleware.https,
    consentTracking.consent,
    userLoggedIn.validateLoggedInMCS,
    csrfProtection.generateToken,
    function (req, res, next) {
        
        return next();
    }
);


server.prepend(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    userLoggedIn.validateLoggedInMCS,
    csrfProtection.generateToken,
    function (req, res, next) {
        var viewData = res.getViewData();
        var preferedPickupStore;
        if(session.privacy.pickupStoreID){
            preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
        }
        viewData.pickupStore = preferedPickupStore;
        res.setViewData(viewData);
        
        next();
});

server.get('checkoutPickupStore', function (req, res, next) {
    var isBilling = req.querystring.isBilling;
    var preferedPickupStore;
    if (session.privacy.pickupStoreID) {
        preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
    }
    var templatePath = isBilling ? 'product/components/billingPickupStore.isml' : 'product/components/checkoutPickupStore.isml';

    res.render(templatePath, {
        preferedPickupStore: preferedPickupStore
    });

    return next();
});

module.exports = server.exports();
