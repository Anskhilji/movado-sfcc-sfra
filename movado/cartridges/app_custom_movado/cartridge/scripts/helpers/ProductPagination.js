/**
 * This script provides a helper method to construct pagination URLs.
 *
 */
'use strict';

var Site = require('dw/system/Site');
var HashMap = require('dw/util/HashMap');
var DEFAULT_PAGE_SIZE = Site.getCurrent().getCustomPreferenceValue('pageSize');

var collections = require('*/cartridge/scripts/util/collections');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var ACTION_ENDPOINT = 'Search-UpdateGrid';
var SEARCH_SHOW_ACTION_ENDPOINT = 'Search-Show';

function getPagingModel(productHits, count, pageSize, startIndex) {
    var PagingModel = require('dw/web/PagingModel');
    var paging = new PagingModel(productHits, count);

    paging.setStart(startIndex || 0);
    paging.setPageSize(pageSize || DEFAULT_PAGE_SIZE);

    return paging;
}

/**
 * Generates URLs for Pagination
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - HTTP query parameters
 * @return {string} - More button URL
 */
function getPaginationUrls(productSearch, httpParams, pageNumber, enableGridSlot) {
    var showMoreEndpoint = 'Search-UpdateGrid';
    var pageSize = httpParams.sz || DEFAULT_PAGE_SIZE;
    var hitsCount = productSearch.count;
    var pagingUrls = new HashMap();
    var nextStart;
    var pageCount = Math.ceil(hitsCount / pageSize);

    if (enableGridSlot) {
    	pageCount = Math.ceil((hitsCount + 1) / pageSize);
    }

    var startPage,
        endPage;
    if (pageCount <= 5) {
    	startPage = 0;
    	endPage = pageCount - 1;
    } else if (pageNumber <= 2) {
    	startPage = 0;
    	endPage = 4;
    } else if (pageNumber > 2) {
    	if ((pageNumber + 2) < pageCount) {
    		startPage = pageNumber - 2;
        	endPage = pageNumber + 2;
    	} else {
    		startPage = pageCount - 5;
    		endPage = pageCount - 1;
    	}
    }

    pagingUrls.put('totalPages', pageCount);
    pagingUrls.put('startPage', startPage + 1);
    pagingUrls.put('endPage', endPage + 1);
    pagingUrls.put('currentPage', pageNumber + 1);
    pagingUrls.put('pagesToDisplay', 5);
    if (pageNumber == 0) {
    	pagingUrls.put('disablePreviousButton', 'disabled');
    }
    if (pageNumber == pageCount - 1) {
    	pagingUrls.put('disableNextButton', 'disabled');
    }

    for (var i = 0; i < pageCount; i++) {
    	var nextStart;
    	var tempcurrentStart = (i - 1) * pageSize;
    	if (enableGridSlot) {
    		tempcurrentStart -= 1;
    	}
        var temppaging = getPagingModel(
		        productSearch.productSearchHits,
		        hitsCount,
		        DEFAULT_PAGE_SIZE,
		        tempcurrentStart
		    );

        if (pageSize > hitsCount) {
	        return '';
	    } else if (pageSize > DEFAULT_PAGE_SIZE) {
	        nextStart = pageSize;
	    } else {
	        var endIdx = temppaging.getEnd();
	        nextStart = endIdx + 1 < hitsCount ? endIdx + 1 : null;
	        if (i == 0) {
	        	nextStart -= DEFAULT_PAGE_SIZE;
	        } else if (enableGridSlot && i == 1) {
	        	nextStart -= 1;
	        }

	        if (!nextStart && i != 0) {
	            break;
	        }
	    }

        temppaging.setStart(nextStart);

	    var baseUrl = productSearch.url(showMoreEndpoint);
	    var finalUrl = temppaging.appendPaging(baseUrl);
	    if (finalUrl.toString().indexOf('%2c') > -1 || finalUrl.toString().indexOf('%2C') > -1) {
	    	finalUrl = getPriceUrl(finalUrl.toString());
	    }

	    if (i == 0) {
	    	pagingUrls.put('firstPage', finalUrl);
	    }
	    if (i == pageNumber - 1) {
	    	pagingUrls.put('previous', finalUrl);
	    }
	    if (i == pageNumber + 1) {
	    	pagingUrls.put('next', finalUrl);
	    }
	    if (i == pageCount - 1) {
	    	pagingUrls.put('lastPage', finalUrl);
	    }
	    pagingUrls.put(Math.floor(i + 1), finalUrl);
    }

    return pagingUrls;
}

/**
 * Retrieves sorting options
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search instance
 * @param {dw.util.List.<dw.catalog.SortingOption>} sortingOptions - List of sorting rule options
 * @param {dw.web.PagingModel} pagingModel - The paging model for the current search context
 * @return {SortingOption} - Sorting option
 */
function getPaginationSortingOptions(productSearch, sortingOptions, pagingModel) {
    return collections.map(sortingOptions, function (option) {
        var baseUrl = productSearch.urlSortingRule(ACTION_ENDPOINT, option.sortingRule);

        if (baseUrl.toString().indexOf('%2c') > -1 || baseUrl.toString().indexOf('%2C') > -1) {
        	baseUrl = getPriceUrl(baseUrl.toString());
	    }

        var pagingParams = {
            start: '0',
            sz: DEFAULT_PAGE_SIZE
        };
        return {
            displayName: option.displayName,
            id: option.ID,
            url: urlHelper.appendQueryParams(baseUrl.toString(), pagingParams).toString()
        };
    });
}

/**
 * Retrieves sorting options
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search instance
 * @param {dw.util.List.<dw.catalog.SortingOption>} sortingOptions - List of sorting rule options
 * @param {dw.web.PagingModel} pagingModel - The paging model for the current search context
 * @return {SortingOption} - Sorting option
 */
function getSortingOptions(productSearch, sortingOptions, pagingModel) {
    return collections.map(sortingOptions, function (option) {
        var baseUrl = productSearch.urlSortingRule(ACTION_ENDPOINT, option.sortingRule);

        if (baseUrl.toString().indexOf('%2c') > -1 || baseUrl.toString().indexOf('%2C') > -1) {
        	baseUrl = getPriceUrl(baseUrl.toString());
	    }

        var pagingParams = {
            start: '0',
            sz: pagingModel.end + 1
        };
        return {
            displayName: option.displayName,
            id: option.ID,
            url: urlHelper.appendQueryParams(baseUrl.toString(), pagingParams).toString()
        };
    });
}

function getRadioUrl(productSearch, actionEndpoint, id, value, selected, selectable) {
    var url = '';

    if (selected) {
        url = productSearch.urlRelaxAttributeValue(actionEndpoint, id, value)
            .relative().toString();
    } else if (!selectable) {
        url = '#';
    } else {
    	url = productSearch.urlRefineAttribute(actionEndpoint, id, value)
        .relative().toString();
    }

    if (url.toString().indexOf('%2c') > -1 || url.toString().indexOf('%2C') > -1) {
    	url = getPriceUrl(url.toString());
    }

    return url;
}

function getPriceUrl(url) {
    if (url.indexOf('pmin') > -1) {
    	var params = {};
        var paramStr = url.slice(url.indexOf('?') + 1);
        var urlPath = url.slice(0, url.indexOf('?') + 1);
        var definitions = paramStr.split('&');

        definitions.forEach(function (val, key) {
	        var parts = val.split('=', 2);
	        params[parts[0]] = parts[1];
	    });

        Object.keys(params).forEach(function (key) {
            var val = params[key];
            if (key == 'pmin' || key == 'pmax') {
                if (val.indexOf('%2c') > -1) {
                    val = val.replace('%2c', '');
                    paramStr = replaceQueryParam(key, val, paramStr);
                } else if (val.indexOf('%2C') > -1) {
                    val = val.replace('%2C', '');
                    paramStr = replaceQueryParam(key, val, paramStr);
                }
            }
        });
        url = urlPath + paramStr;
    }
    return url;
}

function replaceQueryParam(param, newval, search) {
    var searchParams = search.split('&');
    var queryString = '';
    Object.keys(searchParams).forEach(function (key) {
        var paramValue = searchParams[key].split('=');
        if (paramValue[0] === param) {
            paramValue[1] = newval;
        }
        queryString = (queryString) ? (queryString + '&' + paramValue[0] + '=' + paramValue[1]) : paramValue[0] + '=' + paramValue[1];
    });

    return queryString;
}

module.exports = {
    SEARCH_SHOW_ACTION_ENDPOINT: SEARCH_SHOW_ACTION_ENDPOINT,
    getPaginationUrls: getPaginationUrls,
    getPaginationSortingOptions: getPaginationSortingOptions,
    getSortingOptions: getSortingOptions,
    getRadioUrl: getRadioUrl,
    getPriceUrl: getPriceUrl
};
