Ext.define('Product', {
    extend: 'Ext.data.Model',
    fields: ['ID','name']
});

Ext.create('dw.ext.SystemObjectStore',{
	storeId: 'ProductStore',
	type: 'Product', 
	model:'Product',
	pageSize: 15,
	remotefilter: true
});

Ext.define('dw.ext.ProductPicker', {
    extend: 'Ext.window.Window',
	title: 'Product picker',
	height: 400,
	width: 500,
	layout: 'fit',
	items : {
	    xtype: 'grid',
	    border: false,
	    dockedItems: [{
	        xtype: 'pagingtoolbar',
	        store: 'ProductStore',   // same store GridPanel is using
	        dock: 'bottom',
	        displayInfo: true
	    }],
	    columns: [{header :'ID', dataIndex: 'ID', flex: 1},{header :'Name', dataIndex: 'name', flex: 1}],
	    store: 'ProductStore'
	}
});