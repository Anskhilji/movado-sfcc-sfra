'use strict';

var assert = require('chai').assert;
var mockOrderFeedXML = require('../../../../../mocks/helpers/mockOrderFeedXML');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('orderFeedXML', function () {
	describe('exportOrderFeed', function () {
		it('Generates the order XML and uploads to SFTP', function () {

			var expected = true;;

			var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/jobs/orderFeedXML', {
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
					'dw/util/Calendar': mockOrderFeedXML.Calendar
					});

			var result = object.exportOrderFeed();
			assert.deepEqual(result, expected);
		});
	});
});
