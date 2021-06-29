/* eslint-disable block-scoped-var */
/**
* Purpose:	Exports Orders placed or modified since last successful export. Order file is sent to Listrak via FTP.
*	@output products : Array
*/

require('dw/order');
require('dw/catalog');
require('dw/value');
require('dw/io');
require('dw/web');
require('dw/system');
require('dw/util');
require('dw/net');
require('dw/object');

var Calendar = require('dw/util/Calendar');
var ErrorHandling = require('~/cartridge/scripts/util/ltkErrorHandling.js');
importScript('sync/ltkExportUtils.js');
importScript('objects/ltkOrder.js');

var ExportUtil = require('~/cartridge/scripts/sync/ltkExportUtils');

/**
 * send order data in flat files
 * @param {*} args inputs
 */
function orderSync(args) {
    var enabled = dw.system.Site.current.preferences.custom.Listrak_OrderExport_Enabled
	&& dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled;
    if (!empty(enabled) && !enabled)	{
        return;
    }

	// Record the export start time
    var calendar = new Calendar();
    var currentExportStartTime = calendar.getTime().toISOString();

	// Load the date of the last successful export - If no date is found go back 5 yrs
    var lastExport = new ltkExportInfo('lastOrderExportDate');
    var lastExportDate = lastExport.GetValueAsDate();

    calendar.set(Calendar.DATE, calendar.get(Calendar.DATE) - 30); // 30 days before the current date
    var maxHistoryDate = calendar.getTime();

    if (empty(lastExportDate) || maxHistoryDate > lastExportDate)	{
        lastExportDate = maxHistoryDate;
    }


	// Get the orders ready for export
    var products = [];

	// var products : List = new dw.util.List(Product);
    var orders = dw.order.OrderMgr.queryOrders('lastModified >= {1}', 'orderNo', false, lastExportDate);

    if (orders.hasNext())	{
		// //////// Prepare order files //////////
        var orderfile = new ExportFile('orders_DW.txt');
        var itemfile = new ExportFile('orderItems_DW.txt');

		// order header row
        orderfile.AddRowItem('Email');
        orderfile.AddRowItem('OrderNumber');
        orderfile.AddRowItem('DateEntered');
        orderfile.AddRowItem('OrderTotal');
        orderfile.AddRowItem('ItemTotal');
        orderfile.AddRowItem('TaxTotal');
        orderfile.AddRowItem('ShippingTotal');
        orderfile.AddRowItem('Status');
        orderfile.AddRowItem('CouponCode');
        orderfile.AddRowItem('TrackingNumber');
        orderfile.AddRowItem('InternalStatus');
        orderfile.WriteRow();

		// item header row
        itemfile.AddRowItem('OrderNumber');
        itemfile.AddRowItem('Sku');
        itemfile.AddRowItem('Quantity');
        itemfile.AddRowItem('Price');
        itemfile.AddRowItem('TrackingNumber');
        itemfile.AddRowItem('ItemTotal');
        itemfile.WriteRow();

		// Process all orders
        for (var idx = 0; idx < orders.getCount(); idx++) {
            if (orders.hasNext) {
                var order = orders.next();
            } else {
                break;
            }
            var o = new ltkOrder();
            o.LoadOrder(order);

            var orderStatusFilters = [];
            if (!empty(dw.system.Site.current.preferences.custom.Listrak_OrderStatusFilter)) {
                orderStatusFilters = dw.system.Site.current.preferences.custom.Listrak_OrderStatusFilter;
            }

    		var continueProcessing = true;
    		for (var i = 0; i < orderStatusFilters.length; i++) {
        		orderStatusFilter = orderStatusFilters[i];
        		if (o.Order.Status.toLowerCase() === orderStatusFilter.toLowerCase()) {
            		continueProcessing = false;
            		continue; // eslint-disable-line no-continue
        		}
    		}

    		if (!continueProcessing) {
        		continue; // eslint-disable-line no-continue
    		}

			// Add the order information to the order file
            orderfile.AddRowItem(decodeURI(o.Order.EmailAddress), true);
            orderfile.AddRowItem(o.Order.OrderNumber, true);
            orderfile.AddRowItemAsDate(o.Order.OrderDate);
            orderfile.AddRowItem(o.orderTotal().toFixed(2));
            orderfile.AddRowItem(o.Order.ItemTotal.toFixed(2));
            orderfile.AddRowItem(o.Order.TaxTotal.toFixed(2));
            orderfile.AddRowItem(o.Order.ShipTotal.toFixed(2));

            var status = 'NotSet';
            switch (o.Order.Status) {
                case 'NEW' :
                case 'CREATED':
                case 'OPEN' :
                    status = 'Pending';
                    break;
                case 'CANCELLED' :
                    status = 'Canceled';
                    break;
                case 'REPLACED' :
                    status = 'Misc';
                    break;
                default :
                    status = 'Unknown';
                    break;
            }


            if (order.getShippingStatus().getDisplayValue() === 'SHIPPED') { status = 'Shipped'; }
            if (o.Order.Status === 'COMPLETED') { status = 'Completed'; }

            orderfile.AddRowItem(status, true);
            orderfile.AddRowItem(o.Order.CouponCodes, true);
            orderfile.AddRowItem(o.Order.TrackingNumbers, true);
            orderfile.AddRowItem(o.Order.Status, true);

            orderfile.WriteRow();

			// Add the order items for this order to the items files
            for (i = 0; i < o.Order.OrderItems.length; i++)			{
                var item = o.Order.OrderItems[i];
                itemfile.AddRowItem(o.Order.OrderNumber, true);
                itemfile.AddRowItem(item.Sku, true);
                itemfile.AddRowItem(item.Qty);
                itemfile.AddRowItem(item.Price.toFixed(2));
                itemfile.AddRowItem(item.TrackingNumber, true);
                itemfile.AddRowItem((item.Price * item.Qty).toFixed(2));
                itemfile.WriteRow();

                if (item.Product != null) { products.push(item.Product); }
            }
        }

        args.products = products;

		// Write the files and submit via FTP to Listrak
        var orderResult = orderfile.SubmitFile();
        var itemResult = itemfile.SubmitFile();
		/* Close the SeekableIterator object. */
        orders.close();
        if (orderResult === false || itemResult === false)		{
            return;
        }

        orderfile.Delete();
        itemfile.Delete();
    }
    lastExport.SetValue(currentExportStartTime);
    return;
}


exports.orderSync = orderSync;
