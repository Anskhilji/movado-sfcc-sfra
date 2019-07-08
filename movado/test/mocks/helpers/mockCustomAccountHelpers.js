'use strict';

var req={
    currentCustomer: {
        profile: {
            customerNo: 1234
        },
        raw: {
            addressBook: {
                preferredAddress: {}
            }
        }
    },
    locale:{
        id: 'en_US'
    }
};

var addressModel = function(p1){
    return {};
}


var accountModel = function(p1,p2,p3){
        return {};
}

var orderModel = function (p1,p2){
    return {};
}

var URLUtils= {}
var oAuthRenentryRedirectEndpoints={}
var OrderMgr= {
    searchOrders:function(p1,p2,p3,p4){
        
        return {
            first:function(){
                return null;
            }
        };
    }
}
var Order={
    ORDER_STATUS_REPLACED: 'Replaced'
}
var Locale={
    getLocale: function(p1){
        return p1;
    }
}

var bithdate=5
var birthmonth=12

var newsletterHelper={
    subscribeToNewsletter: function(p1,p2){
        return true;
    },
    subscribeToNewsletter: function(p1){
        return true;
    }
}

var addressBook={
    addresses:{
        length:3
    }
}

var AddressModel=function(p1){
    return {address:'add1'};
}
module.exports ={
    req,
    URLUtils,
    oAuthRenentryRedirectEndpoints,
    OrderMgr,
    Order,
    Locale,
    addressModel,
    accountModel,
    orderModel,
    bithdate,
    birthmonth,
    newsletterHelper,
    AddressModel,
    addressBook
}
                 