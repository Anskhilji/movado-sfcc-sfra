'use strict';

var server = require('server');

var customProductOptionsHelper = require('*/cartridge/scripts/helpers/customProductOptionsHelper');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');

server.extend(module.superModule);

// Added custom code for personalization text for Engraving and Embossing
//Added custom code for personalization text for Engraving and Embossing
server.append('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var viewData = res.getViewData();
    var addCartGtmArray;
    if (!viewData.error) {
        // variables for personalization message
        var embossedMessage = req.form.EmbossedMessage; // message to be Embossed Or Engraved  //'EM\nEngraveMessage';
        var engravedMessage = req.form.EngravedMessage;
        var orientation = req.form.orientation;
        var font = req.form.font;
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        if (embossedMessage || engravedMessage) {
            customProductOptionsHelper.updateOptionLineItem(currentBasket, viewData.pliUUID, embossedMessage, engravedMessage, orientation, font);
        }

    }
    next();
});

server.append(
    'Show',
    server.middleware.https,
    function (req, res, next) { 
        var countrySwitch = customCartHelpers.getCountrySwitch();

        if (countrySwitch && !empty(countrySwitch)) {
            res.viewData.countrySwitch = countrySwitch;
        }
        next();
    }
);

server.append('MiniCartShow', function (req, res, next) {
    
    var countrySwitch = customCartHelpers.getCountrySwitch();

    if (countrySwitch && !empty(countrySwitch)) {
        res.viewData.countrySwitch = countrySwitch;
    }

    next();
});


module.exports = server.exports();
