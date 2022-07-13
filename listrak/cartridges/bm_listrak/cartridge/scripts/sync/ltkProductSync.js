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
            for (var i = 2; i <= subCategoryLevels; i++) {
                var fieldName = 'SubCategory' + i.toString();
                productFile.AddRowItem(fieldName);
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

            // Custom Start: [MSS-1697 Add Collection URL, Strap Width, Case Diameter, Family Name to Listrak MVMT Product Feed]
            if (Site.getCurrent().ID === 'MVMTUS' || Site.getCurrent().ID === 'MVMTEU') {
                productFile.AddRowItem('Review URL');
                productFile.AddRowItem('Meta4');
                productFile.AddRowItem('Meta5');
                productFile.AddRowItem('Style');
                productFile.AddRowItem('Meta1');
                productFile.AddRowItem('Size');
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
                productFile.AddRowItem(prd.brand, true);

				// Category
                productFile.AddRowItem(prd.categories[0], true); // Category
                productFile.AddRowItem(prd.categories[1], true); // Sub-category
                for (i = 2; i <= subCategoryLevels; i++) {
                    productFile.AddRowItem(prd.categories[i], true);
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
                productFile.AddRowItem(prd.onSale, true);
                // Custom End

                // Custom Start: Adding Category Value [MSS-1473]
                productFile.AddRowItem(prd.categoryValue, true);
                // Custom End:

                // Custom Start: [MSS-1690 Add Sale Price Information]
                productFile.AddRowItem(prd.onSale == true ? prd.salePrice : '' , true);
                // Custom End

                // Custom Start: [MSS-1697 Add Collection URL, Strap Width, Case Diameter, Family Name to Listrak MVMT Product Feed]
                if (Site.getCurrent().ID === 'MVMTUS' || Site.getCurrent().ID === 'MVMTEU') {
                    productFile.AddRowItem(prd.reviewURL, true);
                    productFile.AddRowItem(prd.meta4, true);
                    productFile.AddRowItem(prd.meta5, true);
                    productFile.AddRowItem(prd.style, true);
                    productFile.AddRowItem(prd.meta1, true);
                    productFile.AddRowItem(prd.size, true);
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
