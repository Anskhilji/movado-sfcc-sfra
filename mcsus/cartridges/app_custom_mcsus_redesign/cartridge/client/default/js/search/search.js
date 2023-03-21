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
    $(window).width() > 544 ? $('.mobile-show-more').remove() : $('.desktop-show-more').remove();
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

$('.filter-container').on(
    'click', '.refinements li a',
    function (e) {
        e.preventDefault();
        e.stopPropagation();

        // add check class in checkBox to select filter
        if ($(this).closest('[data-filter-id="promotion"]').length > 0) { // add check class in radioButton to select filter
            $('[data-filter-id="promotion"]').removeClass('selected-filter-id').find('.fa-check-square').removeClass('fa-check-square').addClass('fa-square-o'); //remove all pre selected promotion value
            $('[data-filter-id="promotion"]').find('[data-filter-value]').removeClass('selected-filter');
            $(this).addClass('selected-filter').closest('[data-filter-id]').addClass('selected-filter-id');
            $(this).find('.fa-square-o').removeClass('fa-square-o').addClass('fa-check-square');
        } else if ($(this).find('.fa-square-o').length > 0) {
            $(this).addClass('selected-filter').closest('[data-filter-id]').addClass('selected-filter-id');
            $(this).find('.fa-square-o').removeClass('fa-square-o').addClass('fa-check-square');
        } else if ($(this).find('.fa-circle-o').length > 0) { // add check class in radioButton to select filter
            $('[data-filter-id="price"]').removeClass('selected-filter-id').find('.fa-check-circle').removeClass('fa-check-circle').addClass('fa-circle-o'); //remove all pre selected price value
            $('[data-filter-id="price"]').find('[data-filter-value]').removeClass('selected-filter');
            $(this).addClass('selected-filter').closest('[data-filter-id]').addClass('selected-filter-id');
            $(this).find('.fa-circle-o').removeClass('fa-circle-o').addClass('fa-check-circle');
        } else {
            $(this).removeClass('selected-filter').closest('[data-filter-id]').removeClass('selected-filter-id');
            $(this).find('.fa-check-square').removeClass('fa-check-square').addClass('fa-square-o');
            $(this).find('.fa-check-circle').removeClass('fa-check-circle').addClass('fa-circle-o');

        }
    });

    function closeRefinementBar() {
        $('.refinement-bar, .movado-modal').hide();
        $('.modal-background').removeClass('filter-modal-background');
        var refinementBarPl = $('.search-results-container').find('.refinement-bar-find, .secondary-bar');
        if (refinementBarPl) {
            refinementBarPl.removeClass('refinement-bar-pl');
            $('.secondary-bar').removeClass('secondary-bar-mt');
        }
        if ($(window).width() > 991) {
            getTileHeight()
        }
    }

module.exports = {
    filter: function () {
        // Display refinements bar when Menu icon clicked
        $('.filter-container').on('click', 'button.filter-results', function () {
            $('.refinement-bar, .movado-modal').show();
            $('.modal-background').addClass('filter-modal-background');
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
        $('.filter-container').on('click', '.refinement-bar button.close, .filter-modal-background', function (e) {
            closeRefinementBar();
        });
    },

    resize: function () {
        // Close refinement bar and hide modal background if user resizes browser
        $(window).resize(function () {
            $('.movado-refinebar, .movado-modal').hide();
            $('.modal-background').removeClass('filter-modal-background');
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
            $('.product-tile-plp-container').addClass('disable-hover');
            
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
                    $('.product-tile-plp-container').addClass('disable-hover');

                    // edit
                    $.spinner().stop();
                    if($(window).width() > 991) {
                        getTileHeight()
                    }
                    setTimeout(() => {
                        $('.product-tile-plp-container').removeClass('disable-hover');
                    }, 200);
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
            $('.product-tile-plp-container').addClass('disable-hover');
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
                    setTimeout(() => {
                        $('.product-tile-plp-container').removeClass('disable-hover');
                    }, 200);
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
        $('.filter-container, body').on(
            'click',
            '.fillter-btn, .refinement-bar a.reset, .filter-value a, .swatch-filter a, .refinement-bar .close-btn-text, refinement-bar .close-btn-text .fa-close, .modal-background.filter-modal-background',
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                var target = e.target;

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
                if ($(target).is('.fillter-btn, .close-btn-text, .fa-close, .filter-modal-background')) {
                    var filtersURL = document.location.href;
                } else {
                    var filtersURL = e.currentTarget.href;
                }
                var currentSelectedSortId = '';
                if (urlparams.hasOwnProperty('srule') == true) {
                    if (urlparams.srule) {
                        currentSelectedSortId = urlparams.srule;
                        filtersURL = removeParam('srule', filtersURL);  // Custom: [MSS-1348 Fix for not applying price filters]
                        filtersURL = replaceUrlParam(filtersURL, 'srule', currentSelectedSortId);
                    }
                }
                //custome start:  [MSS-1447] : multi-select filter / URL
                if ($(target).is('.fillter-btn, .close-btn-text, .fa-close, .filter-modal-background')) {
                    //add selected class  agains checked filter
                    $('[data-filter-id]').each(function () {
                        if ($(this).find('.fa-check-square').length > 0) {
                            $(this).addClass('selected-filter-id');
                        } else if ($(this).find('.fa-check-circle').length > 0) { // add check class in radioButton to select filter
                            $(this).addClass('selected-filter-id');
                        }
                    });
                    $('[data-filter-value]').each(function () {
                        if ($(this).find('.fa-check-square').length > 0) {
                            $(this).addClass('selected-filter');
                        } else if ($(this).find('.fa-check-circle').length > 0) { // add check class in radioButton to select filter
                            $(this).addClass('selected-filter');
                        }
                    });
                    // add custome logic to bulid URL
                    var refinementsAttributesId = [];
                    var refinementsAttributesValues = [];
                    $('.selected-filter-id').each(function () {
                        var selectedId = $(this).data('filter-id');
                        refinementsAttributesId.push(selectedId);
                        var array = [];
                        $('[data-filter-id="' + selectedId + '"] .selected-filter').each(function () {
                            var selectedValue = '';
                            if (selectedId == 'price') {
                                var pmin = $(this).data('value-pmin');
                                var pmax = $(this).data('value-pmax');
                                selectedValue = pmin + '-' + pmax;
                            } else {
                                selectedValue = $(this).data('filter-value');
                            }
                            array.push(selectedValue);
                        });
                        refinementsAttributesValues.push(array);
                    });

                    // generate custome URL
                    var url = '';
                    var prefNumber = 0;
                    refinementsAttributesId.forEach(function (attr, i) {
                        var urlSelector = url == '' ? '?' : '&';
                        var prefv = '';
                        if (attr == 'promotion') {
                            url = (url == '' ? '' : url) + urlSelector + 'pmid=' + refinementsAttributesValues[i];
                        } else if (attr == 'price') {
                            prefv = refinementsAttributesValues[i].toString().split('-'); // value of price is in range
                            url = (url == '' ? '' : url) + urlSelector + 'pmin=' + prefv[0] + '&pmax=' + prefv[1];
                        } else {
                            prefNumber++;
                            prefv = encodeURIComponent(refinementsAttributesValues[i].length > 1 ? refinementsAttributesValues[i].toString().replaceAll(',', '|') : refinementsAttributesValues[i]);
                            url = (url == '' ? '' : url) + urlSelector + 'prefn' + prefNumber + '=' + encodeURIComponent(attr) + '&prefv' + prefNumber + '=' + prefv;
                        }
                    });
                    var baseUrl = document.location.href;
                    if (url != '' && baseUrl.indexOf('srule') !== -1) {
                        var sortingRuleUrl = $('.sorting-rules-filters').find(':selected').data('id');
                        url = url + '&srule=' + sortingRuleUrl;
                    }
                    if (url == '' && baseUrl.indexOf('srule') !== -1) {
                        var categorySortUrl = $('.sorting-rules-filters').find(':selected').data('id');
                        url = url + '?srule=' + categorySortUrl;
                    }
                    if (baseUrl.indexOf('?') !== -1) {
                        baseUrl = baseUrl.split('?')[0];
                    }
                    filtersURL = baseUrl + url;
                }
                //custome end:  [MSS-1447] : multi-select filter / URL
                
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
                    },
                    complete: function () {
                        closeRefinementBar();
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

    
    // Custom start: Listrak persistent popup
    listrakPersistentApply: function () {
        $(document).on('click','.listrak-popup', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var isContainListrakPopup = e.target.closest('.listrak-popup');
            var targetEl = e.target;
            var isTargetContain = targetEl.classList.contains('close-icon-popup');
            if (isContainListrakPopup && !isTargetContain) {
                var listrakPersistenPopupUrl = document.querySelector('.listrak-persistent-url');
                var url = listrakPersistenPopupUrl.dataset.listrakUrl;
                $.ajax({
                    url: url,
                    method: 'GET',
                    success: function (response) {
                        if (response.success == true) {
                            var interval = setInterval(function() {
                                if (typeof _ltk != "undefined" && typeof _ltk.Popup != "undefined") {
                                    _ltk.Popup.openManualByName(response.popupID);
                                    clearInterval(interval);
                                }
                            }, 1000);
                        }
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }
        });
    },
    
    listrakPersistentClose: function () {
        $(document).on('click','.close-icon-popup', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var isContainListrakPopup = e.target.closest('.listrak-popup');
            var targetEl = e.target;
            var isTargetContain = targetEl.classList.contains('close-icon-popup');
            if (isContainListrakPopup && isTargetContain) {
                sessionStorage.setItem("listrakPersistenPopup", "false");
                isContainListrakPopup.remove();
            }
        });
    },
    
    listrakPersistentCheckLoad: function () {
        window.onload = () => {
            var listrakPopup = document.querySelector('.listrak-popup');
            var listrakPopupSearchResult = document.querySelector('.listrak-popup-search-result');
            var listrakPopupProductDetail = document.querySelector('.listrak-popup-product-detail');
            var data = sessionStorage.getItem("listrakPersistenPopup");
            if (data == null) {
                var isListrakPopupContain = listrakPopup.classList.contains('listrak-persistent-popup');
            
                if (isListrakPopupContain) {
                    listrakPopup.classList.remove('listrak-persistent-popup');
                }
            }
            if (listrakPopupSearchResult) {
                var mediumWidth = 992;
                var $windowWidth = $(window).width();
                if ($windowWidth < mediumWidth) {
                    listrakPopup.classList.add('button-search-result');
                }
            }
            if (listrakPopupProductDetail) {
                var mediumWidth = 992;
                var $windowWidth = $(window).width();
                if ($windowWidth < mediumWidth) {
                    listrakPopup.classList.add('button-product-detail');
                }
            }
        };
    },
    // Custom End: Listrak persistent popup
    
    updatePageURLForShowMore: updatePageURLForShowMore,
    updateSortOptions: updateSortOptions,
    replaceQueryParam: replaceQueryParam,
    getUrlParamObj: getUrlParamObj
};
