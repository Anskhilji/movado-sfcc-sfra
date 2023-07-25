/**
 * @class FeedFormPanel
 * @extends Ext.FormPanel
 * @author Danny Gehl
 *
 * The form to edit the feeds.
 *
 * @constructor
 * Create a new Feed Form Panel
 * @param {Object} the main panel
 */

Ext.create('Ext.data.Store', {
    storeId: 'FeedTypes',
    fields: ['id'],
    data: [
        {id: 'CSV'}
    ],
    autoLoad: true
});

Ext.create('Ext.data.Store', {
    storeId: 'FileEncodings',
    fields: ['id'],
    data: [
        {id: 'UTF-8'},
        {id: 'ISO-8859-1'}
    ],
    autoLoad: true
});

Ext.create('Ext.data.Store', {
    storeId: 'FeedObjectTypes',
    fields: ['id'],
    data: [
        {id: 'Catalog'}
    ],
    autoLoad: true
});

Ext.create('Ext.data.JsonStore', {
    storeId: 'AvailableSites',
    fields: ['id', 'name'],
    proxy: {
        type: 'ajax',
        url : 'BMCustomFeeds-GetAllSites',
        reader: {
            type: 'json'
        }
    },
    listeners: {
        load: function(t, records, options) {
        	var group = Ext.getCmp('assignedSites');

        	if(group.items) {

	        	for(var i = 0; i < records.length; i++) {
	              var tempObj = new Ext.form.Checkbox({
	            	  triggerAction: 'all',
	            	  boxLabel: records[i].data.name,
	            	  name: records[i].data.id,
	            	  inputValue: records[i].data.id
	              });
	              group.items.add(tempObj);
	        	}
        	}

            group.doLayout();
        }
    },
    autoLoad: true
});

Ext.create('Ext.data.Store', {
    storeId: 'Folders',
    fields: ['id'],
    data: [
        {id: 'IMPEX/'},
        {id: 'REALMDATA/'},
        {id: 'IMPEX/src/feeds/export/'},
        {id: 'TEMP/'},
        {id: 'CATALOGS/'}
    ],
    autoLoad: true
});

Ext.create('Ext.data.Store', {
    storeId: 'Categories',
    fields: ['id'],
    data: [
        {id: 'None'},
        {id: 'SocialChannelGoogle'},
        {id: 'SocialChannelInstagram'},
        {id: 'SocialChannelSnapchat'},
        {id: 'SocialChannelTiktok'}
    ],
    autoLoad: true
});

Ext.create('Ext.data.Store', {
    storeId: 'GoogleShoppingCategories',
    fields: ['id'],
    data: [
        {id: 'Animals & Pet Supplies'},
        {id: 'Apparel & Accessories'},
        {id: 'Arts & Entertainment'},
        {id: 'Baby & Toddler'},
        {id: 'Business & Industrial'},
        {id: 'Cameras & Optics'},
        {id: 'Electronics'},
        {id: 'Food, Beverages & Tobacco'},
        {id: 'Furniture'},
        {id: 'Hardware'},
        {id: 'Health & Beauty'},
        {id: 'Home & Garden'},
        {id: 'Luggage & Bags'},
        {id: 'Mature'},
        {id: 'Media'},
        {id: 'Office Supplies'},
        {id: 'Religious & Ceremonial'},
        {id: 'Software'},
        {id: 'Sporting Goods'},
        {id: 'Toys & Games'},
        {id: 'Vehicles & Parts'}
    ],
    autoLoad: true
});

FeedFormPanel = function (main) {
    // turn on validation errors beside the field globally
    Ext.form.Field.prototype.msgTarget = 'side';

    var pidField = new Ext.form.TextField({
        id: 'preview-id',
        emptyText: 'Enter an ID',
        text: '',
        xtype: 'textfield',
        width: 220
    });
    FeedFormPanel.superclass.constructor.call(this, {
        monitorValid: true,
        labelAlign: 'top',
        region: 'center',
        frame: true,
        bodyStyle: 'padding:5px 5px 0',
        fit: true,
        tbar: [
            'Preview object id:',
            pidField
            , {
                text: '...',
                handler: function () {
                	var picker = null;
                	switch(main.formPanel.getForm().findField('feedContext').getValue()) {
                		case 'Catalog' : picker = Ext.create('dw.ext.ProductPicker');
                              break;
                        default: picker = null;
                	}

                	if(picker != null) {
	                    picker.items.get(0).on('itemdblclick', function (grid, record, item, index, e, eOpts) {
	                    	//different models have different 'key',
	                    	//thus to avoid code duplicate, we get the value from first column
	                    	pidField.setRawValue(Ext.fly(Ext.fly(item).query('.x-grid-cell')[0]).down('div').dom.innerHTML);
	                        picker.hide();
	                    });
	                    picker.show();
                	}
                }
            },
            , {
                iconCls: 'find',
                scope: this,
                handler: function () {
                    Ext.Ajax.request({
                        url: 'BMCustomFeeds-Preview',
                        params: {pid: pidField.getValue(), feed: main.record.data.id, feedContext : main.formPanel.getForm().findField('feedContext').getValue(), feedPreviewFormat : main.formPanel.getForm().findField('type').getValue()},
                        callback: function (options, success, response) {
                            main.preview.items.first().setValue(response.responseText);
                        }
                    });
                }
            },
            '->',
            Ext.create('Ext.button.Split', {
                iconCls: 'layout',
                text: 'Preview pane',
                tooltip: {title: 'Preview', text: 'Show, move or hide the preview Pane'},
                handler: main.movePreview,
                scope: main,
                menu: {
                    id: 'reading-menu',
                    cls: 'reading-menu',
                    width: 100,
                    items: [{
                        text: 'Right',
                        checked: true,
                        group: 'rp-group',
                        checkHandler: main.movePreview,
                        scope: main,
                        iconCls: 'preview-right'
                    }, {
                        text: 'Bottom',
                        checked: false,
                        group: 'rp-group',
                        checkHandler: main.movePreview,
                        scope: main,
                        iconCls: 'preview-bottom'
                    }, {
                        text: 'Hide',
                        checked: false,
                        group: 'rp-group',
                        checkHandler: main.movePreview,
                        scope: main,
                        iconCls: 'preview-hide'
                    }]
                }
            })],
        items: [{
            xtype: 'container',
            anchor: '100%',
            layout: 'hbox',
            items: [{
                xtype: 'container',
                flex: 1,
                layout: 'anchor',
                items: [{
                    xtype: 'textfield',
                    fieldLabel: 'ID',
                    name: 'id',
                    anchor: '95%',
                    allowBlank: false
                }, {
                    xtype: 'combo',
                    selectOnFocus: false,
                    forceSelection: true,
                    autoSelect: false,
                    allowBlank: false,
                    editable: false,
                    queryMode: 'local',
                    lastQuery: '',
                    displayField: 'id',
                    valueField: 'id',
                    triggerAction: 'all',
                    store: 'FeedTypes',
                    fieldLabel: 'Export Format',
                    name: 'type',
                    anchor: '95%'
                }, {
                	  xtype: 'combo',
                    selectOnFocus: true,
                    forceSelection: true,
                    autoSelect: false,
                    allowBlank: false,
                    editable: true,
                    queryMode: 'local',
                    lastQuery: '',
                    displayField: 'id',
                    valueField: 'id',
                    triggerAction: 'all',
                    store: 'FileEncodings',
                    fieldLabel: 'File Encoding',
                    name: 'fileEncoding',
                    anchor: '95%'
                }, {
                    xtype: 'combo',
                    fieldLabel: 'Folder Name',
                    typeAhead: true,
                    name: 'folderName',
                    anchor: '95%',
                    allowBlank: false,
                    displayField: 'id',
                    valueField: 'id',
                    store: 'Folders',
                    validator: function (val) {
                        return /^(IMPEX|REALMDATA|LIBRARIES|TEMP|CATALOGS).*/.test(val) ? true : 'Please specify a valid root folder for dw.io.File';
                    }
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'File Name',
                    name: 'fileName',
                    anchor: '95%',
                    allowBlank: false,
                    validator: function (val) {
                        return /^([a-zA-Z0-9_,\s-]*(\{\{[^\{\}]+\}\})?)+(\.[A-Za-z]*)*$/.test(val) ? true : 'Please enter a valid filename!';
                    }
                }, {
                    xtype: 'textfield',
                    fieldLabel: 'Category Specific Export',
                    name: 'exportCategoryId',
                    anchor: '95%',
                    emptyText: 'Enter root for all products',
                    allowBlank: true
                }]
            }, {
                xtype: 'container',
                flex: 1,
                layout: 'anchor',
                items: [{
                	xtype: 'combo',
                    selectOnFocus: false,
                    forceSelection: true,
                    autoSelect: false,
                    allowBlank: true,
                    editable: false,
                    queryMode: 'local',
                    lastQuery: '',
                    displayField: 'id',
                    valueField: 'id',
                    triggerAction: 'all',
                    store: 'FeedObjectTypes',
                    fieldLabel: 'Feed Context',
                    name: 'feedContext',
                    id: 'feedContext',
                    anchor: '95%',
                    listeners: {
                        change: function(field, newValue, oldValue) {
                            if (newValue === 'Catalog') {
                                this.nextSibling().show();
                                this.nextSibling().nextSibling().show();
                            } else {
                                this.nextSibling().hide();
                                this.nextSibling().nextSibling().hide();
                            }
                        }
                    }
                }, {
                    xtype: 'combo',
                    selectOnFocus: true,
                    forceSelection: true,
                    autoSelect: true,
                    allowBlank: true,
                    editable: true,
                    queryMode: 'local',
                    lastQuery: '',
                    displayField: 'id',
                    valueField: 'id',
                    triggerAction: 'all',
                    store: 'Categories',
                    fieldLabel: 'Social Category',
                    name: 'socialCategory',
                    anchor: '95%'
                }, {
                    xtype: 'combo',
                    selectOnFocus: false,
                    forceSelection: true,
                    autoSelect: false,
                    allowBlank: true,
                    editable: false,
                    queryMode: 'local',
                    lastQuery: '',
                    displayField: 'id',
                    valueField: 'id',
                    triggerAction: 'all',
                    store: 'GoogleShoppingCategories',
                    fieldLabel: 'Google Shopping Category',
                    name: 'googleShoppingCategories',
                    anchor: '95%'
                }, {
                    xtype: 'checkbox',
                    name: 'includeOfflineProducts',
                    fieldLabel: 'Include Offline Products',
                    hidden: false
                }, {
                    xtype: 'checkbox',
                    name: 'includeOutOfStockProducts',
                    fieldLabel: 'Include Out Of Stock Products',
                    hidden: false
                }, {
    				xtype: 'checkboxgroup',
    				id: 'assignedSites',
    				name: 'assignedSites',
    				columns: 2,
    				valueField : 'id',
    				displayField : 'name',
    				vertical: true,
    				fieldLabel: 'Available for sites',
    				items : []
                }]
            }]
        }, {
            // it might be better to create a new file for this
            xtype: 'textareafield',
            name: 'configuration',
            fieldLabel: 'Template',
            //magic numbers ??? area to improve
            height: (window.innerHeight > 600 ? window.innerHeight - 510 : 190),
            anchor: '98%',
            allowBlank: false,
            listeners: {
                // add context menu event
                'render': function (cmp) {
                    cmp.getEl().on('contextmenu', function (e, b, c, d) {
                        e.preventDefault();
                        this.fireEvent('contextmenu', e, b, c, d);
                    }, this);
                },
                'contextmenu': function (e) {
                    // create a dummy menu for now, should support adding fields later
                    var onAttributeSelect = function (item, checked) {
                        if (checked) {
                            var rawEl = this.inputEl.dom;
                            this.setRawValue(rawEl.value.substring(0, rawEl.selectionStart) + '{{' + item.text + '}}' + rawEl.value.substring(rawEl.selectionEnd));
                        }
                    };
                    if (!this.menu) {
                        this.menu = new Ext.menu.Menu({
                            id: 'mainMenu',
                            scope: this,
                            items: [
                                {
                                    id: 'field',
                                    text: 'Insert field',
                                    iconCls: 'insert-field',
                                    scope: this,
                                    menu: {        // <-- submenu by nested config object
                                        scope: this,
                                        items: [
                                            // this needs to be filled dynamically
                                            '<b class="menu-title">Available attributes</b>',
                                            {
                                                scope: this,
                                                text: 'name',
                                                checked: false,
                                                group: 'attribute',
                                                checkHandler: onAttributeSelect
                                            }, {
                                                scope: this,
                                                text: 'shortDescription',
                                                checked: false,
                                                group: 'attribute',
                                                checkHandler: onAttributeSelect
                                            }, {
                                                scope: this,
                                                text: 'color',
                                                checked: false,
                                                group: 'attribute',
                                                checkHandler: onAttributeSelect
                                            }, {
                                                scope: this,
                                                text: 'size',
                                                checked: false,
                                                group: 'attribute',
                                                checkHandler: onAttributeSelect
                                            }
                                        ]
                                    }
                                }

                            ]
                        });
                    }
                    this.menu.showAt(e.getXY());

                }
            }
        }],

        buttons: [{
            text: 'Save',
            formBind: true,
            scope: this,
            iconCls: 'disk',
            handler: function () {
                main.saveFeed();
            }
        }, {
            text: 'Revert changes',
            iconCls: 'cross',
            handler: function () {
                Ext.MessageBox.confirm('Status', 'Do you really want to discard your changes?', function (action) {
                    if (action == 'yes') {
                        main.loadFeed(main.record);
                    }
                });

            }
        }]
    });

};

Ext.extend(FeedFormPanel, Ext.FormPanel, {});
