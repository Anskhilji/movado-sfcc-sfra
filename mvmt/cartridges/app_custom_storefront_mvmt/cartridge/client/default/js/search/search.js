'use strict';

var swatches = require('movado/utilities/swatches');
var initiallyLoadedProducts = $('.product-grid').data('initial-products');
var isInfiniteScrollEnabled = $('.mvmt-plp.container-fluid').data('infinte-scroll-enabled');
var isPaginationEnabled = $('.mvmt-plp.container-fluid').data('enable-pagination');
var loadMoreIndex = parseInt(initiallyLoadedProducts / 2) - 1;
var totalProductCount = $('.total-product-count').data('total-product-count');

var loadMoreInProcessing = false;
var filterLoadInProgress = false;

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
        '.top-refinements',
        '.header-bar',
        '.header.page-title',
        '.product-grid',
        '.show-more',
        '.filter-bar',
        '.mobile-filter-menu',
        '.sort-dropdown',
        '.mobile-sort-order',
        '.mvmt-redesign-filter-bar',
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
        '.sort-dropdown',
        '.mobile-sort-order',
        '.mvmt-redesign-filter-bar',
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
 * Replace URL params
 *
 * @param {string} url - url
 * @param {string} paramName - paramter name to be replaced
 * @param {string} paramValue - paramter value to be replaced
 * @return {undefined}
 */

function replaceUrlParamPmid(url, pmid, pmidValue) {
    var newUrl = url;
    newUrl = newUrl + (newUrl.indexOf('?') !== -1 ? '&' : '?') + pmid + '=' + pmidValue;
    return newUrl;
}

function replaceUrlParamSrule(url, srule, sruleValue) {
    var newUrl = url;
    newUrl = newUrl + (newUrl.indexOf('?') !== -1 ? '&' : '?') + srule + '=' + sruleValue;
    return newUrl;
}

function replaceUrlParamPmidSrule(url, pmid, pmidValue, srule, sruleValue) {
    var newUrl = url;
    newUrl = newUrl + (newUrl.indexOf('?') !== -1 ? '&' : '?') + pmid + '=' + pmidValue + (newUrl.indexOf('?') !== -1 ? '&' : '?') + srule + '=' + sruleValue;
    return newUrl;
}

function replaceUrlParamSearchQuery(url, queryParam, queryParamValue) {
    var newUrl = url;
    var paramStr = newUrl.slice(newUrl.indexOf('?') + 1);
    return  newUrl = '?' + queryParam + '=' + queryParamValue + '&' +  paramStr;
}

function replaceUrlParamSearchQueryPmid(url, queryParam, queryParamValue, pmid, pmidValue) {
    var newUrl = url;
    var paramStr = newUrl.slice(newUrl.indexOf('?') + 1);
    return  newUrl = '?' + queryParam + '=' + queryParamValue + '&' +  paramStr + '&' + pmid + '=' + pmidValue;
}

function replaceUrlParamSearchQueryPmidSrule(url, queryParam, queryParamValue, pmid, pmidValue, srule, sruleValue) {
    var newUrl = url;
    var paramStr = newUrl.slice(newUrl.indexOf('?') + 1);
    return  newUrl = '?' + queryParam + '=' + queryParamValue + '&' +  paramStr + '&' + pmid + '=' + pmidValue + '&' + srule + '=' + sruleValue;
}

function replaceUrlParamSruleQ(url, srule, paramSrule, q, paramSearchQuery) {
    var newUrl = url;
    var paramStr = newUrl.slice(newUrl.indexOf('?') + 1);
    return  newUrl = '?' + q + '=' + paramSearchQuery + '&' +  paramStr + '&' + srule + '=' + paramSrule;
}

function removeUrlParamsQ(url, q, paramSearchQuery) {
    var newUrl = url;
    return  newUrl = '?' + q + '=' + paramSearchQuery;
}

function removeUrlParamsQSrule(url, q, paramSearchQuery, srule, queryParamSrule) {
    var newUrl = url;
    return  newUrl = '?' + q + '=' + paramSearchQuery + '&' + srule + '=' + queryParamSrule;
}

function removeUrlParamsSrule(url, srule, queryParamSrule) {
    var newUrl = url;
    return  newUrl = '?' + srule + '=' + queryParamSrule;
}


function checkClearAllBtn() {
    var addedFilterBarCheck = document.querySelector('.selected-filter-bar');
    var mobileFiltersClearBtn = document.querySelectorAll('.mobile-filters-clear');
    var addedFilterBarCheckLength = addedFilterBarCheck.children.length > 0;
    if (addedFilterBarCheckLength) {
        if (mobileFiltersClearBtn) {
            mobileFiltersClearBtn.forEach(function (e) {
                var isContainDisbaled = e.classList.contains('disabled');
                if (isContainDisbaled) {
                    e.classList.remove('disabled');
                }
            });
        }
    } else {
        if (mobileFiltersClearBtn) {
            mobileFiltersClearBtn.forEach(function (e) {
                var isContainDisbaled = e.classList.contains('disabled');
                if (!isContainDisbaled) {
                    e.classList.add('disabled');
                }
            });
        }                    
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

function bulidLifeStyleCarousel() {

    $('.product-grid .plp-image-carousel:not(.slick-initialized)').slick({
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: false,
        dots: true,
        arrows: false
    });

    $(document).on('beforeChange', '.product-grid .plp-image-carousel', function (event, slick, currentSlide, nextSlide) {
        var nextSlide = slick.$slides.get(nextSlide);
        var $slideSourceSets = $(nextSlide).find('source');
        $($slideSourceSets).each(function () {
            $(this).attr('srcset', $(this).data('lazy'));
        });
    });
}

// onscroll add class for filter popup
function filterScroll() {
    $(".mobile-selection-group").scroll(function() {
        var scroll = $(this).scrollTop();
        if (scroll > 50) {
            $('.filter-scroll').addClass("scrolled");
        } else {
            $('.filter-scroll').removeClass("scrolled");
        }
    });
}

$(document).ready(function () {
    filterScroll();
});
// onscroll add class for filter popup end

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
    setTimeout(() => {
        filterLoadInProgress = false;
    }, 600);
}

// Desktop Filter bar plp: on plp after clicked on filters bar close btn
function removeSelectedFilterDesktop($element) {
    var isSelectedFilterBar = document.querySelector('.filter-bar-list > .selected-filter-bar');

    if (isSelectedFilterBar) {
        var isFilterChildList = isSelectedFilterBar.children.length > 0;

        if (!isFilterChildList) {
            $('.filter-group').removeClass('active loaded');
            $('.plp-active-filter').removeClass('loaded');
            $('.plp-active-filter-selected').addClass('d-none');
            $('.plp-filter-bar .plp-filter-btn').removeClass('active');
            $('.plp-grid-overlay').removeClass('active');

            var RemoveUrlParams = getUrlParamObj(document.location.href);
            var oldUrl = document.location.href;
            var url = oldUrl.split('?')[0];
            var urlReload = oldUrl.split('?')[1];
            var newFilteredUrl = url;

            if (RemoveUrlParams.hasOwnProperty('q') == true) {
                if (RemoveUrlParams.hasOwnProperty('q') == true && RemoveUrlParams.hasOwnProperty('srule') == false) {
                    if (RemoveUrlParams.q) {
                        var queryParamQ = RemoveUrlParams.q;
                        newFilteredUrl = removeUrlParamsQ(newFilteredUrl, 'q', queryParamQ);
                    }
                }
                if (RemoveUrlParams.hasOwnProperty('q') == true && RemoveUrlParams.hasOwnProperty('srule') == true) {
                    if (RemoveUrlParams.q) {
                        var queryParamQ = RemoveUrlParams.q;  
                        var queryParamSrule = RemoveUrlParams.srule;  
                        newFilteredUrl = removeUrlParamsQSrule(newFilteredUrl, 'q', queryParamQ, 'srule', queryParamSrule);
                    }
                }
            } else {
                if (RemoveUrlParams.hasOwnProperty('srule') == true) {
                    if (RemoveUrlParams.srule) {
                        var queryParamSrule = RemoveUrlParams.srule;  
                        newFilteredUrl = removeUrlParamsSrule(newFilteredUrl, 'srule', queryParamSrule);
                    }
                }
            }
            window.history.pushState({}, '', newFilteredUrl);

            if (urlReload) {
                window.location.reload();
            }
            return;
        } else {
            filterLoadInProgress = true;

            var parentSelectorOuter = document.querySelector('.plp-filter-redesign');
            if (parentSelectorOuter) {
                var parentSelector = parentSelectorOuter.querySelectorAll('.filter-refinement-container');
                var prefv = '';
                var indexValue = 1;
                var params = '';
                var pminValue = '';
                var pmaxValue = '';

                parentSelector.forEach(function (el, index) {
                    if (el.hasChildNodes()) {
                        var prefn = el.dataset.filterId;
                        var childElement = el.querySelectorAll('.filter-element');
                        
                        childElement.forEach(function (e, i) {
                            var hasFilerSelected = e.querySelector('.check-filter-selected');

                            if (hasFilerSelected) {
                                if (prefv.indexOf('%7C') == -1) {
                                    prefv +='%7C';
                                }
                                if (e.dataset.filterId == 'price') {
                                    pminValue += e.dataset.valuePmin;
                                    pmaxValue += e.dataset.valuePmax;
                                } else {
                                    prefv += e.dataset.selectedFilter;
                                }
                                if (prefv.indexOf('%7C') !== -1) {
                                    prefv +='%7C';
                                } 
                            }
                        });
                        if (prefv) {
                            if (params.indexOf('?') == -1) {
                                params += '?';
                            } else {
                                params +='&';
                            }
                            prefv = prefv.slice(3, -3);
                            if(prefn == "pmid"){
                                params += `pmid=${prefv}`;
                                indexValue--;
                            } else if (prefn == 'price') {
                                // making url for pmin & pmax example: ?pmin=500.00&pmax=1000.00
                                if (pminValue !== '' && pmaxValue !== '') {
                                    params += `pmin=${pminValue}&pmax=${pmaxValue}`;
                                    indexValue--;
                                }
                            }else{
                                params += `prefn${indexValue}=${prefn}&prefv${indexValue}=${prefv}`;
                            }
                            indexValue++;
                        }
                        
                    };
                    // Example url: ?prefn1=color&prefv1=Brown&prefn2=pmid&prefv2=Product_level_Promotion
                    prefv = '';
                });

                
                var urlparams = getUrlParamObj(document.location.href);
                var filtersURL = params;
                var currentSelectedSortId = '';

                if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == false) {
                    if (urlparams.srule) {
                        currentSelectedSortId = urlparams.srule;
                        filtersURL = replaceUrlParamSrule(filtersURL, 'srule', currentSelectedSortId);
                        
                    }
                }
                // ?prefn1=color&prefv1=Brown%7CGreen&pmid=product_level_promotion&srule=best-sellers
                if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == false) {
                    if (urlparams.pmid && urlparams.srule) {
                        var paramSrule = urlparams.srule;
                        var paramPmid = urlparams.pmid;
                        filtersURL = replaceUrlParamPmidSrule(filtersURL, 'pmid', paramPmid, 'srule', paramSrule);
                    }
                }

                if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == false && urlparams.hasOwnProperty('q') == true) {
                    if (urlparams.q) {
                        var paramSearchQuery = urlparams.q;
                        filtersURL = replaceUrlParamSearchQuery(filtersURL, 'q', paramSearchQuery);
                    }
                }

                if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == true) {
                    if (urlparams.q && urlparams.srule) {
                        var paramSrule = urlparams.srule;
                        var paramSearchQuery = urlparams.q;
                        filtersURL = replaceUrlParamSruleQ(filtersURL, 'srule', paramSrule, 'q', paramSearchQuery);
                    }
                }

                if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('q') == true && urlparams.hasOwnProperty('srule') == false) {
                    if (urlparams.q) {
                        var paramSearchQuery = urlparams.q;
                        var paramPmid = urlparams.pmid;
                        filtersURL = replaceUrlParamSearchQueryPmid(filtersURL, 'q', paramSearchQuery, 'pmid', paramPmid);
                    }
                }

                if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('q') == true && urlparams.hasOwnProperty('srule') == true) {
                    if (urlparams.q) {
                        var paramSearchQuery = urlparams.q;
                        var paramPmid = urlparams.pmid;
                        var paramSrule = urlparams.srule;
                        filtersURL = replaceUrlParamSearchQueryPmidSrule(filtersURL, 'q', paramSearchQuery, 'pmid', paramPmid, 'srule', paramSrule);
                    }
                }

                var baseUrl = document.location.href;
                if (baseUrl.indexOf('?') !== -1) {
                    baseUrl = baseUrl.split('?')[0];
                }
                filtersURL = baseUrl + filtersURL;
                $.spinner().start();
                $(this).trigger('search:filter', $element);
                $.ajax({
                    url: filtersURL,
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: filtersURL
                    },
                    method: 'GET',
                    success: function (response) {
                        var params = '';
                        var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                        $('body').trigger('facet:success', [gtmFacetArray]);
                        parseResults(response);
                        updatePageURLForFacets(filtersURL);
                        $.spinner().stop();
                        moveFocusToTop();
                        swatches.showSwatchImages();

                        $('.mobile-filter-menu').removeClass('active');
                        $('.mobile-sort-menu').removeClass('active').addClass('disable-events');
                        $('body').removeClass('lock-bg');
                        $('.mvmt-plp .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                        $('.mobile-filter-menu').removeClass('active').addClass('disable-events');
                        $('.mvmt-plp .grid-header .sort-col, .mvmt-plp .grid-header .filter-col').remove();
                        $('.plp-grid-overlay').removeClass('active');
                        $('.plp-active-filter-selected').addClass('d-none');
                        bulidLifeStyleCarousel();
                        if (isInfiniteScrollEnabled && (isPaginationEnabled == false)) {
                            loadMoreIndex = $('#product-search-results .product-tile').length - (parseInt(initiallyLoadedProducts / 2) + 1);
                        }

                    },
                    error: function () {
                        $.spinner().stop();
                        filterLoadInProgress = false;
                    }
                });
            }
        }

    }
}

// Mobile Filter bar plp: on plp after clicked on filters bar close btn
function removeSelectedFilterMobile($element) {
    var isSelectedFilterBar = document.querySelector('.filter-bar-list > .selected-filter-bar');
            
    if (isSelectedFilterBar) {
        var isFilterChildList = isSelectedFilterBar.children.length > 0;

        if (!isFilterChildList) {
            $('.filter-group').removeClass('active loaded');
            $('.plp-active-filter').removeClass('loaded');
            $('.plp-active-filter-selected').addClass('d-none');
            $('.plp-filter-bar .plp-filter-btn').removeClass('active');
            $('.plp-grid-overlay').removeClass('active');
            $('.mobile-filter-redesign').removeClass('active-filter-closed-mobile');
            var mobileSortMenu = document.querySelector('.mobile-sort-menu-container');
            var mobileMenuContainerMain = document.querySelector('.mobile-menu-container-main');
            var isSortActive = mobileSortMenu.classList.contains('active');
            var isMobileActive = mobileMenuContainerMain.classList.contains('active');
            if (isSortActive) {
                $('.mobile-sort-menu').removeClass('active');
                $('body').removeClass('lock-bg');
            } 
            if (isMobileActive) {
                mobileMenuContainerMain.classList.remove('active');
            }
            var RemoveUrlParams = getUrlParamObj(document.location.href);
            var oldUrl = document.location.href;
            var url = oldUrl.split('?')[0];
            var urlReload = oldUrl.split('?')[1];
            var newFilteredUrl = url;

            if (RemoveUrlParams.hasOwnProperty('q') == true) {
                if (RemoveUrlParams.hasOwnProperty('q') == true && RemoveUrlParams.hasOwnProperty('srule') == false) {
                    if (RemoveUrlParams.q) {
                        var queryParamQ = RemoveUrlParams.q;
                        newFilteredUrl = removeUrlParamsQ(newFilteredUrl, 'q', queryParamQ);
                    }
                }
                if (RemoveUrlParams.hasOwnProperty('q') == true && RemoveUrlParams.hasOwnProperty('srule') == true) {
                    if (RemoveUrlParams.q) {
                        var queryParamQ = RemoveUrlParams.q;  
                        var queryParamSrule = RemoveUrlParams.srule;  
                        newFilteredUrl = removeUrlParamsQSrule(newFilteredUrl, 'q', queryParamQ, 'srule', queryParamSrule);
                    }
                }
            } else {
                if (RemoveUrlParams.hasOwnProperty('srule') == true) {
                    if (RemoveUrlParams.srule) {
                        var queryParamSrule = RemoveUrlParams.srule;  
                        newFilteredUrl = removeUrlParamsSrule(newFilteredUrl, 'srule', queryParamSrule);
                    }
                }
            }
            window.history.pushState({}, '', newFilteredUrl);

            if (urlReload) {
                window.location.reload();
            }
            return;
        } else {
            filterLoadInProgress = true;
            var selectedFiltersAll;
            var mobileSortMenu = document.querySelector('.mobile-sort-menu-container');
            var isActive = mobileSortMenu.classList.contains('active');
            if (isActive) {
                selectedFiltersAll = mobileSortMenu.querySelectorAll('.filter-refinement-container');
            } else {
                var mobileMenuContainerMain  = document.querySelector('.mobile-menu-container-main');
                selectedFiltersAll = mobileMenuContainerMain.querySelectorAll('.filter-refinement-container');
            }

            if (selectedFiltersAll) {
                var prefv = '';
                var indexValue = 1;
                var params = '';
                var pminValue = '';
                var pmaxValue = '';

                selectedFiltersAll.forEach(function (el, index) {
                        if (el.hasChildNodes()) {
                            var prefn = el.dataset.filterId;
                            var childElement = el.querySelectorAll('.filter-element');
                            
                            childElement.forEach(function (e, i) {
                                var hasFilerSelected = e.querySelector('.check-filter-selected');

                                if (hasFilerSelected) {
                                    if (prefv.indexOf('%7C') == -1) {
                                        prefv +='%7C';
                                    }
                                    if (e.dataset.filterId == 'price') {
                                        pminValue += e.dataset.valuePmin;
                                        pmaxValue += e.dataset.valuePmax;
                                    } else {
                                        prefv += e.dataset.selectedFilter;
                                    }
                                    if (prefv.indexOf('%7C') !== -1) {
                                        prefv +='%7C';
                                    } 
                                }
                            });
                            if (prefv) {
                                if (params.indexOf('?') == -1) {
                                    params += '?';
                                } else {
                                    params +='&';
                                }
                                prefv = prefv.slice(3, -3);
                                if(prefn == "pmid"){
                                    params += `pmid=${prefv}`;
                                    indexValue--;
                                } else if (prefn == 'price') {
                                    // ?pmin=500.00&pmax=1000.00
                                    if (pminValue !== '' && pmaxValue !== '') {
                                        params += `pmin=${pminValue}&pmax=${pmaxValue}`;
                                        indexValue--;
                                    }
                                }else{
                                    params += `prefn${indexValue}=${prefn}&prefv${indexValue}=${prefv}`;
                                }
                                indexValue++;
                            }
                            
                        };
                    prefv = '';
                });

                var urlparams = getUrlParamObj(document.location.href);
                var filtersURL = params;    
                var currentSelectedSortId = '';

                if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == false) {
                    if (urlparams.srule) {
                        currentSelectedSortId = urlparams.srule;
                        filtersURL = replaceUrlParamSrule(filtersURL, 'srule', currentSelectedSortId);
                        
                    }
                }
                if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == true) {
                    if (urlparams.q && urlparams.srule) {
                        var paramSrule = urlparams.srule;
                        var paramSearchQuery = urlparams.q;
                        filtersURL = replaceUrlParamSruleQ(filtersURL, 'srule', paramSrule, 'q', paramSearchQuery);
                    }
                }
                if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == false) {
                    if (urlparams.pmid && urlparams.srule) {
                        var paramSrule = urlparams.srule;
                        var paramPmid = urlparams.pmid;
                        filtersURL = replaceUrlParamPmidSrule(filtersURL, 'pmid', paramPmid, 'srule', paramSrule);
                    }
                }

                if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == false && urlparams.hasOwnProperty('q') == true) {
                    if (urlparams.q) {
                        var paramSearchQuery = urlparams.q;
                        filtersURL = replaceUrlParamSearchQuery(filtersURL, 'q', paramSearchQuery);
                    }
                }

                if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('q') == true && urlparams.hasOwnProperty('srule') == false) {
                    if (urlparams.q) {
                        var paramSearchQuery = urlparams.q;
                        var paramPmid = urlparams.pmid;
                        filtersURL = replaceUrlParamSearchQueryPmid(filtersURL, 'q', paramSearchQuery, 'pmid', paramPmid);
                    }
                }

                if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('q') == true && urlparams.hasOwnProperty('srule') == true) {
                    if (urlparams.q) {
                        var paramSearchQuery = urlparams.q;
                        var paramPmid = urlparams.pmid;
                        var paramSrule = urlparams.srule;
                        filtersURL = replaceUrlParamSearchQueryPmidSrule(filtersURL, 'q', paramSearchQuery, 'pmid', paramPmid, 'srule', paramSrule);
                    }
                }

                var baseUrl = document.location.href;
                if (baseUrl.indexOf('?') !== -1) {
                    baseUrl = baseUrl.split('?')[0];
                }
                filtersURL = baseUrl + filtersURL;
                $.spinner().start();
                $(this).trigger('search:filter', $element);
                $.ajax({
                    url: filtersURL,
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: filtersURL
                    },
                    method: 'GET',
                    success: function (response) {
                        var params = '';
                        var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                        $('body').trigger('facet:success', [gtmFacetArray]);
                        parseResults(response);
                        updatePageURLForFacets(filtersURL);
                        $.spinner().stop();
                        moveFocusToTop();
                        swatches.showSwatchImages();
                        $('.mvmt-plp .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                        $('.mobile-filter-menu').removeClass('active').addClass('disable-events');
                        $('body').removeClass('lock-bg');
                        $('.mvmt-plp .grid-header .sort-col').remove();
                        $('.mvmt-plp .grid-header .filter-col').remove();
                        $('.mobile-filter-redesign').removeClass('active-filter-closed-mobile');
                        if (isActive) {
                            $('.mobile-sort-menu').removeClass('active');
                            $('body').removeClass('lock-bg');
                        }
                        checkClearAllBtn();
                        if (isInfiniteScrollEnabled && (isPaginationEnabled == false)) {
                            loadMoreIndex = $('#product-search-results .product-tile').length - (parseInt(initiallyLoadedProducts / 2) + 1);
                        }
                        bulidLifeStyleCarousel();
                        filterScroll();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            }                    
        }

    }
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
        $('.container, .container-fluid').on('click', '.refinement-bar button.close, .modal-background', function () {
            $('.refinement-bar, .modal-background').hide();
        });

        $(document).on('click', '.plp-filter-redesign .filter-group .close-icon', function () {
            $('.plp-filter-btn.active').trigger('click');
        });
    },

    resize: function () {
        // Close refinement bar and hide modal background if user resizes browser
        $(window).resize(function () {
            $('.refinement-bar, .modal-background').hide();
        });
    },

    sort: function () {

        // Handle sort order menu selection for mobile
        $(document).on('click', '.mobile-sort-order a, .sort-dropdown .sort-dropdown-item', function (e) {
            var url = $(this).attr('href');
            var $selectedItem = $(this);
            e.preventDefault();
            $.spinner().start();

            $(this).trigger('search:sort', url);
            $.ajax({
                url: url,
                data: { selectedUrl: url },
                method: 'GET',
                success: function (response) {

                    var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                    $('body').trigger('facet:success', [gtmFacetArray]);
                    $('.product-grid').empty().html(response);
                    updatePageURLForSortRule(url);
                    /**
                     * Custom Start: Filter Redesign
                     */
                    $('.mobile-filter-redesign .sort-dropdown-toggle').find('span.selected-value').text($selectedItem.text());
                    $(".plp-filter-redesign .sort-dropdown-toggle").find('span.selected-value').text($selectedItem.text());
                    $('.plp-filter-redesign .sort-dropdown .sort-dropdown-item').removeClass('selected');
                    $('.mobile-filter-redesign .sort-dropdown .sort-dropdown-item').removeClass('selected');
                    $selectedItem.addClass('selected');

                    /**
                     * Custom End:
                     */
                    $.spinner().stop();

                    $('.mobile-sort-menu').removeClass('active');
                    $('body').removeClass('lock-bg');
                    $('.mobile-menu-close, .mobile-sort-order').removeClass('loaded');
                    bulidLifeStyleCarousel();
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
                    updatePageURLForShowMore(showMoreUrl);
                    if (isInfiniteScrollEnabled && (isPaginationEnabled == false)) {
                        loadMoreIndex = $('#product-search-results .product-tile').length - (parseInt(initiallyLoadedProducts / 2) + 1);
                    }
                    bulidLifeStyleCarousel();
                    $.spinner().stop();
                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    loadMoreProductsOnScroll: function () {
        if($('.mvmt-plp-redesign').length == 0){
            return;
        }
        // Load more products on scroll
        if (isInfiniteScrollEnabled && (isPaginationEnabled == false)) {

            $(window).scroll(function (e) {

                if (filterLoadInProgress) {
                    return;
                }
                
                if (!loadMoreInProcessing) {
                    loadMoreInProcessing = true;
                } else {
                    return;
                }

                if (totalProductCount == $('#product-search-results .product-tile').length) {
                    return;
                }

                var productTileHeigth = $('#product-search-results .product-tile').outerHeight();
                var scrollPostion = $(window).scrollTop() + productTileHeigth;
                var isLoadOnScroll = ($('#product-search-results .product-tile').length % (3 * initiallyLoadedProducts)) != 0 ? true : false;
                var nextLoadMorePosition = $('#product-search-results .product-tile').eq(loadMoreIndex).offset().top;

                if (($('#product-search-results .product-tile').length % (3 * initiallyLoadedProducts)) == 0) {
                    $('.grid-footer').removeClass('d-none');
                }
                if ((scrollPostion >= nextLoadMorePosition) && loadMoreInProcessing && isLoadOnScroll && (($('#product-search-results .product-tile').length % initiallyLoadedProducts) == 0)) {
                    e.preventDefault();
                    e.stopPropagation();
                    var showMoreUrl = $('.show-more button').data('url');
                    $.spinner().start();
                    $(this).trigger('search:loadMoreProductsOnScroll', e);
                    $.ajax({
                        url: showMoreUrl,
                        data: { selectedUrl: showMoreUrl },
                        method: 'GET',
                        success: function (response) {
                            loadMoreIndex += parseInt(initiallyLoadedProducts / 2);
                            var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                            $('body').trigger('facet:success', [gtmFacetArray]);
                            $('.grid-footer').replaceWith(response);
                            updateSortOptions(response);
                            updatePageURLForShowMore(showMoreUrl);
                            loadMoreInProcessing = false;
                            if (($('#product-search-results .product-tile').length % (3 * initiallyLoadedProducts)) == 0) {
                                $('.grid-footer').removeClass('d-none');
                            }
                            bulidLifeStyleCarousel();
                            $.spinner().stop();
                        },
                        error: function () {
                            $.spinner().stop();
                        }
                    });
                } else {
                    loadMoreInProcessing = false;
                }

            });
        }
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
                    updatePageURLForPagination(showMoreUrl);
                    var marketingProductsData = $('#marketingProductData', $(response).context).data('marketing-product-data');
                    updateMarketingProducts(marketingProductsData);
                    bulidLifeStyleCarousel();
                    $.spinner().stop();
                    moveFocusToTop();

                },
                error: function () {
                    $.spinner().stop();
                }
            });
        });
    },

    // Custom start: Desktop filters
    // making urls for prefn1,pmid,pmin,pmax,srule and based on url getting the data
    applyFilter: function () {
        // Handle refinement value selection and reset click
            $('.container, .container-fluid').on(
                'click',
                '.search-refinement-close', function(e) {
            e.preventDefault();
            // e.stopPropagation();
            var isSelectedFilterBar = document.querySelector('.filter-bar-list > .selected-filter-bar');
            if (isSelectedFilterBar) {
                var isFilterChildList = isSelectedFilterBar.children.length > 0;
                if (!isFilterChildList) {
                    $('.filter-group').removeClass('active loaded');
                    $('.plp-active-filter').removeClass('loaded');
                    $('.plp-active-filter-selected').addClass('d-none');
                    $('.plp-filter-bar .plp-filter-btn').removeClass('active');
                    $('.plp-grid-overlay').removeClass('active');
                    $('.plp-filter-redesign').removeClass('active-filter-closed-desktop');

                    var RemoveUrlParams = getUrlParamObj(document.location.href);
                    var oldUrl = document.location.href;
                    var url = oldUrl.split('?')[0];
                    var urlReload = oldUrl.split('?')[1];
                    var newFilteredUrl = url;

                    if (RemoveUrlParams.hasOwnProperty('q') == true) {
                        if (RemoveUrlParams.hasOwnProperty('q') == true && RemoveUrlParams.hasOwnProperty('srule') == false) {
                            if (RemoveUrlParams.q) {
                                var queryParamQ = RemoveUrlParams.q;
                                newFilteredUrl = removeUrlParamsQ(newFilteredUrl, 'q', queryParamQ);
                            }
                        }
                        if (RemoveUrlParams.hasOwnProperty('q') == true && RemoveUrlParams.hasOwnProperty('srule') == true) {
                            if (RemoveUrlParams.q) {
                                var queryParamQ = RemoveUrlParams.q;  
                                var queryParamSrule = RemoveUrlParams.srule;  
                                newFilteredUrl = removeUrlParamsQSrule(newFilteredUrl, 'q', queryParamQ, 'srule', queryParamSrule);
                            }
                        }
                    } else {
                        if (RemoveUrlParams.hasOwnProperty('srule') == true) {
                            if (RemoveUrlParams.srule) {
                                var queryParamSrule = RemoveUrlParams.srule;  
                                newFilteredUrl = removeUrlParamsSrule(newFilteredUrl, 'srule', queryParamSrule);
                            }
                        }
                    }
                    window.history.pushState({}, '', newFilteredUrl);

                    if (urlReload) {
                        window.location.reload();
                    }
                    return;
                } else {
                    filterLoadInProgress = true;
    
                    var parentSelectorOuter = document.querySelector('.plp-filter-redesign');
                    if (parentSelectorOuter) {
                        var parentSelector = parentSelectorOuter.querySelectorAll('.filter-refinement-container');
                        var prefv = '';
                        var indexValue = 1;
                        var params = '';
                        var pminValue = '';
                        var pmaxValue = '';
    
                        parentSelector.forEach(function (el, index) {
                                if (el.hasChildNodes()) {
                                    var prefn = el.dataset.filterId;
                                    var childElement = el.querySelectorAll('.filter-element');
                                    
                                    childElement.forEach(function (e, i) {
                                        var hasFilerSelected = e.querySelector('.check-filter-selected');
    
                                        if (hasFilerSelected) {
                                            if (prefv.indexOf('%7C') == -1) {
                                                prefv +='%7C';
                                            }
                                            if (e.dataset.filterId == 'price') {
                                                pminValue += e.dataset.valuePmin;
                                                pmaxValue += e.dataset.valuePmax;
                                            } else {
                                                prefv += e.dataset.selectedFilter;
                                            }
                                            if (prefv.indexOf('%7C') !== -1) {
                                                prefv +='%7C';
                                            } 
                                        }
                                    });
                                    if (prefv) {
                                        if (params.indexOf('?') == -1) {
                                            params += '?';
                                        } else {
                                            params +='&';
                                        }
                                        prefv = prefv.slice(3, -3);
                                        if(prefn == "pmid"){
                                            params += `pmid=${prefv}`;
                                            indexValue--;
                                        } else if (prefn == 'price') {
                                            // making url for pmin & pmax example: ?pmin=500.00&pmax=1000.00
                                            if (pminValue !== '' && pmaxValue !== '') {
                                                params += `pmin=${pminValue}&pmax=${pmaxValue}`;
                                                indexValue--;
                                            }
                                        }else{
                                            params += `prefn${indexValue}=${prefn}&prefv${indexValue}=${prefv}`;
                                        }
                                        indexValue++;
                                    }
                                    
                                };
                            // Example url: ?prefn1=color&prefv1=Brown&prefn2=pmid&prefv2=Product_level_Promotion
                            prefv = '';
                        });
    
                        
                        var urlparams = getUrlParamObj(document.location.href);
                        var filtersURL = params;
                        var currentSelectedSortId = '';
    
                        if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == false) {
                            if (urlparams.srule) {
                                currentSelectedSortId = urlparams.srule;
                                filtersURL = replaceUrlParamSrule(filtersURL, 'srule', currentSelectedSortId);
                                
                            }
                        }
                        // ?prefn1=color&prefv1=Brown%7CGreen&pmid=product_level_promotion&srule=best-sellers
                        if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == false) {
                            if (urlparams.pmid && urlparams.srule) {
                                var paramSrule = urlparams.srule;
                                var paramPmid = urlparams.pmid;
                                filtersURL = replaceUrlParamPmidSrule(filtersURL, 'pmid', paramPmid, 'srule', paramSrule);
                            }
                        }
    
                        if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == false && urlparams.hasOwnProperty('q') == true) {
                            if (urlparams.q) {
                                var paramSearchQuery = urlparams.q;
                                filtersURL = replaceUrlParamSearchQuery(filtersURL, 'q', paramSearchQuery);
                            }
                        }

                        if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == true) {
                            if (urlparams.q && urlparams.srule) {
                                var paramSrule = urlparams.srule;
                                var paramSearchQuery = urlparams.q;
                                filtersURL = replaceUrlParamSruleQ(filtersURL, 'srule', paramSrule, 'q', paramSearchQuery);
                            }
                        }
    
                        if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('q') == true && urlparams.hasOwnProperty('srule') == false) {
                            if (urlparams.q) {
                                var paramSearchQuery = urlparams.q;
                                var paramPmid = urlparams.pmid;
                                filtersURL = replaceUrlParamSearchQueryPmid(filtersURL, 'q', paramSearchQuery, 'pmid', paramPmid);
                            }
                        }
    
                        if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('q') == true && urlparams.hasOwnProperty('srule') == true) {
                            if (urlparams.q) {
                                var paramSearchQuery = urlparams.q;
                                var paramPmid = urlparams.pmid;
                                var paramSrule = urlparams.srule;
                                filtersURL = replaceUrlParamSearchQueryPmidSrule(filtersURL, 'q', paramSearchQuery, 'pmid', paramPmid, 'srule', paramSrule);
                            }
                        }

                        var baseUrl = document.location.href;
                        if (baseUrl.indexOf('?') !== -1) {
                            baseUrl = baseUrl.split('?')[0];
                        }
                        filtersURL = baseUrl + filtersURL;
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
                                var params = '';
                                var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                                $('body').trigger('facet:success', [gtmFacetArray]);
                                parseResults(response);
                                updatePageURLForFacets(filtersURL);
                                $.spinner().stop();
                                moveFocusToTop();
                                swatches.showSwatchImages();
    
                                $('.mobile-filter-menu').removeClass('active');
                                $('.mobile-sort-menu').removeClass('active').addClass('disable-events');
                                $('body').removeClass('lock-bg');
                                $('.mvmt-plp .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                                $('.mobile-filter-menu').removeClass('active').addClass('disable-events');
                                $('.mvmt-plp .grid-header .sort-col, .mvmt-plp .grid-header .filter-col').remove();
                                $('.plp-grid-overlay').removeClass('active');
                                $('.plp-active-filter-selected').addClass('d-none');
                                $('.plp-filter-redesign').removeClass('active-filter-closed-desktop');
                                bulidLifeStyleCarousel();
                                if (isInfiniteScrollEnabled && (isPaginationEnabled == false)) {
                                    loadMoreIndex = $('#product-search-results .product-tile').length - (parseInt(initiallyLoadedProducts / 2) + 1);
                                }
    
                            },
                            error: function () {
                                $.spinner().stop();
                                filterLoadInProgress = false;
                            }
                        });
                    }
                }

            }
        });
    },

    // desktop filters multi selection
    applyFilterSelect: function () {
        // Handle refinement value selection and reset click
        $('.container, .container-fluid').on(
            'click',
            '.filter-refinement-container',
            function (e) {
                e.preventDefault();
                e.stopPropagation();

                filterLoadInProgress = true;
                // Get currently selected sort option to retain sorting rules
                var clicked = e.target.closest('.filter-elements');
                var filterBar = document.querySelectorAll('.selected-filter-bar');

                if (!clicked) return;
                if (clicked) {
                    var isSelected = clicked.querySelector('.selected');
                    var filterBarValue = clicked.dataset.selectedFilter;
                    var filterBarId = clicked.dataset.filterId;
                    var isCheckSquare = clicked.querySelector('.check-square');
                    var isSquareO = clicked.querySelector('.square-o');
                    var isCheckCircle = clicked.querySelector('.check-circle');
                    var isCheckO = clicked.querySelector('.check-o');
                    
                    if (isSelected && isCheckSquare == null && isSquareO == null && isCheckCircle == null && isCheckO == null) {
                        var containClass = isSelected.classList.toggle('filter-selected');
                        if (containClass) {
                            isSelected.classList.add('check-filter-selected');
                            var html = `<li class="filter-value added-filter-bar" data-filter-id="${filterBarId}" data-added-filter-bar="${filterBarValue}">
                                            <a href="">${filterBarValue}</a>
                                        </li>`;
                            filterBar.forEach(function (e) {
                                e.insertAdjacentHTML('beforeend', html);    
                            });
                       } else {
                        var selectedFilterId = isSelected.dataset.selectedFilter;
                            var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');

                            if (slectedFilterBarAll.length > 0) {
                                slectedFilterBarAll.forEach(function (el) {
                                    if (el.hasChildNodes()) {
                                        var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                        addedFilterBarAll.forEach(function (e) {
                                            if (e.dataset.addedFilterBar == selectedFilterId) {
                                                e.remove();
                                            }
                                        });
                                    }
                                });
                            }
                            isSelected.classList.remove('check-filter-selected');
                       }                  
                    } else if (isSelected && isCheckSquare == null && isSquareO !== null && isCheckCircle == null && isCheckO == null) {
                        var filterElement = clicked.parentNode;
                        var isFilterElementFilterId = filterElement.dataset.filterId;
                        if (isFilterElementFilterId == 'pmid') {
                            var isFilterElementValue = filterElement.dataset.selectedFilter;
                            var isSquareOParent = isSquareO.parentNode;
    
                            var selectedFilterId = '';
                            var isparentSelector = document.querySelectorAll('.filter-refinement-container');
                            if (isparentSelector) {
                                isparentSelector.forEach(function (el, index) {
                                    if (el.hasChildNodes()) {
                                        var isPriceFilter = el.dataset.filterId;
                                        if (isPriceFilter == 'pmid') {
                                            var childElement = el.querySelectorAll('.filter-element');
                                        
                                            childElement.forEach(function (e, i) {
                                                var isPriceFilterSelected = e.querySelector('.check-filter-selected');
                                                
                                                if (isPriceFilterSelected) {
                                                    if (isPriceFilterSelected.classList.contains('check-filter-selected')) {
                                                        selectedFilterId = e.dataset.selectedFilter;
                                                        isPriceFilterSelected.classList.remove('check-filter-selected');
    
                                                        if (isPriceFilterSelected.hasChildNodes()) {
                                                            var pmidFilterChildEl = isPriceFilterSelected.querySelector('.fa-check-square');
                                                            
                                                            if (pmidFilterChildEl) {
                                                                pmidFilterChildEl.classList.remove('fa-check-square', 'check-square');
                                                                pmidFilterChildEl.classList.add('fa-square-o', 'square-o');
                                                            }
                                                        }
                                                        
                                                    }
                                                }
                                            });
                                        }
                                    };
                                });
                            }
                            
                            var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');
                            if (slectedFilterBarAll.length > 0) {
                                slectedFilterBarAll.forEach(function (el) {
                                    if (el.hasChildNodes()) {
                                        var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                        addedFilterBarAll.forEach(function (e) {
                                            if (e.dataset.addedFilterBar == selectedFilterId) {
                                                e.remove();
                                            }
                                        });
                                    }
                                });
                            }
    
                            isSquareOParent.classList.add('check-filter-selected');
                            isSquareO.classList.remove('square-o');
                            isSquareO.classList.remove('fa-square-o');
                            isSquareO.classList.add('fa-check-square');
                            isSquareO.classList.add('check-square');
                            var html = `<li class="filter-value added-filter-bar" data-filter-id="${filterBarId}" data-added-filter-bar="${isFilterElementValue}">
                                            <a href="">${filterBarValue}</a>
                                        </li>`;
                            filterBar.forEach(function (e) {
                                e.insertAdjacentHTML('beforeend', html);    
                            });
                        } else {
                            var isFilterElementValue = filterElement.dataset.selectedFilter;
                            var isSquareOParent = isSquareO.parentNode;
    
                            isSquareOParent.classList.add('check-filter-selected');
                            isSquareO.classList.remove('square-o');
                            isSquareO.classList.remove('fa-square-o');
                            isSquareO.classList.add('fa-check-square');
                            isSquareO.classList.add('check-square');
                            var html = `<li class="filter-value added-filter-bar" data-filter-id="${filterBarId}" data-added-filter-bar="${isFilterElementValue}">
                                            <a href="">${filterBarValue}</a>
                                        </li>`;
                            filterBar.forEach(function (e) {
                                e.insertAdjacentHTML('beforeend', html);    
                            });
                        }

                    } else if (isSelected && isSquareO == null && isCheckSquare !== null && isCheckCircle == null && isCheckO == null) {
                        var filterElementLabelParent = clicked.parentNode;
                        var selectedFilterId  = filterElementLabelParent.dataset.selectedFilter
                        var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');

                        if (slectedFilterBarAll.length > 0) {
                            slectedFilterBarAll.forEach(function (el) {
                                if (el.hasChildNodes()) {
                                    var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                    addedFilterBarAll.forEach(function (e) {
                                        if (e.dataset.addedFilterBar == selectedFilterId) {
                                            e.remove();
                                        }
                                    });
                                }
                            });
                        }

                        var isCheckSquaretParent = isCheckSquare.parentNode;
                        isCheckSquaretParent.classList.remove('check-filter-selected');
                        isCheckSquare.classList.remove('fa-check-square');
                        isCheckSquare.classList.remove('check-square');
                        isCheckSquare.classList.add('square-o');
                        isCheckSquare.classList.add('fa-square-o');
                    } else if (isSelected && isSquareO == null && isCheckSquare == null && isCheckCircle == null && isCheckO !== null) {
                        var selectedFilterId = '';
                        var isparentSelector = document.querySelectorAll('.filter-refinement-container');
                        if (isparentSelector) {
                            isparentSelector.forEach(function (el, index) {
                            if (el.hasChildNodes()) {
                                var isPriceFilter = el.dataset.filterId;
                                if (isPriceFilter == 'price') {
                                    var childElement = el.querySelectorAll('.filter-element');
                                
                                    childElement.forEach(function (e, i) {
                                        var isPriceFilterSelected = e.querySelector('.check-filter-selected');
                                        
                                        if (isPriceFilterSelected) {
                                            if (isPriceFilterSelected.classList.contains('check-filter-selected')) {
                                                selectedFilterId = isPriceFilterSelected.dataset.selectedFilter;
                                                isPriceFilterSelected.classList.remove('check-filter-selected');

                                                if (isPriceFilterSelected.hasChildNodes()) {
                                                    var priceFilterChildEl = isPriceFilterSelected.querySelector('.fa-check-circle');
                                                    
                                                    if (priceFilterChildEl) {
                                                        priceFilterChildEl.classList.remove('fa-check-circle', 'check-circle');
                                                        priceFilterChildEl.classList.add('check-o', 'fa-circle-o');
                                                    }
                                                }
                                                
                                            }
                                        }
                                    });
                                }
                            };
                        });
                    }
                                    
                    var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');
                    if (slectedFilterBarAll.length > 0) {
                        slectedFilterBarAll.forEach(function (el) {
                            if (el.hasChildNodes()) {
                                var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                addedFilterBarAll.forEach(function (e) {
                                    if (e.dataset.addedFilterBar == selectedFilterId) {
                                        e.remove();
                                    }
                                });
                            }
                        });
                    }      

                    var isCheckOParent = isCheckO.parentNode;
                    isCheckOParent.classList.add('check-filter-selected');
                    isCheckO.classList.remove('check-o', 'fa-circle-o');
                    isCheckO.classList.add('fa-check-circle', 'check-circle');
                    var html = `<li class="filter-value added-filter-bar" data-filter-id="${filterBarId}" data-added-filter-bar="${filterBarValue}">
                                        <a href="">${filterBarValue}</a>
                                    </li>`;
                    filterBar.forEach(function (e) {
                        e.insertAdjacentHTML('beforeend', html);    
                    });
                }
            }
        });
    },

    // trigger desktop filter on overlay click
    triggerapplyFilter: function () {
        $('.plp-grid-overlay').click(
            function (e) {
            $(this).trigger('search:applyFilter');
        });
    },
    // Custom end: Desktop filters

    //Custom Start: Mobile filters
    // mobile filters multi selection
    applyFilterSelectMobile: function () {
        // Handle refinement value selection and reset click
        $('.mobile-menu-container-main, .mobile-sort-menu-container').on(
            'click',
            '.filter-refinement-container',
            function (e) {
                e.preventDefault();
                e.stopPropagation();
                filterLoadInProgress = true;
                // Get currently selected sort option to retain sorting rules
                var clicked = e.target.closest('.filter-elements');
                var filterBar = document.querySelectorAll('.selected-filter-bar');

                if (!clicked) return;
                if (clicked) {
                    var isSelected = clicked.querySelector('.selected');
                    var filterBarValue = clicked.dataset.selectedFilter;
                    var filterBarId = clicked.dataset.filterId;
                    var isCheckSquare = clicked.querySelector('.check-square');
                    var isSquareO = clicked.querySelector('.square-o');
                    var isCheckCircle = clicked.querySelector('.check-circle');
                    var isCheckO = clicked.querySelector('.check-o');
                    if (isSelected && isCheckSquare == null && isSquareO == null && isCheckCircle == null && isCheckO == null) {
                        var containClass = isSelected.classList.toggle('filter-selected');
                        if (containClass) {
                            isSelected.classList.add('check-filter-selected');
                            var html = `<li class="filter-value added-filter-bar" data-filter-id="${filterBarId}" data-added-filter-bar="${filterBarValue}">
                                            <a href="">${filterBarValue}</a>
                                        </li>`;
                            filterBar.forEach(function (e) {
                                e.insertAdjacentHTML('beforeend', html);    
                            });
                       } else {
                            var selectedFilterId = isSelected.dataset.selectedFilter;
                            var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');

                            if (slectedFilterBarAll.length > 0) {
                                slectedFilterBarAll.forEach(function (el) {
                                    if (el.hasChildNodes()) {
                                        var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                        addedFilterBarAll.forEach(function (e) {
                                            if (e.dataset.addedFilterBar == selectedFilterId) {
                                                e.remove();
                                            }
                                        });
                                    }
                                });
                            }
                            isSelected.classList.remove('check-filter-selected');
                       }                  
                    } else if (isSelected && isCheckSquare == null && isSquareO !== null && isCheckCircle == null && isCheckO == null) {
                        var isFiltersCheckBox = clicked.querySelector('.filters-checkbox');
                        var filterElement = clicked.parentNode;
                        var isFilterElementFilterId = filterElement.dataset.filterId;
                        if (isFilterElementFilterId == 'pmid') {
                            if (isFiltersCheckBox) {
                                var filterElementLabel = filterElement.querySelector('.filter-elements');
                                filterElementLabel.classList.add('label-selected');
                            } 
                            var isFilterElementValue = filterElement.dataset.selectedFilter;
                            var isSquareOParent = isSquareO.parentNode;
    
                            var selectedFilterId = '';
                            var isparentSelector = document.querySelectorAll('.filter-refinement-container');
                            if (isparentSelector) {
                                isparentSelector.forEach(function (el, index) {
                                    if (el.hasChildNodes()) {
                                        var isPriceFilter = el.dataset.filterId;
                                        if (isPriceFilter == 'pmid') {
                                            var childElement = el.querySelectorAll('.filter-element');
                                        
                                            childElement.forEach(function (e, i) {
                                                var isPriceFilterSelected = e.querySelector('.check-filter-selected');
                                                
                                                if (isPriceFilterSelected) {
                                                    var isSelectLabelParent = isPriceFilterSelected.parentNode;
                                                    if (isSelectLabelParent.classList.contains('label-selected')) {
                                                        isSelectLabelParent.classList.remove('label-selected');
                                                    }
                                                    if (isPriceFilterSelected.classList.contains('check-filter-selected')) {
                                                        selectedFilterId = e.dataset.selectedFilter;
                                                        isPriceFilterSelected.classList.remove('check-filter-selected');
    
                                                        if (isPriceFilterSelected.hasChildNodes()) {
                                                            var pmidFilterChildEl = isPriceFilterSelected.querySelector('.fa-check-square');
                                                            
                                                            if (pmidFilterChildEl) {
                                                                pmidFilterChildEl.classList.remove('fa-check-square', 'check-square');
                                                                pmidFilterChildEl.classList.add('fa-square-o', 'square-o');
                                                            }
                                                        }
                                                        
                                                    }
                                                }
                                            });
                                        }
                                    };
                                });
                            }
                            var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');
                            if (slectedFilterBarAll.length > 0) {
                                slectedFilterBarAll.forEach(function (el) {
                                    if (el.hasChildNodes()) {
                                        var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                        addedFilterBarAll.forEach(function (e) {
                                            if (e.dataset.addedFilterBar == selectedFilterId) {
                                                e.remove();
                                            }
                                        });
                                    }
                                });
                            }
    
                            isSquareOParent.classList.add('check-filter-selected');
                            isSquareO.classList.remove('square-o');
                            isSquareO.classList.remove('fa-square-o');
                            isSquareO.classList.add('fa-check-square');
                            isSquareO.classList.add('check-square');
                            var html = `<li class="filter-value added-filter-bar" data-filter-id="${filterBarId}" data-added-filter-bar="${isFilterElementValue}">
                                            <a href="">${filterBarValue}</a>
                                        </li>`;
                            filterBar.forEach(function (e) {
                                e.insertAdjacentHTML('beforeend', html);    
                            });
                        } else {
                            if (isFiltersCheckBox) {
                                var filterElementLabel = filterElement.querySelector('.filter-elements');
                                filterElementLabel.classList.add('label-selected');
                            } 
                            var isFilterElementValue = filterElement.dataset.selectedFilter;
                            var isSquareOParent = isSquareO.parentNode;
    
                            isSquareOParent.classList.add('check-filter-selected');
                            isSquareO.classList.remove('square-o');
                            isSquareO.classList.remove('fa-square-o');
                            isSquareO.classList.add('fa-check-square');
                            isSquareO.classList.add('check-square');
                            var html = `<li class="filter-value added-filter-bar" data-filter-id="${filterBarId}" data-added-filter-bar="${isFilterElementValue}">
                                            <a href="">${filterBarValue}</a>
                                        </li>`;
                            filterBar.forEach(function (e) {
                                e.insertAdjacentHTML('beforeend', html);    
                            });
                        }

                    } else if (isSelected && isSquareO == null && isCheckSquare !== null && isCheckCircle == null && isCheckO == null) {
                        var filterElementLabelParent = clicked.parentNode;
                        var selectedFilterId  = filterElementLabelParent.dataset.selectedFilter
                        var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');

                        if (slectedFilterBarAll.length > 0) {
                            slectedFilterBarAll.forEach(function (el) {
                                if (el.hasChildNodes()) {
                                    var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                    addedFilterBarAll.forEach(function (e) {
                                        if (e.dataset.addedFilterBar == selectedFilterId) {
                                            e.remove();
                                        }
                                    });
                                }
                            });
                        }

                        var isCheckSquaretParent = isCheckSquare.parentNode;
                        var filterElementLabelRemove = filterElementLabelParent.querySelector('.filter-elements');
                        if (filterElementLabelRemove.classList.contains('label-selected')) {
                            filterElementLabelRemove.classList.remove('label-selected');
                        }
                        isCheckSquaretParent.classList.remove('check-filter-selected');
                        isCheckSquare.classList.remove('fa-check-square');
                        isCheckSquare.classList.remove('check-square');
                        isCheckSquare.classList.add('square-o');
                        isCheckSquare.classList.add('fa-square-o');
                    } 
                    else if (isSelected && isSquareO == null && isCheckSquare == null && isCheckCircle == null && isCheckO !== null) {
                        var selectedFilterId = '';
                        var isparentSelector = document.querySelectorAll('.filter-refinement-container');
                        if (isparentSelector) {
                            isparentSelector.forEach(function (el, index) {
                            if (el.hasChildNodes()) {
                                var isPriceFilter = el.dataset.filterId;
                                if (isPriceFilter == 'price') {
                                    var childElement = el.querySelectorAll('.filter-element');
                                
                                    childElement.forEach(function (e, i) {
                                        var isPriceFilterSelected = e.querySelector('.check-filter-selected');
                                        
                                        if (isPriceFilterSelected) {
                                            if (isPriceFilterSelected.classList.contains('check-filter-selected')) {
                                                selectedFilterId = isPriceFilterSelected.dataset.selectedFilter;
                                                isPriceFilterSelected.classList.remove('check-filter-selected');

                                                if (isPriceFilterSelected.hasChildNodes()) {
                                                    var priceFilterChildEl = isPriceFilterSelected.querySelector('.fa-check-circle');
                                                    
                                                    if (priceFilterChildEl) {
                                                        priceFilterChildEl.classList.remove('fa-check-circle', 'check-circle');
                                                        priceFilterChildEl.classList.add('check-o', 'fa-circle-o');
                                                    }
                                                }
                                                
                                            }
                                        }
                                    });
                                }
                            };
                        });
                    }
                                    
                    var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');
                    if (slectedFilterBarAll.length > 0) {
                        slectedFilterBarAll.forEach(function (el) {
                            if (el.hasChildNodes()) {
                                var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                addedFilterBarAll.forEach(function (e) {
                                    if (e.dataset.addedFilterBar == selectedFilterId) {
                                        e.remove();
                                    }
                                });
                            }
                        });
                    }      

                    var isCheckOParent = isCheckO.parentNode;
                    isCheckOParent.classList.add('check-filter-selected');
                    isCheckO.classList.remove('check-o', 'fa-circle-o');
                    isCheckO.classList.add('fa-check-circle', 'check-circle');
                    var html = `<li class="filter-value added-filter-bar" data-filter-id="${filterBarId}" data-added-filter-bar="${filterBarValue}">
                                    <a href="">${filterBarValue}</a>
                                </li>`;
                    filterBar.forEach(function (e) {
                        e.insertAdjacentHTML('beforeend', html);    
                    });


                }
                checkClearAllBtn();
            }

        });
    },

    // making urls for prefn1,pmid,pmin,pmax,srule and based on url getting the data
    applyFilterMobile: function () {
            $('.mobile-menu-container-main, .mobile-sort-menu-container').on(
                'click',
                '.mobile-menu-close-filters', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var isSelectedFilterBar = document.querySelector('.filter-bar-list > .selected-filter-bar');
            
            if (isSelectedFilterBar) {

                var isFilterChildList = isSelectedFilterBar.children.length > 0;
                if (!isFilterChildList) {
                    $('.filter-group').removeClass('active loaded');
                    $('.plp-active-filter').removeClass('loaded');
                    $('.plp-active-filter-selected').addClass('d-none');
                    $('.plp-filter-bar .plp-filter-btn').removeClass('active');
                    $('.plp-grid-overlay').removeClass('active');
                    $('.mobile-filter-redesign').removeClass('active-filter-closed-mobile');
                    var mobileSortMenu = document.querySelector('.mobile-sort-menu-container');
                    var mobileMenuContainerMain = document.querySelector('.mobile-menu-container-main');
                    var isSortActive = mobileSortMenu.classList.contains('active');
                    var isMobileActive = mobileMenuContainerMain.classList.contains('active');
                    if (isSortActive) {
                        $('.mobile-sort-menu').removeClass('active');
                        $('body').removeClass('lock-bg');
                    } 
                    if (isMobileActive) {
                        mobileMenuContainerMain.classList.remove('active');
                    }
                    var RemoveUrlParams = getUrlParamObj(document.location.href);
                    var oldUrl = document.location.href;
                    var url = oldUrl.split('?')[0];
                    var urlReload = oldUrl.split('?')[1];
                    var newFilteredUrl = url;

                    if (RemoveUrlParams.hasOwnProperty('q') == true) {
                        if (RemoveUrlParams.hasOwnProperty('q') == true && RemoveUrlParams.hasOwnProperty('srule') == false) {
                            if (RemoveUrlParams.q) {
                                var queryParamQ = RemoveUrlParams.q;
                                newFilteredUrl = removeUrlParamsQ(newFilteredUrl, 'q', queryParamQ);
                            }
                        }
                        if (RemoveUrlParams.hasOwnProperty('q') == true && RemoveUrlParams.hasOwnProperty('srule') == true) {
                            if (RemoveUrlParams.q) {
                                var queryParamQ = RemoveUrlParams.q;  
                                var queryParamSrule = RemoveUrlParams.srule;  
                                newFilteredUrl = removeUrlParamsQSrule(newFilteredUrl, 'q', queryParamQ, 'srule', queryParamSrule);
                            }
                        }
                    } else {
                        if (RemoveUrlParams.hasOwnProperty('srule') == true) {
                            if (RemoveUrlParams.srule) {
                                var queryParamSrule = RemoveUrlParams.srule;  
                                newFilteredUrl = removeUrlParamsSrule(newFilteredUrl, 'srule', queryParamSrule);
                            }
                        }
                    }
                    window.history.pushState({}, '', newFilteredUrl);

                    if (urlReload) {
                        window.location.reload();
                    }
                    return;
                } else {
                    filterLoadInProgress = true;
                    var selectedFiltersAll;
                    var mobileSortMenu = document.querySelector('.mobile-sort-menu-container');
                    var isActive = mobileSortMenu.classList.contains('active');
                    if (isActive) {
                        selectedFiltersAll = mobileSortMenu.querySelectorAll('.filter-refinement-container');
                    } else {
                        var mobileMenuContainerMain  = document.querySelector('.mobile-menu-container-main');
                        selectedFiltersAll = mobileMenuContainerMain.querySelectorAll('.filter-refinement-container');
                    }

                    if (selectedFiltersAll) {
                        var prefv = '';
                        var indexValue = 1;
                        var params = '';
                        var pminValue = '';
                        var pmaxValue = '';
    
                        selectedFiltersAll.forEach(function (el, index) {
                                if (el.hasChildNodes()) {
                                    var prefn = el.dataset.filterId;
                                    var childElement = el.querySelectorAll('.filter-element');
                                    
                                    childElement.forEach(function (e, i) {
                                        var hasFilerSelected = e.querySelector('.check-filter-selected');
    
                                        if (hasFilerSelected) {
                                            if (prefv.indexOf('%7C') == -1) {
                                                prefv +='%7C';
                                            }
                                            if (e.dataset.filterId == 'price') {
                                                pminValue += e.dataset.valuePmin;
                                                pmaxValue += e.dataset.valuePmax;
                                            } else {
                                                prefv += e.dataset.selectedFilter;
                                            }
                                            if (prefv.indexOf('%7C') !== -1) {
                                                prefv +='%7C';
                                            } 
                                        }
                                    });
                                    if (prefv) {
                                        if (params.indexOf('?') == -1) {
                                            params += '?';
                                        } else {
                                            params +='&';
                                        }
                                        prefv = prefv.slice(3, -3);
                                        if(prefn == "pmid"){
                                            params += `pmid=${prefv}`;
                                            indexValue--;
                                        } else if (prefn == 'price') {
                                            // ?pmin=500.00&pmax=1000.00
                                            if (pminValue !== '' && pmaxValue !== '') {
                                                params += `pmin=${pminValue}&pmax=${pmaxValue}`;
                                                indexValue--;
                                            }
                                        }else{
                                            params += `prefn${indexValue}=${prefn}&prefv${indexValue}=${prefv}`;
                                        }
                                        indexValue++;
                                    }
                                    
                                };
                            prefv = '';
                        });
       
                        var urlparams = getUrlParamObj(document.location.href);
                        var filtersURL = params;    
                        var currentSelectedSortId = '';
    
                        if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == false) {
                            if (urlparams.srule) {
                                currentSelectedSortId = urlparams.srule;
                                filtersURL = replaceUrlParamSrule(filtersURL, 'srule', currentSelectedSortId);
                                
                            }
                        }
                        if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == true) {
                            if (urlparams.q && urlparams.srule) {
                                var paramSrule = urlparams.srule;
                                var paramSearchQuery = urlparams.q;
                                filtersURL = replaceUrlParamSruleQ(filtersURL, 'srule', paramSrule, 'q', paramSearchQuery);
                            }
                        }
                        if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('srule') == true && urlparams.hasOwnProperty('q') == false) {
                            if (urlparams.pmid && urlparams.srule) {
                                var paramSrule = urlparams.srule;
                                var paramPmid = urlparams.pmid;
                                filtersURL = replaceUrlParamPmidSrule(filtersURL, 'pmid', paramPmid, 'srule', paramSrule);
                            }
                        }
    
                        if (urlparams.hasOwnProperty('pmid') == false && urlparams.hasOwnProperty('srule') == false && urlparams.hasOwnProperty('q') == true) {
                            if (urlparams.q) {
                                var paramSearchQuery = urlparams.q;
                                filtersURL = replaceUrlParamSearchQuery(filtersURL, 'q', paramSearchQuery);
                            }
                        }
    
                        if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('q') == true && urlparams.hasOwnProperty('srule') == false) {
                            if (urlparams.q) {
                                var paramSearchQuery = urlparams.q;
                                var paramPmid = urlparams.pmid;
                                filtersURL = replaceUrlParamSearchQueryPmid(filtersURL, 'q', paramSearchQuery, 'pmid', paramPmid);
                            }
                        }
    
                        if (urlparams.hasOwnProperty('pmid') == true && urlparams.hasOwnProperty('q') == true && urlparams.hasOwnProperty('srule') == true) {
                            if (urlparams.q) {
                                var paramSearchQuery = urlparams.q;
                                var paramPmid = urlparams.pmid;
                                var paramSrule = urlparams.srule;
                                filtersURL = replaceUrlParamSearchQueryPmidSrule(filtersURL, 'q', paramSearchQuery, 'pmid', paramPmid, 'srule', paramSrule);
                            }
                        }

                        var baseUrl = document.location.href;
                        if (baseUrl.indexOf('?') !== -1) {
                            baseUrl = baseUrl.split('?')[0];
                        }
                        filtersURL = baseUrl + filtersURL;
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
                                var params = '';
                                var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                                $('body').trigger('facet:success', [gtmFacetArray]);
                                parseResults(response);
                                updatePageURLForFacets(filtersURL);
                                $.spinner().stop();
                                moveFocusToTop();
                                swatches.showSwatchImages();
                                $('.mvmt-plp .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                                $('.mobile-filter-menu').removeClass('active').addClass('disable-events');
                                $('body').removeClass('lock-bg');
                                $('.mvmt-plp .grid-header .sort-col').remove();
                                $('.mvmt-plp .grid-header .filter-col').remove();
                                $('.mobile-filter-redesign').removeClass('active-filter-closed-mobile');
                                if (isActive) {
                                    $('.mobile-sort-menu').removeClass('active');
                                    $('body').removeClass('lock-bg');
                                }
                                checkClearAllBtn();
                                if (isInfiniteScrollEnabled && (isPaginationEnabled == false)) {
                                    loadMoreIndex = $('#product-search-results .product-tile').length - (parseInt(initiallyLoadedProducts / 2) + 1);
                                }
                                bulidLifeStyleCarousel();
                                filterScroll();
                            },
                            error: function () {
                                $.spinner().stop();
                            }
                        });
                    }                    
                }

            }
        });
    },

    // trigger mobile filter on close 'x' btn click
    triggerapplyFilterMobile: function () {
        $('.mobile-menu-container-main, .mobile-sort-menu-container').on(
            'click',
            '.mobile-menu-close', function(e) {
                e.preventDefault();
                e.stopPropagation();
            $(this).trigger('search:applyFilterMobile');
        });
    },

    // clear all selected fitlers for mobile
    applyFilterMobileClear: function () {
        $('.mobile-menu-container-main, .mobile-sort-menu-container').on(
            'click',
            '.mobile-filters-clear', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var selectedFiltersBar = document.querySelectorAll('.selected-filter-bar');
                var filterRefinementContainerAll = document.querySelectorAll('.filter-refinement-container');

                filterRefinementContainerAll.forEach(function (element) {
                    var isContainChildList = element.querySelectorAll('.filter-element');

                    isContainChildList.forEach(function (el) {
                        var isCheckFilterSelected = el.querySelector('.check-filter-selected');

                        if (isCheckFilterSelected) {
                            var isCheckFilterSelectedContain = isCheckFilterSelected.classList.contains('filter-selected');
                            var isCheckSquareEl = isCheckFilterSelected.querySelector('.check-square');
                            var isCheckCircleEl = isCheckFilterSelected.querySelector('.check-circle');
                    
                            if (isCheckFilterSelectedContain) {
                                isCheckFilterSelected.classList.remove('filter-selected');
                                isCheckFilterSelected.classList.remove('check-filter-selected');
                            } else if (isCheckSquareEl) {
                                isCheckSquareEl.classList.remove('fa-check-square', 'check-square');
                                isCheckSquareEl.classList.add('fa-square-o', 'square-o');
                                isCheckFilterSelected.classList.remove('check-filter-selected')
                                var isSelectLabel = isCheckFilterSelected.parentNode;
                                if (isSelectLabel.classList.contains('label-selected')) {
                                    isSelectLabel.classList.remove('label-selected');
                                }
                            } else if (isCheckCircleEl) {
                                isCheckCircleEl.classList.remove('fa-check-circle', 'check-circle');
                                isCheckCircleEl.classList.add('fa-circle-o', 'check-o');
                                isCheckFilterSelected.classList.remove('check-filter-selected')
                            }
                        }
                    });
                    
                });
                selectedFiltersBar.forEach(function (el) {
                    var isCheckSelectedFiltersChild  = el.children.length > 0;
                     if (isCheckSelectedFiltersChild) {
                         el.innerHTML = '';
                     }
                 });
                checkClearAllBtn();

                var oldUrl = document.location.href;
                var url = oldUrl.split('?')[0];
                window.history.pushState({}, '/', url);
        });
    },
    // check clear all button is disabled or not based on window load
    applyFilterMobileClearBtnCheck: function () {
        window.onload = () => {
            checkClearAllBtn();
          };
    },
    //Custom End
    
    // Custom filters: this method will work for desktop and mobile filters
    removedSelectedFilters: function () {
    //     $('.selected-filter-bar').click(
        $('.mobile-filter-redesign, .plp-active-filter, .plp-active-filter-list').on(
            'click',
            '.selected-filter-bar',
            function (e) {
            e.preventDefault();
            var clickedFilterBarClose = e.target.closest('.added-filter-bar');
            if (!clickedFilterBarClose) return;
            if (clickedFilterBarClose) {
                var currentValue = clickedFilterBarClose.dataset.addedFilterBar;

                var filterRefinementContainerAll = document.querySelectorAll('.filter-refinement-container');

                filterRefinementContainerAll.forEach(function (el) {
                    if (el.hasChildNodes()) {
                        var childElementAll = el.querySelectorAll('.filter-element');
                        childElementAll.forEach(function (e) {
                            if (e.dataset.selectedFilter == currentValue) {
                                var isFilterSelected = e.querySelector('.check-filter-selected');
                                if (isFilterSelected) {
                                    var isCheckBox = isFilterSelected.querySelector('.check-square');
                                    var isPriceRadioBtn = isFilterSelected.querySelector('.check-circle');

                                    if (isCheckBox && isPriceRadioBtn == null) {
                                        var filterElementLabelSelected = e.querySelector('.filter-elements');
                                        if (filterElementLabelSelected) {
                                            if (filterElementLabelSelected.classList.contains('label-selected')) {
                                                filterElementLabelSelected.classList.remove('label-selected');
                                            }
                                        }
                                        isFilterSelected.classList.remove('check-filter-selected');
                                        isCheckBox.classList.remove('fa-check-square', 'check-square');
                                        isCheckBox.classList.add('square-o', 'fa-square-o');

                                        var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');

                                        if (slectedFilterBarAll.length > 0) {
                                            slectedFilterBarAll.forEach(function (el) {
                                                if (el.hasChildNodes()) {
                                                    var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                                    addedFilterBarAll.forEach(function (e) {
                                                        if (e.dataset.addedFilterBar == currentValue) {
                                                            e.remove();
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                        
                                    } else if (isPriceRadioBtn && isCheckBox == null) {
                                        isFilterSelected.classList.remove('check-filter-selected');
                                        isPriceRadioBtn.classList.remove('fa-check-circle', 'check-circle');
                                        isPriceRadioBtn.classList.add('fa-circle-o', 'check-o');
                                        var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');

                                        if (slectedFilterBarAll.length > 0) {
                                            slectedFilterBarAll.forEach(function (el) {
                                                if (el.hasChildNodes()) {
                                                    var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                                    addedFilterBarAll.forEach(function (e) {
                                                        if (e.dataset.addedFilterBar == currentValue) {
                                                            e.remove();
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    } else {
                                        isFilterSelected.classList.remove('check-filter-selected', 'filter-selected');
                                        var slectedFilterBarAll = document.querySelectorAll('.selected-filter-bar');

                                        if (slectedFilterBarAll.length > 0) {
                                            slectedFilterBarAll.forEach(function (el) {
                                                if (el.hasChildNodes()) {
                                                    var addedFilterBarAll = el.querySelectorAll('.added-filter-bar');
                                                    addedFilterBarAll.forEach(function (e) {
                                                        if (e.dataset.addedFilterBar == currentValue) {
                                                            e.remove();
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        });
                    }
                });

                var addedFilterBarCheck = document.querySelector('.selected-filter-bar');
                var addedFilterBarCheckLength = addedFilterBarCheck.children.length > 0;
                if (!addedFilterBarCheckLength) {
                    var mobileFiltersClearBtn = document.querySelectorAll('.mobile-filters-clear');
                    if (mobileFiltersClearBtn) {
                        mobileFiltersClearBtn.forEach(function (e) {
                            var isContainDisbaled = e.classList.contains('disabled');
                            if (!isContainDisbaled) {
                                e.classList.add('disabled');
                            }
                        })
                    }
                }

                var mobileActiveFilterClosed = document.querySelector('.active-filter-closed-mobile');
                var desktopActiveFilterClosed = document.querySelector('.active-filter-closed-desktop');
                if (!desktopActiveFilterClosed && mobileActiveFilterClosed) {
                    removeSelectedFilterDesktop($(this));
                } else if (desktopActiveFilterClosed && !mobileActiveFilterClosed) {
                    removeSelectedFilterMobile($(this));
                } else if (!desktopActiveFilterClosed && !mobileActiveFilterClosed) {
                    var mediumWidth = 992;
                    var $windowWidth = $(window).width();
                    if ($windowWidth >= mediumWidth) {
                        removeSelectedFilterDesktop($(this));
                    } else {
                        removeSelectedFilterMobile($(this));
                    }
                }
            }
        });
    },
    // Custom end: this method will work for desktop and mobile filters

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
        $(document).on("click", '.plp-filter-bar .plp-filter-btn', function (e) {
            var button = this
            $(button).next().toggleClass('active');
            $(button).toggleClass('active');
            setTimeout(function () {
                $(button).next().toggleClass('loaded');
            }, 300);

            if ($(button).hasClass('active')) {
                $('.plp-grid-overlay').addClass('active');

            } else {
                $('.plp-grid-overlay').removeClass('active');
            }

            setTimeout(function () {
                $(button).next().children('.plp-active-filter').toggleClass('loaded');
            }, 500);

            $(".plp-filter-bar .plp-filter-btn").not($(this)).removeClass('active');
            $(".filter-group").not($(this).next()).removeClass('active loaded');
            $(".plp-active-filter").not($(this).next().children('.plp-active-filter')).removeClass('loaded');
            $(button).hasClass('active') ? $('.plp-active-filter-selected').removeClass('d-none') : $('.plp-active-filter-selected').addClass('d-none');
            var isFilterContains = $(".plp-filter-redesign").hasClass('active-filter-closed-desktop');
            var isActiveFilterMobile= $(".mobile-filter-redesign").hasClass('active-filter-closed-mobile');
            if (!isActiveFilterMobile) {
                $(".mobile-filter-redesign").addClass('active-filter-closed-mobile');
            }
            if (!isFilterContains) {
                $(".plp-filter-redesign").addClass('active-filter-closed-desktop');
            }
        });

        $(document).on('click', '.filter-close-btn', function (e) {
            $(".filter-group").removeClass('active loaded');
            $(".plp-active-filter").removeClass('loaded');
            $(".plp-filter-bar .plp-filter-btn").removeClass('active');
            $('.plp-grid-overlay').removeClass('active');
        });

        $(window).scroll(function () {
            var scroll = $(window).scrollTop();

            if (scroll >= 300) {
                $('.scroll-top').addClass('active');
            } else {
                $('.scroll-top').removeClass('active');
            }
        });

        $('.scroll-top').click(function () {
            $('html, body').animate({ scrollTop: 0 }, 1000);
            return false;
        });

        // Show hide popover

        $(document).on('click', '.sort-dropdown', function (e) {
            e.preventDefault();
            $(this).find('.sort-dropdown-toggle').toggleClass('active');
            $(this).find('.dropdown-menu').slideToggle('fast');
        });
    },

    stickyFilterBar: function () {
        $(window).scroll(function (event) {
            var $headerSize = $('.header-menu-wrapper').height();
            var $headerBannerSize = $('.hero').height();
            var $totalHeaderSize = $headerBannerSize - 50;
            $totalHeaderSize += $('.top-refinements').outerHeight() || 0;
            if ($(this).scrollTop() > $totalHeaderSize && $(this).scrollTop() > 0) {
                $headerSize = parseInt($headerSize) === 0 ? $('.sticky-header-wrapper').height() - 2 : $headerSize - 2;
                $('.plp-filter-bar').addClass('sticky');
                $('.plp-filter-bar').css('top', $headerSize);
                $('.mvmt-redesign-filter-bar,.mobile-filter-redesign .plp-active-filters-redesign').addClass('mobile-sticky');
                $('.mvmt-redesign-filter-bar').css('top', $headerSize + 12);
                $('.mobile-filter-redesign .plp-active-filters-redesign').css('top', $headerSize + ($(".mvmt-redesign-filter-bar").outerHeight()));
            } else {
                $('.plp-filter-bar').removeClass('sticky');
                $('.plp-filter-bar').css('top', '');
                $('.mvmt-redesign-filter-bar,.mobile-filter-redesign .plp-active-filters-redesign').removeClass('mobile-sticky');
                $('.mvmt-redesign-filter-bar,.mobile-filter-redesign .plp-active-filters-redesign').css('top', '');
            }
        });
    },

    mobileSortFilterMenu: function () {
        $(document).on("click", '.mobile-filter-sort-redesign, .mobile-filter-btn-list button', function(e) {
            var  menu = $(this).data('menu');
            var selectors = ''+ menu +' .mobile-sort-order, '+ menu +' .mobile-filter-actions, '+ menu +' .mobile-filter-options-list, '+ menu +' .mobile-menu-close, '+ menu +' .mobile-selection.active .mobile-selection-outer';
            $(''+ menu +'').addClass('active').removeClass('disable-events');
            $('body').addClass('lock-bg');
            setTimeout(function () {
                $('' + selectors + '').addClass('loaded');
                $('' + menu + ' .mobile-selection').addClass('border-radius-transform-transition skip-animation');
            }, 300);
            var isFilterContains = $('.plp-filter-redesign').hasClass('active-filter-closed-desktop');
            var isActiveFilterMobile= $('.mobile-filter-redesign').hasClass('active-filter-closed-mobile');
            if (!isActiveFilterMobile) {
                $('.mobile-filter-redesign').addClass('active-filter-closed-mobile');
            }
            if (!isFilterContains) {
                $('.plp-filter-redesign').addClass('active-filter-closed-desktop');
            }
        });
        $(document).on("click", '.filter-open button', function(e) {
            var  menu = $(this).data('menu');
            $('body').addClass('lock-bg');
            setTimeout(function () {
                $('' + menu + ' .mobile-selection.active .mobile-active-filters, ' + menu + ' .mobile-selection.active .mobile-active-actions').addClass('skip-animation loaded');
                $('' + menu + ' .mobile-selection:not(.acitve) .mobile-active-filters, ' + menu + ' .mobile-selection:not(.acitve) .mobile-active-actions').addClass('skip-animation');
            }, 300);
        });
        // Custom start: Mobile filters popup close on x button
        $(document).on("click", '.mobile-menu-close-filters, .mobile-close-menu', function(e) {
            var isParent = $(this).closest('.mobile-menu-close');
            var  menuClose = isParent.data('close-menu');
            $(''+ menuClose +'').removeClass('active').addClass('disable-events');
            $('body').removeClass('lock-bg');

            $('.mobile-selection .mobile-active-filters, .mobile-selection .mobile-active-actions, .mobile-selection .mobile-selection-outer, .mobile-selection .mobile-menu-close').removeClass('loaded');
            $('.mobile-selection').removeClass('skip-animation');

            $('.mobile-selection .mobile-active-filters, .mobile-selection .mobile-active-actions').removeClass('skip-animation loaded');
        });
        // Custom end: Mobile filters popup close on x button
        $(document).on("click", '.mobile-selection .mobile-menu-close', function(e) {
            $('.mobile-filter-sort-redesign').addClass('filter-open');
        });

        $(document).on("click", '.mobile-filter-redesign .plp-filter-btn-redesign', function(e) {
            $(this).toggleClass('active');
            $(this).next().toggleClass('active loaded');
        });

        $(document).on("click", '.mobile-filter-options-list button, .mobile-active-filters button, .mobile-filter-btn', function (e) {

            var str = $(this).data('option-select');
            var optionMenu = str.split(" ")[0];
            $('body').addClass('lock-bg');

            $('.mobile-selection .mobile-active-filters, .mobile-selection .mobile-active-actions, .mobile-selection .mobile-selection-outer, .mobile-selection .mobile-menu-close').removeClass('loaded');
            $('.mobile-selection').removeClass('active');

            $('.mobile-selection .mobile-active-filters, .mobile-selection .mobile-active-actions').addClass('skip-animation');

            var loadClass = ''+ optionMenu +' .mobile-selection-outer, '+ optionMenu +' .mobile-selection-close';
            $(''+ optionMenu +' .mobile-menu-close').addClass('loaded');
            $(''+ optionMenu +'').addClass('active');
            $('.mobile-filter-menu').addClass('active').removeClass('disable-events');

            setTimeout(function () {
                $('' + loadClass + '').addClass('loaded');
                if (!$('.mobile-active-actions').parents('.mobile-filter-redesign').length) {
                    $('' + optionMenu + ' .mobile-active-filters, ' + optionMenu + ' .mobile-active-actions').addClass('loaded skip-animation');
                }
            }, 500);
            var isFilterContains = $('.plp-filter-redesign').hasClass('active-filter-closed-desktop');
            var isActiveFilterMobile= $('.mobile-filter-redesign').hasClass('active-filter-closed-mobile');
            if (!isActiveFilterMobile) {
                $('.mobile-filter-redesign').addClass('active-filter-closed-mobile');
            }
            if (!isFilterContains) {
                $('.plp-filter-redesign').addClass('active-filter-closed-desktop');
            }
        });
    },

    strapNavSlider: function () {
        $('.straps-guide-nav').resize();
        var svgRight = '<svg width="5px" height="8px" viewBox="0 0 9 13" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="Symbols" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><g id="Press-Slider" transform="translate(-1360.000000, -140.000000)" fill="#2B2B2B"><g id="right-arrow-white"><polygon points="1361.6855 140 1360 141.633333 1365.53808 147 1360 152.366667 1361.6855 154 1368.90909 147"></polygon></g></g></g></svg>';
        $('.straps-nav-mobile .slick-prev, .straps-nav-mobile .slick-next').text(Resources.SLICK_BUTTON_MORE);
        $('.straps-nav-mobile .slick-next').prepend(svgRight);

        $(window).on('resize', function () {
            $('.straps-nav-mobile .slick-prev, .straps-nav-mobile .slick-next').text('');

            setTimeout(function () {
                $('.straps-nav-mobile .slick-prev, .straps-nav-mobile .slick-next').text(Resources.SLICK_BUTTON_MORE);
                $('.straps-nav-mobile .slick-next').prepend(svgRight);
            }, 100);
        });
    },

    strapNavMobileSticky: function () {
        $(window).scroll(function (event) {
            var $headerSize = $('.header-menu-wrapper').height();
            var $searchBannerSize = $('.search-banner').height();
            var $totalHeaderSize = $searchBannerSize + 70;

            if ($(this).scrollTop() > $totalHeaderSize) {
                $headerSize = parseInt($headerSize) === 0 ? $('.sticky-header-wrapper').height() - 2 : $headerSize - 2;
                $('.straps-nav-mobile').addClass('sticky');
                $('.straps-nav-mobile').css('top', $headerSize + 15);
            } else {
                $('.straps-nav-mobile').removeClass('sticky');
                $('.straps-nav-mobile').css('top', '');
            }
        });
    },
    // Custom End
};
