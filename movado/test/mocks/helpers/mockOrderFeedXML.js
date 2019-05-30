var FileHelper =  {
	createDirectory: function(){
		return '';
	}
}

var address = {
	firstName: 'Bhanuj',
	lastName: 'Kashyap',
	companyName: '',
	countryCode: 'US',
	address1: '7 Times Sq',
	city: 'New York',
	postalCode: 10036,
	stateCode: 'NY',
	phone: 8888888888
}

var ID = 'USPS';
var coupon = 'COUPON';
var coupons = [];
coupons[0] = coupon;

var promotion = {
	basedOnCoupon: true,
	coupons: coupon
}

var shippingPriceAdjustment = {
	getPromotion: function(){
		return promotion;
	}
}
var getShippingPriceAdjustments = [];
getShippingPriceAdjustments[0] = shippingPriceAdjustment;

var shippingLineItem = {
	getShippingPriceAdjustments : getShippingPriceAdjustments
}

var shippingLineItem = {
	getBasePrice: function(){
		return '';
	},
	getAdjustedPrice: function(){
		return '';
	},
	custom : {
		sabrixStateTotal: '',
		sabrixCountyTotal: '',
		sabrixCityTotal: '',
		sabrixDistrictTotal: '',
		sabrixAdditionalCityTotal: '',
		sabrixAdditionalDistrictTotal: ''
	},
	getAdjustedTax: function(){
		return '';
	}
}

var shippingLineItems = [];
shippingLineItems[0] = shippingLineItem;

var shipment = {
	getShippingAddress: function(){
		return address;
	},
	getShippingMethod: function(){
		return {
			ID : ID
		};
	},
	shippingLineItems: shippingLineItems,
};

var shipments = [];
shipments[0] = shipment;

var productLineItem = {
	getPosition: function(){
		return 0.0;
	},
	getProductID: function(){
		return 'PRODUCTID';
	},
	quantityValue: function(){
		return 1;
	},
	custom : {
		ispreOrderProduct : true,
		sabrixStateTotal: 0.0,
		sabrixCountyTotal: 0.0,
		sabrixCityTotal: 0.0,
		sabrixDistrictTotal : 0.0,
		sabrixAdditionalCityTotal: 0.0,
		sabrixAdditionalDistrictTotal: 0.0,
		GiftWrapMessage: 'dummyMessage'
	},
	getBasePrice: function(){
		return 0.0;
	},
	getProratedPrice: function(){
		return 0.0;
	},
	getTax: function(){
		return 0.0;
	},
	getOptionProductLineItems: function (){
		return false;
	},
	getOptionModel: function(){
		return false;
	},

}

var allProductLineItems = [];
allProductLineItems[0] = productLineItem;

var orderPaymentInstrument = {
	getPaymentMethod: function(){
		return 'Any Card';
	},
	custom : {
		AuthExpirationDate: ''
	}
}

var orderPaymentInstruments = [];
orderPaymentInstruments[0] = orderPaymentInstrument;

var order = {
	getOrderNo: function(){
		return '';
	},
	getCreationDate: function(){
		return '';
	},
	custom: {
		consumerPriceBookId: 'ABCD',
		httpLocale: 'en'
	},
	getCurrencyCode: function(){
		return '';
	},
	getAdjustedMerchandizeTotalPrice: function(){
		return '';
	},
	getTotalTax: function(){
		return '';
	},
	getTotalGrossPrice: function(){
		return '';
	},
	billingAddress: {
		firstName: 'Bhanuj',
		lastName: 'Kashyap',
		countryCode: 'US',
		address1: '7 Times Sq',
		city:  'New York',
		postalCode: 10036,
		stateCode: 'NY',
		phone: 8888888888
	},
	getShipments: shipments,
	getProductLineItems: function(){
		return allProductLineItems;
	},
	getPaymentInstruments: orderPaymentInstruments,
	getShippingTotalPrice: 10
}

var array = {
	add: function (){
		return "added";
	}
}

var ArrayList = function(){
	return array;
}

var paymentMethod = {
	SAPPaymentMethod: 'any card'
}

var PaymentMgr = {
	getPaymentMethod: function(param1){
		return paymenthMethodObj = {
			custom: paymentMethod
		}
	}
}

var Site = {
    getCurrent: function () {
        return {
            getCustomPreferenceValue: function () {
                return 'ABCD';
            }
        };
    }
};

var Order = {
	ORDER_STATUS_NEW: '',
	ORDER_STATUS_OPEN: '',
	CONFIRMATION_STATUS_CONFIRMED: '',
	ORDER_STATUS_CANCELLED: ''
}

var Logger = {
	getLogger: function(param1){
		return {
			info: function(){
				return 'info';
			},
			error: function(){
				return 'error';
			}
		}
	}
}

var file = {
	exists: function(){
		return true;
	},
	remove: function(){
		return true;
	}
}

var File = function(param1){
	return file;
}

var FileWriter = function(param1, param2){
	return {
		close: function(){
			return 'nothing';
		}
	}
}

var streamWriter = {
	writeRaw: function(){
		return '';
	},
	writeStartElement: function(){
		return '';
	},
	writeCharacters: function(){
		return '';
	},
	writeEndElement: function(){
		return '';
	},
	writeEndDocument: function(){
		return '';
	},
	flush: function(){
		return '';
	},
	close: function(){
		return '';
	}
}

var XMLStreamWriter = function(param){
	return streamWriter;
}

var StringUtils = {
	formatCalendar: function(param1, param2){
		return 'formattedDate';
	}
}

var Calendar = function(){
	return 'calender';
}

var OrderData = {
	WebSiteID: 'MOVADOUS',
	OrderType: 'ZOR',
	POType: 'ECM',
	WebOrderCreationTimeStamp: '20190101000000',
	PONumber: 123456,
	PODate: '20190101000000',
	ShiptoName: 'Bhanuj Kashyap',
	ShiptoCountry: 'US',
	BilltoName: 'Bhanuj Kashyap',
	CarrierCode: 'USPS',
	InventoryLocation: 1000,
	SubTotal: 200,
	TotalTax: 10,
	NetAmount: 200,
	ChargingShipping: 'Y',
	PaymentMethod: 'CreditCard',
	POItemNumber: 1,
	SKUNumber: 'SKU',
	Quantity: 1,
	ShippingLineItem: 'FIXEDFREIGHT'
}

var OrderManager ={
    processOrders: function(dummyMethodCallback, param1, param2, param3, param4, param5, param6){
        return 123456;
    }
}

var ShippingLineItem = function (){
	return '';
}

var ProductLineItem = function (){
	return '';
}

module.exports = {
	OrderManager,
	ShippingLineItem,
	ProductLineItem,
	PaymentMgr,
	Order,
	Logger,
	File,
	FileHelper,
	FileWriter,
	XMLStreamWriter,
	StringUtils,
	ArrayList,
	Calendar
}
