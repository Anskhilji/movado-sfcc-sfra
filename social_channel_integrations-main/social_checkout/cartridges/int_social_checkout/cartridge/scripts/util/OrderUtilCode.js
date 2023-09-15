'use strict';

var Status = require('dw/system/Status');

var OrderUtilCode = {
    RESPONSE_CODE: {
        PATCH_SUCCESS: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Order successfully updated.'
        },
        SUCCESS: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Shipment(s) successfully updated.'
        },
        NOTUPDATED: {
            status: Status.ERROR,
            code: 'NOTUPDATED',
            msg: "1 or more shipment(s) weren't updated cuz either a) request didn't transition it to 'shipped' or b) it wasn't already in a 'shipped' state."
        },
        NOTEXISTS: {
            status: Status.ERROR,
            code: 'NOTEXISTS',
            msg: "1 or more shipment(s) weren't updated cuz they didn't exist for the given order."
        },
        BADREQUEST: {
            status: Status.ERROR,
            code: 'BADREQUEST',
            msg: "Incorrect shipment(s) info 'c_shipmentsInfo' json."
        },
        ORDERCANCEL: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Order Cancelled'
        },
        ORDERCANCEL_ITEMS: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Order items cancelled'
        },
        ERROR_ORDERCANCEL: {
            status: Status.ERROR,
            code: 'OrderCancelError',
            msg: "Couldn't cancel order, see log for details"
        },
        ERROR_ORDERCANCEL_ITEMS: {
            status: Status.ERROR,
            code: 'OrderCancelError',
            msg: "Couldn't cancel items on order, see log for details"
        },
        ORDERRETURN: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Order Returned'
        },
        ERROR_ORDERRETURN: {
            status: Status.ERROR,
            code: 'SUCCOrderItemReturnError',
            msg: "Couldn't return order, see log for details"
        },
        INVALID_ACCESS_TOKEN: {
            status: Status.ERROR,
            type: 'InvalidAccessTokenException',
            msg: 'Unauthorized request! The access token is invalid.'
        },
        OPRDER_STATRUS_UPDATE_SUCCESS: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Order Statuses Updated'
        },
        NOT_SOCIAL_ORDER: {
            status: Status.ERROR,
            code: 'BADREQUEST',
            msg: 'Order not placed through social channel'
        },
        BEFORE_POST_SUCCESS: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Order before post success'
        },
        AFTER_POST_SUCCESS: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Order after post success'
        },
        ORDER_ALREADY_EXISTS_CHANNEL: {
            status: Status.ERROR,
            code: 'ERROR',
            msg: 'External order ID already exists for this channel'
        },
        ERROR_ORDER_REFUND: {
            status: Status.ERROR,
            code: 'ERROR',
            msg: 'An error has occurred during order refund'
        },
        INVALID_PRODUCTS: {
            status: Status.ERROR,
            code: 'ERROR',
            msg: 'ProductID {0} does not exists or is not available'
        },
        INSUFFICIENT_INVENTORY: {
            status: Status.ERROR,
            code: 'ERROR',
            msg: 'ProductID {0} does not have enough inventory quantity available'
        },
        INVALID_SHIPMENT: {
            status: Status.ERROR,
            code: 'ERROR',
            msg: 'Shipment {0} does not exists or is not available'
        },
        INTERNAL_ERROR: {
            status: Status.ERROR,
            code: 'INTERNAL_ERROR',
            msg: '{0}'
        },
        DEBUG_SUCCESS: {
            status: Status.OK,
            code: 'SUCCESS',
            msg: 'Endpoint is accessible and access token is valid'
        },
        OCI_RESERVATION_UNAVAILABLE: {
            status: Status.ERROR,
            code: 'ERROR',
            msg: 'There are some products unavailable'
        },
        OCI_RESERVATION_ERROR: {
            status: Status.ERROR,
            code: 'ERROR',
            msg: 'An error has occurred during OCI reservation'
        },
        OCI_RESERVATION_SUCCESS: {
            status: Status.OK,
            code: 'OK',
            msg: 'OCI reservation was successfully completed'
        }
    },

    EXTERNAL_ORDER_STATUS: {
        CREATED: 2,
        NEW: 3,
        CANCELLED: 6,
        CANCELLED_PARTIAL: 7,
        COMPLETED: 5,
        REFUNDED: 8
    },

    EXTERNAL_RETURN_STATUS: {
        NEW: 3,
        CONFIRMED: 2,
        CANCELLED: 6,
        RETURNED: 4,
        PARTIAL_RETURN: 5,
        REFUNDED: 8
    }
};

module.exports = OrderUtilCode;
