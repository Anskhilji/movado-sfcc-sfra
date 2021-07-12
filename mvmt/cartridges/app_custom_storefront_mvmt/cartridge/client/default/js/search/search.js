'use strict';

var swatches = require('movado/utilities/swatches');
var initiallyLoadedProducts = $('.product-grid').data('initial-products');
var isInfiniteScrollEnabled = $('.mvmt-plp.container-fluid').data('infinte-scroll-enabled');
var isPaginationEnabled = $('.mvmt-plp.container-fluid').data('enable-pagination');
var loadMoreIndex = parseInt(initiallyLoadedProducts / 2) - 1;
var totalProductCount = $('.total-product-count').data('total-product-count');

var loadMoreInProcessing = false;

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
    var pattern = new RegExp('(\\?|\\&)(' + paramName + '=).*?(&|$)');
    var newUrl = url;
    if (url.search(pattern) >= 0) {
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

function bulidLifeStyleCarousel() {

    $('.product-grid .plp-image-carousel:not(.slick-initialized)').slick({
        lazyLoad: 'ondemand',
        slidesToShow: 1,
        slidesToScroll: 1,
        infinite: false,
        dots: true,
        arrows: false,
    });

    $(document).on('beforeChange', '.product-grid .plp-image-carousel', function (event, slick, currentSlide, nextSlide) {
        var nextSlide = slick.$slides.get(nextSlide);
        var $slideSourceSets = $(nextSlide).find('source');
        $($slideSourceSets).each(function () {
            $(this).attr('srcset', $(this).data('lazy'));
        });
    });
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

    applyFilter: function () {
        // Handle refinement value selection and reset click
        $('.container, .container-fluid').on(
            'click',
            '.refinements li a, .refinement-bar a.reset, .filter-value a, .swatch-filter a, .top-refinements a',
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
                        bulidLifeStyleCarousel();
                    },
                    error: function () {
                        $.spinner().stop();
                    }
                });
            });
    },
    //Custom Start: Make this fucntion for mobile filter
    applyFilterMobile: function () {
        // Handle refinement value selection and reset click
        $('.container, .container-fluid').on(
            'click',
            '.mobile-filter .mobile-selection-inner a, .mobile-active-actions .mobile-active-clear-btn',
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
                        selectedUrl: filtersURL
                    },
                    method: 'GET',
                    success: function (response) {
                        var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                        $('body').trigger('facet:success', [gtmFacetArray]);
                        parseMobileResults(response);
                        // edit start
                        updatePageURLForFacets(filtersURL);
                        // edit end
                        $.spinner().stop();
                        moveFocusToTop();
                        swatches.showSwatchImages();
                        $('.mvmt-plp .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                        $('.mobile-filter-menu').removeClass('active').addClass('disable-events');
                        $('body').removeClass('lock-bg');
                        $('.mvmt-plp .grid-header .sort-col').remove();
                        $('.mvmt-plp .grid-header .filter-col').remove()
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
            } else {
                $('.plp-filter-bar').removeClass('sticky');
                $('.plp-filter-bar').css('top', '');
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
        });
        $(document).on("click", '.filter-open button', function(e) {
            var  menu = $(this).data('menu');
            $('body').addClass('lock-bg');
            setTimeout(function () {
                $('' + menu + ' .mobile-selection.active .mobile-active-filters, ' + menu + ' .mobile-selection.active .mobile-active-actions').addClass('skip-animation loaded');
                $('' + menu + ' .mobile-selection:not(.acitve) .mobile-active-filters, ' + menu + ' .mobile-selection:not(.acitve) .mobile-active-actions').addClass('skip-animation');
            }, 300);
        });

        $(document).on("click", '.mobile-menu-close, .mobile-close-menu', function(e) {
            var  menuClose = $(this).data('close-menu');
            $(''+ menuClose +'').removeClass('active').addClass('disable-events');
            $('body').removeClass('lock-bg');

            $('.mobile-selection .mobile-active-filters, .mobile-selection .mobile-active-actions, .mobile-selection .mobile-selection-outer, .mobile-selection .mobile-menu-close').removeClass('loaded');
            $('.mobile-selection').removeClass('skip-animation');

            $('.mobile-selection .mobile-active-filters, .mobile-selection .mobile-active-actions').removeClass('skip-animation loaded');
        });

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
                $('' + optionMenu + ' .mobile-active-filters, ' + optionMenu + ' .mobile-active-actions').addClass('loaded skip-animation');
            }, 500);
        });
    },

    swatchesSlider: function () {
        $('.product-tile-redesign .swatches').slick({
            slidesToShow: 5,
            slidesToScroll: 1,
            infinite: true,
            dots: false,
            arrows: true,
            responsive: [
                {
                    breakpoint: 544,
                    settings: {
                        slidesToShow: 3,
                    }
                },
            ]
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
                $('.straps-nav-mobile').css('top', $headerSize + 17);
            } else {
                $('.straps-nav-mobile').removeClass('sticky');
                $('.straps-nav-mobile').css('top', '');
            }
        });
    },
    // Custom End
};
