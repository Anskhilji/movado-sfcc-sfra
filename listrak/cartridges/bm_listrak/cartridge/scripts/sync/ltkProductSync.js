/* eslint-disable block-scoped-var */
/**
 * Purpose:	Exports Product Catalog. Product file is sent to Listrak via FTP.
 */

require('dw/catalog');
require('dw/svc');
require('dw/value');
require('dw/web');
require('dw/system');
require('dw/util');
require('dw/net');
require('dw/object');

var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');

var ErrorHandling = require('~/cartridge/scripts/util/ltkErrorHandling.js');
importScript('sync/ltkExportUtils.js');
importScript('objects/ltkProduct.js');

var Constants = require('*/cartridge/scripts/util/Constants');

/**
 *  buildsp product file to send to Listrak
 */
function productSync() {
    var enabled = dw.system.Site.current.preferences.custom.Listrak_ProductExport_Enabled;
    if (!empty(enabled) && !enabled) {
        return;
    }
    var includeOfflineProducts = dw.system.Site.current.preferences.custom.Listrak_ProductExport_IncludeOfflineProducts;

    var calendar = new Calendar();
    var currentExportStartTime = calendar.getTime().toISOString();
    var lastExport = new ltkExportInfo('lastProductExportDate');

    var subCategoryLevels = dw.system.Site.current.preferences.custom.Listrak_SubcategoryLevels;
    // If maxRelated = 0, related products won't be exported
    var maxRelated = dw.system.Site.current.preferences.custom.Listrak_MaxRecommendedProductExport;
    var categoryLevelAttributes = Site.getCurrent().getCustomPreferenceValue('Listrak_CategoryLevelAttributes');
    var getAssignedCategories = Site.getCurrent().getCustomPreferenceValue('Listrak_ConfiguredCategories');
    var productFeedJewelryJson = Site.getCurrent().getCustomPreferenceValue('Listrak_ProductFeedJewelryAttribute');

    // Custom Start: [MSS-2385 Listrak - Olivia Burton - Product Feed Changes]
    var productFeedCaseMeterialJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedCaseMaterialAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedCaseMaterialAttribute : '';
    var productFeedColorJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedColorAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedColorAttribute : '';
    var productFeedAttachmentTypeJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedAttachmentTypeAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedAttachmentTypeAttribute : '';
    var productFeedStrapColorJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedStrapColorAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedStrapColorAttribute : '';
    var productFeedJewelryStyleJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedJewelryStyleAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedJewelryStyleAttribute : '';
    // Custom End

    var productFeedMaterialJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedMaterialAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedMaterialAttribute : '';
    var productFeedDialBackgroundColorJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedDialBackgroundColorAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedDialBackgroundColorAttribute : '';
    var productFeedJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedGenderAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedGenderAttribute : '';
    var productFeedDialColorJson = !empty(Site.current.preferences.custom.Listrak_ProductFeedDialColorAttribute) ? Site.current.preferences.custom.Listrak_ProductFeedDialColorAttribute : '';

    if (subCategoryLevels <= 0) {
        subCategoryLevels = 1;
    } // if not set, use default of 1

    var prods = dw.catalog.ProductMgr.queryAllSiteProducts();

    if (prods.hasNext()) {
        try {
            var productFile = new ExportFile('products_DW.txt');

            // //////// Write header row //////////
            productFile.AddRowItem('Sku');
            productFile.AddRowItem('Variant');
            productFile.AddRowItem('Title');
            productFile.AddRowItem('ImageUrl');
            productFile.AddRowItem('LinkUrl');
            productFile.AddRowItem('Description');
            productFile.AddRowItem('Price');
            productFile.AddRowItem('Brand');
            productFile.AddRowItem('Category');
            productFile.AddRowItem('SubCategory');
            if (empty(productFeedJewelryJson)) {
                for (var i = 2; i <= subCategoryLevels; i++) {
                    var fieldName = 'SubCategory' + i.toString();
                    productFile.AddRowItem(fieldName);
                }
            }
            productFile.AddRowItem('CategoryTree');
            productFile.AddRowItem('QOH');
            productFile.AddRowItem('InStock');
            productFile.AddRowItem('SystemInStock');
            productFile.AddRowItem('MasterSku');
            productFile.AddRowItem('ReviewProductID');

            var additionalAttributes = dw.system.Site.current.preferences.custom.Listrak_Additional_Attributes;
            var idx = 0;
            for (idx = 0; idx < additionalAttributes.length; idx++) {
                productFile.AddRowItem(additionalAttributes[idx]);
            }

            for (var x = 1; x <= maxRelated; x++) {
                productFile.AddRowItem('Related_Sku_' + x.toString());
                productFile.AddRowItem('Related_Type_' + x.toString());
                productFile.AddRowItem('Related_Rank_' + x.toString());
            }

            // Custom Start: Add Sales Info [MSS-1473]
            productFile.AddRowItem('OnSale');
            // Custom End

            // Custom Start: Adding category value [MSS-1473]
            productFile.AddRowItem('CategoryValue');
            // Custom End

            // Custom Start: [MSS-1690 Add Sale Price Information]
            productFile.AddRowItem('SalePrice');
            // Custom End

            // Custom Start: [MSS-1696 Listrak - Create New Product Feed for MVMT - Add Gender]
            if (!empty(productFeedJson)) {
                productFile.AddRowItem('Gender');
            }
            // Custom End

            // Custom Start: [MSS-1697 Add Collection URL, Strap Width, Case Diameter, Family Name to Listrak MVMT Product Feed]
            if (categoryLevelAttributes) {
                productFile.AddRowItem('Review URL');
                productFile.AddRowItem('Meta4');
                productFile.AddRowItem('Meta5');
                productFile.AddRowItem('Style');
                productFile.AddRowItem('Meta1');
                productFile.AddRowItem('Size');
            }
            // Custom End

            // Custom Start: [MSS-2376 MCS - Listrak Product Feed Update]
            if (Site.current.ID === 'MCSUS') {
                productFile.AddRowItem('Meta4');
            }
            // Custom End

            // Custom Start: [MSS-1966 Listrak - MCS Feed Changes]
            if (!empty(getAssignedCategories)) {
                productFile.AddRowItem('Meta5');
            }
            // Custom End:

            // Custom Start: [MSS-2302 Movado - Listrak - New Product Feed]
            if (Site.current.ID === 'MovadoUS') {
                if (!empty(productFeedMaterialJson)) {
                    productFile.AddRowItem('Meta2');
                }

                productFile.AddRowItem('Meta3');
                productFile.AddRowItem('Meta4');
                productFile.AddRowItem('Color');
            }

            if (!empty(productFeedDialColorJson)) {
                productFile.AddRowItem('Style');
            }

            if (Site.current.ID === 'MovadoUS') {
                productFile.AddRowItem('Size');
            } 
            
            if (Site.current.ID === 'MCSUS') {  // Custom Start: [MSS-2376 MCS - Listrak Product Feed Update]
                productFile.AddRowItem('Color');
                productFile.AddRowItem('Size');
                productFile.AddRowItem('Style');

                if (!empty(productFeedMaterialJson)) {
                    productFile.AddRowItem('Meta2');
                }
            }
            
            if (!empty(productFeedDialBackgroundColorJson)) {
                productFile.AddRowItem('Meta3');
            }
            // Custom End

            // Custom Start: [MSS-2385 Listrak - Olivia Burton - Product Feed Changes]
            if (Site.current.ID === 'OliviaBurtonUS' || Site.current.ID === 'OliviaBurtonUK') {
                if (!empty(productFeedAttachmentTypeJson) && !empty(productFeedJewelryStyleJson)) {
                    productFile.AddRowItem('Style');
                }
                productFile.AddRowItem('Size');
                if (!empty(productFeedStrapColorJson)) {
                    productFile.AddRowItem('Color');
                }
            }
            // Custom End

            productFile.WriteRow();

            // //////// Write product rows //////////
            for (idx = 0; idx < prods.getCount(); idx++)			{
                if (prods.hasNext()) { var product = prods.next(); } else { break; }
                var rpSkus = [];
                if (maxRelated > 0)					{ var relatedProducts = product.getOrderableRecommendations(); }
                // Modification D. Gomez 8/29/2017 v16.4 fix offlineproducts check

                var prd = new ltkProduct();
                prd.LoadProduct(product);
                if (!product.getOnlineFlag()) {
                    if (!includeOfflineProducts) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                }
                // grab recommended products
                var numRelated = 0;
                if (maxRelated > 0 && !relatedProducts.empty) {
                    numRelated = Math.min(maxRelated, relatedProducts.length);
                    for (rpID = 0; rpID < numRelated; rpID++) {
                        rpSkus.push({
                            sku: relatedProducts[rpID].recommendedItemID,
                            type: getRelatedType(relatedProducts[rpID].recommendationType)
                        });
                    }
                }


                // Sku
                productFile.AddRowItem(prd.sku, true);

                // Variant
                productFile.AddRowItem(prd.variant, true);

                // Title
                productFile.AddRowItem(prd.title, true);

                // Image URL
                productFile.AddRowItem(prd.imageURL, true);

                // Link URL
                productFile.AddRowItem(prd.linkURL, true);

                // Description
                productFile.AddRowItem(prd.description, true);

                // Price
                productFile.AddRowItem(prd.price == null ? 0.00 : prd.price, true);

                // Brand
                // Custom Start: [MSS-2302 Movado - Listrak - New Product Feed]
                if (Site.current.ID === 'MovadoUS') {
                    productFile.AddRowItem(prd.familyName, true);
                } else {
                    productFile.AddRowItem(prd.brand, true);
                }
                // Custom End

                if (Site.current.ID === 'MCSUS') {
                    if (!empty(productFeedJewelryJson)) {
                        productFile.AddRowItem(prd.jewelryType, true); // Jewelry Type
                    }
                    productFile.AddRowItem(prd.familyName, true);
                } else if (Site.current.ID === 'OliviaBurtonUS' || Site.current.ID === 'OliviaBurtonUK') {
                    if (prd.productStyle === Constants.WATCHES_CATEGORY) {
                        if (!empty(productFeedCaseMeterialJson)) {
                            productFile.AddRowItem(prd.caseMaterial, true);
                        } else {
                            productFile.AddRowItem('', true);
                        }
                        productFile.AddRowItem(prd.familyName, true);
                    } else if (prd.productStyle === Constants.JEWELRY_CATEGORY) {
                        if (!empty(productFeedColorJson)) {
                            productFile.AddRowItem(prd.color, true);
                        } else {
                            productFile.AddRowItem('', true);
                        }
                        productFile.AddRowItem(prd.familyName, true);
                    } else {
                        productFile.AddRowItem('', true);
                        productFile.AddRowItem(prd.familyName, true);
                    }
                } else {
                    // Category
                    productFile.AddRowItem(prd.categories[0], true); // Category
                    if (!empty(productFeedJewelryJson)) {
                        productFile.AddRowItem(prd.jewelryType, true); // Jewelry Type
                    } else {
                        productFile.AddRowItem(prd.categories[1], true); // Sub-category
                        for (i = 2; i <= subCategoryLevels; i++) {
                            productFile.AddRowItem(prd.categories[i], true);
                        }
                    }
                }
                
                // CategoryTree
                var tree = '';
                var index = 0;
                // for each(category in prd.categories) {
                for (i = 0; i < prd.categories.length; i++) {
                    var category = prd.categories[i];
                    if (index === 0) {
                        tree = category;
                    } else {
                        tree += ' > ' + category;
                    }
                    index++;
                }
                productFile.AddRowItem(tree, true);

                // Quantity On Hand
                productFile.AddRowItem(prd.QOH, true);

                // InStock
                productFile.AddRowItem(prd.inStock, true);

                // system in stock
                productFile.AddRowItem(prd.SystemInStock, true);

                // MasterSku
                productFile.AddRowItem(prd.masterSku, true);

                // ProductReviewID
                productFile.AddRowItem(prd.reviewProductID, true);

                // Additional Attributes
                for (i = 0; i < additionalAttributes.length; i++) {
                    var attr = additionalAttributes[i];
                    if (prd.additionalAttributeValues.containsKey(attr)) {
                        productFile.AddRowItem(prd.additionalAttributeValues.get(attr), true);
                    } else { productFile.AddRowItem('', true); }
                }

                // Related Products
                for (x = 0; x < maxRelated; x++) {
                    if (numRelated > x) { // this product has related product in this index
                        productFile.AddRowItem(rpSkus[x].sku);
                        productFile.AddRowItem(rpSkus[x].type);
                        productFile.AddRowItem(x + 1);
                    } else {
                        // send empty columns
                        productFile.AddRowItem();
                        productFile.AddRowItem();
                        productFile.AddRowItem();
                    }
                }

                // Custom Start: Adding Sales info [MSS-1473]
                productFile.AddRowItem(!empty(prd.onSale) && prd.onSale ? true : false, true);
                // Custom End

                // Custom Start: Adding Category Value [MSS-1473]
                productFile.AddRowItem(prd.categoryValue, true);
                // Custom End:

                // Custom Start: [MSS-1690 Add Sale Price Information]
                productFile.AddRowItem(!empty(prd.salePrice) ? prd.salePrice : '' , true);
                // Custom End

                // Custom Start: [MSS-1696 Listrak - Create New Product Feed for MVMT - Add Gender]
                if (!empty(productFeedJson)) {
                    productFile.AddRowItem(prd.watchGender, true);
                }
                // Custom End

                // Custom Start: [MSS-1697 Add Collection URL, Strap Width, Case Diameter, Family Name to Listrak MVMT Product Feed]
                if (categoryLevelAttributes) {
                    productFile.AddRowItem(prd.reviewURL, true);
                    productFile.AddRowItem(prd.meta4, true);
                    productFile.AddRowItem(prd.meta5, true);
                    productFile.AddRowItem(prd.style, true);
                    productFile.AddRowItem(prd.meta1, true);
                    productFile.AddRowItem(prd.size, true);
                }
                // Custom End

                // Custom Start: [MSS-2376 MCS - Listrak Product Feed Update]
                if (Site.current.ID === 'MCSUS') {
                    productFile.AddRowItem(prd.movement, true);
                }
                // Custom End

                // Custom Start: [MSS-1966 Listrak - MCS Feed Changes]
                if (!empty(getAssignedCategories)) {
                    productFile.AddRowItem(prd.meta5, true);
                }
                // Custom End

                // Custom Start: [MSS-2302 Movado - Listrak - New Product Feed]
                if (Site.current.ID === 'MovadoUS') {
                    if (!empty(productFeedMaterialJson)) {
                        productFile.AddRowItem(prd.meta2, true);
                    }

                    productFile.AddRowItem(prd.meta3, true);
                    productFile.AddRowItem(prd.movement, true);
                    productFile.AddRowItem(prd.strapColor, true);
                }

                if (!empty(productFeedDialColorJson)) {
                    productFile.AddRowItem(prd.dialColor, true);
                }

                if (Site.current.ID === 'MovadoUS') {
                    productFile.AddRowItem(prd.caseDiameter, true);
                } 

                // Custom Start: [MSS-2376 MCS - Listrak Product Feed Update]
                if (Site.current.ID === 'MCSUS') {  
                    productFile.AddRowItem(prd.strapColor, true);
                    productFile.AddRowItem(prd.caseDiameter, true);
                    productFile.AddRowItem(prd.meta3, true);

                    if (!empty(productFeedMaterialJson)) {
                        productFile.AddRowItem(prd.meta2, true);
                    }
                }   

                if (!empty(productFeedDialBackgroundColorJson)) {
                    productFile.AddRowItem(prd.dialBackgroundColor, true);
                }
                // Custom End

                // Custom Start: [MSS-2385 Listrak - Olivia Burton - Product Feed Changes]
                if (Site.current.ID === 'OliviaBurtonUS' || Site.current.ID === 'OliviaBurtonUK') {
                    if (prd.productStyle === Constants.WATCHES_CATEGORY) {
                        if (!empty(productFeedAttachmentTypeJson)) {
                            productFile.AddRowItem(prd.attachmentTypeAttr, true);
                        }
                    } else if (prd.productStyle === Constants.JEWELRY_CATEGORY) {
                        if (!empty(productFeedJewelryStyleJson)) {
                            productFile.AddRowItem(prd.jewelryStyle, true);
                        }
                    } else {
                        if (!empty(productFeedAttachmentTypeJson) && !empty(productFeedJewelryStyleJson)) {
                            productFile.AddRowItem('', true);
                        }
                    }

                    if (prd.productStyle === Constants.WATCHES_CATEGORY) {
                        productFile.AddRowItem(prd.productCaseDiameter, true);
                    } else {
                        productFile.AddRowItem('', true);
                    }
                    
                    if (prd.productStyle === Constants.WATCHES_CATEGORY) {
                        if (!empty(productFeedStrapColorJson)) {
                            productFile.AddRowItem(prd.strapColorAttr, true);
                        }
                    } else {
                        if (!empty(productFeedStrapColorJson)) {
                            productFile.AddRowItem('', true);                            
                        }
                    }                 
                }
                // Custom End

                productFile.WriteRow();
            }
        } catch (e) {
            ErrorHandling.reportError('Error creating product export file: ' + e.message, 'Low', 'ltkProductSync.ds');
        }

        var result = productFile.SubmitFile();
        prods.close();
        if (result === false) {
            return;
        }

        productFile.Delete();
        lastExport.SetValue(currentExportStartTime);
    }
}

/**
 * helper method
 * @param {*} type input
 * @returns {*} output
 */
function getRelatedType(type) {
    var typeString = '';
    switch (type) {
        case 1:
            typeString = 'Cross-sell';
            break;
        case 2:
            typeString = 'Up-sell';
            break;
        default:
            typeString = 'Cross-sell';
            break;
    }
    return typeString;
}

exports.productSync = productSync;
