/**
 * The main class to create the UI.
 *
 * @author Danny Gehl
 */

Ext.onReady(function () {
    Ext.QuickTips.init();

    var store = Ext.create('dw.ext.CustomObjectStore', {
        type: 'SalesChannelFeedConfig'
    });

    //var feeds = new dw.ext.FeedPanel({
    var feeds = Ext.create('dw.ext.FeedPanel', {
        region: 'west',
        width: 225,
        minWidth: 175,
        split: true,
        store: store
    });

    var mainPanel = new MainPanel(store);

    feeds.on('feedselect', function (panel, feed) {
        if (feed) {
            mainPanel.loadFeed(feed);
        }
    });

    mainPanel.statusBar = Ext.create('Ext.ux.StatusBar', {
        defaultText: 'Feeds loaded: 0',
        id: 'feeds-statusbar',
        items: []
    });

    var viewport = new Ext.Panel({
        height: (window.innerHeight > 600 ? (window.innerHeight -110) : 600),
        layout: 'border',
        renderTo: 'customfeeds-ui',
        items: [
            new Ext.Panel({
                html: '<div class="x-form-field" style="padding:5px"><p>Configure your product social feeds using predefined templates</p>',
                region: 'north',
                title: 'Product social feeds management',
                collapsible: true
            }),
            feeds,
            mainPanel
        ],
        bbar: mainPanel.statusBar
    });

    store.on('beforeload', function (store, operation, options) {
        mainPanel.statusBar.showBusy('Loading feeds...');
    });
    store.on('load', function (store, records, successful, eOpts) {
        if (records) {
            for (var i = 0; i < records.length; i++) {
                records[i].data.leaf = true;
            }
        }
        feeds.view.getSelectionModel().select(records[0]);
        mainPanel.statusBar.clearStatus({useDefaults: true});
        mainPanel.statusBar.setStatus(records.length + ' feeds loaded.');
    });
    store.on('update', function (store, record, operation, eOpts) {
        if (record.data.id === 'root') return;
        switch (operation) {
            case Ext.data.Model.EDIT:
                mainPanel.statusBar.setStatus('Updating feed ' + record.data.id + '...');
                break;
            case Ext.data.Model.COMMIT:
                mainPanel.statusBar.setStatus('Feed ' + record.data.id + ' was successfully updated!');
                break;
            case Ext.data.Model.REJECT:
                mainPanel.statusBar.setStatus('Something went horribly wrong :( Data was rejected!');
                break;
        }
    });
    store.on('add', function (store, records, index) {
        mainPanel.statusBar.setStatus('New feed ' + records[0].data.id + ' successfully created.');
    });
    store.on('remove', function (store, records, index) {
        mainPanel.statusBar.setStatus('Feed ' + records[0].data.id + ' successfully deleted.');
    });
});

