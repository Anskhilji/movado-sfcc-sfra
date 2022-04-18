'use strict';
var Resource = require('dw/web/Resource');
var ShippingMgr = require('dw/order/ShippingMgr');
var Site = require('dw/system/Site');
var ProductMgr = require('dw/catalog/ProductMgr');
var ContentMgr = require('dw/content/ContentMgr');
var StringUtils = require('dw/util/StringUtils');
var Logger = require('dw/system/Logger');
var ArrayList = require('dw/util/ArrayList');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');
var collections = require('*/cartridge/scripts/util/collections');
var Calendar = require('dw/util/Calendar');
var URLUtils = require('dw/web/URLUtils');


/* static constants */
var DELIMITER_COMMA = ',';
var ATTR_DIAL = 'dial';
var ATTR_CASE_MAT = 'caseMaterial';
var ATTR_CASE_DIA = 'caseDiameter';
var ATTR_GEM_TYPE = 'gemstoneType';
var ATTR_GEM_NUMBER = 'gemstoneNumber';
var ATTR_GEM_CLARITY = 'gemstoneClarity';
var ATTR_CARAT = 'caratWeight';
var ATTR_ATTACH_TYPE = 'attachmentType';
var ATTR_MOVEMENT_TYPE = 'movementType';
var ATTR_GENDER = 'watchGender';
var ATTR_WTR_RESISTANCE = 'waterResistance';
var ATTR_FABRICATION = 'crystalFabrication';
var ATTR_RING_SIZE = 'ringSize';
var ATTR_LENGTH = 'length';
var ATTR_POWER_RESERVE  = 'powerReserve';
var ATTR_MOVEMENT_FUNCTIONS = 'movementFunctions';
var ATTR_CALIBER = 'caliber';
var STRAP = 'strap';
var BRACELET = 'bracelet';
var BANGLE = 'bangle';
var NEWLINE = '\n';
var EMBOSSED = 'Embossed';
var ENGRAVED = 'Engraved';

function getBadges(apiProduct) {
	// Contains what attributes needs to display image/text
    var imageBadges = Site.getCurrent().getCustomPreferenceValue('imageTypeBadges');
    var textBadges = Site.getCurrent().getCustomPreferenceValue('textTypeBadges');

	// Contains image url / text to be displayed on storefront
    var badgeImage1 = Site.getCurrent().getCustomPreferenceValue('imageBadge1');
    var badgeImage2 = Site.getCurrent().getCustomPreferenceValue('imageBadge2');
    var badgeEcoFriendly = Site.getCurrent().getCustomPreferenceValue('badgeEcoFriendly');
    var badgeVeganFriendly = Site.getCurrent().getCustomPreferenceValue('badgeVeganFriendly');
    var badgeStatus = Site.getCurrent().getCustomPreferenceValue('badgeStatus');
    var badgeText = JSON.parse(Site.getCurrent().getCustomPreferenceValue('textForBadges'));

    var attrDef = SystemObjectMgr.describe('Product');
    var attGrp = attrDef.getAttributeGroup('indicators');
    var attrGrpDefs = attGrp.attributeDefinitions;

    var imageBadgesObj = new ArrayList();
    var textBadgesObj = new ArrayList();

    Object.keys(imageBadges).forEach(function (imageKey) {
        var imageBadge = imageBadges[imageKey];
        var beginDate;
        var numOfdays;

        collections.forEach(attrGrpDefs, function (attrGrpDef) {
            var id = attrGrpDef.ID;

            if (id.toLowerCase().indexOf(imageBadge.toLowerCase()) > -1) {
                var attrVal = apiProduct.custom[id];

                if (id.indexOf('BeginDate') > -1) {
                    beginDate = attrVal;
                } else if (id.indexOf('Days') > -1) {
                    numOfdays = attrVal;
                }
            }
        });

        if (beginDate && numOfdays) {
			// Logic to check if badge required or not
            var today = new Calendar();
            var badgeStartDate = new Calendar(beginDate);
            var badgeEndDate = new Calendar(beginDate);
            badgeEndDate.add(badgeEndDate.DAY_OF_MONTH, numOfdays);

            if (today.after(badgeStartDate) && today.before(badgeEndDate)) {
                if (badgeImage1) {
                    // MSS-1169 Change url to URL fix deprecated method usage
                    var badgeImageUrl1 = badgeImage1.URL.toString();
                }
                if (badgeImage2) {
                    // MSS-1169 Change url to URL fix deprecated method usage
                    var badgeImageUrl2 = badgeImage2.URL.toString();
                }
                if (badgeEcoFriendly && badgeStatus) {
                    var badgeEcoFriendlyUrl = badgeEcoFriendly.URL.toString();
                }
                if (badgeVeganFriendly && badgeStatus) {
                    var badgeVeganFriendlyUrl = badgeVeganFriendly.URL.toString();
                }


                if (badgeImageUrl1 && badgeImageUrl1.indexOf(imageBadge) > -1) {
                    var badge = {
                        attr: imageBadge,
                        attrType: 'image',
                        // MSS-1169 Change url to URL fix deprecated method usage
                        imageUrl: badgeImage1.URL,
                        imageAlt: imageBadge
                    };
                    imageBadgesObj.add(badge);
                }

                if (badgeImageUrl2 && badgeImageUrl2.indexOf(imageBadge) > -1) {
                    var badge = {
                        attr: imageBadge,
                        attrType: 'image',
                        // MSS-1169 Change url to URL fix deprecated method usage
                        imageUrl: badgeImage2.URL,
                        imageAlt: imageBadge
                    };
                    imageBadgesObj.add(badge);
                }
                if (badgeEcoFriendlyUrl && badgeStatus && badgeEcoFriendlyUrl.indexOf(imageBadge) > -1) {
                    var badge = {
                        attr: imageBadge,
                        attrType: 'image',
                        imageUrl: badgeEcoFriendly.URL,
                        imageAlt: imageBadge,
                        isRedesigned: true
                    };
                    imageBadgesObj.add(badge);
                }
                if (badgeVeganFriendlyUrl && badgeStatus && badgeVeganFriendlyUrl.indexOf(imageBadge) > -1) {
                    var badge = {
                        attr: imageBadge,
                        attrType: 'image',
                        imageUrl: badgeVeganFriendly.URL,
                        imageAlt: imageBadge,
                        isRedesigned: true
                    };
                    imageBadgesObj.add(badge);
                }
            }
        }
    });

    Object.keys(textBadges).forEach(function (textKey) {
        var textBadge = textBadges[textKey];
        var beginDate;
        var numOfdays;

        collections.forEach(attrGrpDefs, function (attrGrpDef) {
            var id = attrGrpDef.ID;

            if (id.toLowerCase().indexOf(textBadge.toLowerCase()) > -1) {
                var attrVal = apiProduct.custom[id];

                if (id.indexOf('BeginDate') > -1) {
                    beginDate = attrVal;
                } else if (id.indexOf('Days') > -1) {
                    numOfdays = attrVal;
                }
            }
        });

        if (beginDate && numOfdays) {
			// Logic to check if badge required or not
            var today = new Calendar();
            var badgeStartDate = new Calendar(beginDate);
            var badgeEndDate = new Calendar(beginDate);
            badgeEndDate.add(badgeEndDate.DAY_OF_MONTH, numOfdays);

            if (today.after(badgeStartDate) && today.before(badgeEndDate)) {
                Object.keys(badgeText).forEach(function (txtKey) {
                    if (txtKey.indexOf(textBadge) > -1) {
                        var badge = {
                            attr: textBadge,
                            attrType: 'text',
                            text: badgeText[txtKey]
                        };
                        textBadgesObj.add(badge);
                    }
                });
            }
        }
    });

    var badges = {
        imageBadges: imageBadgesObj,
        textBadges: textBadgesObj
    };

    return badges;
}


/**
 * adds attribute to attributeList
 * @param attributesList
 * @param attributeName
 * @param attribute
 * @returns [List] attributes
 */
function pushAttributeToList(attributesList, attributeName, attribute, imagePath) {
    if (attributesList) {
        attributesList.push({
            name: attributeName,
            value: attribute,
            image: imagePath
        });
    }
    return attributesList;
}


/**
 * get the PDP display attributes and their corresponding images
 * @param apiProduct
 * @returns [List] attributes
 */
function getPdpAttributes(apiProduct) {
    var attr;
    var attributes = [];

	/* get List of attributes for PDP*/
    var pdpAttributes = Site.getCurrent().getCustomPreferenceValue('pdpAttributesList');
    var attrNameMapping = JSON.parse(Site.getCurrent().getCustomPreferenceValue('pdpAttrIdNameMapping'));

	/* get images for attributes*/
    var dialImage = Site.getCurrent().getCustomPreferenceValue('dialAttributeImage');
    var caseDiaImage = Site.getCurrent().getCustomPreferenceValue('caseDiameterAttributeImage');
    var caseMaterialImage = Site.getCurrent().getCustomPreferenceValue('caseMaterialAttributeImage');
    var waterResistanceImage = Site.getCurrent().getCustomPreferenceValue('waterResistanceAttributeImage');
    var movementTypeImage = Site.getCurrent().getCustomPreferenceValue('movementTypeAttributeImage');
    var gemstoneNumberImage = Site.getCurrent().getCustomPreferenceValue('gemstoneNumberAttributeImage');
    var watchGenderImage = Site.getCurrent().getCustomPreferenceValue('watchGenderAttributeImage');
    var caratWeightImage = Site.getCurrent().getCustomPreferenceValue('caratWeightAttributeImage');
    var gemstoneClarityImage = Site.getCurrent().getCustomPreferenceValue('gemstoneClarityAttributeImage');
    var fabricationImage = Site.getCurrent().getCustomPreferenceValue('crystalFabricationAttributeImage');
    var gemstoneTypeImage = Site.getCurrent().getCustomPreferenceValue('gemstoneTypeAttributeImage');
    var attachmentTypeImage = Site.getCurrent().getCustomPreferenceValue('attachmentTypeAttributeImage');
    var ringSizeImage = Site.getCurrent().getCustomPreferenceValue('ringSizeAttributeImage');
    var lengthImage = Site.getCurrent().getCustomPreferenceValue('lengthAttributeImage');

    /* split the list of attributes*/
    pdpAttributes = pdpAttributes.split(DELIMITER_COMMA);

    try {
        for (var i = 0; i < pdpAttributes.length; i++) {
            attr = pdpAttributes[i];

			/* populate the attributes in list if it has value*/

            if (attr && attr == ATTR_DIAL && apiProduct.custom.dial) {
                attributes = pushAttributeToList(attributes, attrNameMapping.dial, apiProduct.custom.dial, dialImage.URL);
            } else if (attr && attr == ATTR_RING_SIZE && apiProduct.custom.ringSize) {
                attributes = pushAttributeToList(attributes, attrNameMapping.ringSize, apiProduct.custom.ringSize, ringSizeImage.URL);
            } else if (attr && attr == ATTR_LENGTH && apiProduct.custom.length) {
                attributes = pushAttributeToList(attributes, attrNameMapping.length, apiProduct.custom.length, lengthImage.URL);
            } else if (attr && attr == ATTR_CASE_DIA && apiProduct.custom.caseDiameter) {
                attributes = pushAttributeToList(attributes, attrNameMapping.caseDiameter, apiProduct.custom.caseDiameter, caseDiaImage.URL);
            } else if (attr && attr == ATTR_CASE_MAT && apiProduct.custom.caseMaterial) {
                attributes = pushAttributeToList(attributes, attrNameMapping.caseMaterial, apiProduct.custom.caseMaterial, caseMaterialImage.URL);
            } else if (attr && attr == ATTR_FABRICATION && apiProduct.custom.crystalFabrication) {
                attributes = pushAttributeToList(attributes, attrNameMapping.crystalFabrication, apiProduct.custom.crystalFabrication, fabricationImage.URL);
            } else if (attr && attr == ATTR_WTR_RESISTANCE && apiProduct.custom.waterResistance) {
                attributes = pushAttributeToList(attributes, attrNameMapping.waterResistance, apiProduct.custom.waterResistance, waterResistanceImage.URL);
            } else if (attr && attr == ATTR_ATTACH_TYPE && apiProduct.custom.attachmentType) {
                if (apiProduct.custom.attachmentType.toLowerCase() == BRACELET || apiProduct.custom.attachmentType.toLowerCase() == BANGLE) {
                    attributes = pushAttributeToList(attributes, attrNameMapping.Bracelet, apiProduct.custom.bracelet, attachmentTypeImage.URL);
                }				else if (apiProduct.custom.attachmentType.toLowerCase() == STRAP) {
            attributes = pushAttributeToList(attributes, attrNameMapping.Strap, apiProduct.custom.strapFabrication, attachmentTypeImage.URL);
        } else {
            attributes = pushAttributeToList(attributes, attrNameMapping.attachmentType, apiProduct.custom.strapFabrication, attachmentTypeImage.URL);
        }
            }			else if (attr && attr == ATTR_MOVEMENT_TYPE && apiProduct.custom.movementType) {
                attributes = pushAttributeToList(attributes, attrNameMapping.movementType, apiProduct.custom.movementType, movementTypeImage.URL);
            }			else if (attr && attr == ATTR_GENDER && apiProduct.custom.watchGender && apiProduct.custom.watchGender.length > 0) {
        attributes = pushAttributeToList(attributes, attrNameMapping.watchGender, apiProduct.custom.watchGender[0], watchGenderImage.URL);
    }			else if (attr && (attr == ATTR_GEM_TYPE || attr == ATTR_GEM_NUMBER || attr == ATTR_CARAT || attr == ATTR_GEM_CLARITY) && apiProduct.custom.gemstoneType) {
        if (attr == ATTR_GEM_TYPE) {
        attributes = pushAttributeToList(attributes, attrNameMapping.gemstoneType, apiProduct.custom.gemstoneType, gemstoneTypeImage.URL);
    }				else if (attr == ATTR_GEM_NUMBER && apiProduct.custom.gemstoneNumber) {
        attributes = pushAttributeToList(attributes, attrNameMapping.gemstoneNumber, apiProduct.custom.gemstoneNumber, gemstoneNumberImage.URL);
    }				else if (attr == ATTR_CARAT && apiProduct.custom.caratWeight) {
        attributes = pushAttributeToList(attributes, attrNameMapping.caratWeight, apiProduct.custom.caratWeight, caratWeightImage.URL);
    }				else if (attr == ATTR_GEM_CLARITY && apiProduct.custom.gemstoneClarity) {
        attributes = pushAttributeToList(attributes, attrNameMapping.gemstoneClarity, apiProduct.custom.gemstoneClarity, gemstoneClarityImage.URL);
    }
    } else if (attr && attr == ATTR_CALIBER && apiProduct.custom.caliber) {
        attributes = pushAttributeToList(attributes, attrNameMapping.caliber, apiProduct.custom.caliber, null);
    } else if (attr && attr == ATTR_MOVEMENT_FUNCTIONS && apiProduct.custom.movementFunctions) {
        attributes = pushAttributeToList(attributes, attrNameMapping.movementFunctions, apiProduct.custom.movementFunctions, null);
    } else if (attr && attr == ATTR_POWER_RESERVE && apiProduct.custom.powerReserve) {
        attributes = pushAttributeToList(attributes, attrNameMapping.powerReserve, apiProduct.custom.powerReserve, null);
    }
        }
    } catch (e) {
        Logger.getLogger('ProductCustomHelpers').error('Error occured while populating PDP attributes : '+ e.message + e.stack);
        return [];
    }

    Logger.getLogger('ProductCustomHelpers').debug('Attributes populated Successfully : ');
    return attributes;
}


/**
 * return the title texts to be added on personalization items
 * @param apiProduct
 * @returns [List] assets
 */
function getPersonalizationAssets(apiProduct) {
    var assets = {};
    var engravingTitleText = ContentMgr.getContent('EngravingDescriptionText');
    var engravingReturnText = ContentMgr.getContent('EngravingDescriptionText2');
    var embossingTitleText = ContentMgr.getContent('EmbossingDescriptionText');
    var embossingReturnText = ContentMgr.getContent('EmbossingDescriptionText2');
    var pdvideoAssetID = apiProduct.custom.videoContentAssetID;
    var pdp_video_asset;

    if (embossingTitleText && embossingTitleText.custom && embossingTitleText.custom.body) {
        assets.embossingTop = embossingTitleText.custom.body.markup;
    }
    if (embossingReturnText && embossingReturnText.custom && embossingReturnText.custom.body) {
        assets.embossingBottom = embossingReturnText.custom.body.markup;
    }
    if (engravingTitleText && engravingTitleText.custom && engravingTitleText.custom.body) {
        assets.engravingTop = engravingTitleText.custom.body.markup;
    }
    if (engravingReturnText && engravingReturnText.custom && engravingReturnText.custom.body) {
        assets.engravingBottom = engravingReturnText.custom.body.markup;
    }
    if (pdvideoAssetID) {
        pdp_video_asset = ContentMgr.getContent(pdvideoAssetID);
        if (pdp_video_asset && pdp_video_asset.custom && pdp_video_asset.custom.body) {
            assets.pdp_video_asset = pdp_video_asset.custom.body;
        }
    }

    Logger.getLogger('ProductCustomHelpers').debug('Assets fo embossing and engraving populated Successfully : ');
    return assets;
}

/**
 * gets the collection content assets to be shown on PDP
 * @param apiProduct
 * @returns {ArrayList}
 */
function getMoreCollectionIdHeader(apiProduct) {
    var collectionContentList = new ArrayList();
    var contentAssetIds = apiProduct.custom.moreContentAssetIDs;

    if (contentAssetIds) {
        for (var i = 0; i < contentAssetIds.length; i++) {
            var contentAsset = ContentMgr.getContent(contentAssetIds[i]);
            if (contentAsset && contentAsset.custom && contentAsset.custom.body) {
                collectionContentList.add(contentAsset.custom.body);
            }
        }
    }

    return collectionContentList;
}


/**
 * gets the text level validation for embossing message while a user adds personalization
 * @param apiProduct
 * @returns
 */
function getEmbossingTextValidation(apiProduct) {
    var embossFeilds = Site.getCurrent().getCustomPreferenceValue('embossingTextValidations');

    if (embossFeilds) {
        embossFeilds = JSON.parse(embossFeilds);
    }
    return embossFeilds;
}


/**
 * populates the recommendation items based on recommendation type
 * @param product
 * @param productTileParams
 * @returns {Array}
 */
function getRecommendations(recommendationsList, product, recommendationTypeIds) {
    var recommendation;
    var productRecommendations;
    productRecommendations = product.recommendations;

    if (productRecommendations && recommendationTypeIds) {
        for (var k = 0; k < recommendationTypeIds.length; k++) {
            for (var i = 0; i < productRecommendations.length; i++) {
                recommendation = productRecommendations[i];

                if (recommendation && recommendation.recommendedItem && recommendation.recommendedItem.online) {
					/* populate recommendation array based on recommendation type*/
                    if (recommendationTypeIds[k] == recommendation.recommendationType) {
                        recommendationsList.push({
                            productId: recommendation.recommendedItem.ID
                        });
                    }
                }
            }
        }
    }

    Logger.getLogger('ProductCustomHelpers').debug('Recommendation populated Successfully : ');
    return recommendationsList;
}

/**
 * populates the recommendation items based on recommendation type
 * @param product
 * @param productTileParams
 * @returns {Array}
 */
function getMoreStyleRecommendations(recommendationsList, product, recommendationTypeIds) {
    var productTile = require('*/cartridge/models/product/productTile');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var recommendation;
    var productRecommendations;
    productRecommendations = product.recommendations;
    var productTileParams = {};
    var product = {};
    var apiProduct = {};
    var productType = {};
    var recommenadationProduct = {};
    var recommenadationProductUrl = '';

    if (productRecommendations && recommendationTypeIds) {
        for (var k = 0; k < recommendationTypeIds.length; k++) {
            for (var i = 0; i < productRecommendations.length; i++) {
                recommendation = productRecommendations[i];

				/* populate recommendation array based on recommendation type*/
                if (recommendationTypeIds[k] == recommendation.recommendationType) {
                    productTileParams = { pview: 'tile', pid: recommendation.recommendedItem.ID };
                    product = Object.create(null);
                    apiProduct = ProductMgr.getProduct(recommendation.recommendedItem.ID);
                    productType = productHelper.getProductType(apiProduct);
                    recommenadationProduct = productTile(product, apiProduct, productType, productTileParams);
                    if (recommenadationProduct) {
                        recommenadationProductUrl = URLUtils.url('Product-Show', 'pid', recommendation.recommendedItem.ID).toString();
                        recommendationsList.push({
                            productId: recommendation.recommendedItem.ID,
                            productImages: recommenadationProduct.images,
                            productUrl: recommenadationProductUrl,
                            productName: recommendation.recommendedItem.name
                        });
                    }
                }
            }
        }
    }

    Logger.getLogger('ProductCustomHelpers').debug('Recommendation populated Successfully : ');
    return recommendationsList;
}

/**
 * gets the text level validation for engraving message while a user adds personalization
 * @param apiProduct
 * @returns
 */
function getEngravingTextValidation(apiProduct) {
    var engraveFeilds = Site.getCurrent().getCustomPreferenceValue('engravingTextValidations');

    if (engraveFeilds) {
        engraveFeilds = JSON.parse(engraveFeilds);
    }
    return engraveFeilds;
}


/**
 * gets the custom site preferences being used in the product model
 * @returns
 */
function getPrefrences() {
    var prefs = {};
    var recommendationTitle = Site.getCurrent().getCustomPreferenceValue('recommendationsTitle');
    var recommendationCarouselConfig = Site.getCurrent().getCustomPreferenceValue('recommendationCarouselConfig');
    var bottomSectionRecommendation = Site.getCurrent().getCustomPreferenceValue('bottomSectionRecommendation');
    var isRecommendationTitleLeftAligned = Site.getCurrent().getCustomPreferenceValue('isRecommendationTitleLeftAligned');

    if (recommendationTitle) {
        prefs.recommendationsTitle = recommendationTitle;
    }
    if (recommendationCarouselConfig) {
        prefs.recommendationCarouselConfig = recommendationCarouselConfig.replace(/[\n\s]/gi, '');
    }
    if (bottomSectionRecommendation) {
        prefs.bottomSectionRecommendation = bottomSectionRecommendation;
    }
    if (isRecommendationTitleLeftAligned) {
        prefs.isRecommendationTitleLeftAligned = isRecommendationTitleLeftAligned;
    }
    return prefs;
}

/**
 * @param engravedMessage
 * @returns
 */
function validateEngraveMessage(engravedMessage) {
    var regex = new RegExp("^[A-Za-z0-9\/\\.\\?\\!\\,\\;\\:\\-\\(\\)\\'\\*\\&\\$\\\"\\\n]+$", 'i');
    var engravedMessageLines = engravedMessage.split(NEWLINE);
    var line1 = true;
    var line2 = true;
    var results = '';
    if (engravedMessageLines.length > 0 && engravedMessageLines.length <= 2) {
        if (engravedMessageLines[0] && engravedMessageLines[0].length <= 10) {
            line1 = regex.test(engravedMessageLines[0]);
        }
        if (engravedMessageLines[1] && engravedMessageLines[1].length <= 10) {
            line2 = regex.test(engravedMessageLines[1]);
        }
        var results = !!(line1 && line2);
        return results;
    }
    return false; // more than 2 lines
}

/**
 *
 * @param embossMessage
 * @returns
 */
function validateEmbossMessage(embossMessage) {
    var regex = new RegExp("^[A-Za-z0-9\/\\.\\?\\!\\,\\;\\:\\-\\(\\)\\'\\*\\&\\$\\\"\\\n]+$", 'i');
    var results = '';
    if (embossMessage.length <= 2) {
        results = regex.test(embossMessage);
    }
    return results;
}

/**
*
* @param embossMessage
* @param characterLimit
* @returns
*/
function validateEmbossMessageByOrientation(embossMessage, characterLimit) {
   var regex = new RegExp("^[A-Za-z0-9\/\\.\\?\\!\\,\\;\\:\\-\\(\\)\\'\\*\\&\\$\\\"\\\n]+$", 'i');
   var results = '';
   if (embossMessage.length <= characterLimit) {
       results = regex.test(embossMessage);
   }
   return results;
}

/**
 * Validate Personalization message and update options and
 * Store session data for apple pay for options & message
 *
 * @param params
 * @param req
 * @returns
 */
function updateOptionsAndMessage(req, params) {
    
    var embossedMessage = params.EmbossedMessage;
    var previousEmbossOptionId = params.EmbossedFirstOptionID;

    var engravedMessage = params.EngravedMessage;
    var previousEngraveOptionId = params.EngravedFirstOptionID;
    
    //For OliviaBurtonUK validate by orientation character limit
    var characterLimit = 2;
    var siteID = Site.getCurrent().getID();
    if (siteID == 'OliviaBurtonUK' || siteID == 'OliviaBurtonUS') {
        
        var embossingCharacterLimitValidation = Site.getCurrent().getCustomPreferenceValue('embossingTextValidations');
        if (embossingCharacterLimitValidation) {
            embossingCharacterLimitValidation = JSON.parse(embossingCharacterLimitValidation);
        }
        
        
        if(params.orientation == 'isVertical') {
            characterLimit = embossingCharacterLimitValidation.verticalTextLimit;
        } else if (params.orientation == 'isHorizontal') {
            characterLimit = embossingCharacterLimitValidation.horizontalTextLimit;
        }
    }
    
	// Check for embossedMessage/engravedMessage received
    if (embossedMessage || engravedMessage) {
        var validEmbossMessage = true;
        var validEngraveMessage = true;

		// validate embossedMessage message
        if (embossedMessage) {
            if (siteID == 'OliviaBurtonUK' || siteID == 'OliviaBurtonUS') { 
                validEmbossMessage = validateEmbossMessageByOrientation(embossedMessage, characterLimit);
            } else {
                validEmbossMessage = validateEmbossMessage(embossedMessage);
            }
            
            if (!validEmbossMessage) {
                params.validationErrorEmbossed = Resource.msg('error.emboss.message', 'product', null);
                req.session.raw.custom.appleEmbossedMessage = '';
            }
        }

		// validate engravedMessage message
        if (engravedMessage) {
            validEngraveMessage = validateEngraveMessage(engravedMessage);
            if (!validEngraveMessage) {
                params.validationErrorEngraved = Resource.msg('error.engrave.message', 'product', null);
                req.session.raw.custom.appleEngravedMessage = '';
            }
        }

		// if either of the message  validation failed then update with default option
        if (params.validationErrorEmbossed || params.validationErrorEngraved) {
            if (params.validationErrorEmbossed && previousEmbossOptionId != null) {
                for (var i = 0; i < params.options.length; i++) {
                    if (params.options[i].optionId === EMBOSSED) {
                        params.options[i].selectedValueId = previousEmbossOptionId;
                    }
                }
            }
            if (params.validationErrorEngraved && previousEngraveOptionId != null) {
                for (var i = 0; i < params.options.length; i++) {
                    if (params.options[i].optionId === ENGRAVED) {
                        params.options[i].selectedValueId = previousEngraveOptionId;
                    }
                }
            }
        }
    }

	// populate session variable for apple pay
    req.session.raw.custom.appleProductId = params.pid;
    if (params.options) {
        for (var i = 0; i < params.options.length; i++) {
            var option = params.options[i];
            if (option.optionId === EMBOSSED) {
                req.session.raw.custom.appleEmbossOptionId = option.selectedValueId;
                if (embossedMessage && !params.validationErrorEmbossed) {
                    req.session.raw.custom.appleEmbossedMessage = embossedMessage.toUpperCase();
                }
            }
            if (option.optionId === ENGRAVED) {
                req.session.raw.custom.appleEngraveOptionId = option.selectedValueId;
                if (engravedMessage && !params.validationErrorEngraved) {
                    req.session.raw.custom.appleEngravedMessage = engravedMessage;
                }
            }
        }
    }

    return params;
}

/**
 *
 * @param productOptions
 * @returns productOption
 */
function getProductOptions(productOptions) {
    var prodOptionArray = '';
    if (productOptions.empty != true) {
        collections.forEach(productOptions, function (productOption) {
            if (prodOptionArray == '' && productOption.ID != 'GiftWrapped') {
                prodOptionArray = productOption.ID;
            } else if (productOption.ID != 'GiftWrapped') {
                prodOptionArray += ',' + productOption.ID;
            }
        });
    }
    return prodOptionArray;
}

/**
 *
 * @param productIds
 * @returns wishlistGtmObj
 */
function getWishlistGtmObj(product) {
    var wishlistGtmObj = [];
    if (request.httpURL != null) {
        wishlistGtmObj.push({
            event: 'dataTrack',
            eventCategory: 'Wishlist Add',
            eventAction: request.httpURL,
            eventLabel: product.productName + '|' + product.id
        });
    }

    return wishlistGtmObj[0];
}

/**
 *
 * @param productIds
 * @returns wishlistGtmObj
 */
function getWishlistGtmObjforPDP(product) {
    var wishlistGtmObj = [];
    if (request.httpURL != null) {
        wishlistGtmObj.push({
            event: 'dataTrack',
            eventCategory: 'Wishlist Add',
            eventAction: request.httpURL,
            eventLabel: product.name + '|' + product.ID
        });
    }

    return wishlistGtmObj[0];
}
/**
 *
 * @param productIds
 * @returns wishlistGtmObj
 */
function getGtmProductClickObj(product, categoryName, position) {
    var productClickGtmObj = [];
    if (categoryName != null) {
        productClickGtmObj.push({
            name: escapeQuotes(product.productName),
            id: product.id,
            price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
            brand: product.brand,
            category: escapeQuotes(categoryName),
            position: position,
            list: 'PLP'
        });
    }	else {
        var productObj = ProductMgr.getProduct(product.id);
        var category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? productObj.masterProduct.primaryCategory.ID
				: '')
				: ((productObj.primaryCategory != null) ? productObj.primaryCategory.ID
						: ''))
				: '');
        productClickGtmObj.push({
            name: product.productName,
            id: product.id,
            price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
            brand: product.brand,
            category: category,
            position: position,
            list: 'Search Results'
        });
    }

    return productClickGtmObj[0];
}

/**
 *
 * @param product
 * @param categoryName
 * @param position
 * @returns
 */
function getProductGtmObj(product, categoryName, position) {
    var productGtmObj = [];
    if (categoryName != null) {
        productGtmObj.push({
	          name: escapeQuotes(product.productName),
	          id: product.id,
	          price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
	          currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
	          brand: product.brand,
	          category: escapeQuotes(categoryName),
	          list: 'PLP',
	          position: position
	         });
    }	else {
        var productObj = ProductMgr.getProduct(product.id);
        var category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? productObj.masterProduct.primaryCategory.ID
				: '')
				: ((productObj.primaryCategory != null) ? productObj.primaryCategory.ID
						: '')) : '');
        productGtmObj.push({
	          name: product.productName,
	          id: product.id,
	          price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
	          currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
	          brand: product.brand,
	          category: category,
	          list: 'Search Results',
	          position: position
	         });
    }

    return productGtmObj[0];
}

/**
 *
 * @param product
 * @param categoryName
 * @param position
 * @returns
 */
function getQVGtmObj(product, categoryName) {
    var productGtmObj = [];
    var variant = '';
    var category = '';
    var productObj = ProductMgr.getProduct(product.id);
    if (productObj && productObj.optionModel) {
        variant = getProductOptions(productObj.optionModel.options);
    }
    if (categoryName == null) {
        category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? productObj.masterProduct.primaryCategory.ID
				: '')
				: ((productObj.primaryCategory != null) ? productObj.primaryCategory.ID
						: ''))
				: '');
    } else {
        category = escapeQuotes(categoryName);
    }
    productGtmObj.push({
	          name: escapeQuotes(product.productName),
	          id: product.id,
	          price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
	          brand: product.brand,
	          category: category,
	          list: 'Quick View',
	          variant: variant
	         });
    return productGtmObj[0];
}


/**
 * Function to escape quotes
 * @param value
 * @returns escape quote value
 */
function escapeQuotes(value) {
    if (value != null) {
        return value.replace(/'/g, '');
    }
    return value;
}

function getShopBagLabel(product) {
    var shopBagLabel = product.custom.shopbagLabel;
    return shopBagLabel;
}

function getSapLineStatus(product) {
    return product.custom.sapLineStatus ? product.custom.sapLineStatus : '';
}

/**
 * populates GTM obj for more style products
 * @param product
 * @returns {Array}
 */
function getMoreStyleGtmArray(product, recommendationTypeIds) {
    var recommendation;
    var productRecommendations;
    var moreStylesGtmObj = [];
    productRecommendations = product.recommendations;

    if (productRecommendations && recommendationTypeIds) {
        for (var k = 0; k < recommendationTypeIds.length; k++) {
            for (var i = 0; i < productRecommendations.length; i++) {
                recommendation = productRecommendations[i];
                if (recommendationTypeIds[k] == recommendation.recommendationType) {
                    var variant = '';
                    if (recommendation && recommendation.recommendedItem && recommendation.recommendedItem.optionModel) {
                        variant = getProductOptions(recommendation.recommendedItem.optionModel.options);
                    }
                    moreStylesGtmObj.push({
                        id: recommendation.recommendedItem.ID,
                        name: recommendation.recommendedItem.name,
                        brand: recommendation.recommendedItem.brand,
                        variant: variant,
                        category: escapeQuotes(recommendation.recommendedItem.variant ? ((recommendation.recommendedItem.masterProduct != null && recommendation.recommendedItem.masterProduct.primaryCategory != null) ? recommendation.recommendedItem.masterProduct.primaryCategory.ID
								: '')
								: ((recommendation.recommendedItem.primaryCategory != null) ? recommendation.recommendedItem.primaryCategory.ID
										: '')),
                        price: recommendation.recommendedItem.priceModel.price.value,
                        position: i + 1
                    });
                }
            }
        }
    }
    return moreStylesGtmObj;
}

/**
 *
 * @param pid
 * @returns formatted pid
 */
function formatProductId(pid) {
    if (pid != null && pid.indexOf('%') > -1) {
        return pid.replace(/%20/g, ' ');
    }

    return pid;
}

/**
 * method used to get products attribute
 * @param {dw.catalog.Product} apiProduct 
 * @param {Number} quantity
 * @returns {Object} marketingProduct
 */

function getMarketingProducts(apiProduct, quantity) {
    var Logger = require('dw/system/Logger');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var priceFactory = require('*/cartridge/scripts/factories/price');
    var productFactory = require('*/cartridge/scripts/factories/product');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');

    try {
        var defaultVariant = apiProduct.variationModel.defaultVariant;
        var defaultVariantPrice;
        var marketingProductData;
        var price;
        var productType = productHelper.getProductType(apiProduct);
        var productModel;

        if (apiProduct.master) {
            var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(defaultVariant);
            defaultVariantPrice = priceFactory.getPrice(defaultVariant, null, false, promotions, null);
        }
        productModel = productFactory.get({pid: apiProduct.ID});

        if (defaultVariantPrice) {
            if(defaultVariantPrice.sales) {
                price = defaultVariantPrice.sales.value;
            } else {
                price = defaultVariantPrice.list.value;
            }
        } else {
            if (productModel.price && productModel.price.sales) {
                price = productModel.price.sales.value;
            } else {
                price = prodcutModel.price.list.value;
            }
        }

        var productCategory = '';
        var apiCategories;

        if (apiProduct.getOnlineCategories().length > 0) {
            apiCategories = apiProduct.getOnlineCategories();
            productCategory = stringUtils.removeSingleQuotes(apiCategories[apiCategories.length-1].displayName);
        }

        if (empty(productCategory) && apiProduct.variant &&
            apiProduct.variationModel.master.getOnlineCategories().length > 0) {
                apiCategories = apiProduct.variationModel.master.getOnlineCategories();
                productCategory = stringUtils.removeSingleQuotes(apiCategories[apiCategories.length-1].displayName);
        }

        marketingProductData = {
            name: stringUtils.removeSingleQuotes(apiProduct.name),
            id: apiProduct.ID,
            price: price,
            category: productCategory,
            sku: apiProduct.ID,
            variantID: apiProduct.variant ? apiProduct.ID : '',
            brand: stringUtils.removeSingleQuotes(apiProduct.brand),
            currentCategory: productCategory,
            productType: productType,
            quantity: quantity
        };
        return marketingProductData;
    } catch (e) {
        Logger.error('Error occurred while generating products json. Product {0}: \n Error: {1} \n Message: {2} \n', apiProduct , e.stack, e.message);
        return null;
    }
}

/**
 * Checks for redesigned 
 * @param {Object} product - 
 * @returns {boolean} isRedesignedBadge - Returns true if redesigned badge
 */
function isOnlyRedesignedBadge(product) {
    var isRedesignedBadge = false;
    if( product.badges && product.badges.imageBadges && product.badges.imageBadges.length == 1 
        && ((product.badges.imageBadges[0].imageUrl.toString().indexOf('badgeVeganFriendly') > -1) 
        ||  (product.badges.imageBadges[0].imageUrl.toString().indexOf('badgeEcoFriendly') > -1 ))) {
            isRedesignedBadge = true
    }
    return isRedesignedBadge;
}

/**
 * It is used to get productCustomAttribute for Details and Specs Sections on PDP
 * @param {Object} apiProduct - apiProduct is from ProductMgr
 * @returns {Object} - detailAndSpecAttributes object
 */

 function getPdpDetailAndSpecsAttributes(apiProduct) {
    var category = null;
    var pdpDetailAttributes = [];
    var pdpSpecAttributes = [];
    try {
        var categoriesConfig = !empty(Site.getCurrent().getCustomPreferenceValue('specDetailsAttributesConfigJSON')) ? JSON.parse(Site.getCurrent().getCustomPreferenceValue("specDetailsAttributesConfigJSON")) : '';

        if (!empty(categoriesConfig) && !empty(apiProduct)) {
            category = getCategoryConfig(apiProduct, categoriesConfig);
        }

        if (empty(category) && apiProduct.variant) {
            category = getCategoryConfig(apiProduct.variationModel.master, categoriesConfig);
        }

        if (!empty(category)) {
            var attributes = category.attributes;
            if (!empty(attributes)) {
                for (var attributesIndex = 0; attributesIndex < attributes.length; attributesIndex++) {
                    try {
                        var id = attributes[attributesIndex].ID;
                        var displayName = attributes[attributesIndex].displayName;
                        var isCustom =  attributes[attributesIndex].custom;
                        var section = attributes[attributesIndex].section;
                        var image = attributes[attributesIndex].image;
                        var value = null;
                        if (id == 'ringSize') {
                            var ringSizes = !empty(Site.getCurrent().getCustomPreferenceValue('ringSize')) ? Site.getCurrent().getCustomPreferenceValue("ringSize") : '';
                            value = ringSizes.filter(function(ringSize){ return ringSize.split(',')[0] === apiProduct.custom[id] });
                            value = value.length > 0 ? value[0] : null;
                        } else {
                            if (isCustom) {
                                value = (!empty(id) || !empty(apiProduct.custom[id])) ? apiProduct.custom[id] : '';
                            } else {
                                value = (!empty(id) || !empty(apiProduct[id])) ? apiProduct[id] : '';
                            }
                        }
                        if (!empty(value)) {
                            var attribute = {
                                displayName: displayName,
                                value: value,
                                section: section,
                                image: image
                            };

                            for (var sectionIndex = 0; sectionIndex < section.length; sectionIndex++) {
                                var currentSection = section[sectionIndex];
                                if (currentSection == 'details') {
                                    pdpDetailAttributes.push(attribute);
                                }
                                if (currentSection == 'specs') {
                                    pdpSpecAttributes.push(attribute);
                                }
                            }
                        }
                    } catch (e) {
                        Logger.error('(productCustomHepler.js -> getPdpDetailAndSpecsAttributes) Error occured while setting the attributes values in the object : ' + e);
                    }
                }
            }
        }
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getPdpDetailAndSpecsAttributes) Error occured while reading json from site preferences: ' + e);
    }
    return detailAndSpecAttributes = {
        pdpDetailAttributes: pdpDetailAttributes,
        pdpSpecAttributes: pdpSpecAttributes
    };

}

/**
 * It is used to get category object of current product
 * @param {Object} apiProduct - apiProduct is from ProductMgr
 * @param {Object} categoriesConfig - categories json configured in site preference
 * @returns {Object} - category object
 */

 function getCategoryConfig(apiProduct, categoriesConfig) {
    var categoryConfigFound = false;
    var category = null;
    var currentCategory;
    var locale;
    var currentLocale;
    var apiCategories = apiProduct.getOnlineCategories().iterator();
    while (apiCategories.hasNext()) {
        currentCategory = apiCategories.next();
        locale = request.locale;
        currentLocale = categoriesConfig[locale];
        category = currentLocale[currentCategory.ID];
        
        if (!empty(category)) {
            break;
        }

        while (currentCategory.parent != null) {
            currentCategory = currentCategory.parent;
            if (!empty(currentCategory)) {
                locale = request.locale;
                currentLocale = categoriesConfig[locale];
                category = currentLocale[currentCategory.ID];
                if (!empty(category)) {
                    categoryConfigFound = true;
                    break;
                }
            }
        } //End inner while

        if (categoryConfigFound) {
            break;
        }
    } //End outer while
    return category;
}

module.exports = {
    getBadges: getBadges,
    getPdpAttributes: getPdpAttributes,
    getPdpDetailAndSpecsAttributes: getPdpDetailAndSpecsAttributes,
    getCategoryConfig: getCategoryConfig,
    getPersonalizationAssets: getPersonalizationAssets,
    getEmbossingTextValidation: getEmbossingTextValidation,
    getEngravingTextValidation: getEngravingTextValidation,
    getRecommendations: getRecommendations,
    getMoreCollectionIdHeader: getMoreCollectionIdHeader,
    getPrefrences: getPrefrences,
    getMoreStyleRecommendations: getMoreStyleRecommendations,
    getProductOptions: getProductOptions,
    getWishlistGtmObj: getWishlistGtmObj,
    getGtmProductClickObj: getGtmProductClickObj,
    escapeQuotes: escapeQuotes,
    getShopBagLabel: getShopBagLabel,
    validateEngraveMessage: validateEngraveMessage,
    validateEmbossMessage: validateEmbossMessage,
    updateOptionsAndMessage: updateOptionsAndMessage,
    getProductGtmObj: getProductGtmObj,
    getQVGtmObj: getQVGtmObj,
    getMoreStyleGtmArray: getMoreStyleGtmArray,
    formatProductId: formatProductId,
    getWishlistGtmObjforPDP: getWishlistGtmObjforPDP,
    getMarketingProducts : getMarketingProducts,
    isOnlyRedesignedBadge: isOnlyRedesignedBadge
};
