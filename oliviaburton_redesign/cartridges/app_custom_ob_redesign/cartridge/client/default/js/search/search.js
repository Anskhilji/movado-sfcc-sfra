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
 * this method use to get products for GTM Product object
 * @param {Object} response 
 */

function updateMarketingProducts(response) {
    if (typeof setMarketingProductsByAJAX !== 'undefined' && response !== 'undefined') {
        setMarketingProductsByAJAX.cartMarketingData = null;
        setMarketingProductsByAJAX.plpMarketingData = response;
        window.dispatchEvent(setMarketingProductsByAJAX);
    }
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

        $results.find('.' + $(this)[0].className.replace(/ /g, '.')).addClass('active');
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
        '.filter-bar',
        '.refine-wrapper .result-count',
        '.mobile-filter-menu',
        '.sort-dropdown-list',
        '.mobile-sort-order',
    ].forEach(function (selector) {
        updateDom($results, selector);
    });

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });
}

//Custom Start Makes this function for mobile filter
function parseMobileResults(response) {
    var $results = $(response);
    var specialHandlers = {
        '.mobile-filter-menu': handleRefinements
    };

    // Update DOM elements that do not require special handling
    [
        '.grid-header',
        '.header.page-title',
        '.product-grid',
        '.show-more',
        '.filter-bar',
        '.mobile-filter-menu',
        '.sort-dropdown-list',
        '.mobile-sort-order'
    ].forEach(function (selector) {
        updateDom($results, selector);
    });

    Object.keys(specialHandlers).forEach(function (selector) {
        specialHandlers[selector]($results);
    });
}
// Custom End
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
    if (url.search(pattern)>=0 ) {
        newUrl = url.replace(pattern, (newUrl.indexOf('&') > 0 ? '&' : '?') + paramName + '=' + paramValue);
    }
    else {
        newUrl = newUrl + (newUrl.indexOf('?') > 0 ? '&' : '?') + paramName + '=' + paramValue;
    }
    return newUrl;
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
            }

            else {
                url = document.location.href + '&start=' + start + '&sz=' + size;
            }
        }

        else {
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

// Added container-fluid class alongside container

module.exports = {

    filter: function () {
        // Display refinements bar when Menu icon clicked
        $('.container, .container-fluid').on('click', 'button.filter-results', function () {
            $('.refinement-bar, .modal-background').show();
        });
    },

    closeRefinments: function () {
        // Refinements close button
        $('.container, .container-fluid').on('click', '.refinement button.close, .modal-background', function () {
            $('.refinement-bar, .modal-background').hide();
        });
    },
    
    sort: function () {

        // Handle sort order menu selection for mobile
        $(document).on('click', '.mobile-sort-order a, .sort-dropdown .sort-dropdown-item', function (e) {
            var url = $(this).attr('href');
            e.preventDefault();
            $.spinner().start();
            $(this).trigger('search:sort', url);
            var thisText = $(this).text();
            $.ajax({
                url: url,
                data: { selectedUrl: url },
                method: 'GET',
                success: function (response) {
                    var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                    $('body').trigger('facet:success', [gtmFacetArray]);
                    $('.product-grid').empty().html(response);
                    // edit
                    updatePageURLForSortRule(url);
                    // edit
                    $.spinner().stop();

                    $('.sort-dropdown-list .sort-dropdown-toggle').text(thisText);
                    $('.mobile-sort-menu').removeClass('active');
                    $('body').removeClass('lock-bg');
                    $('.mobile-menu-close, .mobile-sort-order').removeClass('loaded');
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    showMore: function () {
        // Show more products
        $('.container, .container-fluid').on('click', '.plp-show-more button, .show-more button', function (e) {
            e.stopPropagation();
            var showMoreUrl = $(this).data('url');

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
                    // edit end
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    showPagination: function () {
        // Show more products
    	$('.container, .container-fluid').on('click', '.show-pagination button', function (e) {
        e.stopPropagation();
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
                // Get products for marketing data
                var marketingProductsData = $('#marketingProductData', $(response).context).data('marketing-product-data');
                updateMarketingProducts(marketingProductsData);
                $.spinner().stop();
                moveFocusToTop();
            },
            error: function () {
                $.spinner().stop();
            }
        });
    });
    },

    applyFilter: function () {
        // Handle refinement value selection and reset click
        $('.container, .container-fluid').on(
            'click',
            '.refinements li a, .refinement-bar a.reset, .plp-filter-reset, .filter-value a, .swatch-filter a',
            function (e) {
                e.preventDefault();
                e.stopPropagation();

                // Get currently selected sort option to retain sorting rules
                var urlparams = getUrlParamObj(document.location.href);
                var filtersURL = e.currentTarget.href;
                var currentSelectedSortId = '';
                if (urlparams.hasOwnProperty('srule') == true) {
                    if (urlparams.srule) {
                        currentSelectedSortId = urlparams.srule;
                        filtersURL = replaceUrlParam(filtersURL, 'srule', currentSelectedSortId);
                    }
                }
               
                $.spinner().start();
                $(this).trigger('search:filter', e);
                $.ajax({
                    url: filtersURL,
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: e.currentTarget.href + currentSelectedSortId
                    },
                    method: 'GET',
                    success: function (response) {
                    	var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                    	$('body').trigger('facet:success', [gtmFacetArray]);
                        parseResults(response);
                        // edit start
                        updatePageURLForFacets(filtersURL);
                        // edit end
                        $.spinner().stop();
                        moveFocusToTop();
                        swatches.showSwatchImages();

                        $('.mobile-filter-menu').removeClass('active');
                        $('body').removeClass('lock-bg');
                        $('.mvmt-plp .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                        $('.mobile-filter-menu').removeClass('active').addClass('disable-events');
                        $('.mvmt-plp .grid-header .sort-col, .mvmt-plp .grid-header .filter-col').remove();
                        $('.plp-grid-overlay').removeClass('active');
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            });
    },

    // Custom End
    showContentTab: function () {
        // Display content results from the search
        $('.container, .container-fluid').on('click', '.content-search', function () {
            if ($('#content-search-results').html() === '') {
                getContent($(this), $('#content-search-results'));
            }
        });

        // Display the next page of content results from the search
        $('.container').on('click', '.show-more-content button', function () {
            getContent($(this), $('#content-search-results .result-count'));
            $('.show-more-content').remove();
        });
    },

    // Custom Start: Make these fucntions for custom events
    sortMenuDesktop: function () { 
        $(document).on("click", '.plp-filter-bar .plp-filter-btn', function(e) {
            var button = this
            $(button).next().toggleClass('active');
            $(button).toggleClass('active');
            setTimeout(function(){
                $(button).next().toggleClass('loaded');
            }, 300);

            if ($(button).hasClass('active')) {
                $('.plp-grid-overlay').addClass('active');

            } else {
                $('.plp-grid-overlay').removeClass('active');
            }

            setTimeout(function(){
                $(button).next().children('.plp-active-filter').toggleClass('loaded');
            }, 500);

            $(".plp-filter-bar .plp-filter-btn").not($(this)).removeClass('active');
            $(".filter-group").not($(this).next()).removeClass('active loaded');
            $(".plp-active-filter").not($(this).next().children('.plp-active-filter')).removeClass('loaded');
        });

        $(document).on('click', '.filter-close-btn', function(e) {
            $(".filter-group").removeClass('active loaded');
            $(".plp-filter-bar .plp-filter-btn").removeClass('active');
            $('.plp-grid-overlay').removeClass('active');
        });

        $(window).scroll(function() {
            var scroll = $(window).scrollTop();

            if (scroll >= 300) {
                $('.scroll-top').addClass('active');
            } else {
                $('.scroll-top').removeClass('active');
            }
        });

        $('.scroll-top').click(function(){
            $('html, body').animate({scrollTop:0}, 1000);
            return false;
        });

        // Show hide popover

        $(document).on('click', '.sort-dropdown', function(e) {
            e.preventDefault();
            $(this).find('.sort-dropdown-toggle, .sort-dropdown-list').toggleClass('active');
            $(this).find('.dropdown-menu').slideToggle('fast');
        });
    },
    // Custom End
};
