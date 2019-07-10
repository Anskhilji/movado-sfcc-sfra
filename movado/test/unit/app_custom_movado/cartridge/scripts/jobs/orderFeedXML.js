'use strict';

var assert = require('chai').assert;
var mockOrderFeedXML = require('../../../../../mocks/helpers/mockOrderFeedXML');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('orderFeedXML', function () {
	describe('exportOrderFeed', function () {
		it('Generates the order XML with ALL Options and Gif Message', function () {

			var expected = true;

			var object = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/jobs/orderFeedXML', {
					'dw/system/Site': mockOrderFeedXML.Site,
					'dw/order/OrderMgr' : mockOrderFeedXML.OrderManager,
					'dw/order/PaymentMgr': mockOrderFeedXML.PaymentMgr,
					'dw/order/ShippingLineItem': mockOrderFeedXML.ShippingLineItem,
					'dw/order/ProductLineItem': mockOrderFeedXML.ProductLineItem,
					'dw/order/Order': mockOrderFeedXML.Order,
					'dw/system/Logger': mockOrderFeedXML.Logger,
					'dw/io/File': mockOrderFeedXML.File,
					'*/cartridge/scripts/file/FileHelper': mockOrderFeedXML.FileHelper,
					'dw/io/FileWriter': mockOrderFeedXML.FileWriter,
					'dw/io/XMLStreamWriter': mockOrderFeedXML.XMLStreamWriter,
					'dw/util/StringUtils': mockOrderFeedXML.StringUtils,
					'dw/util/ArrayList': mockOrderFeedXML.ArrayList,
					'dw/util/Calendar': mockOrderFeedXML.Calendar,
					'dw/catalog/ProductMgr': mockOrderFeedXML.ProductMgr,
					'*/cartridge/scripts/helpers/pricing': mockOrderFeedXML.PriceHelper,
					'dw/system/Transaction': mockOrderFeedXML.Transaction
					});

			var result = object.exportOrderFeed();
			assert.equal(result, expected);
		});
	});
});
