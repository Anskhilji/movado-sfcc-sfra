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

    var collectionIter = collectionSuggestions ? collectionSuggestions.categories : null;
    var collectionList = new Array();
    for (var key in collectionIter) {
        if (collectionIter.hasOwnProperty(key)) {
            collectionList.push(collectionIter[key].id);
        }
    }
    this.available = false;

    for (var i = 0; i < maxItems; i++) {
        var category = null;

        if (iter.hasNext()) {
            category = iter.next().category;

            if (collectionList.indexOf(category.ID) == -1) {
                this.available = true;
                this.categories.push({
                    name: category.displayName,
                    imageUrl: category.image ? category.image.url : '',
                    url: URLUtils.url(endpoint, 'cgid', category.ID),
                    parentID: category.parent.ID,
                    parentName: category.parent.displayName
                });
            }
        }
    }
}

module.exports = CategorySuggestions;
