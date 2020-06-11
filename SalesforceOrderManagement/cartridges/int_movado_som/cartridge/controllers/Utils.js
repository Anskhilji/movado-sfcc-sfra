/* eslint-disable indent */
'use strict';

var server = require('server');
var CartHelpers = require('*/cartridge/scripts/cart/cartHelpers');

/**
 * @param {dw.order.Basket} b a basket
 */
function addRandomProducts(b) {
  var CatalogMgr = require('dw/catalog/CatalogMgr');
  var ProductSearchModel = require('dw/catalog/ProductSearchModel');

  var siteRootCategory = CatalogMgr.getSiteCatalog().getRoot();
  var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ? siteRootCategory.getOnlineSubCategories() : null;

  var psm = new ProductSearchModel();
  var cat;
  do {
    var posCategory = Math.floor(Math.random() * Math.floor(topLevelCategories.length));
    cat = topLevelCategories[posCategory];
  }
  while (!cat.hasOnlineProducts());

  psm.setCategoryID(cat.getID());
  psm.setOrderableProductsOnly(true);
  psm.search();
  var productHit = psm.getProductSearchHits().next();
  var posProduct = Math.floor(Math.random() * Math.floor(psm.count));
  for (var i = 0; i < posProduct; i++) {
    productHit = psm.productSearchHits.next();
  }
  CartHelpers.addProductToCart(b, productHit.productID, 1, null, {});
}

/**
 * @param {dw.order.Basket} b a basket
 */
function removeExistingInstruments(b) {
  // get all credit card payment instruments
  var ccPaymentInstrs = b.getPaymentInstruments('CREDIT_CARD');
  var iter = ccPaymentInstrs.iterator();
  var existingPI = null;

  // remove them
  while (iter.hasNext()) {
    existingPI = iter.next();
    b.removePaymentInstrument(existingPI);
  }
}

/**
 * @param {dw.customer.CustomerAddress} a a customer address
 */
function setRandomOrderAddress(a) {
  a.setFirstName('Isabella');
  a.setLastName('Williams');
  a.setAddress1('3498 E 47th Ave');
  a.setAddress2('Apt 4B');
  a.setCity('Dallas');
  a.setStateCode('TX');
  a.setPostalCode('75240');
  a.setCountryCode('US');
  a.setPhone('312-456-7894');
  a.setCompanyName('A Company Here');
}

/**
 * @param {dw.order.Basket} b a basket
 */
function setRandomShippingMethod(b) {
  var ShippingMgr = require('dw/order/ShippingMgr');
  var methods = ShippingMgr.getShipmentShippingModel(b.defaultShipment).applicableShippingMethods.toArray();
  var pos = Math.floor(Math.random() * Math.floor(methods.length));
  b.defaultShipment.setShippingMethod(methods[0]);
}

/**
 * @param {dw.order.Basket} b a basket
 * @param {dw.order.Basket} sid a shipping method id
 */
function setShippingMethodById(b, sid) {
  var ShippingMgr = require('dw/order/ShippingMgr');

  try {
    var methods = ShippingMgr.getShipmentShippingModel(b.defaultShipment).applicableShippingMethods.toArray();
    for (var i = 0; i < methods.length; i++) {
      if (methods[i].ID == sid) {
        b.defaultShipment.setShippingMethod(methods[i]);
      }
    }
  } catch (e) {
    setRandomShippingMethod(b);
  }
}

server.get('CreateOrder', function (req, res, next) {
  var BasketMgr = require('dw/order/BasketMgr');
  var Transaction = require('dw/system/Transaction');
  var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
  var URLUtils = require('dw/web/URLUtils');
  var redirect = URLUtils.url('Checkout-Begin', 'stage', 'payment').toString();

  Transaction.wrap(function () {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();

    // addRandomProducts(currentBasket);
    CartHelpers.addProductToCart(currentBasket, 'MT01-BL', 1, null, {});
    CartHelpers.addProductToCart(currentBasket, 'CIT-961', 1, null, {});

    // Add email, shipping address, set shipping method, calculate tax
    if ('randomEmail' in request.httpParameters && request.httpParameters.randomEmail == 'true') {
      currentBasket.setCustomerEmail('test' + Math.floor(Math.random() * Math.floor(1000000)) + '@tester.com');
    } else {
      currentBasket.setCustomerEmail('tester@null.com');
    }

    var shipAddress = currentBasket.defaultShipment.createShippingAddress();
    setRandomOrderAddress(shipAddress);
    var billAddress = currentBasket.createBillingAddress();
    setRandomOrderAddress(billAddress);
    if ('randomShippingMethod' in request.httpParameters && request.httpParameters.randomShippingMethod == 'true') {
      setRandomShippingMethod(currentBasket);
    } else {
      setShippingMethodById(currentBasket, 'KEN3011');
    }
    basketCalculationHelpers.calculateTotals(currentBasket);

    if ('payment' in req.querystring) {
      // Clear payment instruments
      removeExistingInstruments(currentBasket);

      switch (req.querystring.payment) {
        case 'Adyen':
          var pi = currentBasket.createPaymentInstrument('CREDIT_CARD', currentBasket.totalGrossPrice);
          pi.setCreditCardHolder('CCFirst CCLast');
          pi.setCreditCardExpirationMonth(3);
          pi.setCreditCardExpirationYear(2030);
          break;
        case 'PayPalExpress':
          redirect = URLUtils.url('AdyenExpressPaypal-ExpressCheckoutFromCart').toString();
          break;
        default:
          break;
      }
    }
  });

  res.redirect(redirect);
  next();
});

module.exports = server.exports();
