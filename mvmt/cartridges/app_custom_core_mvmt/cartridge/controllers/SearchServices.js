'use strict';

var Site = require('dw/system/Site');
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var page = module.superModule;
server.extend(page);

var ABTestMgr = require('dw/campaign/ABTestMgr');

server.replace('GetSuggestions', cache.applyDefaultCache, function (req, res, next) {
    var SuggestModel = require('dw/suggest/SuggestModel');
    var CategorySuggestions = require('*/cartridge/models/search/suggestions/category');
    var ContentSuggestions = require('*/cartridge/models/search/suggestions/content');
    var ProductSuggestions = require('*/cartridge/models/search/suggestions/product');
    var SearchPhraseSuggestions = require('*/cartridge/models/search/suggestions/searchPhrase');
    var CollectionSuggestions = require('*/cartridge/models/search/suggestions/collections');
    var Site = require('dw/system/Site');
    var collectionSuggestions;
    var categorySuggestions;
    var contentSuggestions;
    var productSuggestions;
    var recentSuggestions;
    var popularSuggestions;
    var brandSuggestions;
    var searchTerms = req.querystring.q;
    var suggestions;

    var minChars = Site.getCurrent().getCustomPreferenceValue('SearchMinChars');
    var maxSuggestions = Site.getCurrent().getCustomPreferenceValue('SearchMaxSuggestions');
    var searchAnalyticsTrackingData;

    if (searchTerms && searchTerms.length >= minChars) {
		// creating a new suggestion model
        suggestions = new SuggestModel();
        suggestions.setSearchPhrase(searchTerms);
        suggestions.setMaxSuggestions(maxSuggestions);

        collectionSuggestions = new CollectionSuggestions(suggestions, maxSuggestions);
        categorySuggestions = new CategorySuggestions(suggestions, maxSuggestions, collectionSuggestions);
        contentSuggestions = new ContentSuggestions(suggestions, maxSuggestions);
        productSuggestions = new ProductSuggestions(suggestions, maxSuggestions);
        recentSuggestions = new SearchPhraseSuggestions(suggestions.recentSearchPhrases, maxSuggestions);
        popularSuggestions = new SearchPhraseSuggestions(suggestions.popularSearchPhrases, maxSuggestions);
        brandSuggestions = new SearchPhraseSuggestions(suggestions.brandSuggestions, maxSuggestions);

		// Configuring Did You Mean Functionality
        var didYouMeanPresence = true;
        var matchPhrases = productSuggestions.phrases;
        var matchPhrasesNumber = matchPhrases.length;

		// Setting did you mean variable toggle
        for (var j = 0; j < matchPhrasesNumber; j++)		{
            if (matchPhrases[j].exactMatch === true)			{
                didYouMeanPresence = false;
                break;
            }
        }

        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
            searchAnalyticsTrackingData = {search: searchTerms};
        }

        var renderingTemplate = 'search/old/suggestions';
        if (ABTestMgr.isParticipant('MVMTRedesignPLPABTest', 'render-new-design')) {
            renderingTemplate = 'search/suggestions';
        }

        if (productSuggestions.available || contentSuggestions.available
				|| categorySuggestions.available
				|| recentSuggestions.available
				|| popularSuggestions.available
				|| brandSuggestions.available
				|| collectionSuggestions.available) {
            res.render(renderingTemplate, {
                suggestions: {
                    product: productSuggestions,
                    category: categorySuggestions,
                    content: contentSuggestions,
                    recent: recentSuggestions,
                    popular: popularSuggestions,
                    brand: brandSuggestions,
                    collection: collectionSuggestions,
                    didYouMeanPresence: didYouMeanPresence,
                    searchCount: searchTerms.length 
                },
                searchAnalyticsTrackingData: JSON.stringify(searchAnalyticsTrackingData)
            });
        } else {
            res.json({});
        }
    } else {
		// Return an empty object that can be checked on the client.  By default, rendered
		// templates automatically get a diagnostic string injected into it, making it difficult
		// to check for a null or empty response on the client.
        res.json({});
    }
    next();
});

module.exports = server.exports();
