Ext.define('Order', {
    extend: 'Ext.data.Model',
    fields: ['orderNo', 'customerName', 'confirmationStatus', 'paymentStatus']
});

Ext.create('dw.ext.SystemObjectStore',{
	storeId: 'OrderStore',
	type: 'Order', 
	model:'Order',
	pageSize: 15,
	remotefilter: true
});

Ext.define('dw.ext.OrderPicker', {
    extend: 'Ext.window.Window',
	title: 'Order picker',
	height: 400,
	width: 640,
	layout: 'fit',
	items : {
	    xtype: 'grid',
	    border: false,
	    dockedItems: [{
	        xtype: 'pagingtoolbar',
	        store: 'OrderStore',
	        dock: 'bottom',
	        displayInfo: true
	    }],
	    columns: [{header :'OrderNo', dataIndex: 'orderNo', flex: 1},{header :'Customer Name', dataIndex: 'customerName', flex: 1},{header :'Export Status', dataIndex: 'exportStatus', flex: 1},{header :'Payment Status', dataIndex: 'paymentStatus', flex: 1}],
	    store: 'OrderStore'
	}
});