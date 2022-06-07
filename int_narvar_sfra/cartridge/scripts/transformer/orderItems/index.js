'use strict';

const URLUtils = require('dw/web/URLUtils');
const util = require('../../utils/util');
const log = require('../../utils/log');
const custom = require('./custom');
const productAttirbutes = require('./productAttributes');

/**
 * This is a description of the getOrderItemStatus function.
 * This function is used to get item's status
 * @param {dw.order.ProductLineItem} productLineItem - This is the demandware product details
 * @returns {string} - item's status: This will return item's status e.g; SHIPPED or NOT_SHIPPED
 */
const getOrderItemStatus = function (productLineItem) {
    return productLineItem.shipment ? util.ITEM_STATUS_MAPPING[productLineItem.shipment.shippingStatus] : util.ITEM_STATUS_MAPPING.OPEN;
};

/**
 * This is a description of the checkIsBackOrdered function.
 * This function is used to get item is in back order or not.
 * @param {dw.order.OrderItem} orderItem - This is the demandware product details
 * @returns {boolean} - item's backordered status: This will return item's backordered status
 */
const checkIsBackOrdered = function (orderItem) {
    return orderItem ? util.ITEM_STATUS_MAPPING[orderItem.status.value] === util.ITEM_STATUS_MAPPING.BACKORDER : false;
};

/**
 * This is a description of the getValueAndUom function.
 * This is to split the actual value and its unit of measurement
 * @param {string} dimension - This is the value for a dimension
 * @returns {Array} - [value, unit]: Return value and unit of that value
 */
const getValueAndUom = function (dimension) {
    if (typeof dimension === 'object') {
        return dimension.toString().split(' ');
    }
    return dimension.split(' ');
};

/**
 * This is a description of the getBaseOrderItems function.
 * This function is used to get items details
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Object} - items: This will return items details
 */
const getBaseOrderItems = function (order) {
    let items = [];
    try {
        let itemPosition = 1;
        const shipments = order.shipments.toArray();
        shipments.forEach(function (shipment) {
            const productLineItems = shipment.productLineItems.toArray();
            productLineItems.forEach(function (productLineItem) {
                if (productLineItem.parent && !productLineItem.optionProductLineItem) {
                    log.sendLog('info', 'Skipped parent items');
                } else {
                    const product = productLineItem.product;
                    const discountAmount = productLineItem.price.subtract(productLineItem.proratedPrice);
                    const discountPercent = (Number(discountAmount.value / productLineItem.price.value) * 100).toFixed(2);

                    const orderItem = productLineItem.orderItem;
                    const item = {
                        item_id: productLineItem.productID,
                        product_id: productLineItem.productID,
                        sku: productLineItem.productID,
                        name: productLineItem.productName,
                        description: (product && product.shortDescription) ? product.shortDescription.markup : '',
                        quantity: productLineItem.quantityValue,
                        unit_price: productLineItem.proratedPrice.value / productLineItem.quantityValue,
                        discount_amount: discountAmount.value / productLineItem.quantityValue,
                        discount_percent: Number(discountPercent),
                        categories: [],
                        is_gift: shipment.gift || false,
                        line_number: productLineItem.position,
                        fulfillment_status: getOrderItemStatus(productLineItem),
                        is_backordered: checkIsBackOrdered(orderItem),
                        dimensions: {},
                        attributes: {},
                        is_final_sale: false
                        // item_promise_date: '2017-07-20'
                    };

                    item.line_price = item.unit_price * item.quantity;
                    item.original_unit_price = item.unit_price + item.discount_amount;
                    item.original_line_price = item.original_unit_price * item.quantity;

                    if (product) {
                        // Add classification category first
                        if (product.classificationCategory) {
                            item.categories.push(product.classificationCategory.displayName);
                        }

                        const categories = product.categories.toArray();

                        // Loop through all assigned categories
                        categories.forEach(function (category) {
                            if (item.categories.indexOf(category.displayName) === -1) {
                                item.categories.push(category.displayName);
                            }
                        });

                        let images = product.getImages('large');
                        if (images.size() > 0) {
                            item.item_image = images[0].getHttpURL().toString();
                        }
                        item.item_url = URLUtils.http('Product-Show', 'pid', product.ID).toString();
                        if (product.manufacturerName) {
                            item.vendor = product.manufacturerName;
                        }
                        try {
                            const variations = product.variationModel.getProductVariationAttributes();
                            const variationsList = variations.toArray();

                            variationsList.forEach(function (variationAttribute) {
                                const selectedVarationValue = product.variationModel.getSelectedValue(variationAttribute);

                                item.attributes[variationAttribute.ID] = (selectedVarationValue) ? selectedVarationValue.displayValue : '';
                                item[variationAttribute.ID] = (selectedVarationValue) ? selectedVarationValue.displayValue : '';
                                if (variationAttribute.ID === 'color' || variationAttribute.ID === 'colour') {
                                    item.color = (selectedVarationValue) ? selectedVarationValue.displayValue : '';
                                } else if (variationAttribute.ID === 'size') {
                                    item.size = (selectedVarationValue) ? selectedVarationValue.displayValue : '';
                                } else if (variationAttribute.ID === 'style') {
                                    item.style = (selectedVarationValue) ? selectedVarationValue.displayValue : '';
                                }
                            });

                            const customAttributes = product.custom;

                            if (customAttributes.size) {
                                const size = getValueAndUom(customAttributes.size);
                                if (size[0] !== '000') {
                                    item.size = item.size ? item.size : size[0];
                                }
                            }

                            const prdSize = customAttributes.length ||
                                customAttributes.displaySize ||
                                customAttributes.tvSize ||
                                customAttributes.dimDepth;

                            if (prdSize) {
                                const sizeDetails = getValueAndUom(prdSize);
                                if (sizeDetails[0] !== '000') {
                                    item.dimensions.length = sizeDetails[0];
                                    item.size = item.size ? item.size : sizeDetails[0];
                                }
                                item.dimensions.uom = item.dimensions.uom ? item.dimensions.uom : sizeDetails[1];
                            }

                            if (customAttributes.dimHeight) {
                                const height = getValueAndUom(customAttributes.dimHeight);
                                item.dimensions.height = height[0];
                                item.dimensions.uom = height[1];
                            }
                            if (customAttributes.dimWidth) {
                                const width = getValueAndUom(customAttributes.dimWidth);
                                item.dimensions.width = width[0];
                                item.dimensions.uom = item.dimensions.uom ? item.dimensions.uom : width[1];
                            }
                            if (customAttributes.dimWeight) {
                                const weight = getValueAndUom(customAttributes.dimWeight);
                                item.dimensions.weight = weight[0];
                                item.dimensions.weight_uom = weight[1];
                            }

                            productAttirbutes.forEach(function (productAttirbute) {
                                const attributeValue = customAttributes[productAttirbute];
                                if (attributeValue && typeof attributeValue !== 'object' && attributeValue !== 'null' && attributeValue !== '000') {
                                    item.attributes[productAttirbute] = item.attributes[productAttirbute] ? item.attributes[productAttirbute] : attributeValue;
                                }
                            });
                            if (typeof customAttributes.isSale === 'boolean') {
                                item.is_final_sale = customAttributes.isSale;
                            }
                        } catch (error) {
                            const err = error;
                            log.sendLog('error', 'orderItems:getBaseOrderItems, Error while getting items dimensions:: ' + JSON.stringify(err));
                        }
                    }
                    itemPosition = productLineItem.position + 1;
                    items.push(item);
                }
            });

            // go through gift card line items
            const giftCertificateLineItems = shipment.giftCertificateLineItems.toArray();

            giftCertificateLineItems.forEach(function (giftCertLineItem) {
                const item = {
                    item_id: util.TRANSFORMER_CONFIGURATIONS.GIFT_CARD_SKU,
                    product_id: util.TRANSFORMER_CONFIGURATIONS.GIFT_CARD_SKU,
                    sku: util.TRANSFORMER_CONFIGURATIONS.GIFT_CARD_SKU,
                    name: util.TRANSFORMER_CONFIGURATIONS.GIFT_CARD_NAME,
                    description: (giftCertLineItem.message) ? giftCertLineItem.message : '',
                    quantity: 1,
                    unit_price: giftCertLineItem.price.value,
                    item_url: URLUtils.http('GiftCert-Purchase').toString(),
                    item_image: URLUtils.httpStatic('/images/gift_cert.gif').toString(),
                    is_gift: true,
                    line_number: itemPosition
                };

                items.push(item);
            });
        });
        items = custom.getCustomizedOrderItems(items, order);
    } catch (error) {
        log.sendLog('error', 'orderItems:getBaseOrderItems, Error while transforming items details:: ' + JSON.stringify(error));
    }

    return items;
};

module.exports = {
    getBaseOrderItems: getBaseOrderItems
};
