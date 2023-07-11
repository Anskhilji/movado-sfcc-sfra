'use strict';

var Status = require('dw/system/Status');

var OrderUtilCode = {
  RESPONES_CODE : {
    PATCH_SUCCESS : {
      status: Status.OK,
      code: "SUCCESS",
      msg: "Order successfully updated."
    },
    SUCCESS: {
      status: Status.OK,
      code: "SUCCESS",
      msg: "Shipment(s) successfully updated."
    },
    NOTUPDATED: {
      status: Status.ERROR,
      code: "NOTUPDATED",
      msg: "1 or more shipment(s) weren't updated cuz either a) request didn't transition it to 'shipped' or b) it wasn't already in a 'shipped' state."
    },
    NOTEXISTS: {
      status: Status.ERROR,
      code: "NOTEXISTS",
      msg: "1 or more shipment(s) weren't updated cuz they didn't exist for the given order."
    },
    BADREQUEST: {
      status: Status.ERROR,
      code: "BADREQUEST",
      msg: "Incorrect shipment(s) info 'c_shipmentsInfo' json."
    },
    ORDERCANCEL: {
      status: Status.OK,
      code: "SUCCESS",
      msg: "Order Cancelled"
    }, 
    ERROR_ORDERCANCEL: {
      status: Status.ERROR,
      code: "OrderCancelError",
      msg: "Couldn't cancell order, see log for details"
    },       
    ORDERRETURN: {
      status: Status.OK,
      code: "SUCCESS",
      msg: "Order Returned"
    },
    ERROR_ORDERRETURN: {
      status: Status.ERROR,
      code: "SUCCOrderItemReturnError",
      msg: "Couldn't return order, see log for details"
    },    
    INVALID_ACCESS_TOKEN: {
      status: Status.ERROR,
      type: "InvalidAccessTokenException",
      msg: "Unauthorized request! The access token is invalid."
    },
    OPRDER_STATRUS_UPDATE_SUCCESS: {
      status: Status.OK,
      code: "SUCCESS",
      msg: "Order Statuses Updated"
    },
    NOT_SOCIAL_ORDER: {
      status: Status.ERROR,
      code: "BADREQUEST",
      msg: "Order not placed through social channel"
    }           
  },

  TikTokChannelID : 15,

  EXTERNAL_ORDER_STATUS: {
    CREATED: 2,
    NEW: 3,      
    CANCELLED: 6,
    CANCELLED_PARTIAL: 7,  
    COMPLETED: 5
  },

  EXTERNAL_RETURN_STATUS: {
    NEW: 3,
    CONFIRMED: 2,      
    CANCELLED: 6,
    RETURNED: 4,  
    PARTIAL_RETURN: 5
  }
};

module.exports = OrderUtilCode;