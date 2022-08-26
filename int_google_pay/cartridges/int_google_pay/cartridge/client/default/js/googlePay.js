/**
 * Define the version of the Google Pay API referenced when creating your
 * configuration
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#PaymentDataRequest|apiVersion in PaymentDataRequest}
 */
const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0
};

var isGlobalMiniCart = false;

/**
 * Card networks supported by your site and your gateway
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#CardParameters|CardParameters}
 * @todo confirm card networks supported by your site and gateway
 */
const allowedCardNetworks = ["AMEX", "DISCOVER", "INTERAC", "JCB", "MASTERCARD", "VISA"];

/**
 * Card authentication methods supported by your site and your gateway
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#CardParameters|CardParameters}
 * @todo confirm your processor supports Android device tokens for your
 * supported card networks
 */
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

function isIE() {
    var ua = navigator.userAgent;
    /* MSIE used to detect old browsers and Trident used to newer ones*/
    var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
    return is_ie; 
}

function isApple() {
    var ua = navigator.userAgent;
    /* MSIE used to detect old browsers and Trident used to newer ones*/
    var is_apple = ua.indexOf("Safari/") > -1 && !ua.indexOf("chrome") > -1;
    return is_apple; 
}
/**
 * Identify your gateway and your site's gateway merchant identifier
 *
 * The Google Pay API response will return an encrypted payment method capable
 * of being charged by a supported gateway after payer authorization
 *
 * @todo check with your gateway on the parameters to pass
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#gateway|PaymentMethodTokenizationSpecification}
 */
const tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
        'gateway': 'adyen',
        'gatewayMerchantId': window.Resources.GOOGLE_PAY_MERCHANT_NAME
    }
};

/**
 * Describe your site's support for the CARD payment method and its required
 * fields
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#CardParameters|CardParameters}
 */
const baseCardPaymentMethod = {
    type: 'CARD',
    parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks
    }
};

/**
 * Describe your site's support for the CARD payment method including optional
 * fields
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#CardParameters|CardParameters}
 */
const cardPaymentMethod = Object.assign(
    {},
    baseCardPaymentMethod,
    {
        tokenizationSpecification: tokenizationSpecification
    }
);

/**
 * An initialized google.payments.api.PaymentsClient object or null if not yet set
 *
 * @see {@link getGooglePaymentsClient}
 */
let paymentsClient = null;

/**
 * Configure your site's support for payment methods supported by the Google Pay
 * API.
 *
 * Each member of allowedPaymentMethods should contain only the required fields,
 * allowing reuse of this base request when determining a viewer's ability
 * to pay and later requesting a supported payment method
 *
 * @returns {object} Google Pay API version, payment methods supported by the site
 */
function getGoogleIsReadyToPayRequest() {
    return Object.assign(
        {},
        baseRequest,
        {
            allowedPaymentMethods: [baseCardPaymentMethod]
        }
    );
}

/**
 * Configure support for the Google Pay API
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#PaymentDataRequest|PaymentDataRequest}
 * @returns {object} PaymentDataRequest fields
 */
function getGooglePaymentDataRequest() {
    return new Promise(function (resolve, reject) {
        const paymentDataRequest = Object.assign({}, baseRequest);
        paymentDataRequest.allowedPaymentMethods = [cardPaymentMethod];
        getGoogleTransactionInfo(false, null, null)
            .then(function (transactionData) {
                paymentDataRequest.transactionInfo = transactionData.transactionInfo;
                paymentDataRequest.merchantInfo = {
                    // @todo a merchant ID is available for a production environment after approval by Google
                    // See {@link https://developers.google.com/pay/api/web/guides/test-and-deploy/integration-checklist|Integration checklist}
                    // merchantId: '01234567890123456789',
                    merchantName: window.Resources.GOOGLE_PAY_MERCHANT_NAME
                };
                paymentDataRequest.callbackIntents = ["PAYMENT_AUTHORIZATION"];
                if (window.isGooglePayExpress) {
                    paymentDataRequest.callbackIntents = ["SHIPPING_ADDRESS", "SHIPPING_OPTION", "PAYMENT_AUTHORIZATION"];
                    paymentDataRequest.shippingAddressRequired = true;
                    paymentDataRequest.shippingAddressParameters = getGoogleShippingAddressParameters();
                    paymentDataRequest.shippingOptionRequired = true;
                }

                paymentDataRequest.emailRequired = true;


                if (window.googlePayEnvironment == 'PRODUCTION') {
                    paymentDataRequest.merchantInfo.merchantId = window.Resources.GOOGLE_PAY_MERCHANT_ACCOUNT;
                }
                resolve(paymentDataRequest);

            })
            .catch(function (err) {
                // show error in developer console for debugging
                reject(err);
            });
    });

}

/**
 * Provide Google Pay API with shipping address parameters when using dynamic buy flow.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#ShippingAddressParameters|ShippingAddressParameters}
 * @returns {object} shipping address details, suitable for use as shippingAddressParameters property of PaymentDataRequest
 */
function getGoogleShippingAddressParameters() {
    return {
        allowedCountryCodes: window.Resources.GOOGLE_PAY_ALLOWED_COUNTRY_CODES,
        phoneNumberRequired: true
    };
}

/**
 * Return an active PaymentsClient or initialize
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#PaymentsClient|PaymentsClient constructor}
 * @returns {google.payments.api.PaymentsClient} Google Pay API client
 */
function getGooglePaymentsClient() {
    if (paymentsClient === null) {
        var paymentDataCallbacks = {};
        paymentDataCallbacks.onPaymentAuthorized = onPaymentAuthorized;
        if (window.isGooglePayExpress) {
            paymentDataCallbacks.onPaymentDataChanged = onPaymentDataChanged;
        }
        paymentsClient = new google.payments.api.PaymentsClient({
            environment: window.googlePayEnvironment,
            paymentDataCallbacks: paymentDataCallbacks
        });
    }
    return paymentsClient;
}


function onPaymentAuthorized(paymentData) {
    return new Promise(function (resolve, reject) {

        // handle the response
        processPayment(paymentData)
            .then(function (data) {
                if (data.error) {
                    resolve({
                        transactionState: 'ERROR',
                        error: {
                            intent: 'PAYMENT_AUTHORIZATION',
                            message: data.error.errorText ? data.error.errorText : data.errorMessage,
                            reason: 'PAYMENT_DATA_INVALID'
                        }
                    });
                } else {
                    setTimeout(() => {
                        window.location.href = data.redirectUrl
                    }, 300);
                    resolve({ transactionState: 'SUCCESS' });
                }
            })
            .catch(function (error) {
                resolve({
                    transactionState: 'ERROR',
                    error: {
                        intent: 'PAYMENT_AUTHORIZATION',
                        message: error.message,
                        reason: 'PAYMENT_DATA_INVALID'
                    }
                });
            });

    });
}

/**
 * Handles dynamic buy flow shipping address and shipping options callback intents.
 *
 * @param {object} itermediatePaymentData response from Google Pay API a shipping address or shipping option is selected in the payment sheet.
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#IntermediatePaymentData|IntermediatePaymentData object reference}
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentDataRequestUpdate|PaymentDataRequestUpdate}
 * @returns Promise<{object}> Promise of PaymentDataRequestUpdate object to update the payment sheet.
 */
function onPaymentDataChanged(intermediatePaymentData) {
    return new Promise(function (resolve, reject) {

        let shippingAddress = intermediatePaymentData.shippingAddress;
        let shippingOptionData = intermediatePaymentData.shippingOptionData;
        let paymentDataRequestUpdate = {};

        if (intermediatePaymentData.callbackTrigger == "INITIALIZE" || intermediatePaymentData.callbackTrigger == "SHIPPING_ADDRESS") {
            if (false) { // @Todo add check for un supported shipping areas
                paymentDataRequestUpdate.error = getGoogleUnserviceableAddressError();
            }
            else {
                getGoogleTransactionInfo(true, null, shippingAddress)
                    .then(function (transactionData) {
                        paymentDataRequestUpdate.newShippingOptionParameters = transactionData.transactionInfo.newShippingOptionParameters;
                        delete transactionData.transactionInfo.newShippingOptionParameters;
                        paymentDataRequestUpdate.newTransactionInfo = transactionData.transactionInfo;
                        resolve(paymentDataRequestUpdate);
                    })
                    .catch(function (err) {
                        // show error in developer console for debugging
                        console.error(err);
                        reject(err);
                    });

            }
        }
        else if (intermediatePaymentData.callbackTrigger == "SHIPPING_OPTION") {
            getGoogleTransactionInfo(true, shippingOptionData.id, shippingAddress)
                .then(function (transactionData) {
                    delete transactionData.transactionInfo.newShippingOptionParameters;
                    paymentDataRequestUpdate.newTransactionInfo = transactionData.transactionInfo;
                    resolve(paymentDataRequestUpdate);

                })
                .catch(function (err) {
                    console.error(err);
                    reject(err);
                })

        }

    });
}


/**
 * Provide Google Pay API with shipping options and a default selected shipping option.
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#ShippingOptionParameters|ShippingOptionParameters}
 * @returns {object} shipping option parameters, suitable for use as shippingOptionParameters property of PaymentDataRequest
 */
function getGoogleDefaultShippingOptions() {
    return new Promise(function (resolve, reject) {
        var $selector = isGlobalMiniCart ? $('#google-pay-container-mini-cart') : $('#google-pay-container');
        $.ajax({
            url: $selector.data('default-shipping-methods-url'),
            method: 'POST',
            success: function (data) {
                if (data.shippingMethods) {
                    resolve(data.shippingMethods) // Resolve promise and go to then()
                } else {
                    reject(data);
                }

            },
            error: function (err) {
                reject(err) // Reject the promise and go to catch()
            }
        });
    });
}


/**
 * Initialize Google PaymentsClient after Google-hosted JavaScript has loaded
 *
 * Display a Google Pay payment button after confirmation of the viewer's
 * ability to pay.
 */
function onGooglePayLoaded(isMiniCart) {
    if (isMiniCart) {
        isGlobalMiniCart = true;
    }

    if (window.dw &&
        window.dw.applepay &&
        window.ApplePaySession &&
        window.ApplePaySession.canMakePayments()) {
        $('.googlepay-btn').remove();
        $('.google-pay-container').remove();
        $('#google-pay-container-mini-cart').remove();
        $('.google-pay-options').remove();
        $('.google-pay-column').remove();
        return;
    }

    if (isIE() || window.ApplePaySession) {
        $('.googlepay-btn').remove();
        $('.google-pay-container').remove();
        $('#google-pay-container-mini-cart').remove();
        $('.google-pay-options').remove();
        return;
    }

    if (window.googlePayButtonAvailable) {
        const paymentsClient = getGooglePaymentsClient();
        paymentsClient.isReadyToPay(getGoogleIsReadyToPayRequest())
            .then(function (response) {
                if (response.result) {
                    addGooglePayButton(isGlobalMiniCart);
                    // @todo prefetch payment data to improve performance after confirming site functionality
                    // prefetchGooglePaymentData();
                }
            })
            .catch(function (err) {
                // show error in developer console for debugging
                console.error(err);
            });
    } else {
        setTimeout(() => {
            onGooglePayLoaded();
        }, 1000);
    }
}

/**
 * Add a Google Pay purchase button alongside an existing checkout button
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#ButtonOptions|Button options}
 * @see {@link https://developers.google.com/pay/api/web/guides/brand-guidelines|Google Pay brand guidelines}
 */
function addGooglePayButton() {
    const paymentsClient = getGooglePaymentsClient();
    var buttonConfigs = {
        buttonColor: window.googlePayButtonColor,
        buttonType: window.googlePayButtonType,
        onClick: onGooglePaymentButtonClicked
    }
    if (window.isEnabledGooglePayCustomSize) {
        buttonConfigs.buttonSizeMode = 'fill';
    }
    
    var button;
    if (!isGlobalMiniCart) {
        var googlePayContainer = document.getElementsByClassName('google-pay-container');
        $.each (googlePayContainer,function(element, googlePayContainer) {
            button = paymentsClient.createButton(buttonConfigs);
            googlePayContainer.append(button);
        });
    } else {
        var $googlePayButton = $('#google-pay-container-mini-cart > .gpay-button-fill');
        if ($googlePayButton.length === 0) {
            button = paymentsClient.createButton(buttonConfigs);
            document.getElementById('google-pay-container-mini-cart').appendChild(button);
        }
    }
}

/**
 * Provide Google Pay API with a payment amount, currency, and amount status
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/request-objects#TransactionInfo|TransactionInfo}
 * @returns {object} transaction info, suitable for use as transactionInfo property of PaymentDataRequest
 */
function getGoogleTransactionInfo(includeShippingDetails, selectedShippingMethod, shippingAddress) {
    return new Promise(function (resolve, reject) {
        var $selector = isGlobalMiniCart ? $('#google-pay-container-mini-cart') : $('#google-pay-container');

        var data = {
            googlePayEntryPoint: $selector.data('entry-point'),
            pid: $selector.data('pid') ? $selector.data('pid') : false,
            selectedShippingMethod: selectedShippingMethod,
            includeShippingDetails: includeShippingDetails,
            shippingAddress: shippingAddress ? JSON.stringify(shippingAddress) : shippingAddress
        };

        if (window.Resources.IS_CLYDE_ENABLED && typeof Clyde !== 'undefined') {
            var clydeContract = Clyde.getSelectedContract();
            if (clydeContract) {
                data.clydeContractSku = clydeContract.sku;
                data.clydeContractPrice = clydeContract.recommendedPrice;
            }
        }

        $.ajax({
            url: $selector.data('url'),
            method: 'POST',
            data: data,
            success: function (data) {
                resolve(data) // Resolve promise and go to then()
            },
            error: function (err) {
                reject(err) // Reject the promise and go to catch()
            }
        });
    });
}

/**
 * Prefetch payment data to improve performance // Not used might need in future
 *
 * @see {@link https://developers.google.com/pay/api/web/reference/client#prefetchPaymentData|prefetchPaymentData()}
 */
function prefetchGooglePaymentData() {
    const paymentDataRequest = getGooglePaymentDataRequest();
    // transactionInfo must be set but does not affect cache
    paymentDataRequest.transactionInfo = {
        totalPriceStatus: 'NOT_CURRENTLY_KNOWN',
        currencyCode: 'USD'
    };
    const paymentsClient = getGooglePaymentsClient();
    paymentsClient.prefetchPaymentData(paymentDataRequest);
}

/**
 * Show Google Pay payment sheet when Google Pay payment button is clicked
 */
function onGooglePaymentButtonClicked() {
    getGooglePaymentDataRequest()
        .then(function (paymentDataRequest) {
            const paymentsClient = getGooglePaymentsClient();
            paymentsClient.loadPaymentData(paymentDataRequest)
        }).catch(function (err) {
            console.error(err);
        })
}

/**
 * Process payment data returned by the Google Pay API
 *
 * @param {object} paymentData response from Google Pay API after user approves payment
 * @see {@link https://developers.google.com/pay/api/web/reference/response-objects#PaymentData|PaymentData object reference}
 */
function processPayment(paymentData) {
    // show returned data in developer console for debugging
    console.log(paymentData);
    return new Promise(function (resolve, reject) {
        var $selector = isGlobalMiniCart ? $('#google-pay-container-mini-cart') : $('#google-pay-container');
        setTimeout(function () {
            $.ajax({
                url: $selector.data('process-payments-url'),
                method: 'POST',
                data: {
                    paymentData: JSON.stringify(paymentData),
                    isGooglePayExpress: window.isGooglePayExpress
                },
                success: function (data) {
                    if (!data.error) {
                        resolve(data) // Resolve promise and go to then()
                    } else {
                        reject(data);
                    }

                },
                error: function (err) {
                    reject(err) // Reject the promise and go to catch()
                }
            });

        }, 3000);
    });
}


$(document).ready(function name(params) {
    if (window.Resources.GOOGLE_PAY_ENABLED) {
        var script = document.createElement('script');
        script.async = true;
        script.onload = function () {
            onGooglePayLoaded();
        };
        script.src = 'https://pay.google.com/gp/p/js/pay.js';

        document.head.appendChild(script);
        window.loadGooglePayButtons = onGooglePayLoaded;
    }
});