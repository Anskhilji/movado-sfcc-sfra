'use strict';
var ArrayList = require('../dw.util.Collection.js');


var lineItem={
    custom:{
        SAPTrackingNumber:'q',
        SAPCarrier:'q',
        SAPShipDate:'q',
        SAPCancelDate:'q',
        GiftWrapMessageFormatted:{
            toString:function(){
                return 'GiftWrapMessageFormatted'
            }
        },
        sapTrackingNumber:'a',
        sapCarrierCode:'a',
        sapShippedDate:'a',
        sapCancelDate:'a',
        GiftWrapMessage:'a'
    }
}
var lineItem1={
    custom:{
        SAPTrackingNumber:'q',
        SAPCarrier:'q',
        SAPShipDate:'q',
        SAPCancelDate:'q',
        GiftWrapMessageFormatted:{
            toString:function(){
                return 'GiftWrapMessageFormatted'
            }
        },
        sapTrackingNumber:'',
        sapCarrierCode:'',
        sapShippedDate:'',
        sapCancelDate:'',
        GiftWrapMessage:''
    }
}

var a={
    orderNo: '1234',
    allLineItems: 
    [lineItem,lineItem1],
    custom:{
        isMigratedOrder: true,
        OrderStatus:{
            value:{
                toString:function(){
                    return 'abc';
                }
            }
        },
        sapOrderStatus:'status'
    }

}

var array=[a,a]

var OrderManager= {
    searchOrders:function(p1,p2,p3){
        var a= new ArrayList(array);
        //console.log(a.iterator().next());
        return a.iterator();
    }
}
    


var Transaction= {
    wrap: function (item) {
        item();
    }
}
var Logger={
    getLogger:function(p1){
        return {
            error:function(p1){
                //console.log(p1);
            }
        }
    }
}

var PriceAdjustment=lineItem

var ShippingLineItem=lineItem

module.exports ={
    lineItem,
    OrderManager,
    Transaction,
    Logger,
    PriceAdjustment,
    ShippingLineItem
}

