function create(order) {
    var customer = order.customer,
        customerModel,
        customerCreationDate,
        customerNote;

    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');
    var UUIDUtils = require('dw/util/UUIDUtils');

    var RCUtilities = require('~/cartridge/scripts/riskified/util/RCUtilities');
    var Constants = require('~/cartridge/scripts/riskified/util/Constants');

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');
    
    if (empty(customer.note)) {
        customerNote = '';
    }

    if (customer.isRegistered()) {
        Calendar = new Calendar(customer.profile.getCreationDate());
        customerCreationDate = StringUtils.formatCalendar(Calendar, Constants.RISKIFIED_DATE_FORMAT);
        customerModel = {
            created_at     : customerCreationDate,
            email          : RCUtilities.escape(customer.profile.email, regExp, '', true),
            first_name     : RCUtilities.escape(customer.profile.firstName, regExp, '', true),
            id             : RCUtilities.escape(customer.profile.customerNo, regExp, '', true),
            last_name      : RCUtilities.escape(customer.profile.lastName, regExp, '', true),
            note           : customerNote,
            orders_count   : customer.orderHistory.orderCount,
            verified_email : false,
            account_type   : 'registered'
        };
    } else {
        Calendar = new Calendar(order.getCreationDate());
        orderCreationDate = StringUtils.formatCalendar(Calendar, Constants.RISKIFIED_DATE_FORMAT);
        /**
         * Custom: Start Setting first_name  and last_name from Billing Address 
         */
        customerModel = {
            created_at     : orderCreationDate,
            email          : RCUtilities.escape(order.customerEmail, regExp, '', true),
            first_name     : RCUtilities.escape(order.billingAddress.firstName, regExp, '', true),
            id             : UUIDUtils.createUUID(),
            last_name      : RCUtilities.escape(order.billingAddress.lastName, regExp, '', true),
            note           : customerNote,
            orders_count   : 0,
            verified_email : false,
            account_type   : 'guest'
        };

        /**
         * Custom: End
         */
    }

    return customerModel;
}

exports.create = create;
