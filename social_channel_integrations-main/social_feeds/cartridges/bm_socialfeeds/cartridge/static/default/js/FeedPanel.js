/**
 * @class dw.ext.FeedPanel
 * @extends Ext.panel.Panel
 *
 * Shows a list of available feeds. Also has the ability to add/remove feeds.
 *
 * @constructor
 * Create a new Feed Panel
 * @param {Object} config The config object
 */

Ext.define('dw.ext.FeedPanel', {
    extend: 'Ext.grid.Panel',

    width: 425,
    height: 250,
    collapsible: true,
    title: 'Product Feeds',
    multiSelect: false,
    viewConfig: {
        emptyText: 'No feeds to display'
    },

    columns: [{
        text: 'Feed',
        flex: 100,
        dataIndex: 'id',
        align: 'left'
    }],

    initComponent: function () {
        Ext.apply(this, {
            dockedItems: this.createToolbar(),
            selModel: {
                mode: 'SINGLE',
                listeners: {
                    scope: this,
                    selectionchange: this.onSelectionChange
                }
            }
        });

        this.createMenu();
        this.callParent(arguments);
        this.on({
            scope: this,
            itemcontextmenu: this.onContextMenu,
            afterrender: this.onViewReady
        });

    },

    onViewReady: function () {
        if (this.store.first()) {
            this.view.getSelectionModel().select(this.store.first());
        }
    },

    /**
     * Creates the toolbar to be used for controlling feeds.
     * @private
     * @return {Ext.toolbar.Toolbar}
     */
    createToolbar: function () {
        this.createActions();
        this.toolbar = Ext.create('widget.toolbar', {
            items: [this.addAction, this.removeAction]
        });
        return this.toolbar;
    },

    /**
     * Create actions to share between toolbar and menu
     * @private
     */
    createActions: function () {
        this.addAction = Ext.create('Ext.Action', {
            scope: this,
            handler: this.onAddFeedClick,
            text: 'Add feed',
            iconCls: 'add'
        });

        this.removeAction = Ext.create('Ext.Action', {
            itemId: 'remove',
            scope: this,
            handler: this.onRemoveFeedClick,
            text: 'Remove feed',
            iconCls: 'delete'
        });
    },

    /**
     * Create the context menu
     * @private
     */
    createMenu: function () {
        this.menu = Ext.create('widget.menu', {
            items: [this.removeAction, '-', this.addAction],
            listeners: {
                hide: function (c) {
                    c.activeFeed = null;
                }
            }
        });
        return this.menu;
    },

    /**
     * Used when view selection changes so we can disable toolbar buttons.
     * @private
     */
    onSelectionChange: function () {
        var selected = this.getSelectedItem();
        this.toolbar.getComponent('remove').setDisabled(!selected);
        if (selected) {
            this.loadFeed(selected);
        }
    },

    /**
     * Loads a feed.
     * @private
     * @param {Ext.data.Model} rec The feed
     */
    loadFeed: function (rec) {
        if (rec) {
        	if("" === rec.data.fileEncoding) {
        		rec.data.fileEncoding = "UTF-8";
        	}
        	if("" === rec.data.feedContext) {
        		rec.data.feedContext = "Catalog";
        	}
            this.fireEvent('feedselect', this, rec);
        }
    },

    /**
     * Gets the currently selected record in the view.
     * @private
     * @return {Ext.data.Model} Returns the selected model. false if nothing is selected.
     */
    getSelectedItem: function () {
        return this.view.getSelectionModel().getSelection()[0] || false;
    },

    /**
     * Listens for the context menu event on the view
     * @private
     */
    onContextMenu: function (view, record, item, index, event) {
        var menu = this.menu || this.createMenu();

        event.stopEvent();
        menu.activeFeed = view.store.getAt(index);
        menu.showAt(event.getXY());
    },

    /**
     * React to a feed being removed
     * @private
     */
    onRemoveFeedClick: function () {
        var active = this.menu.activeFeed || this.getSelectedItem();

        if (active) {
            this.store.remove(active);
            this.store.sync();
        }

        if (this.store.data.length > 0) {
            this.view.getSelectionModel().select(0);
        }
    },

    /**
     * React to a feed attempting to be added
     * @private
     */
    onAddFeedClick: function () {
        var rec = Ext.create(this.store.getProxy().getReader().getModel());
        //set defaults for new record
        rec.data.fileEncoding = "UTF-8";
        rec.data.feedContext = "Catalog";
        rec.data.type = "CSV";
        rec.setId('- New Feed -');
        this.getStore().insert(0, rec);
        this.view.getSelectionModel().select(0);
    },

    // Inherit docs
    onDestroy: function () {
        this.callParent(arguments);
        this.menu.destroy();
    }
});