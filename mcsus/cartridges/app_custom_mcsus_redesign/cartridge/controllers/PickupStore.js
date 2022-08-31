'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.replace('GetPreferredStore', function (req, res, next) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var preferedPickupStore;
    var isPdp = req.querystring.isPdp;
    var address1;
    var phone;
    var template = null;

    // Custom Comment Start: A/B testing for OB Redesign PDP
    if (ABTestMgr.isParticipant('MCSRedesignPDPABTest','Control')) {
        template = 'product/components/pdpStorePickUp';
    } else if (ABTestMgr.isParticipant('MCSRedesignPDPABTest','render-new-design')) {
        template =  'product/components/pdpStorePickUpRedesign';
    } else {
        template = 'product/components/pdpStorePickUp';
    }

    if (session.privacy.pickupStoreID) {
        preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
        address1 = preferedPickupStore.address1;
        phone = preferedPickupStore.phone;
    }
    var storeObject = {
        address1: address1,
        phone: phone
    }
    res.render(isPdp ? template : 'modalpopup/modelPopUpButton', {
        storeObject: storeObject,
        isPdp: isPdp
    });
    return next();
});

module.exports = server.exports();