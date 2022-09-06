/**
*	Purpose: 	Stores customer activity to the custom session
*				for consumption by client side script.
*/
/**
 *  Object used to mimic the native client side JS Activity Tracker.
 * */
function _ActivityTracker() {
    /* Adds a product browse activity to be sent up to Listrak later via client side JS. */
    this.AddProductBrowse = function (Sku, Data) {
        if (typeof Sku === 'string') {
            Sku = Sku.trim();
            if (Sku.length > 0) {
                session.privacy.ProdBrowse = Sku;
            }
        }
    };

    /* Adds a quickview product browse activity to a sku array to be sent up to Listrak later via JS. */
    this.AddProductQuickBrowse = function (Sku, Data) {
        if (typeof Sku === 'string') {
            Sku = Sku.trim();
            if (Sku.length > 0) {
                var quickViews = session.privacy.QuickViewSkus;

                if (quickViews != null && quickViews.length > 0) { session.privacy.QuickViewSkus = quickViews + ',' + Sku; } else { session.privacy.QuickViewSkus = Sku; }
            }
        }
    };
}
exports._ActivityTracker = _ActivityTracker;
