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
        '.refine-wrapper',
        '.refine-wrapper-sidebar',
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
    var element = document.querySelector('.tab-content');
    var headerEl = document.querySelector('.header-menu-wrapper');
    var stickyNav = document.querySelector('.filter-box');
    var filters = $('.filter-bar').outerHeight();
    var headerElHeight = headerEl.getBoundingClientRect().height;
    var stickyNavHeight = stickyNav.getBoundingClientRect().height;
    var totalHeight = headerElHeight + stickyNavHeight + filters;
    var y = element.getBoundingClientRect().top + window.pageYOffset - totalHeight;
    window.scrollTo({top: y, behavior: 'smooth'});
}
 // Custom:MSS-2073 start
function closeRefinementFilters() {
    $('.refinement-box-filter-desktop, .desktop-search-refine-bar-redesing').removeClass('active');
    $('.header-menu-wrapper').removeClass('header-active');
    $('.dk-fillter-check').unbind();
    $('.dk-fillter-m').removeClass('dk-fillter-check');
    $('.refine-wrapper-sidebar').removeClass('fillterslideinleft');
}
function refinementBoxFilterDesktop($refinementBox, $dkFilterCheck, $modelBackground) {
    $refinementBox.on('click', function() {
        $('.refinement-box-filter-desktop').removeClass('active');
        $(this).addClass('active');
        $('.modal-background').addClass('d-block');
        $('.desktop-search-refine-bar-redesing').addClass('active');
        $('.header-menu-wrapper').addClass('header-active');
        $('.dk-fillter-m').addClass('dk-fillter-check');

        $dkFilterCheck.on('click', function(e) {
            if(!$('.modal-background').hasClass('d-block')) {
                $('.modal-background').addClass('d-block');
            }
        });

    });

    $modelBackground.on('click', function(e){
        closeRefinementFilters();
    });
}
function moreFilterBtn($moreFilterBtn) {
    $moreFilterBtn.click(function(){
        closeRefinementFilters(); // close refinement filter before opening of sidebar more filter
        $('.modal-background').removeClass('fadeOut').addClass('d-block fadeIn fast')
        $('body').addClass('no-overflow');
        $('.search-results.plp-new-design .refinement-bar').removeClass('fadeOutRight').addClass('fast fadeInRight animated d-block');
        $('.search-results.plp-new-design .custom-select__option').focus();
        $('.search-results.plp-new-design  .refinement-bar .refine-wrapper-sidebar').removeClass('fillterslideinleft');
        $('.refine-wrapper-sidebar').addClass('fillterslideinleft');
    });
}
 // Custom:MSS-2073 end

// filter bar sticky styling MSS-1912
$(window).scroll(function() {    
    var scroll = $(window).scrollTop();
    var screenWidth = 130;
    
    //  this var use for mobile scree 
    if (window.innerWidth <= 767) {
        screenWidth = 45;
    }

    if (scroll > screenWidth) {
        $('.filter-box').addClass('filter-bar-sticky');
        
    } else {
        $('.filter-box').removeClass('filter-bar-sticky');
    }
}); 

module.exports = {
    filter: function () {
        // Display refinements bar when Menu icon clicked
        $('.container, .container-fluid').on('click', 'button.filter-results', function () {
            $('.refinement-bar, .modal-background').show();
        });
    },

    closeRefinments: function () {
        // Refinements close button
        $('.container, .container-fluid').on('click', '.refinement-bar button.close, .modal-background', function () {
            $('.refinement-bar, .modal-background').hide();
        });
    },

    resize: function () {
        // Close refinement bar and hide modal background if user resizes browser
        $(window).resize(function () {
            $('.refinement-bar, .modal-background').hide();
       });
    },

    sort: function () {
        // Handle sort order menu selection
        $('.container, .container-fluid').on('change', '[name=sort-order]', function (e) {
            setTimeout( function () {
                if ( $('.plp-new-design .refinement-bar .selected-value:contains("Sort")').length == 0) {
                    $('.plp-new-design .refinement-bar .selected-value').prepend('<span>Sort By</span> ');
                }
            }, 20);
            var url = this.value;
            e.preventDefault();

            $.spinner().start();

            // Push Data into gtm For Sorting Rules Filters
            var $filteredText = $(this).find(':selected').text().trim();
            if ($filteredText !==undefined) {
                dataLayer.push({
                    event: 'Collection Filtering',
                    eventCategory: 'Collection Filter',
                    eventAction: 'Open Filter Category',
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
                    // edit
                    $.spinner().stop();
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

            //push data on ga tracking
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


        //push data on ga tracking
        var $Next = $('this').attr('aria-label');
        var $Pervious = $('this').attr('aria-label');
        var $pageSize = $(this).data('page-size');
        var $pageNumber = $(this).data('page-number');

        if ($Next !==undefined) {
            dataLayer.push({
                event: 'Pagination',
                eventCategory: 'Load More Results - Pagination',
                eventAction: $Next,
                eventLabel: $pageSize
            });
        }

        if ($Pervious !==undefined) {
            dataLayer.push({
                event: 'Pagination',
                eventCategory: 'Load More Results - Pagination',
                eventAction: $Pervious,
                eventLabel: $pageSize
            });
        }
                
        if ($pageNumber !== undefined && $pageNumber !== undefined) {
            dataLayer.push({
                event: 'Pagination',
                eventCategory: 'Load More Results - Pagination',
                eventAction: $pageNumber,
                eventLabel: $pageSize
            });
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
            '.refinements li a, .refinements-sidebar li a, .refinement-bar a.reset, .filter-value a, .swatch-filter a',
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                var $selectedFiltersNav = e.target;
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
                        updatePageURLForFacets(filtersURL);
                        var $selectedFiltersNav = $('.selected-filters-nav');
                        var $selectedFilterVal = '';
                        $selectedFiltersNav.each(function() {
                            var $isChildEl = $(this).find('.filter-value');
                            if ($isChildEl.length > 0) {
                                $isChildEl.each (function () {
                                    $selectedFilterVal = $(this).find('a').text().trim();
                                    var $filterSideBar = $('.refine-wrapper-sidebar .selected-refinement');
    
                                    if ($filterSideBar.length > 0) {
                                        $filterSideBar.each(function () {
                                            var $selectedRefinementList = $(this).find('.card-body .values');
                                            
                                            if ($selectedRefinementList.length > 0) {
                                                var $isChildren = $selectedRefinementList.find('li');
    
                                                if ($isChildren.length > 0) {
                                                    $isChildren.each(function() {
    
                                                        var $isSelectionTabVal = $(this).find('.selection-tab').text().trim();
    
                                                        if ($isSelectionTabVal == $selectedFilterVal) {
                                                            $(this).find('.selection-tab').addClass('selected');
                                                            $selectedFilterVal = '';
                                                        }
                                                        
                                                    });
                                                }
    
                                            }
                                        });
                                    }
                                });
                            }
                        });
                        $(".close-refinebar .filter-more").removeClass("d-none").addClass("d-block");
                        // edit end
                        $.spinner().stop();
                        $('.search-results.plp-new-design #sort-order').customSelect();
                        setTimeout( function () {
                            if ( $('.plp-new-design .refinement-bar .selected-value:contains("Sort")').length == 0) {
                                $('.plp-new-design .refinement-bar .selected-value').prepend('<span>Sort By</span> ');
                            }
                        }, 20);
                        moveFocusToTop();
                        swatches.showSwatchImages();
                        $('.plp-new-design .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                        // Custom:MSS-2073 start
                        var $refinementBox = $('.refinement-box-filter-desktop');
                        var $dkFilterCheck = $('.dk-fillter-check');
                        var $modelBackground = $('.modal-background');
                        var $moreFilterBtn = $('.more-filter-btn');
                        refinementBoxFilterDesktop($refinementBox, $dkFilterCheck, $modelBackground);
                        moreFilterBtn($moreFilterBtn);
                        $('.desktop-search-refine-bar-redesing').removeClass('active');
                        // Custom:MSS-2073 end
                        if (!$('.refinement-bar-redesign').hasClass('d-block')) { // do not close sidebar filter on selection
                            $('.modal-background').removeClass('d-block');
                            $('.refinement-bar-redesign').removeClass('d-block');
                        }
                        $("body").removeClass("no-overflow-ctm");
                        var $bannerCount = $('.banner-count .result-count');
                        var $sideBarCount = $('.show-bottom-btn .result-count');
                        var $productSearchResult = $('.grid-header .result-count .category-name').data('result-counts');
                        var $bannerSearchResultCountAppend = $('.banner-count .result-count .search-result-count');
                        var $bannerSearchResultCount = $('.search-result-counts .result-count .search-result-count').data('result-counts');
                        var filterBarLayout = $('.filter-bar-overlay');

                        if (filterBarLayout.length > 0) {
                            $('.modal-background').addClass('d-block');
                        }

                        if ($bannerSearchResultCount && $bannerSearchResultCount !== undefined) {
                            $bannerSearchResultCountAppend.html($bannerSearchResultCount);
                        } else if ($productSearchResult && $productSearchResult !== undefined) {
                            var $html = '<span>(' + $productSearchResult + ')</span>';
                            $bannerCount.html($html);
                            if($sideBarCount && $sideBarCount.length){
                                var $html = '<span>(' + $productSearchResult + ')</span>';
                                $sideBarCount.html($html);
                            }
                        } else {
                            var $searchResultCountBanner = $('.search-result-count');
                            if ($searchResultCountBanner.length > 0) {
                                var $html = '<span class="make-bold">' + 0 + '</span> Results for';
                                $bannerSearchResultCountAppend.html($html);
                            } else {
                                var $html = '<span>(' + 0 + ' items)</span>';
                                $bannerCount.html($html);
                                if($sideBarCount && $sideBarCount.length){
                                    var $html = '<span>(' + $productSearchResult + ')</span>';
                                    $sideBarCount.html($html);
                                }
                            }
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

    // start: append value to plp sort by from select option
    selectedFiltervalueAppendToPlpSortBy: function () {
        $('.sort-order-mobile-menu, .refinement-bar-redesign').on('click', '.custom-select__dropdown', function (e) {
            var $mobileFilterBtn = $('.mobile-fliter-sort-button');
            var $selectedValue = e.target.innerText;
            var $html = 'Sort by: ' + $selectedValue;
            $mobileFilterBtn.html($html);
            $('.close-refinebar').trigger('click');
        });
    },
};
