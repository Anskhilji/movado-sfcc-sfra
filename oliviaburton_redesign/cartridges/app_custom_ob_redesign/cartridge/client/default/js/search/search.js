'use strict';
var movadoBase = require('movado/search/search');

function updateURLForShowMore(showMoreUrl) {
    var params = movadoBase.getUrlParamObj(showMoreUrl);
    var start = params.start;
    var size = params.sz;
    var newSize = parseInt(start) + parseInt(size);
    var url;
    var currentProductCount = $('#show-more-update').text();
    var res = currentProductCount.replace(size, newSize);
    $('#show-more-update').text(res);
    
    if (history.pushState) {
    	if (document.location.href.indexOf('?') > -1) {
    		if (document.location.href.indexOf('sz=') > -1) {
    			var tempUrlParams = document.location.search;
    			tempUrlParams = movadoBase.replaceQueryParam('sz', newSize, tempUrlParams);
    			url = document.location.href.substring(0, document.location.href.indexOf('?')) + tempUrlParams;
    		} else {
    			url = document.location.href + '&start=0&sz=' + newSize;
    		}
    } else {
        url = document.location.href + '?start=0&sz=' + newSize;
    }
        window.history.pushState({ path: url }, '', url);
    }
}

module.exports = {
    movadoBase: movadoBase,
    showMore:  function () {
        // Show more products
        $('.container, .container-fluid, .test').off('click', '.show-more .show-button').on('click', '.show-more button', function (e) {
            e.stopPropagation();
    
            //push data on ga tracking
            var showMoreUrl = $(this).data('url');
            var $pageSize = $(this).data('page-number');
            var $plpName = $(this).data('category-id');
            var $counter = 1;
            var $pageCounter = $pageSize + $counter;
            
            if ($pageSize !== undefined && $plpName !== undefined) {
                dataLayer.push({
                    event: 'Load More Results',
                    eventCategory: 'Load More Results - See More',
                    eventAction: $plpName,
                    eventLabel: $pageCounter
                });
            }
    
            e.preventDefault();
    
            $.spinner().start();
            $(this).trigger('search:showMore', e);
            $.ajax({
                url: showMoreUrl,
                data: { selectedUrl: showMoreUrl },
                method: 'GET',
                success: function (response) {
                    var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                    $('body').trigger('facet:success', [gtmFacetArray]);
                    $('.grid-footer').replaceWith(response);
                    movadoBase.updateSortOptions(response);
                    // edit
                    updateURLForShowMore(showMoreUrl);
                    // edit end
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    }
}
