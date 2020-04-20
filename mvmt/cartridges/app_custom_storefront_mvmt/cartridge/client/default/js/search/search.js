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
    var topScrollHeight = $('.tab-content').offset().top - $('header').outerHeight();
    $('html, body').animate({
        scrollTop: topScrollHeight
    }, 500);
}

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
            var url = this.value;
            e.preventDefault();

            $.spinner().start();
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

        // Handle sort order menu selection
        $(document).on('click', '.mobile-sort-order a', function (e) {
            var url = this.value;
            e.preventDefault();

            $.spinner().start();
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
            '.refinements li a, .refinement-bar a.reset, .filter-value a, .swatch-filter a',
            function (e) {
                e.preventDefault();
                e.stopPropagation();

                $.spinner().start();
                $(this).trigger('search:filter', e);
                $.ajax({
                    url: e.currentTarget.href,
                    data: {
                        page: $('.grid-footer').data('page-number'),
                        selectedUrl: e.currentTarget.href
                    },
                    method: 'GET',
                    success: function (response) {
                    	var gtmFacetArray = $(response).find('.gtm-product').map(function () { return $(this).data('gtm-facets'); }).toArray();
                    	$('body').trigger('facet:success', [gtmFacetArray]);
                        parseResults(response);
                        // edit start
                        updatePageURLForFacets(e.currentTarget.href);
                        // edit end
                        $.spinner().stop();
                        moveFocusToTop();
                        swatches.showSwatchImages();
                        $('.mvmt-plp .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                        $('.mvmt-plp .result-count').removeClass('col-12 col-md-9 col-sm-6 order-sm-2');
                        $('.mvmt-plp .grid-header .sort-col').remove();
                        $('.mvmt-plp .grid-header .filter-col').remove()
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

    sortMenuDesktop: function () {
        $(document).on("click", '.plp-filter-bar .plp-filter-btn', function(e) {
            var button = this
            $(button).next().toggleClass('active');
            $(button).toggleClass('active');
            setTimeout(function(){
                $(button).next().toggleClass('loaded');
            }, 300);

            setTimeout(function(){
                $(button).next().children('.plp-active-filter').toggleClass('loaded');
            }, 500);

            $(".plp-filter-bar .plp-filter-btn").not($(this)).removeClass('active');
            $(".filter-group").not($(this).next()).removeClass('active loaded');
            $(".plp-active-filter").not($(this).next().children('.plp-active-filter')).removeClass('loaded');
        });

        $(document).on("click", '.filter-close-btn', function(e) {
            $(".filter-group").removeClass('active loaded');
            $(".plp-active-filter").removeClass('loaded');
            $(".plp-filter-bar .plp-filter-btn").removeClass('active');
        });

        $(".mvmt-plp #sort-order").customSelect({
            block: "plp-sort",
        });
    },

    stickyFilterBar: function () {
        $(window).scroll( function (event) {
            var $headerSize = $('.header-menu-wrapper').height();
            var $headerBannerSize = $('.hero').height();
            var $totalHeaderSize = $headerBannerSize - 70;
            if ($(this).scrollTop() > $totalHeaderSize) {
                $headerSize = parseInt($headerSize) === 0 ? $('.sticky-header-wrapper').height() - 2 : $headerSize - 2;
                $('.plp-filter-bar').addClass('sticky');
                $('.plp-filter-bar').css('top', $headerSize);
            } else {
                $('.plp-filter-bar').removeClass('sticky');
                $('.plp-filter-bar').css('top', '');
            }
        });
    },

    mobileSortMenu: function () {

        $(document).on("click", '.mobile-filter-btn-list button', function(e) {
            var  menu = $(this).data('menu');
            console.log(menu);
            $(''+ menu +'').addClass('active');
            setTimeout (function (){
                $(''+ menu +' .mobile-sort-order').addClass('loaded');
                $(''+ menu +' .mobile-filter-actions').addClass('loaded');
                $(''+ menu +' .mobile-filter-options-list').addClass('loaded');
            }, 500);
        });

        $(document).on("click", '.mobile-close-menu', function(e) {
            var  menuClose = $(this).data('close-menu');
            $(''+ menuClose +'').removeClass('active');
        });

        
    }
};
