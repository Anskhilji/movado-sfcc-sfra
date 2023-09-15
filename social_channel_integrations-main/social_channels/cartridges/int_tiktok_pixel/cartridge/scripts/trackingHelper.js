'use strict';

var Logger = require('dw/system/Logger');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var constants = require('*/cartridge/scripts/TikTokConstants');

/**
 * Get the dwanonymous_ cookie value for user event tracking
 * @returns {string} - the dwanonymous_ cookie value
 */
function getDwanonymousCookie() {
    var siteCookies = request.getHttpCookies();
    var identifier = null;
    if (siteCookies != null) {
        for (var i = 0; i < siteCookies.cookieCount; i++) {
            if (siteCookies[i].getName().includes('dwanonymous_')) {
                identifier = siteCookies[i].getValue();
                session.custom.tiktokId = identifier;
                return identifier;
            }
        }
    }

    return session.sessionID || null;
}

/**
 * Get the logged in user information
 * @returns {Object} - user information
 */
function getLoggedInUserInfo() {
    if (session.customer.profile != null && session.custom.enabledAdvanceMatching) {
        var cusProfile = session.customer.profile;
        // customer is authenticated
        var cusEmail = (cusProfile.email) ? cusProfile.email : cusProfile.credentials.login;
        var cusPhoneNum = null;
        if (cusProfile.phoneMobile != null && cusProfile.phoneMobile.length > 0) {
            cusPhoneNum = cusProfile.phoneMobile;
        } else if (cusProfile.phoneHome != null && cusProfile.phoneHome.length > 0) {
            cusPhoneNum = cusProfile.phoneHome;
        } else if (cusProfile.phoneBusiness != null && cusProfile.phoneBusiness > 0) {
            cusPhoneNum = cusProfile.phoneBusiness;
        }

        var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
        var tikTokSettings = customObjectHelper.getCustomObject();

        var Mac = require('dw/crypto/Mac');
        var Encoding = require('dw/crypto/Encoding');
        var encrypt = new Mac(Mac.HMAC_SHA_256);

        var hashCusEmail = '';
        var hashCusPhoneNum = '';
        var hashCusExternalID = '';
        if (cusEmail != null) {
            hashCusEmail = Encoding.toHex(encrypt.digest(cusEmail.toLowerCase(), tikTokSettings.custom.pixelCode));
        }
        if (cusPhoneNum != null) {
            hashCusPhoneNum = Encoding.toHex(encrypt.digest(cusPhoneNum.toLowerCase(), tikTokSettings.custom.pixelCode));
        }
        hashCusExternalID = Encoding.toHex(encrypt.digest(session.custom.tiktokId.toLowerCase(), tikTokSettings.custom.pixelCode));
        session.custom.tiktokUserInfo = hashCusEmail + '|' + hashCusPhoneNum + '|' + hashCusExternalID;
        return session.custom.tiktokUserInfo;
    }

    return null;
}

/**
 * @description hash order email address
 * @param {string} orderEmail - order email address
 * @param {string} tikTokUserInfo - tiktok user information
 * @returns {string} - hashed order email address
 */
function hashOrderEmail(orderEmail, tikTokUserInfo) {
    var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
    var tikTokSettings = customObjectHelper.getCustomObject();
    var Mac = require('dw/crypto/Mac');
    var Encoding = require('dw/crypto/Encoding');
    var encrypt = new Mac(Mac.HMAC_SHA_256);
    var cusEmail = orderEmail;
    var hashCusExternalID = '';
    var hashCusPhoneNum = '';

    if (tikTokUserInfo != null) {
        var userInfo = tikTokUserInfo.split('|');
        hashCusPhoneNum = userInfo[1];
        hashCusExternalID = userInfo[2];
    } else {
        hashCusExternalID = Encoding.toHex(encrypt.digest(session.custom.tiktokId.toLowerCase(), tikTokSettings.custom.pixelCode));
    }

    var hashCusEmail = Encoding.toHex(encrypt.digest(cusEmail.toLowerCase(), tikTokSettings.custom.pixelCode));
    session.custom.tiktokUserInfo = hashCusEmail + '|' + hashCusPhoneNum + '|' + hashCusExternalID;
    return session.custom.tiktokUserInfo;
}

/**
 * @description create the event queue in custom object
 * @param {string} tikTokEventId - tiktok event id
 * @param {string} event - event name
 * @param {string} referrerUrl - referrer url
 * @param {string} ttclid - ttclid
 * @param {string} reqUrl - request url
 * @param {string} userAgent - user agent
 * @param {string} titokProperties - TikTok properties
 * @param {string} tikTokUserInfo - tiktok user information
 * @returns {void}
 */
function queueEvent(tikTokEventId, event, referrerUrl, ttclid, reqUrl, userAgent, titokProperties, tikTokUserInfo) {
    var Calendar = require('dw/util/Calendar');
    var eventCount = session.custom.maxNumEvents || constants.MAX_TRACKING_EVENTS;
    // check if limit of max event reached
    if (CustomObjectMgr.getAllCustomObjects('TikTokWebEvents').getCount() > eventCount) {
        // exit function with logging
        Logger.warn('TikTok event tracking reached max limit. Current stored event count is ' + eventCount);
        return;
    }
    var StringUtils = require('dw/util/StringUtils');
    var timestamp = StringUtils.formatCalendar(new Calendar(), "yyyy-MM-dd'T'HH:mm:ss'Z'");
    var cusExternalId = '';
    var cusPhoneNumber = '';
    var cusEmail = '';
    if (tikTokUserInfo != null) {
        var userInfo = tikTokUserInfo.split('|');
        cusEmail = userInfo[0];
        cusPhoneNumber = userInfo[1];
        cusExternalId = userInfo[2];
    }
    Transaction.wrap(function () {
        var eventTimeStamp = timestamp + '_' + tikTokEventId;
        var obj = CustomObjectMgr.createCustomObject('TikTokWebEvents', eventTimeStamp);
        obj.custom.event = event;
        obj.custom.event_id = tikTokEventId;
        obj.custom.referrer = referrerUrl;
        obj.custom.ttclid = ttclid;
        obj.custom.url = reqUrl;
        obj.custom.external_id = cusExternalId;
        obj.custom.phone_number = cusPhoneNumber;
        obj.custom.email = cusEmail;
        obj.custom.user_agent = userAgent;
        obj.custom.properties = JSON.stringify(titokProperties);
    });
}

/**
 * @description add event for TikTok to queue or send it real time
 * @param {string} eventID - event id
 * @param {Object} viewData - view data
 * @param {boolean} realTime - send the event to real time or queue it for later
 * @private
 */
function firePixelEvent(eventID, viewData, realTime) {
    var reqUrl = request.getHttpURL().toString();
    var userAgent = request.httpUserAgent;
    var referrerUrl = (request.getHttpReferer()) ? request.getHttpReferer() : '';
    var tikTokEventId = (session.custom.tiktokId) ? session.custom.tiktokId : getDwanonymousCookie();
    var ttclid = (session.custom.ttclid) ? session.custom.ttclid : '';
    var tikTokUserInfo = (session.custom.tiktokUserInfo) ? session.custom.tiktokUserInfo : getLoggedInUserInfo();

    // default to real time is no value is passed
    var isRealTime = realTime === true || realTime == null;

    try {
        var lineItemCtnr = null;
        var titokProperties = {};
        var contentsList = [];
        var contentItem;
        var currencyCode;

        if (eventID === this.EVENTID.ViewContent) {
            contentItem = {};
            var product = viewData.product;
            contentItem.content_type = 'product';
            contentItem.content_id = product.id;
            contentItem.quantity = 1;
            if (product.price.sales != null) {
                contentItem.price = product.price.sales.value;
                currencyCode = product.price.sales.currency;
            } else if (product.price.list != null) {
                contentItem.price = product.price.list.value;
                currencyCode = product.price.list.currency;
            }
            contentsList.push(contentItem);
        } else if (eventID !== this.EVENTID.CompletePayment) {
            var BasketMgr = require('dw/order/BasketMgr');
            lineItemCtnr = BasketMgr.getCurrentBasket();
        } else {
            var orderID = viewData.orderID;
            if (orderID) {
                var OrderMgr = require('dw/order/OrderMgr');
                lineItemCtnr = OrderMgr.getOrder(orderID);
                tikTokEventId = orderID;
                var orderEmail = lineItemCtnr.getCustomerEmail();
                if (orderEmail != null && session.custom.enabledAdvanceMatching) {
                    tikTokUserInfo = hashOrderEmail(orderEmail, tikTokUserInfo);
                }
            }
        }
        if (lineItemCtnr != null) {
            var plis = lineItemCtnr.getProductLineItems().iterator();
            while (plis.hasNext()) {
                var pli = plis.next();
                if (!pli.isBonusProductLineItem()) {
                    contentItem = {};
                    contentItem.content_type = 'product';
                    contentItem.content_id = pli.productID;
                    contentItem.quantity = pli.getQuantityValue();
                    contentItem.price = pli.getAdjustedPrice().getValue();
                    contentsList.push(contentItem);
                }
            }
            titokProperties.contents = contentsList;
            titokProperties.currency = lineItemCtnr.currencyCode;
            titokProperties.value = lineItemCtnr.getAdjustedMerchandizeTotalPrice().getValue();
        } else {
            titokProperties.contents = contentsList;
            titokProperties.currency = currencyCode;
        }
        if (isRealTime) {
            var customObjectHelper = require('int_tiktok/cartridge/scripts/customObjectHelper');
            var tiktokService = require('int_tiktok/cartridge/scripts/services/tiktokService');
            var tikTokSettings = customObjectHelper.getCustomObject();
            tiktokService.pixelTrack(tikTokSettings, eventID, tikTokEventId, reqUrl, referrerUrl, ttclid, titokProperties, userAgent, tikTokUserInfo);
        } else {
            queueEvent(tikTokEventId, eventID, referrerUrl, ttclid, reqUrl, userAgent, titokProperties, tikTokUserInfo);
        }
    } catch (err) {
        Logger.error('firePixelEvent = ' + err);
    }
}

module.exports = {
    firePixelEvent: firePixelEvent,
    EVENTID: {
        ViewContent: 'ViewContent',
        AddToCart: 'AddToCart',
        CompletePayment: 'CompletePayment',
        InitiateCheckout: 'InitiateCheckout'
    }
};
