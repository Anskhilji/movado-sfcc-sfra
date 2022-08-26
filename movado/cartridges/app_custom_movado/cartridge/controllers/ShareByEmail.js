'use strict';

var Resource = require('dw/web/Resource');

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var shareByEmailHelper = require('*/cartridge/scripts/helpers/shareByEmailHelper');
var productFactory = require('*/cartridge/scripts/factories/product');
var EmailSubscriptionHelper = require('int_custom_marketing_cloud/cartridge/scripts/helper/EmailSubscriptionHelper');
var SFMCApi = require('*/cartridge/scripts/api/SFMCApi');

/**
 * Opens the Modal and populates it with form data.
 */

server.get('ShowModal', server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    var customerName = '';
    var customerEmail = '';
    var addtoemaillist = false;
    var viewData = res.getViewData();
    var params = {
        pid: req.querystring.pid
    };
    var product = productFactory.get(params);
    var images = product.images.pdp533;
    var sendToFriendForm = server.forms.getForm('sendtofriend');
    sendToFriendForm.clear();

    if (req.currentCustomer.raw.isAuthenticated() && 'profile' in req.currentCustomer) {
        customerName = req.currentCustomer.profile.firstName + ' ' + req.currentCustomer.profile.lastName;
        customerEmail = req.currentCustomer.profile.email;
        addtoemaillist = req.currentCustomer.raw.profile.custom.addtoemaillist;
    }
    viewData = {
        sendToFriendForm: sendToFriendForm,
        customerName: customerName,
        customerEmail: customerEmail,
        product: product,
        image: images[0]
    };

    res.setViewData(viewData);
    res.render('common/sendToFriendModal');
    next();
});

/**
 * Captures the personal information to share product info via email.
 */
server.post('SendToFriend', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var status = { success: false, error: false, message: '' };
    var result = {
        valid: true
    };
    var params = {
        pid: req.querystring.pid
    };
    var product = productFactory.get(params);
    var sendToFriendForm = server.forms.getForm('sendtofriend');
    var viewData = res.getViewData();
    viewData = {
        sendToFriendForm: sendToFriendForm
    };

    var isPreviewClick = req.querystring.previewClick ? req.querystring.previewClick : false;

    result = shareByEmailHelper.sendToFriendValidations(sendToFriendForm, result);

    if (!result.valid) {
        res.setViewData(viewData);
        res.json({
            error: true,
            fields: formErrors.getFormErrors(sendToFriendForm)
        });
        return next();
    }

    result.yourName = shareByEmailHelper.fetchHtmlValue(sendToFriendForm, 'yourname');
    result.youremail = shareByEmailHelper.fetchHtmlValue(sendToFriendForm, 'youremail');
    result.friendsName = shareByEmailHelper.fetchHtmlValue(sendToFriendForm, 'friendsname');
    result.friendsEmail = shareByEmailHelper.fetchHtmlValue(sendToFriendForm, 'friendsemail');
    result.confirmFriendsEmail = shareByEmailHelper.fetchHtmlValue(sendToFriendForm, 'confirmfriendsemail');
    result.addtoemaillist = sendToFriendForm.addtoemaillist.checked;
    result.message = shareByEmailHelper.fetchHtmlValue(sendToFriendForm, 'message');

    if (sendToFriendForm.valid && result.valid) {
        if (isPreviewClick) {
            res.json({
                error: false
            });
        } else {
            var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
            var ContentMgr = require('dw/content/ContentMgr');
            var Resource = require('dw/web/Resource');
            var URLUtils = require('dw/web/URLUtils');
            var Site = require('dw/system/Site');
            var emailHeaderContent = ContentMgr.getContent('email-header');
            var emailFooterContent = ContentMgr.getContent('email-footer');
            var emailMarketingContent = ContentMgr.getContent('email-share-product-marketing');
            var pdpURL = URLUtils.https('Product-Show', 'pid', product.id);
            var addToCartURL = URLUtils.https('Cart-AddProductFromEmail', 'pid', product.id);
            var objectForEmail = {
                name: result.yourName,
                saluationText: Resource.msg('pdp.share.email.salutation', 'account', null),
                personalMessage: result.message !== '' ? result.message : null,
                product: product,
                pdpURL: pdpURL,
                addToCartURL: addToCartURL,
                addToCartText: Resource.msg('global.addtocart', 'account', null),
                viewProductText: Resource.msg('global.viewdetails', 'account', null),
                friendsEmail: result.friendsEmail,
                productModel: Resource.msg('global.itemno', 'account', null),
                priceLabel: Resource.msg('global.price', 'account', null),
                emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
                emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
                emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : '')
            };

            if (sendToFriendForm.addtoemaillist.checked) {
                var requestParams = {
                    email: result.youremail
                }
                SFMCApi.sendSubscriberToSFMC(requestParams);
                status = EmailSubscriptionHelper.emailSubscriptionResponse(true);
            }

            var emailObj = {
                to: result.friendsEmail,
                subject: Resource.msg('subject.share.product.email', 'account', null),
                // this needs to be closed
                from: result.youremail || Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                type: emailHelpers.emailTypes.productShareEmail
            };

            emailHelpers.sendEmail(emailObj, 'sendToFriend/productShareEmail', objectForEmail);

            if (status) {
                res.json({
                    error: false
                });
            } else {
                res.json({
                    error: true,
                    fields: formErrors.getFormErrors(sendToFriendForm)
                });
            }
        }
    } else {
        res.json({
            error: true,
            fields: formErrors.getFormErrors(sendToFriendForm)
        });
    }
    return next();
});

module.exports = server.exports();
