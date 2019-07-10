'use strict'

var priceBook = {
	ID: 'priceBookID'
};

var model = {
	priceInfo: {
		priceBook: 'priceBook'
	}
}

var PriceHelper =  {
	getRootPriceBook: function(param1){
	return priceBook;
	}
}

var product = {
	getPriceModel: function(){
		return model;
	}
}

var ProductMgr = {
	getProduct: function(para1){
		return product;
	}
}

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
	phone: {
		replace: function (p1, p2) {
			return 8888888888;
		}
	}
}

var promotion = {
	custom: {
		promoCode: 'PromoCaode'
	},
	getID: function(){
		return 'PromotionID';
	}
};

var productPriceAdjustment = {
	getPromotion: function () {
	    return promotion;
	},
	custom : {
		sabrixStateTotal: '1.00',
		sabrixCountyTotal: '1.00',
		sabrixCityTotal: '1.00',
		sabrixDistrictTotal: '0.00',
		sabrixAdditionalCityTotal: '0.00',
		sabrixAdditionalDistrictTotal: '0.00',
	}
}

var shippingPriceAdjustment = {
	getPromotion: function(){
		return promotion;
	},
	custom : {
		sabrixStateTotal: '1.00',
		sabrixCountyTotal: '1.00',
		sabrixCityTotal: '1.00',
		sabrixDistrictTotal: '0.00',
		sabrixAdditionalCityTotal: '0.00',
		sabrixAdditionalDistrictTotal: '0.00',
	}
}

var orderPriceAdjustment = {
	getPromotion: function(){
		return promotion;
	},
	custom : {
		sabrixStateTotal: '1.00',
		sabrixCountyTotal: '1.00',
		sabrixCityTotal: '1.00',
		sabrixDistrictTotal: '0.00',
		sabrixAdditionalCityTotal: '0.00',
		sabrixAdditionalDistrictTotal: '0.00',
	},
	price: {
		value: 90.00
	},
	tax: {
		value: 1.00
	}
}

var shippingPriceAdjustmentsforTax = [
	{
		custom : {
			sabrixStateTotal: '1.00',
			sabrixCountyTotal: '1.00',
			sabrixCityTotal: '1.00',
			sabrixDistrictTotal: '0.00',
			sabrixAdditionalCityTotal: '0.00',
			sabrixAdditionalDistrictTotal: '0.00',
		},
		price: {
			value: 5.00
		},
		tax: {
			value: 1.00
		}
	}
]

var orderAdjustmentCollection = [];
orderAdjustmentCollection[0] = orderPriceAdjustment;

var adjustmentCollection = [];
adjustmentCollection[0] = productPriceAdjustment;

var getShippingPriceAdjustments = [];
getShippingPriceAdjustments[0] = shippingPriceAdjustment;

var SLI = function (){};
function ShippingLineItem (){
	SLI.call(this);
	return {};
};
ShippingLineItem.prototype = Object.create(SLI.prototype);
ShippingLineItem.prototype.constructor = ShippingLineItem;
var shippingLineItem = new ShippingLineItem();

var PLI = function (){};
function ProductLineItem (){
	PLI.call(this);
	return {};
};
ProductLineItem.prototype = Object.create(PLI.prototype);
ProductLineItem.prototype.constructor = ProductLineItem;
var productLineItem = new ProductLineItem();

shippingLineItem = {
	UUID: 'UUID',
	getBasePrice: function (){
		return 10.00;
	},
	getAdjustedPrice: function (){
		return 8.00;
	},
	custom: {
		// sabrixStateTotal: '0.00',
		// sabrixCountyTotal: '0.00',
		// sabrixCityTotal: '0.00',
		// sabrixDistrictTotal: '0.00',
		// sabrixAdditionalCityTotal: '0.00',
		// sabrixAdditionalDistrictTotal: '0.00',
		isThisBillable: 'Y'
	},
	getAdjustedTax: function (){
		return 2.00;
	},
	basePrice: {
		value: 10.00
	},
	proratedPrice: {
		value: 5.00
	},
	adjustedPrice: {
		value: 8.00
	},
	adjustedTax: {
		value: 8.00
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
			ID : 'ShipID'
		};
	},
	shippingLineItems: shippingLineItems,
	shippingPriceAdjustments: shippingPriceAdjustments
};

var shipments = [];
shipments[0] = shipment;

var productLineItemOptions = [];
productLineItemOptions[0] = {
    UUID: 'UUID',
    getOptionID: function (){
	    return 'GiftWrap';
	}
};

productLineItemOptions[1] = {
    UUID: 'UUID',
    getOptionID: function (){
	    return 'Embossed';
	}
};

productLineItemOptions[2] = {
    UUID: 'UUID',
    getOptionID: function (){
	    return 'Engraved';
	}
};

productLineItem = {
	UUID: 'UUID',
	getPosition: function(){
		return 1;
	},
	getProductID: function(){
		return 'PRODUCTID';
	},
	quantityValue: function(){
		return 1;
	},
	productID: 'PRODUCTID',
	custom : {
		isPreOrderProduct : true,
		sabrixStateTotal: 1.0,
		sabrixCountyTotal: 1.0,
		sabrixCityTotal: 1.0,
		sabrixDistrictTotal : 0.0,
		sabrixAdditionalCityTotal: 0.0,
		sabrixAdditionalDistrictTotal: 0.0,
		GiftWrapMessage: 'dummyMessage',
		giftWrapOption: 'giftWrapOption',
		giftBoxSKU: 'giftBoxSKU',
		isGiftWrapped: true,
		engraveMessageLine1: 'engraveMessageLine1',
		engraveMessageLine2: 'engraveMessageLine2',
		fontName: 'fontName',
		embossMessageLine1: 'embossMessageLine1',
		isHorizontal: 'isHorizontal',
		isThisBillable: 'Y',
		basePrice: 10.0
	},
	getBasePrice: function(){
		return 10.0;
	},
	getProratedPrice: function(){
		return 5.0;
	},
	getTax: function(){
		return 10.0;
	},
	getOptionProductLineItems: function (){
		return productLineItemOptions;
	},
	getOptionModel: function(){
		return {
			getOption: function(param1){
				return {
					getID: function(){
						return 'GiftWrapped';
					}
				};
			},
			getSelectedOptionValue: function(param2){
				return 'OptionValue';
			},
			getPrice: function(param3){
				return 10.00;
			}
		};
	},
	getPriceAdjustments: function(){
		return adjustmentCollection;
	},
	priceAdjustments: adjustmentCollection,
	basePrice: {
		value: 10.00
	},
	proratedPrice: {
		value: 5.00
	},
	adjustedPrice: {
		value: 8.00
	},
	tax: {
		value: 10.00
	},
	adjustedTax: {
		value: 9.00
	}
}

var productLineItem1 = {
	UUID: 'UUID',
	getPosition: function(){
		return 1;
	},
	getProductID: function(){
		return 'PRODUCTID';
	},
	quantityValue: function(){
		return 1;
	},
	productID: 'PRODUCTID',
	custom : {
		isPreOrderProduct : true,
		sabrixStateTotal: 1.0,
		sabrixCountyTotal: 1.0,
		sabrixCityTotal: 1.0,
		sabrixDistrictTotal : 0.0,
		sabrixAdditionalCityTotal: 0.0,
		sabrixAdditionalDistrictTotal: 0.0,
		GiftWrapMessage: 'dummyMessage',
		giftWrapOption: 'giftWrapOption',
		giftBoxSKU: 'giftBoxSKU',
		isGiftWrapped: false,
		engraveMessageLine1: 'engraveMessageLine1',
		engraveMessageLine2: 'engraveMessageLine2',
		fontName: 'fontName',
		embossMessageLine1: 'embossMessageLine1',
		isHorizontal: 'isHorizontal',
		isThisBillable: 'Y',
		basePrice: 10.0
	},
	getBasePrice: function(){
		return 10.0;
	},
	getProratedPrice: function(){
		return 5.0;
	},
	getTax: function(){
		return 10.0;
	},
	getOptionProductLineItems: function (){
		return productLineItemOptions;
	},
	getOptionModel: function(){
		return {
			getOption: function(param1){
				return {
					getID: function(){
						return 'Embossed';
					}
				};
			},
			getSelectedOptionValue: function(param2){
				return 'OptionValue';
			},
			getPrice: function(param3){
				return 10.00;
			}
		};
	},
	getPriceAdjustments: function(){
		return adjustmentCollection;
	},
	priceAdjustments: adjustmentCollection,
	basePrice: {
		value: 10.00
	},
	proratedPrice: {
		value: 5.00
	},
	adjustedPrice: {
		value: 8.00
	},
	tax: {
		value: 10.00
	},
	adjustedTax: {
		value: 9.00
	}
}

var productLineItem2 = {
	UUID: 'UUID',
	getPosition: function(){
		return 1;
	},
	getProductID: function(){
		return 'PRODUCTID';
	},
	quantityValue: function(){
		return 1;
	},
	productID: 'PRODUCTID',
	custom : {
		isPreOrderProduct : true,
		sabrixStateTotal: 1.0,
		sabrixCountyTotal: 1.0,
		sabrixCityTotal: 1.0,
		sabrixDistrictTotal : 0.0,
		sabrixAdditionalCityTotal: 0.0,
		sabrixAdditionalDistrictTotal: 0.0,
		GiftWrapMessage: 'dummyMessage',
		giftWrapOption: 'giftWrapOption',
		giftBoxSKU: 'giftBoxSKU',
		isGiftWrapped: false,
		engraveMessageLine1: 'engraveMessageLine1',
		engraveMessageLine2: 'engraveMessageLine2',
		fontName: 'fontName',
		embossMessageLine1: 'embossMessageLine1',
		isHorizontal: 'isHorizontal',
		isThisBillable: 'Y',
		basePrice: 10.0
	},
	getBasePrice: function(){
		return 10.0;
	},
	getProratedPrice: function(){
		return 5.0;
	},
	getTax: function(){
		return 10.0;
	},
	getOptionProductLineItems: function (){
		return productLineItemOptions;
	},
	getOptionModel: function(){
		return {
			getOption: function(param1){
				return {
					getID: function(){
						return 'Engraved';
					}
				};
			},
			getSelectedOptionValue: function(param2){
				return 'OptionValue';
			},
			getPrice: function(param3){
				return 10.00;
			}
		};
	},
	getPriceAdjustments: function(){
		return adjustmentCollection;
	},
	priceAdjustments: adjustmentCollection,
	basePrice: {
		value: 10.00
	},
	proratedPrice: {
		value: 5.00
	},
	adjustedPrice: {
		value: 8.00
	},
	tax: {
		value: 10.00
	},
	adjustedTax: {
		value: 9.00
	}
}
var allProductLineItems = [];
allProductLineItems[0] = productLineItem;
allProductLineItems[1] = productLineItem1;
allProductLineItems[2] = productLineItem2;

var orderPaymentInstrument = {
	getPaymentMethod: function(){
		return 'Any Card';
	},
	custom : {
		authExpirationDate: ''
	}
}

var orderPaymentInstruments = [];
orderPaymentInstruments[0] = orderPaymentInstrument;

var shippingPriceAdjustmentObj = {
	custom : {
		sabrixStateTotal: '1.00',
		sabrixCountyTotal: '1.00',
		sabrixCityTotal: '1.00',
		sabrixDistrictTotal: '0.00',
		sabrixAdditionalCityTotal: '0.00',
		sabrixAdditionalDistrictTotal: '0.00'
	},
	tax: {
		value: 2.00
	},
}

var shippingPriceAdjustments = [];
shippingPriceAdjustments[0] = shippingPriceAdjustmentObj;

var Order = {
	ORDER_STATUS_REPLACED: '',
	ORDER_STATUS_FAILED: '',
	CONFIRMATION_STATUS_CONFIRMED: '',
	ORDER_STATUS_CANCELLED: '',
	EXPORT_STATUS_EXPORTED: ''
}

var order = {
	getOrderNo: function(){
		return '1234567890';
	},
	getCreationDate: function(){
		return '';
	},
	custom: {
		consumerPriceBookId: 'ABCD',
		httpLocale: 'en'
	},
	getCurrencyCode: function(){
		return 'USD';
	},
	getAdjustedMerchandizeTotalPrice: function(){
		return 100.00;
	},
	adjustedMerchandizeTotalPrice: {
		value: 80.00
	},
	adjustedShippingTotalPrice: {
		value: 10.00
	},
	adjustedShippingTotalTax: {
		value: 2.00
	},
	adjustedShippingTotalGrossPrice: {
		value: 3.00
	},
	shippingTotalGrossPrice: {
		value: 3.00
	},
	getTotalTax: function(){
		return 10.00;
	},
	getTotalGrossPrice: function(){
		return 100.00;
	},
	billingAddress: {
		firstName: 'Bhanuj',
		lastName: 'Kashyap',
		countryCode: 'US',
		address1: '7 Times Sq',
		city:  'New York',
		postalCode: 10036,
		stateCode: 'NY',
		phone: {
			replace: function(p1, p2) {
				return 8888888888;
			}
		}
	},
	getShipments: function () {
		return shipments;
	},
	shipments: {
		0: {
			shippingPriceAdjustments
		},
		length: 1
	},
	shippingPriceAdjustments: shippingPriceAdjustmentsforTax,
	allProductLineItems: allProductLineItems,
	getProductLineItems: function (){
		return allProductLineItems;
	},
	getPaymentInstruments: function () {
		return orderPaymentInstruments;
	},
	getShippingTotalPrice: function () {
		return 10.00;
	},
	getPriceAdjustments: function () {
		return orderAdjustmentCollection;
	},
	priceAdjustments: orderAdjustmentCollection,
	setExportStatus: function (param2) {
		return '';
	}
}

var ArrayList = function(){
	return {
		add: function (){
			return "added";
		},
		length: 1
	}
};

var PaymentMgr = {
	getPaymentMethod: function(param1){
		return {
			custom: {
				SAPPaymentMethod: 'SAP'
			}
		}
	}
};

var Site = {
    getCurrent: function () {
        return {
            getCustomPreferenceValue: function () {
                return 'ABCD';
            }
        };
    }
};

var Logger = {
	getLogger: function(param1){
		return {
			warn: function(){
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

var OrderManager = {
    processOrders: function(generateOrderXML, param1, param2, param3, param4, param5, param6){
        return generateOrderXML.call(null, order);
    }
};

var Transaction = {
    wrap: function (callBack) {
        return callBack.call();
    },
    begin: function () {},
    commit: function () {}
};

module.exports = {
	Site: Site,
	OrderManager: OrderManager,
	ShippingLineItem: ShippingLineItem,
	ProductLineItem: ProductLineItem,
	PaymentMgr: PaymentMgr,
	Order: Order,
	Logger: Logger,
	File: File,
	FileHelper: FileHelper,
	FileWriter: FileWriter,
	XMLStreamWriter: XMLStreamWriter,
	StringUtils: StringUtils,
	ArrayList: ArrayList,
	Calendar: Calendar,
	ProductMgr: ProductMgr,
	PriceHelper: PriceHelper,
	Transaction: Transaction
}
