'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

server.replace('UpdateShippingMethodsList', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
    var Locale = require('dw/util/Locale');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    checkoutLogger.debug('(CheckoutShippingServices) -> UpdateShippingMethodsList: Inside UpdateShippingMethodsList to update shipping method');

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
    	checkoutLogger.error('(CheckoutShippingServices) -> UpdateShippingMethodsList: Current basket is empty');
        return next();
    }

    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shipment;
    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    var address = checkoutAddrHelper.getAddressFromRequest(req);

    var shippingMethodID;

    if (shipment.shippingMethod) {
        shippingMethodID = shipment.shippingMethod.ID;
    }

    Transaction.wrap(function () {
        var shippingAddress = shipment.shippingAddress;

        if (!shippingAddress) {
            shippingAddress = shipment.createShippingAddress();
        }

        Object.keys(address).forEach(function (key) {
            var value = address[key];
            if (value) {
                shippingAddress[key] = value;
            } else {
                shippingAddress[key] = null;
            }
        });

        ShippingHelper.selectShippingMethod(shipment, shippingMethodID);

        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    var currentLocale = Locale.getLocale(req.locale.id);

    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket', defaultShipment: true }
    );

    res.json({
        customer: new AccountModel(req.currentCustomer),
        order: basketModel,
        shippingForm: server.forms.getForm('shipping')
    });
    checkoutLogger.debug('(CheckoutShippingServices) -> UpdateShippingMethodsList: Shipping method list is updated');

	return next();
});

/**
 * Handle Ajax shipping form submit
 */
server.replace(
    'SubmitShipping',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Bytes = require('dw/util/Bytes');
        var Encoding = require('dw/crypto/Encoding');
        var Site = require('dw/system/Site');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');

        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
        var emailObj = [];

        var currentBasket = BasketMgr.getCurrentBasket();
        checkoutLogger.debug('(CheckoutShippingServices) -> SubmitShipping: Inside SubmitShipping to submit shipping form');

        if (!currentBasket) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            checkoutLogger.error('(CheckoutShippingServices) -> SubmitShipping: Current basket is empty');
            return next();
        }

        var form = server.forms.getForm('shipping');
        var result = {};

        var saveShippingAddress = false;
        var shippingAddressId;
        if (form.shippingAddress.addressFields.saveShippingAddress != undefined) {
        	saveShippingAddress = form.shippingAddress.addressFields.saveShippingAddress.checked;
        	Transaction.wrap(function () {
            	currentBasket.custom.saveShippingAddress = saveShippingAddress;
        	});
            checkoutLogger.debug('(CheckoutShippingServices) -> SubmitShipping: Shipping address is saved in the current basket');
        }

        if (form.shippingAddress.addressFields.shippingAddressId != undefined) {
        	shippingAddressId = form.shippingAddress.addressFields.shippingAddressId.htmlValue;
        	Transaction.wrap(function () {
            	currentBasket.custom.shipAddressId = shippingAddressId;
        });
        }

        // verify shipping form data
        var shippingFormErrors = COHelpers.validateShippingForm(form.shippingAddress.addressFields);

        if (Object.keys(shippingFormErrors).length > 0) {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'invalid');

            res.json({
                form: form,
                fieldErrors: [shippingFormErrors],
                serverErrors: [],
                error: true
            });
            checkoutLogger.error('(CheckoutShippingServices) -> SubmitShipping: Field validations errors');
        } else {
            req.session.privacyCache.set(currentBasket.defaultShipment.UUID, 'valid');
            
            // Subscribe to the movado email list: Starts.
            var requestParams = {
                email: form.shippingAddress.addressFields.email.htmlValue,
                requestLocation: 'CHECKOUT_SERVICE'
            }
            if (!Site.current.preferences.custom.auto_optin_checkout) {
            var subscribeToMovado = form.shippingAddress.addressFields.subscribetomovado.value;

                if (subscribeToMovado) {
                    if (!empty(requestParams) && !empty(requestParams.email)) {
                        if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
                            var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
                            var ltkConstants = require('*/cartridge/scripts/utils/ListrakConstants');
                            requestParams.source = ltkConstants.Source.Checkout;
                            requestParams.event = ltkConstants.Event.Checkout;
                            requestParams.subscribe = ltkConstants.Subscribe.Checkout;
                            requestParams.firstName= form.shippingAddress.addressFields.firstName.value;
                            requestParams.lastName= form.shippingAddress.addressFields.lastName.value;
                            
                            ltkApi.sendSubscriberToListrak(requestParams);
                        } else {
                            var sfmcApi = require('*/cartridge/scripts/api/SFMCApi');
                            sfmcApi.sendSubscriberToSFMC(requestParams);
                        }
                    }
                }
            } else {
                if (!empty(requestParams) && !empty(requestParams.email)) {
                    if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
                        var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
                        var ltkConstants = require('*/cartridge/scripts/utils/ListrakConstants');
                        requestParams.source = ltkConstants.Source.Checkout;
                        requestParams.event = ltkConstants.Event.Checkout;
                        requestParams.subscribe = ltkConstants.Subscribe.Checkout;
                        requestParams.firstName= form.shippingAddress.addressFields.firstName.value;
                        requestParams.lastName= form.shippingAddress.addressFields.lastName.value;
                        
                        ltkApi.sendSubscriberToListrak(requestParams);
                    } else {
                        var sfmcApi = require('*/cartridge/scripts/api/SFMCApi');
                        sfmcApi.sendSubscriberToSFMC(requestParams);
                    }
                }
            }

            var isGtmEnabled = Site.current.getCustomPreferenceValue('gtmEnabled');
            if (isGtmEnabled) {
                var userEmail = !empty(form.shippingAddress.addressFields.email.htmlValue) ? form.shippingAddress.addressFields.email.htmlValue : '';
                var userHashedEmail = Encoding.toHex(new Bytes(userEmail, 'UTF-8'));
                emailObj.push({
                    userEmail: userEmail,
                    userHashedEmail: userHashedEmail,
                    submitLocation: 'checkout'
                });
                result.emailObj = JSON.stringify(emailObj);
            }
            
            result.address = {
                firstName: form.shippingAddress.addressFields.firstName.value,
                lastName: form.shippingAddress.addressFields.lastName.value,
                companyName: form.shippingAddress.addressFields.companyName.value,
                address1: form.shippingAddress.addressFields.address1.value,
                address2: form.shippingAddress.addressFields.address2.value,
                city: form.shippingAddress.addressFields.city.value,
                postalCode: form.shippingAddress.addressFields.postalCode.value,
                countryCode: form.shippingAddress.addressFields.country.value,
                phone: form.shippingAddress.addressFields.phone.value
            };
            
            if (Object.prototype.hasOwnProperty
                .call(form.shippingAddress.addressFields, 'states')) {
                result.address.stateCode =
                    form.shippingAddress.addressFields.states.stateCode.value;
            }

            result.shippingBillingSame =
                form.shippingAddress.shippingAddressUseAsBillingAddress.value;

            result.shippingMethod = form.shippingAddress.shippingMethodID.value
                ? form.shippingAddress.shippingMethodID.value.toString()
                : null;

            result.isGift = form.shippingAddress.isGift.checked;

            result.giftMessage = result.isGift ? form.shippingAddress.giftMessage.value : null;

            res.setViewData(result);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var AccountModel = require('*/cartridge/models/account');
                var OrderModel = require('*/cartridge/models/order');
                var Locale = require('dw/util/Locale');

                var shippingData = res.getViewData();

                checkoutAddrHelper.copyShippingAddressToShipment(
                    shippingData,
                    currentBasket.defaultShipment
                );

                Transaction.wrap(function () {
                    currentBasket.setCustomerEmail(form.shippingAddress.addressFields.email.htmlValue || '');
                    if (!empty(currentBasket.billingAddress)) {
                        currentBasket.billingAddress.setPhone(form.shippingAddress.addressFields.phone.htmlValue || '');
                    }
                });

                var giftResult = COHelpers.setGift(
                    currentBasket.defaultShipment,
                    shippingData.isGift,
                    shippingData.giftMessage
                );

                if (giftResult.error) {
                    res.json({
                        error: giftResult.error,
                        fieldErrors: [],
                        serverErrors: [giftResult.errorMessage]
                    });
                    checkoutLogger.error('(CheckoutShippingServices) -> SubmitShipping: Errors from gift result: ' + giftResult.error);
                    return;
                }

                if (!currentBasket.billingAddress) {
                    if (req.currentCustomer.addressBook
                        && req.currentCustomer.addressBook.preferredAddress) {
                        // Copy over preferredAddress (use addressUUID for matching)
                    	checkoutAddrHelper.copyBillingAddressToBasket(
                            req.currentCustomer.addressBook.preferredAddress, currentBasket);
                    } else {
                        // Copy over first shipping address (use shipmentUUID for matching)
                    	checkoutAddrHelper.copyBillingAddressToBasket(
                            currentBasket.defaultShipment.shippingAddress, currentBasket);
                    }
                }
                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }

                COHelpers.recalculateBasket(currentBasket);

                var currentLocale = Locale.getLocale(req.locale.id);
                var basketModel = new OrderModel(
                    currentBasket,
                    {
                        usingMultiShipping: usingMultiShipping,
                        shippable: true,
                        countryCode: currentLocale.country,
                        containerView: 'basket'
                    }
                );

                res.json({
                    customer: new AccountModel(req.currentCustomer),
                    order: basketModel,
                    form: server.forms.getForm('shipping')
                });
            });
        }

        return next();
    }
);

server.replace('SelectShippingMethod', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var URLUtils = require('dw/web/URLUtils');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var Locale = require('dw/util/Locale');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');

    var currentBasket = BasketMgr.getCurrentBasket();
    checkoutLogger.debug('(CheckoutShippingServices) -> SelectShippingMethod: Inside SelectShippingMethod to select shipping method');

    if (!currentBasket) {
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        checkoutLogger.error('(CheckoutShippingServices) -> SelectShippingMethod: Current basket is empty');
        return next();
    }

    var shipmentUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
    var shippingMethodID = req.querystring.methodID || req.form.methodID;
    var shipment;
    if (shipmentUUID) {
        shipment = ShippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
        shipment = currentBasket.defaultShipment;
    }

    var viewData = res.getViewData();
    viewData.address = checkoutAddrHelper.getAddressFromRequest(req);
    viewData.isGift = req.form.isGift === 'true';
    viewData.giftMessage = req.form.isGift ? req.form.giftMessage : null;
    res.setViewData(viewData);

    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var shippingData = res.getViewData();
        var address = shippingData.address;

        try {
            Transaction.wrap(function () {
                var shippingAddress = shipment.shippingAddress;

                if (!shippingAddress) {
                    shippingAddress = shipment.createShippingAddress();
                }

                shippingAddress.setFirstName(address.firstName || '');
                shippingAddress.setLastName(address.lastName || '');
                shippingAddress.setCompanyName(address.companyName || '');
                shippingAddress.setAddress1(address.address1 || '');
                shippingAddress.setAddress2(address.address2 || '');
                shippingAddress.setCity(address.city || '');
                shippingAddress.setPostalCode(address.postalCode || '');
                shippingAddress.setStateCode(address.stateCode || '');
                shippingAddress.setCountryCode(address.countryCode || '');
                shippingAddress.setPhone(address.phone || '');

                ShippingHelper.selectShippingMethod(shipment, shippingMethodID);

                basketCalculationHelpers.calculateTotals(currentBasket);
            });
        } catch (err) {
            res.setStatusCode(500);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
            });
            
            checkoutLogger.error('(CheckoutShippingServices) -> SelectShippingMethod: Error in selecting shipping method and exception is : ' + err);
            return;
        }

        COHelpers.setGift(shipment, shippingData.isGift, shippingData.giftMessage);

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        var currentLocale = Locale.getLocale(req.locale.id);

        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket', defaultShipment: false }
        );

        res.json({
            customer: new AccountModel(req.currentCustomer),
            order: basketModel
        });
    });

    return next();
});

module.exports = server.exports();
