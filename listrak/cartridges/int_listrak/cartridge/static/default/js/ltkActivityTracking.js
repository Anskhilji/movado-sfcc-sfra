(function (d) {
    if (document.addEventListener) document.addEventListener('ltkAsyncListener', d);
    else {
        e = document.documentElement; e.ltkAsyncProperty = 0; e.attachEvent('onpropertychange', function (e) {
            if (e.propertyName === 'ltkAsyncProperty') { d(); }
        });
    }
}(function () {
    /**
    * Used to reset the activity tracker parameters in the pdict upon successful send up to Listrak endpoint.
    */
    function resetProductActivityParams()	{
        var path = clearUrl;
        jQuery.ajax({
			  url: path,
			  context: document,
			  success: function () { }
        });
    }
    var scriptVars = document.querySelector('script[src*="ltkActivityTracking.js"]');

    var sku = scriptVars.getAttribute('ltk-data-sku');
    var qvSku = scriptVars.getAttribute('ltk-data-qvsku');
    var category = scriptVars.getAttribute('ltk-data-category');
    var clearUrl = scriptVars.getAttribute('ltk-data-clearurl');

    try {
		/* Perform activity/page/product browse logging. */
        var sessionSku = sku;
        var sessionCategory = category;
        var sessionQuickViewSkus = qvSku;

		/* Iterate through any quickviews and add them as product browses. */
        if (sessionQuickViewSkus != null && sessionQuickViewSkus !== 'null' && sessionQuickViewSkus.length > 0)		{
            var quickViews = sessionQuickViewSkus.split(',');

            for (var i = 0; i < quickViews.length; i++)			{
                _ltk.Activity.AddProductBrowse(quickViews[i]);
            }
        }

		/* Add the product browse if we have it. */
        if (sessionSku != null && sessionSku !== 'null' && sessionSku.length > 0)		{
            _ltk.Activity.AddProductBrowse(sessionSku);
        }

		/* Add the page browse. We should ALWAYS have if this JS fires. */
        var currentPage = window.location.href;
        _ltk.Activity.AddPageBrowse(currentPage);

		/* Submit the activity through client side JS to the endpoint. */
        _ltk.Activity.Submit();

		/* Do a post to reset the browse/quickview/page parameters if there are products in them. */
        resetProductActivityParams();
    }	catch (er)	{
		/* An error has occurred, yet to determine if we want to do anything here. */
    }
}));
