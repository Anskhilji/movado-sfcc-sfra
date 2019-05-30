'use strict';

var URLUtils = require('dw/web/URLUtils');
var endpoint = 'Search-Show';

/**
 * @constructor
 * @classdesc CategorySuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of categories to retrieve
 * @param {models.search.suggestions.collections} collectionSuggesstions
 */
function CategorySuggestions(suggestions, maxItems, collectionSuggestions) {
    this.categories = [];

    if (!suggestions.categorySuggestions) {
        this.available = false;
        return;
    }

    var categorySuggestions = suggestions.categorySuggestions;
    var iter = categorySuggestions.suggestedCategories;


    var collectionIter = collectionSuggestions ? collectionSuggestions.suggestedCategories : null;

    this.available = categorySuggestions.hasSuggestions();

    for (var i = 0; i < maxItems; i++) {
        var category = null;
        var collection = null;

        if (iter.hasNext()) {
            category = iter.next().category;

            if (collectionIter != null && collectionIter.hasNext()) {
                collection = collectionIter.next().category;

                // Not pushing a category in object if category is equal to collection
                if (category != collection) {
                	this.categories.push({
                		name: category.displayName,
                		imageUrl: category.image ? category.image.url : '',
                		url: URLUtils.url(endpoint, 'cgid', category.ID),
                		parentID: category.parent.ID,
                		parentName: category.parent.displayName
                	});
                }
            } else {
            	this.available = false;
            }
        }
    }
}

module.exports = CategorySuggestions;
