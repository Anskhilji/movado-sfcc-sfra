'use strict';

function getProductSetBasePrice(productID, currency, isJob) {
    var Currency = require('dw/util/Currency');
    var Money = require('dw/value/Money');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Transaction = require('dw/system/Transaction');

    var productSet = ProductMgr.getProduct(productID);
    var productSetProducts = productSet.productSetProducts.iterator();
    var currentProductSetProduct;
    var currentProdcutSetProductPriceModel;
    var basePrice = 0;
    var currencyCode;
    var formattedBasePrice;
    var defaultCurrency;
    if (isJob) {
        Transaction.wrap(function () {
            if (currency) {
                defaultCurrency = session.getCurrency();
                var sessionCurrency = Currency.getCurrency(currency);
                session.setCurrency(sessionCurrency);
            }
        });
    }

    while (productSetProducts.hasNext()) {
        currentProductSetProduct = productSetProducts.next();
        currentProdcutSetProductPriceModel = currentProductSetProduct.priceModel;
        if (currentProdcutSetProductPriceModel.price.available) {
            currencyCode = currentProdcutSetProductPriceModel.price.currencyCode;
            basePrice += currentProdcutSetProductPriceModel.price.decimalValue;
        }
    }

    formattedBasePrice = new Money(basePrice, currencyCode).toFormattedString();

    if (isJob) {
        if (currency && defaultCurrency) {
            session.setCurrency(defaultCurrency);
        }
    }

    return {
        basePrice: basePrice,
        formattedBasePrice: formattedBasePrice,
        currencyCode: currencyCode
    }
}

function getProductSetSalePrice(productID, currency, isJob) {
    var Currency = require('dw/util/Currency');
    var Money = require('dw/value/Money');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var Transaction = require('dw/system/Transaction');

    var productSet = ProductMgr.getProduct(productID);
    var Promotion = require('dw/campaign/Promotion');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var productSetProducts = productSet.productSetProducts.iterator();
    var currentPromotionalPrice = Money.NOT_AVAILABLE;
    var salePrice = 0;
    var currentProductSetProduct;
    var formattedSalePrice;
    var currencyCode;
    var currentProdcutSetProductPriceModel;
    var promoCalloutMsg;
    var defaultCurrency;

    if (isJob) {
        Transaction.wrap(function () {
            if (currency) {
                defaultCurrency = session.getCurrency();
                var sessionCurrency = Currency.getCurrency(currency);
                session.setCurrency(sessionCurrency);
            }
        });
    }

    while (productSetProducts.hasNext()) {
        currentProductSetProduct = productSetProducts.next();
        currentProdcutSetProductPriceModel = currentProductSetProduct.priceModel;
        var PromotionItr = PromotionMgr.activePromotions.getProductPromotions(currentProductSetProduct).iterator();
        var promoDateItr = PromotionItr;
        if (!empty(PromotionItr)) {
            for each(var promo in PromotionItr) {
                if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT) && !promo.basedOnCoupons) {
                    if (currentProductSetProduct.optionProduct) {
                        currentPromotionalPrice = promo.getPromotionalPrice(currentProductSetProduct, currentProductSetProduct.getOptionModel());
                        promoCalloutMsg = promo.calloutMsg ? promo.calloutMsg.markup : '';

                    } else {
                        currentPromotionalPrice = promo.getPromotionalPrice(currentProductSetProduct);
                        promoCalloutMsg = promo.calloutMsg ? promo.calloutMsg.markup : '';
                    }
                    break;
                }
            }
        }

        if (currentPromotionalPrice && currentPromotionalPrice.available && currentProdcutSetProductPriceModel.price.available) {
            currencyCode = currentProdcutSetProductPriceModel.price.currencyCode;
            salePrice += currentPromotionalPrice.decimalValue;
        }
    }
    var salePriceEffectiveDate = getProductSetEfectiveDate(productID);
    formattedSalePrice = new Money(salePrice, currencyCode).toFormattedString();

    if (isJob) {
        if (currency && defaultCurrency) {
            session.setCurrency(defaultCurrency);
        }
    }

    return {
        salePrice: salePrice,
        formattedSalePrice: formattedSalePrice,
        promoCalloutMsg: promoCalloutMsg,
        salePriceEffectiveDate: salePriceEffectiveDate,
        currencyCode: currencyCode
    }
}

function getProductSetEfectiveDate(productID) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productSet = ProductMgr.getProduct(productID);
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var productSetProducts = productSet.productSetProducts.iterator();
    var startDate;
    var endDate;
    var firstDateValidator = true;

    while (productSetProducts.hasNext()) {
        var currentProductSet = productSetProducts.next();
        var promoDateItr = PromotionMgr.activePromotions.getProductPromotions(currentProductSet).iterator();
        if (!empty(promoDateItr)) {
            for each(var promotion in promoDateItr) {
                var getPromotionalDates = getPromoDate(promotion, startDate, endDate, firstDateValidator);
                startDate = getPromotionalDates.startDate;
                endDate = getPromotionalDates.endDate;
            }
        }
    }

    if (!empty(startDate)) {
        startDate = new Date(startDate * 1000.0);
    }
    if (!empty(endDate)) {
        endDate = new Date(endDate * 1000.0);
    }
    var salePriceEffectiveDate = getSalePriceEffectiveDate(startDate, endDate);

    return salePriceEffectiveDate;
}

function getPromoDate(promotion, startDate, endDate, firstDateValidator) {
    if (promotion.startDate && promotion.endDate) {
        if (firstDateValidator == true) {
            var formatedStartDate = new Date(promotion.startDate);
            startDate = formatedStartDate.getTime() / 1000.0;
            var formatedEndDate = new Date(promotion.endDate);
            endDate = formatedEndDate.getTime() / 1000.0;
            firstDateValidator = false;
        }
        var promoFormatedStartDate = new Date(promotion.startDate);
        var promoStartDate = promoFormatedStartDate.getTime() / 1000.0;
        var promoFormatedEndDate = new Date(promotion.endDate);
        var promoEndDate = promoFormatedEndDate.getTime() / 1000.0;

        if (promoStartDate < startDate) {
            startDate = promoStartDate;
        }

        if (promoEndDate > endDate) {
            endDate = promoEndDate;
        }
    }
    return {
        startDate: startDate,
        endDate: endDate
    }
}

/**
 * This method is used to get end date of a product campaign after promotion
 * @param {Date} startDate endDate
 * @returns {Date} end date.
 */
function getSalePriceEffectiveDate(startDate, endDate) {
    var commonUtils = require('*/cartridge/scripts/utils/commonUtils');
    var Constants = require('*/cartridge/scripts/utils/Constants');
    var Calendar = require('dw/util/Calendar');
    var campaignStartingDate = '';
    var campaignEndingDate = '';
    var currentDateTime = new Calendar();
    if (!empty(startDate)) {
        campaignStartingDate = commonUtils.formatDateTimeISO_8601(new Calendar(startDate));
    } else {
        campaignStartingDate = commonUtils.formatDateTimeISO_8601(currentDateTime);
    }
    if (!empty(endDate)) {
        campaignEndingDate = commonUtils.formatDateTimeISO_8601(new Calendar(endDate));
    } else {
        currentDateTime.add(currentDateTime.YEAR, "1");
        campaignEndingDate = commonUtils.formatDateTimeISO_8601(currentDateTime);
    }

    return campaignStartingDate + Constants.PROMOTION_START_END_DATE_SEPARATOR + campaignEndingDate;
}

module.exports = {
    getProductSetBasePrice: getProductSetBasePrice,
    getProductSetSalePrice: getProductSetSalePrice
};