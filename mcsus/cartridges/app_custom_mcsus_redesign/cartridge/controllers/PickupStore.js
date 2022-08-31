'use strict';

var server = require('server');

server.replace('GetPreferredStore', function (req, res, next) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var preferedPickupStore;
    var isPdp = req.querystring.isPdp;
    var address1;
    var phone;
    if (session.privacy.pickupStoreID) {
        preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
        address1 = preferedPickupStore.address1;
        phone = preferedPickupStore.phone;
    }
    var storeObject = {
        address1: address1,
        phone: phone
    }
    res.render(isPdp ? 'product/components/pdpStorePickUpRedesign' : 'modalpopup/modelPopUpButton', {
        storeObject: storeObject,
        isPdp: isPdp
    });
    return next();
});

module.exports = server.exports();