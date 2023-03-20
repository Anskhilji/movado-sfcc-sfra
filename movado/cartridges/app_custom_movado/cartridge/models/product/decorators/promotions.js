'use strict';
var collections = require('*/cartridge/scripts/util/collections');

module.exports = function (object, promotions) {
    Object.defineProperty(object, 'promotions', {
        enumerable: true,
        value: promotions.length === 0 ? null : collections.map(promotions, function (promotion) {
            return {
                calloutMsg: promotion.calloutMsg ? promotion.calloutMsg.markup : '',
                details: promotion.details ? promotion.details.markup : '',
                enabled: promotion.enabled,
                id: promotion.ID,
                name: promotion.name,
                promotionClass: promotion.promotionClass,
                rank: promotion.rank,
                image: promotion.image,
                plpCalloutMsg: !empty(promotion.custom.calloutMessagePLP) ? promotion.custom.calloutMessagePLP.markup : '',
                promotionBadge: promotion.custom.promotionBadge,
                promotionMsg: !empty(promotion.custom.promotionMessage) ? promotion.custom.promotionMessage : '',
                progressBarPromoMsg: !empty(promotion.custom.progressBarPromoMsg) ? promotion.custom.progressBarPromoMsg : '',
                isPromoProgressBarEnable: !empty(promotion.custom.isPromoProgressBarEnable) ? promotion.custom.isPromoProgressBarEnable : ''
            };
        })
    });
};
