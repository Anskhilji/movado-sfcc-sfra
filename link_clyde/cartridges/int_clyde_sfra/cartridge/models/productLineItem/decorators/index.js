'use strict';
var base = module.superModule;

module.exports = {
    gift: base.gift,
    bonusProductLineItem: base.bonusProductLineItem,
    appliedPromotions: base.appliedPromotions,
    renderedPromotions: base.renderedPromotions,
    uuid: base.uuid,
    orderable: base.orderable,
    shipment: base.shipment,
    priceTotal: base.priceTotal,
    quantityOptions: base.quantityOptions,
    options: base.options,
    quantity: base.quantity,
    bundledProductLineItems: base.bundledProductLineItems,
    bonusProductLineItemUUID: base.bonusProductLineItemUUID,
    preOrderUUID: base.preOrderUUID,
    discountBonusLineItems: base.discountBonusLineItems,
    bonusUnitPrice: base.bonusUnitPrice,
    lineItemText: require('*/cartridge/models/productLineItem/decorators/lineItemText')
};
