'use strict';

var server = require('server');
var Cart = module.superModule;

server.extend(Cart);


server.replace('AddProduct', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var previousBonusDiscountLineItems = currentBasket.getBonusDiscountLineItems();
    var productId = req.form.pid;
    var childProducts = Object.hasOwnProperty.call(req.form, 'childProducts')
        ? JSON.parse(req.form.childProducts)
        : [];
    var options = req.form.options ? JSON.parse(req.form.options) : [];
    var quantity;
    var result;
    var pidsObj;

    if (currentBasket) {
        Transaction.wrap(function () {
            if (!req.form.pidsObj) {
                quantity = parseInt(req.form.quantity, 10);
                result = cartHelper.addProductToCart(
                    currentBasket,
                    productId,
                    quantity,
                    childProducts,
                    options,
                    req.form
                );
            } else {
                // product set
                pidsObj = JSON.parse(req.form.pidsObj);
                result = {
                    error: false,
                    message: Resource.msg('text.alert.addedtobasket', 'product', null)
                };

                pidsObj.forEach(function (PIDObj) {
                    quantity = parseInt(PIDObj.qty, 10);
                    var pidOptions = PIDObj.options ? JSON.parse(PIDObj.options) : {};
                    var PIDObjResult = cartHelper.addProductToCart(
                        currentBasket,
                        PIDObj.pid,
                        quantity,
                        childProducts,
                        pidOptions
                    );
                    if (PIDObjResult.error) {
                        result.error = PIDObjResult.error;
                        result.message = PIDObjResult.message;
                    }
                });
            }
            if (!result.error) {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                basketCalculationHelpers.calculateTotals(currentBasket);
            }
        });
    }

    var quantityTotal = ProductLineItemsModel.getTotalQuantity(currentBasket.productLineItems);
    var cartModel = new CartModel(currentBasket);

    var urlObject = {
        url: URLUtils.url('Cart-ChooseBonusProducts').toString(),
        configureProductstUrl: URLUtils.url('Product-ShowBonusProducts').toString(),
        addToCartUrl: URLUtils.url('Cart-AddBonusProducts').toString()
    };

    var newBonusDiscountLineItem =
        cartHelper.getNewBonusDiscountLineItem(
            currentBasket,
            previousBonusDiscountLineItems,
            urlObject,
            result.uuid
        );
    if (newBonusDiscountLineItem) {
        var allLineItems = currentBasket.allProductLineItems;
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(allLineItems, function (pli) {
            if (pli.UUID === result.uuid) {
                Transaction.wrap(function () {
                    pli.custom.bonusProductLineItemUUID = 'bonus'; // eslint-disable-line no-param-reassign
                    pli.custom.preOrderUUID = pli.UUID; // eslint-disable-line no-param-reassign
                });
            }
        });
    }
    /**
     * Custom Start: Removing reportingURL as it is not supported in our code base
     */
    //var reportingURL = cartHelper.getReportingUrlAddToCart(currentBasket, result.error);
    // res.json({
    //     reportingURL: reportingURL,
    //     quantityTotal: quantityTotal,
    //     message: result.message,
    //     cart: cartModel,
    //     newBonusDiscountLineItem: newBonusDiscountLineItem || {},
    //     error: result.error,
    //     pliUUID: result.uuid,
    //     minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
    // });
    // res.json({
    //     quantityTotal: quantityTotal,
    //     message: result.message,
    //     cart: cartModel,
    //     newBonusDiscountLineItem: newBonusDiscountLineItem || {},
    //     error: result.error,
    //     pliUUID: result.uuid,
    //     minicartCountOfItems: Resource.msgf('minicart.count', 'common', null, quantityTotal)
    // });
    /**
     * Custom End
     */

    res.json({
        quantityTotal: quantityTotal,
        message: result.message,
        cart: cartModel,
        newBonusDiscountLineItem: newBonusDiscountLineItem || {},
        error: result.error,
        pliUUID: result.uuid
    })

    next();
});


server.append('RemoveProductLineItem', function (req, res, next) {
    var query = req.querystring;
    var deletedProductId = query.pid;
    var productUUID = query.uuid;
    var addClydeContract = require('*/cartridge/scripts/clydeAddContracts');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    var CartModel = require('*/cartridge/models/cart');
    var deletedContractUUIDs = [];
    Transaction.wrap(function () {
        deletedContractUUIDs = addClydeContract.updateContracts(currentBasket,deletedProductId,productUUID);
    });

    var basketModel = new CartModel(currentBasket);
    var basketModelPlus = {
        basket: basketModel,
        toBeDeletedUUIDs: deletedContractUUIDs ? deletedContractUUIDs : []
    };
    res.json(basketModelPlus);

    next();
});

server.append('UpdateQuantity', function (req, res, next) {
    var addClydeContract = require('*/cartridge/scripts/clydeAddContracts');
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var currentBasket = BasketMgr.getCurrentBasket();
    var CartModel = require('*/cartridge/models/cart');

    Transaction.wrap(function () {
        addClydeContract.updateContracts(currentBasket);
    });

    var basketModel = new CartModel(currentBasket);
    res.json(basketModel);

    return next();
});

module.exports = server.exports();