var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var UUIDUtils = require('dw/util/UUIDUtils');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');


/**
 * validates the email entered by user
 * @param email
 * @returns
 */
function validateEmail(email) {
    if (!email) {
        return false;
    }
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}


/**
 * Used to store the newsletter email in custom object
 * @param email
 * @returns
 */
function subscribeToNewsletter(email, optOutFlag, currCustomer) {
    var UUID;
    var emailObject;
    var customerFound = false;
    try {
        UUID = UUIDUtils.createUUID();
        if (UUID && validateEmail(email)) {
            Transaction.wrap(function () {
                emailObject = CustomObjectMgr.createCustomObject('newsletterSignup', UUID);
                if (currCustomer && currCustomer.profile && currCustomer.profile.email === email) {
                    var CustomerMgr = require('dw/customer/CustomerMgr');
                    var customer = CustomerMgr.searchProfile('email = {0}', email);
                    customer.custom.addtoemaillist = optOutFlag || true;
                    customerFound = true;
                }
                emailObject.custom.email = email;
                if (optOutFlag) {
                    emailObject.custom.optOutFlag = optOutFlag;
                    return {
                        success: true,
                        optOutFlag: true,
                        customerFound: customerFound,
                        message: Resource.msg('newsletter.signup.success', 'common', null)
                    };
                }
            });
            return {
                success: true,
                optOutFlag: false,
                customerFound: customerFound,
                message: Resource.msg('newsletter.signup.success', 'common', null)
            };
        }
    } catch (error) {
        Logger.error('Newsletter Subscription encoutered an error with details :' + error);
        return {
            success: false,
            error: true,
            message: Resource.msg('newsletter.signup.failure', 'common', null)
        };
    }
    Logger.debug('Newsletter Subscription success for email :' + email);
    return {
        success: false,
        error: true,
        message: Resource.msg('newsletter.signup.failure', 'common', null)
    };
}


module.exports.validateEmail = validateEmail;
module.exports.subscribeToNewsletter = subscribeToNewsletter;
