'use strict';

var debounce = require('lodash/debounce');
var endpoint = $('.suggestions-wrapper').data('url');
var minChars = $('input.search-field').data('queryThreshold');
var $suggestionsSlots = $('.search-recomendation');
var currentCount;

/**
 * Retrieves Suggestions element relative to scope
 *
 * @param {Object} scope - Search input field DOM element
 * @return {JQuery} - .suggestions-wrapper element
 */
function getSuggestionsWrapper(scope) {
    return $(scope).siblings('.suggestions-wrapper');
}

/**
 * Determines whether DOM element is inside the .search-mobile class
 *
 * @param {Object} scope - DOM element, usually the input.search-field element
 * @return {boolean} - Whether DOM element is inside  div.search-mobile
 */
function isMobileSearch(scope) {
    return !!$(scope).closest('.search-mobile').length;
}

/**
 * Remove modal classes needed for mobile suggestions
 *
 */
function clearModals() {
    $('body').removeClass('modal-open');
    $('.suggestions').removeClass('modal');
}

/**
 * Apply modal classes needed for mobile suggestions
 *
 * @param {Object} scope - Search input field DOM element
 */
function applyModals(scope) {
    if (isMobileSearch(scope)) {
        $('body').addClass('modal-open');
        getSuggestionsWrapper(scope).find('.suggestions').addClass('modal');
    }
}

/**
 * Tear down Suggestions panel
 */
function tearDownSuggestions() {
    $('input.search-field').val('');
    clearModals();
    $('.search-mobile .suggestions').unbind('scroll');
    $('.suggestions-wrapper').empty();
}

/**
 * Determines whether the "More Content Below" icon should be displayed
 *
 * @param {Object} scope - DOM element, usually the input.search-field element
 */
function handleMoreContentBelowIcon(scope) {
    if (($(scope).scrollTop() + $(scope).innerHeight()) >= $(scope)[0].scrollHeight) {
        $('.more-below').fadeOut();
    } else {
        $('.more-below').fadeIn();
    }
}

/**
 * Positions Suggestions panel on page
 *
 * @param {Object} scope - DOM element, usually the input.search-field element
 */
function positionSuggestions(scope) {
    var outerHeight;
    var $scope;
    var $suggestions;
    var top;

    if (isMobileSearch(scope)) {
        $scope = $(scope);
        top = $scope.offset().top;
        outerHeight = $scope.outerHeight();
        $suggestions = getSuggestionsWrapper(scope).find('.suggestions');
        $suggestions.css('top', top + outerHeight);

        handleMoreContentBelowIcon(scope);

        // Unfortunately, we have to bind this dynamically, as the live scroll event was not
        // properly detecting dynamic suggestions element's scroll event
        $suggestions.scroll(function () {
            handleMoreContentBelowIcon(this);
        });
    }
}

/**
 * Process Ajax response for SearchServices-GetSuggestions
 *
 * @param {Object|string} response - Empty object literal if null response or string with rendered
 *                                   suggestions template contents
 */
function processResponse(response) {
    var $suggestionsWrapper = getSuggestionsWrapper(this).empty();

    $.spinner().stop();

    if (!(typeof (response) === 'object')) {
        $suggestionsWrapper.append(response).show();
        positionSuggestions(this);
        // custom start hide recomendation slots
        $suggestionsSlots.hide();

        if (isMobileSearch(this)) {
            applyModals(this);
        }
    } else {
        $suggestionsWrapper.hide();
    }
}

function showShortText() {
    $('.text-family-truncate-wrapper').each(function () {
        var $moretext = '...';
        var $content = $(this).html();
        var $collectionArray = $content.split(' ');

        if ($collectionArray.length > 3) {
            var $contentUpdated = '';
            for (var i = 0; i <= 3; i++) {
                if (i == 3) {
                    $contentUpdated += $moretext + '</a>';
                } else {
                    $contentUpdated += $collectionArray[i] + ' ';
                }
            }

            var $updateContent = $contentUpdated.split(' ');
            var $html = '<span>' + $updateContent[0] + ' ' + $updateContent[1]+'</span><br/>';
            var $html2 = '<span>' + $updateContent[2] + $updateContent[3]+'</span>';
            $(this).html($html).append($html2);
        }
    });
}

function slickSearchSwatch() {
    $('.suggestions-wrapper').removeClass('d-none');
    $('.suggestions-case-diameter').addClass('suggestions-family-name');
    $('.product-tile-redesign .swatches').slick({
        infinite: true,
        speed: 300,
        slidesToShow: 5,
        slidesToScroll: 1,
        dots: false,
        arrows: true,
        autoplay: false,
        prevArrow: '<button type="button" data-role="none" class="slick-prev slick-arrow" aria-label="Previous" tabindex="0" role="button"><i class="fa fa-chevron-left" aria-hidden="true"></i></button>',
        nextArrow: '<button type="button" data-role="none" class="slick-next slick-arrow" aria-label="Next" tabindex="0" role="button"><i class="fa fa-chevron-right" aria-hidden="true"></i></button>',
        responsive: [
            {
                breakpoint: 544,
                settings: {
                    slidesToShow: 3,
                }
            },
        ]
    });
}

/**
 * Retrieve suggestions
 *
 * @param {Object} scope - Search field DOM element
 */

function getSuggestions(scope) {
    $('.suggestions-wrapper').addClass('d-none');
    $('.suggestions-case-diameter').removeClass('case-diameter');
    if ($(scope).val().length >= minChars) {
        currentCount = $(scope).val().length;
        $suggestionsSlots.hide();
        $.spinner().stop();
        $.spinner().start();
        $.ajax({
            context: scope,
            url: endpoint + encodeURIComponent($(scope).val()),
            method: 'GET',
            success: function (data) {
                showShortText();
                slickSearchSwatch();
                var resposeCount = $('#searchCount', $(data).context).val();
                processResponse;
                if (resposeCount == currentCount) {
                    $('body').trigger('siteSearch:success', $(scope).val());
                }
            },
            error: function () { $.spinner().stop();}
        });
    } else {
        clearModals();
        getSuggestionsWrapper(scope).empty();
    }
}

function getSuggestionsSlots() {
    if ($('input.search-field').val().length === 0) {
        $suggestionsSlots.show();
    }
}

module.exports = function () {
    $('input.search-field').each(function () {
        /**
         * Use debounce to avoid making an Ajax call on every single key press by waiting a few
         * hundred milliseconds before making the request. Without debounce, the user sees the
         * browser blink with every key press.
         */

        var debounceSuggestions = debounce(getSuggestions, 300);

        $(this).on('keyup click', function (e) {
            debounceSuggestions(this, e);
            getSuggestionsSlots();
        });
    });

    $('body').off('click').on('mouseup', function (e) {
        if (!$('.suggestions').has(e.target).length && !$(e.target).hasClass('search-field')) {
            $('.suggestions').hide();
        }
    });

    $('body').on('click touchend', '.search-mobile span.fa-close', function () {
        $('.suggestions').hide();
        tearDownSuggestions();
    });
};
