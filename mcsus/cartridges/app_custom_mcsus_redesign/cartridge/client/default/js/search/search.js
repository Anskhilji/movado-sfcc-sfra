'use strict';

var swatches = require('movado/utilities/swatches');
/**
 * Update DOM elements with Ajax results
 *
 * @param {Object} $results - jQuery DOM element
 * @param {string} selector - DOM element to look up in the $results
 * @return {undefined}
 */
function updateDom($results, selector) {
    var $updates = $results.find(selector);
    $(selector).empty().html($updates.html());
}

/**
 * Keep refinement panes expanded/collapsed after Ajax refresh
 *
 * @param {Object} $results - jQuery DOM element
 * @return {undefined}
 */
function handleRefinements($results) {
    $('.refinement.active').each(function () {
        $(this).removeClass('active');

        $results
            .find('.' + $(this)[0].className.replace(/ /g, '.'))
            .addClass('active');
    });

    updateDom($results, '.refinements');
}

/**
 * Parse Ajax results and updated select DOM elements
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function parseResults(response) {
    var $results = $(response);
    var specialHandlers = {
        '.refinements': handleRefinements
    };

    // Update DOM elements that do not require special handling
    [
        '.grid-header',
        '.header-bar',
        '.header.page-title',
        '.product-grid',
        '.show-more',
        '.filter-bar'
    ].forEach(function (selector) {
        updateDom($results, selector);
    });

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });
}

/**
 * This function retrieves another page of content to display in the content search grid
 * @param {JQuery} $element - the jquery element that has the click event attached
 * @param {JQuery} $target - the jquery element that will receive the response
 * @return {undefined}
 */
function getContent($element, $target) {
    var showMoreUrl = $element.data('url');
    $.spinner().start();
    $.ajax({
        url: showMoreUrl,
        method: 'GET',
        success: function (response) {
            $target.append(response);
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}

/**
 * Update sort option URLs from Ajax response
 *
 * @param {string} response - Ajax response HTML code
 * @return {undefined}
 */
function updateSortOptions(response) {
    var $tempDom = $('<div>').append($(response));
    var sortOptions = $tempDom.find('.grid-footer').data('sort-options').options;
    sortOptions.forEach(function (option) {
        $('option.' + option.id).val(option.url);
    });
}

/**
 * Updates url parameter valuue
 *
 * @param {string} param - param whose value needs to be updated
 * @param {string} newval - newval with which the param value is replaced with
 * @param {string} search - page URL query string
 * @return {undefined}
 */
function replaceQueryParam(param, newval, search) {
    var regex = new RegExp('([?;&])' + param + '[^&;]*[;&]?');
    var query = search.replace(regex, '$1').replace(/&$/, '');

    return (query.length > 2 ? query + '&' : '?') + (newval ? param + '=' + newval : '');
}

/**
 * Returns a map of query string params with key as param name and val as param value
 *
 * @param {string} url - page URL
 * @return {undefined}
 */
function getUrlParamObj(url) {
    var params = {};
    var paramStr = url.slice(url.indexOf('?') + 1);
    var definitions = paramStr.split('&');

    definitions.forEach(function (val, key) {
        var parts = val.split('=', 2);
        params[parts[0]] = parts[1];
    });

    return params;
}

// Custom Start: [MSS-1348 Fix for not applying price filters]
function removeParam(key, sourceURL) {
    var rtn = sourceURL.split("?")[0],
        param,
        params_arr = [],
        queryString = (sourceURL.indexOf("?") !== -1) ? sourceURL.split("?")[1] : "";
    if (queryString !== "") {
        params_arr = queryString.split("&");
        for (var i = params_arr.length - 1; i >= 0; i -= 1) {
            param = params_arr[i].split("=")[0];
            if (param === key) {
                params_arr.splice(i, 1);
            }
        }
        if (params_arr.length) rtn = rtn + "?" + params_arr.join("&");
    }
    return rtn;
}
// Custom End

/**
 * Adds selected facets to page URL
 *
 * @param {string} url - facet AJAX URL
 * @return {undefined}
 */
function updatePageURLForFacets(href) {
    var urlParams = href.slice(href.indexOf('?') + 1);

    if (history.pushState) {
    	if (document.location.href.indexOf('?') > -1) {
    		var url = document.location.href.substring(0, document.location.href.indexOf('?')) + '?' + urlParams;
    } else {
        var url = document.location.href + '?' + urlParams;
    }
        window.history.pushState({ path: url }, '', url);
    }
}

/**
 * Replace URL params
 *
 * @param {string} url - url
 * @param {string} paramName - paramter name to be replaced
 * @param {string} paramValue - paramter value to be replaced
 * @return {undefined}
 */
function replaceUrlParam(url, paramName, paramValue) {
    var pattern = new RegExp('(\\?|\\&)('+ paramName +'=).*?(&|$)');
    var newUrl = url;
    if (url.search(pattern) >= 0 ) {
        newUrl = url.replace(pattern, (newUrl.indexOf('&') > 0 ? '&' : '?') + paramName + '=' + paramValue);
    }
    else {
        newUrl = newUrl + (newUrl.indexOf('?') > 0 ? '&' : '?') + paramName + '=' + paramValue;
    }
    return newUrl;
}

/**
 * Adds selected sort rule to page URL
 *
 * @param {string} url - facet AJAX URL
 * @return {undefined}
 */
function updatePageURLForSortRule(href) {
    var hrefparams = getUrlParamObj(href);
    var urlparams = getUrlParamObj(document.location.href);
    var urlStr = document.location.search;

    Object.keys(urlparams).forEach(function (urlkey) {
        Object.keys(hrefparams).forEach(function (hrefkey) {
            var hrefval = hrefparams[hrefkey];
            if (urlkey == hrefkey) {
                urlStr = replaceQueryParam(urlkey, hrefval, urlStr);
            } else if (urlparams[hrefkey] == undefined && urlStr.indexOf(hrefkey) == -1) {
                if (urlStr.indexOf('?') > -1) {
                    urlStr = urlStr + '&' + hrefkey + '=' + hrefval;
                } else {
                    urlStr = urlStr + '?' + hrefkey + '=' + hrefval;
                }
            }
        });
    });

    if (history.pushState) {
        var url = document.location.href.substring(0, document.location.href.indexOf('?')) + urlStr;
        window.history.pushState({ path: url }, '', url);
    }
}

/**
 * Adds page start and size to page URL for show more
 *
 * @param {string} url - facet AJAX URL
 * @return {undefined}
 */
function updatePageURLForShowMore(showMoreUrl) {
    var params = getUrlParamObj(showMoreUrl);
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
    			tempUrlParams = replaceQueryParam('sz', newSize, tempUrlParams);
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

/**
 * Adds page start and size to page URL for pagination
 *
 * @param {string} url - facet AJAX URL
 * @return {undefined}
 */
function updatePageURLForPagination(showMoreUrl) {
    var params = getUrlParamObj(showMoreUrl);
    var start = params.start;
    var size = params.sz;
    var url;

    if (history.pushState) {
    	if (document.location.href.indexOf('?') > -1) {
    		if (document.location.href.indexOf('start=') > -1) {
    			var tempUrlParams = document.location.search;
    			tempUrlParams = replaceQueryParam('start', start, tempUrlParams);
    			url = document.location.href.substring(0, document.location.href.indexOf('?')) + tempUrlParams;
    		} else {
    			url = document.location.href + '&start=' + start + '&sz=' + size;
    		}
    } else {
        url = document.location.href + '?start=' + start + '&sz=' + size;
    }
        window.history.pushState({ path: url }, '', url);
    }
}
/**
 * Moving the focus to top after pagination and filtering
 */
function moveFocusToTop() {
    var topScrollHeight = $('.tab-content').offset().top - $('header').outerHeight();
    $('html, body').animate({
        scrollTop: topScrollHeight
    }, 500);
}

function refreshYotpoWidgets() {
    if((document.readyState === 'complete' || document.readyState === 'interactive') && (isYotpoJsLoaded)) {
        var api = new Yotpo.API(yotpo);
        api.refreshWidgets();
    } else {
        setTimeout(function() {
            refreshYotpoWidgets();
        }, 500);
    }
}

function getTileHeight() {
    setTimeout(function() { 
        $('.tile-body').each(function() {
            var tileHeight = $(this).innerHeight();
            $(this).closest('.product-tile-plp-container').css('padding-bottom',tileHeight);
        })
    }, 100);
}

$( document ).ready(function() {
    if($(window).width() > 991) {
        getTileHeight()
    }
});

module.exports = {
    filter: function () {
        // Display refinements bar when Menu icon clicked
        $('.filter-container').on('click', 'button.filter-results', function () {
            $('.refinement-bar, .movado-modal').show();
            var refinementBarPl = $('.search-results-container').find('.refinement-bar-find, .secondary-bar');
            if (refinementBarPl) {
              refinementBarPl.addClass('refinement-bar-pl');
              $('.secondary-bar').addClass('secondary-bar-mt');
            }
            if($(window).width() > 991) {
                getTileHeight()
            }
        });
    },

    closeRefinments: function () {
        // Refinements close button
        $('.filter-container').on('click', '.refinement-bar button.close, .modal-background', function () {
            $('.refinement-bar, .movado-modal').hide();
            var refinementBarPl = $('.search-results-container').find('.refinement-bar-find, .secondary-bar');
            if (refinementBarPl) {
              refinementBarPl.removeClass('refinement-bar-pl');
              $('.secondary-bar').removeClass('secondary-bar-mt');
            }
            if($(window).width() > 991) {
                getTileHeight()
            }
        });
    },

    resize: function () {
        // Close refinement bar and hide modal background if user resizes browser
        $(window).resize(function () {
            $('.movado-refinebar, .movado-modal').hide();
        });
    },

    sort: function () {
        // Handle sort order menu selection
        $('.filter-container').on('change', '[name=sort-order]', function (e) {
        	var url = this.value;
        	e.preventDefault();

            $.spinner().start();

            // Push Data into gtm For Sorting Rules Filters
            var $filteredText = $(this).find(':selected').text().trim();
            var $filterCategory = $(this).find(':selected').data('filter-category');
            var $OpenFilter = 'Open';
            var $OpenFilterCategory = $filterCategory + " " + $OpenFilter;
            if ($filteredText !==undefined) {
                dataLayer.push({
                    event: 'Collection Filtering',
                    eventCategory: 'Collection Filter',
                    eventAction: $OpenFilterCategory,
                    eventLabel: $filteredText
                  });
            }
            
            $(this).trigger('search:sort', this.value);
            $.ajax({
                url: this.value,
                data: { selectedUrl: this.value },
                method: 'GET',
                success: function (response) {
                	var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                	$('body').trigger('facet:success', [gtmFacetArray]);
                    $('.product-grid').empty().html(response);
                    // edit
                    updatePageURLForSortRule(url);
                    if (window.Resources.IS_YOTPO_ENABLED) {
                        refreshYotpoWidgets();
                    }
                    // edit
                    $.spinner().stop();
                    if($(window).width() > 991) {
                        getTileHeight()
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    showMore: function () {
        // Show more products
        $('.filter-container').on('click', '.plp-show-more button, .show-more button', function (e) {
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
                    updateSortOptions(response);
                    // edit
                    updatePageURLForShowMore(showMoreUrl);
                    if (window.Resources.IS_YOTPO_ENABLED) {
                        refreshYotpoWidgets();
                    }
                    // edit end
                    $.spinner().stop();
                    if($(window).width() > 991) {
                        getTileHeight()
                    }
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    showPagination: function () {
        // Show more products
    	$('.filter-container').on('click', '.show-pagination button', function (e) {
        e.stopPropagation();

        //push data on ga tracking
        var $AriaLabel = $(this).attr('aria-label');
        var $pageSize = $(this).data('page-size');
        var $pageNumber = $(this).data('page-number');

        if ($AriaLabel !==undefined) {
            dataLayer.push({
                event: 'Pagination',
                eventCategory: 'Load More Results - Pagination',
                eventAction: $AriaLabel,
                eventLabel: $pageSize
            });
        } else {
            if ($pageNumber !== undefined && $pageNumber !== undefined) {
                dataLayer.push({
                    event: 'Pagination',
                    eventCategory: 'Load More Results - Pagination',
                    eventAction: $pageNumber,
                    eventLabel: $pageSize
                });
            }
        }

        var showMoreUrl = $(this).data('url');

        e.preventDefault();

        $.spinner().start();
        $(this).trigger('search:showPagination', e);
        $.ajax({
            url: showMoreUrl,
            data: { selectedUrl: showMoreUrl },
            method: 'GET',
            success: function (response) {
            	$('.product-grid').html(response);
            	updateSortOptions(response);
            	var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
            	$('body').trigger('facet:success', [gtmFacetArray]);
            	// edit
            	updatePageURLForPagination(showMoreUrl);
            	// edit
                if (window.Resources.IS_YOTPO_ENABLED) {
                    refreshYotpoWidgets();
                }
                $.spinner().stop();
                moveFocusToTop();
                if($(window).width() > 991) {
                    getTileHeight()
                }
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
    },

    applyFilter: function () {
        // Handle refinement value selection and reset click
        $('.filter-container').on(
            'click',
            '.refinements li a, .refinement-bar a.reset, .filter-value a, .swatch-filter a',
            function (e) {
                e.preventDefault();
                e.stopPropagation();

                //push data into datalayer for filters into gtm
                var $filterType = $(this).parents('.card-body').siblings('.movado-refinements-type').text().trim();
                dataLayer.push({
                    event: 'Filter Sort',
                    eventCategory: 'Filter & Sort',
                    eventAction: $filterType,
                    eventLabel: $(this).text().trim()
                });

                // Get currently selected sort option to retain sorting rules
                var urlparams = getUrlParamObj(document.location.href);
                var filtersURL = e.currentTarget.href;
                var currentSelectedSortId = '';
                if (urlparams.hasOwnProperty('srule') == true) {
                    if (urlparams.srule) {
                        currentSelectedSortId = urlparams.srule;
                        filtersURL = removeParam('srule', filtersURL);  // Custom: [MSS-1348 Fix for not applying price filters]
                        filtersURL = replaceUrlParam(filtersURL, 'srule', currentSelectedSortId);
                    }
                }

                $.spinner().start();
                $(this).trigger('search:filter', e);
                $.ajax({
                    url: filtersURL,
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: filtersURL
                    },
                    method: 'GET',
                    success: function (response) {
                    	var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                    	$('body').trigger('facet:success', [gtmFacetArray]);
                        parseResults(response);
                        // edit start
                        updatePageURLForFacets(filtersURL);
                        // edit end
                        if (window.Resources.IS_YOTPO_ENABLED) {
                            refreshYotpoWidgets();
                        }
                        $.spinner().stop();
                        moveFocusToTop();
                        swatches.showSwatchImages();
                        if($(window).width() > 991) {
                            getTileHeight()
                        }
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            });
    },

    showContentTab: function () {
        // Display content results from the search
        $('.filter-container').on('click', '.content-search', function () {
            if ($('#content-search-results').html() === '') {
                getContent($(this), $('#content-search-results'));
            }
            if($(window).width() > 991) {
                getTileHeight()
            }
        });

        // Display the next page of content results from the search
        $('.filter-container').on('click', '.show-more-content button', function () {
            getContent($(this), $('#content-search-results .result-count'));
            $('.show-more-content').remove();
            if($(window).width() > 991) {
                getTileHeight()
            }
        });
    },
    
    updatePageURLForShowMore: updatePageURLForShowMore,
    updateSortOptions: updateSortOptions,
    replaceQueryParam: replaceQueryParam,
    getUrlParamObj: getUrlParamObj
};
