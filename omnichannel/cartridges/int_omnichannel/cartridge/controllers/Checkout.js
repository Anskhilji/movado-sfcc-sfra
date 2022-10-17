
'use strict';

var server = require('server');

var StoreMgr = require('dw/catalog/StoreMgr');

var page = module.superModule;
server.extend(page);

server.get('CheckoutPickupStore', function (req, res, next) {
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