/**
 * @class MainPanel
 * @extends Ext.TabPanel
 * @author Danny Gehl
 *
 * Shows the feed details and the preview.
 *
 * @constructor
 * Create a new Feed Main Panel
 * @param {Object} the store
 */
MainPanel = function (store) {
    this.store = store;

    this.formPanel = new FeedFormPanel(this);
    this.preview = new Ext.Panel({
        id: 'preview',
        region: 'east',
        autoScroll: true,
        title: 'Feed preview',
        cls: 'x-form-field',
        layout: 'fit',
        items: [{xtype: 'textarea', flex: 1, border: 0}],
        clear: function () {
            this.items.first().setValue('');
        }
    });

    MainPanel.superclass.constructor.call(this, {
        id: 'main-tabs',
        activeTab: 0,
        region: 'center',
        margins: '0 5 5 0',
        resizeTabs: true,
        tabWidth: 150,
        minTabWidth: 120,
        enableTabScroll: true,
        items: {
            id: 'main-view',
            layout: 'border',
            title: 'Loading...',
            hideMode: 'offsets',
            items: [
                this.formPanel,
                {
                    id: 'bottom-preview',
                    layout: 'fit',
                    height: 100,
                    split: true,
                    border: false,
                    region: 'south',
                    hidden: true
                },
                {
                    id: 'right-preview',
                    layout: 'fit',
                    items: [this.preview],
                    border: false,
                    region: 'east',
                    width: 350,
                    split: true
                }
            ]
        }
    });

};

Ext.extend(MainPanel, Ext.TabPanel, {

    loadFeed: function (feed) {
        this.record = feed;
        this.preview.clear();
        this.formPanel.getForm().reset();
        this.formPanel.getForm().loadRecord(this.record);
        var alreadyAssignedSites = {};
        if (this.record.data.assignedSites){
	        for (var i = 0; i < this.record.data.assignedSites.length; i++) {
	        	alreadyAssignedSites[this.record.data.assignedSites[i]] = true;
	        };
	        Ext.getCmp('assignedSites').setValue(alreadyAssignedSites);
	        Ext.getCmp('main-view').setTitle(feed.data.id);
        }
    },

    saveFeed: function () {
    	this.formPanel.getForm().updateRecord(this.record);
    	
    	/** !workaround
    	* We use remoting to add site checkboxes
    	* and because form is rendered before response is processed, 
    	* we need this workaround to collect the value of checked checkboxes
    	* + Object.keys() works with IE9+, FF4+, Chrome5+, Opera12+, Safari5+
    	*/
    	this.record.data.assignedSites = [];
    	var selectedAssignedSites = Object.keys(Ext.getCmp('assignedSites').getValue());
    	for(var i=0;i<selectedAssignedSites.length;i++){
    		this.record.data.assignedSites.push(selectedAssignedSites[i]);
    	}
    	this.record.dirty = true; //mark record as dirty, so that synch triggers a request
    	//\\end of workaround
    	
        this.store.sync();
    },

    movePreview: function (m, pressed) {
        if (m.split) { // cycle if not a menu item click
            var readMenu = Ext.menu.MenuMgr.get('reading-menu');
            var items = readMenu.items.items;
            var b = items[0], r = items[1], h = items[2];
            if (b.checked) {
                r.setChecked(true);
            } else if (r.checked) {
                h.setChecked(true);
            } else if (h.checked) {
                b.setChecked(true);
            }
            return;
        }
        if (pressed) {
            var preview = this.preview;
            var right = Ext.getCmp('right-preview');
            var bot = Ext.getCmp('bottom-preview');
            var btn = this.formPanel.getDockedComponent(0).items.get(2);
            switch (m.text) {
                case 'Bottom':
                    right.hide();
                    bot.add(preview);
                    bot.show();
                    bot.ownerCt.doLayout();
                    //btn.setIconClass('preview-bottom');
                    break;
                case 'Right':
                    bot.hide();
                    right.add(preview);
                    right.show();
                    right.ownerCt.doLayout();
                    //btn.setIconClass('preview-right');
                    break;
                case 'Hide':
                    preview.ownerCt.hide();
                    preview.ownerCt.ownerCt.doLayout();
                    //btn.setIconClass('preview-hide');
                    break;
            }
        }
    }
});