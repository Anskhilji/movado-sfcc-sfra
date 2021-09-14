
var Site = require('dw/system/Site');
var ltk = require('*/cartridge/scripts/objects/ltk.js');

/**
 * Clears privacy values
 */
function clear() {
    session.privacy.ProdBrowse = '';
    session.privacy.QuickViewSkus = '';
}
exports.ClearTracker = clear;
exports.ClearTracker.public = true;
exports.TrackRequest = trackRequest;
exports.TrackRequest.public = true;
/**
 * tracks browse activity
  */
function trackRequest() {
    var enabled = Site.getCurrent().getCustomPreferenceValue('Listrak_ActivityTracker_Enabled') && dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled;
    if (empty(enabled) || !enabled)	{
        return;
    }

    var httpParameterMap = request.httpParameterMap;
    if (httpParameterMap.t.stringValue != null || httpParameterMap.title.stringValue != null) {
		// app resource, or analytics request, so save time and exit function
        return;
    }
    var source = httpParameterMap.source.stringValue;
    var pid = httpParameterMap.pid.stringValue;
    var format = httpParameterMap.format.stringValue;
    var _ltk = new ltk.LTK();

	/* Record activity for certain page (Product, category) browses.
	This activity is stored in the pipeline dictionary and is fired
	through JS calls in the ltkTrackActivity template. */

	/* Quickview browse, same as Product(pid).  Still here in case we want to differentiate between quickview and full product view.
	This will be submitted via JS once the ltkTrackActivity template loads (full page request).  All quickview browses are stored in a comma
	delimited string that is parsed upon the next full page load. */
    if (source != null && source === 'quickview') {
        _ltk.AT.AddProductQuickBrowse(pid);
        return;
    }

	/* The pid is defined, but format isn't = initial product page request, secondary product requests come via ajax format. */
    if (pid != null && format === null) {
        _ltk.AT.AddProductBrowse(pid);
        return;
    }
}
