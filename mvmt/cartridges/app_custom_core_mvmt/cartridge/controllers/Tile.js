'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);
var cache = require('*/cartridge/scripts/middleware/cache');

server.append('Show', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var promotionObj = [];
    var activeProductPromotion = PromotionMgr.activePromotions.productPromotions;

    if(activeProductPromotion) {

       for (var i = 0; i < activeProductPromotion.length; i++) {
        var promotionId = activeProductPromotion[i].ID;
        var promotionName = activeProductPromotion[i].name;
        var promotionCreated = activeProductPromotion[i].startDate;
            promotionObj.push({
                id: promotionId,
                name: promotionName,
                creative: promotionCreated,
                position: ''
            });
        }
    }

    res.setViewData({promotionObj: JSON.stringify(promotionObj)});   

    next();
});

module.exports = server.exports();
