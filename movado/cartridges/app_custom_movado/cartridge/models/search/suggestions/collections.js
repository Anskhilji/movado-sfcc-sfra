'use strict';

var URLUtils = require('dw/web/URLUtils');
var endpoint = 'Search-Show';
var Site = require('dw/system/Site');
var collectionsCategory = Site.current.getCustomPreferenceValue('collectionsCategory');
var root = Site.current.getCustomPreferenceValue('rootCategory');

// checking for hierarchical parent for browse by collection category
function pushToCollection(category, immediateParent) {
    var status = false;
    if (immediateParent.ID === root) {
        return false;
    }

    if (collectionsCategory.length > 0) {
        for (var a = 0; a < collectionsCategory.length; a++) {
            if (category.ID === collectionsCategory[a]) {
                status = true;
            }
        }
    }

    if (collectionsCategory.length > 0) {
        for (var b = 0; b < collectionsCategory.length; b++) {
            if (immediateParent.ID === collectionsCategory[b]) {
                status = true;
            }
        }
    }

    return status ? true : pushToCollection(immediateParent, immediateParent.parent);
}

/**
 * @constructor
 * @classdesc CategorySuggestions class
 *
 * @param {dw.suggest.SuggestModel} suggestions - Suggest Model
 * @param {number} maxItems - Maximum number of categories to retrieve
 */
function CollectionSuggestions(suggestions, maxItems) {
    this.categories = [];

    var collectionSuggestions = suggestions.categorySuggestions;
    var iter = collectionSuggestions.suggestedCategories;

    this.available = false;

    for (var i = 0; i < maxItems; i++) {
        var category = null;

        if (iter.hasNext()) {
            category = iter.next().category;
            var pushFlag = pushToCollection(category, category.parent);
            if (pushFlag) {
                this.available = true;
                this.categories.push({
                    id: category.ID,
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

module.exports = CollectionSuggestions;
