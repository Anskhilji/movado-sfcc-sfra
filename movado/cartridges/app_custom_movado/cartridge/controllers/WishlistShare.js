'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var shareByEmailHelper = require('*/cartridge/scripts/helpers/shareByEmailHelper');
var URLUtils = require('dw/web/URLUtils');

/**
 * Opens the Modal and populates it with form data.
 */
server.get('ShowModal', server.middleware.https, csrfProtection.generateToken, function (req, res, next) {
    var customerName = '';
    var customerEmail = '';
    var viewData = res.getViewData();
    var shareWishlistForm = server.forms.getForm('sendtofriend');
    shareWishlistForm.clear();

    if (req.currentCustomer.raw.isAuthenticated() && 'profile' in req.currentCustomer) {
        customerName = req.currentCustomer.profile.firstName + ' ' + req.currentCustomer.profile.lastName;
        customerEmail = req.currentCustomer.profile.email;
    }
    viewData = {
        shareWishlistForm: shareWishlistForm,
        customerName: customerName,
        customerEmail: customerEmail,
        action: URLUtils.url('WishlistShare-SendToFriend', 'wishlistId', req.querystring.wishlistId).toString()

    };

    res.setViewData(viewData);
    res.render('common/shareWishlistModal');
    next();
});

/**
 * Captures the personal information to share wishlist  via email.
 */
server.post('SendToFriend', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var status = { success: false, error: false, message: '' };
    var result = {
        valid: true
    };
    var isPreviewClick = req.querystring.previewClick ? req.querystring.previewClick : false;

    var sharewishlistform = server.forms.getForm('sendtofriend');
    var viewData = res.getViewData();
    viewData = {
        sharewishlistform: sharewishlistform
    };

    result = shareByEmailHelper.sendToFriendValidations(sharewishlistform, result);


    if (!result.valid) {
        res.setViewData(viewData);
        res.json({
            error: true,
            fields: formErrors.getFormErrors(sharewishlistform)
        });
        return next();
    }

    result.yourName = shareByEmailHelper.fetchHtmlValue(sharewishlistform, 'yourname');
    result.youremail = shareByEmailHelper.fetchHtmlValue(sharewishlistform, 'youremail');
    result.friendsName = shareByEmailHelper.fetchHtmlValue(sharewishlistform, 'friendsname');
    result.friendsEmail = shareByEmailHelper.fetchHtmlValue(sharewishlistform, 'friendsemail');
    result.confirmFriendsEmail = shareByEmailHelper.fetchHtmlValue(sharewishlistform, 'confirmfriendsemail');
    result.message = shareByEmailHelper.fetchHtmlValue(sharewishlistform, 'message');

    if (sharewishlistform.valid && result.valid) {
        if (isPreviewClick) {
            res.json({ error: false });
        } else {
            var id = req.querystring.wishlistId;
            var productListMgr = require('dw/customer/ProductListMgr');
            var WishlistModel = require('*/cartridge/models/productList');
            var productList = productListMgr.getProductList(id);
                // creating wishlist Model for email
            var wishlistObject = new WishlistModel(
                        productList,
                {
                    type: 'wishlist',
                    publicView: true,
                    pageSize: productList.items.getLength(),
                    pageNumber: 1,
                    socialLinks: false
                }
                    );
                /** start: code is for email functionality */
                // var product = productFactory.get(params);
            var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
            var ContentMgr = require('dw/content/ContentMgr');
            var Resource = require('dw/web/Resource');
            var Site = require('dw/system/Site');
            var emailHeaderContent = ContentMgr.getContent('email-header');
            var emailFooterContent = ContentMgr.getContent('email-footer');
            var emailMarketingContent = ContentMgr.getContent('email-share-wishlist-marketing');
            var objectForEmail = {
                wishListShowURL: URLUtils.https('Wishlist-ShowOthers', 'id', wishlistObject.productList.UUID),
                saluationText: Resource.msgf('wishlist.share.email.salutation', 'account', null, result.yourName),
                personalMessage: result.message !== '' ? result.message : null,
                wishlist: wishlistObject,
                friendsEmail: result.friendsEmail,
                notAvailableText: Resource.msg('displayproductlistitems.notavailable', 'account', null),
                addToCartText: Resource.msg('global.addtocart', 'account', null),
                viewProductText: Resource.msg('global.viewdetails', 'account', null),
                wishListLabel: Resource.msg('wishlist.share.see.label', 'account', null),
                emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
                emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
                emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : '')
            };

            var emailObj = {
                to: result.friendsEmail,
                subject: Resource.msg('subject.share.wishlist.email', 'account', null),
                from: result.youremail || Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
                type: emailHelpers.emailTypes.wishlistShareEmail
            };

            emailHelpers.sendEmail(emailObj, 'sendToFriend/wishlistShareEmail', objectForEmail);

            if (!status.error) {
                res.json({
                    error: false
                });
            } else if (status.error && status.message) {
                res.json({
                    error: false,
                    serverError: status.error,
                    serverErrorMessage: status.message
                });
            }
        }
    } else {
        res.json({
            error: true,
            fields: formErrors.getFormErrors(sharewishlistform)
        });
    }
    return next();
});

module.exports = server.exports();
