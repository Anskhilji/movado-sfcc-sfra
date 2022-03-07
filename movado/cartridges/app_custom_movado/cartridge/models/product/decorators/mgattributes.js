'use strict';
var Resource = require('dw/web/Resource');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var Site = require('dw/system/Site');

// var publicHolidays = Site.getCurrent().getCustomPreferenceValue('publicHolidaysList');
module.exports = function (object, apiProduct) {
    Object.defineProperty(object, 'resources', {
        enumerable: true,
        value: {
            // seeMore: Resource.msg('label.see.more', 'product', null)
        	Add: Resource.msg('label.product.personalizaion.add', 'product', null),
        	Remove: Resource.msg('label.product.personalizaion.remove', 'product', null),
        	FreePersonalization: Resource.msg('label.product.personalizaion.Free', 'product', null),
        	Highlight: Resource.msg('label.product.detail.highlights', 'product', null),
        	Zoom: Resource.msg('button.zoomview', 'product', null),
        	Details: Resource.msg('label.product.detail.details', 'product', null),
        	EstimatedTotal: Resource.msg('label.product.detail.estimated.total', 'product', null),
        	Personalization: Resource.msg('label.product.option.personalization', 'product', null),
        	embossingPlaceholder: Resource.msg('pdict.product.resources.placeholdertext.text.embossing', 'product', null),
        	
        	embossingHorizontalPlaceholder: Resource.msg('pdict.product.resources.placeholdertext.text.horizontal.embossing', 'product', null),
        	embossingVerticalPlaceholder: Resource.msg('pdict.product.resources.placeholdertext.text.vertical.embossing', 'product', null),
            embossingHorizontalPlaceholderRedesign: Resource.msg('pdict.product.resources.placeholdertext.text.horizontal.embossing.redesign', 'product', null),
        	embossingVerticalPlaceholderRedesign: Resource.msg('pdict.product.resources.placeholdertext.text.vertical.embossing.redesign', 'product', null),
        	
        	engravingPlaceholder: Resource.msg('pdict.product.resources.placeholdertext.text.engraving', 'product', null),
            engravingPlaceholderRedesign: Resource.msg('pdict.product.resources.placeholdertext.text.engraving.redesign', 'product', null),
        	Free: Resource.msg('label.product.option.personalization.Free', 'product', null),
            errorEmptyEmbossText: Resource.msg('label.product.personalization.mandatory.embossing.message', 'product', null),
            errorMaxlengthEmbossText: Resource.msg('label.product.personalization.maxlength.embossing.message', 'product', null),
            
            errorMaxlengthHorizontalEmbossText: Resource.msg('label.product.personalization.maxlength.embossing.horizontal.message', 'product', null),
            errorMaxlengthVerticalEmbossText: Resource.msg('label.product.personalization.maxlength.embossing.vertical.message', 'product', null),
            
        	errorEmptyEngraveText: Resource.msg('label.product.personalization.mandatory.engarving.message', 'product', null),
        	errorMaxlengthEngraveText: Resource.msg('label.product.personalization.maxlength.engarving.message', 'product', null),
        	viewMoreStyles: Resource.msg('label.product.recommendations.viewMoreStyles', 'product', null),
        	youMayLike: Resource.msg('label.product.recommendations.youMayLike', 'product', null)
        }
    });

    Object.defineProperty(object, 'prefs', {
    	enumerable: true,
    	value: productCustomHelpers.getPrefrences(apiProduct)
    });

    Object.defineProperty(object, 'badges', {
    	enumerable: true,
    	value: productCustomHelpers.getBadges(apiProduct)
    });

    Object.defineProperty(object, 'pdpAttributesList', {
        enumerable: true,
        value: productCustomHelpers.getPdpAttributes(apiProduct)
    });

    Object.defineProperty(object, 'assets', {
        enumerable: true,
        value: productCustomHelpers.getPersonalizationAssets(apiProduct)
    });

    Object.defineProperty(object, 'embossingTextValidations', {
        enumerable: true,
        value: productCustomHelpers.getEmbossingTextValidation(apiProduct)
    });

    Object.defineProperty(object, 'engravingTextValidations', {
        enumerable: true,
        value: productCustomHelpers.getEngravingTextValidation(apiProduct)
    });

    Object.defineProperty(object, 'shopLabel', {
        enumerable: true,
        value: productCustomHelpers.getShopBagLabel(apiProduct)
    });
};

