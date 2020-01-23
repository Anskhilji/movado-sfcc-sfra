'use strict'

var Resource = require('dw/web/Resource');

function emailSubscriptionResponse(result) {
    if (result) {
        return {
            success: true,
            optOutFlag: true,
            customerFound: true,
            message: result.message
        };
    } else {
        return {
            success: true,
            optOutFlag: false,
            customerFound: true,
            message: Resource.msg('newsletter.signup.success', 'common', null)
        };
    }
    
}

module.exports = {
    emailSubscriptionResponse: emailSubscriptionResponse
}
