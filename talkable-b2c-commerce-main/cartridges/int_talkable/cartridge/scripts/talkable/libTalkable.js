"use strict";

/* global request empty */

/**
 * @returns {Object} Includes the utility library for Talkable which provides the common functions.
 */
function TalkableHelper() {
    return {
        encryptParam: function (plain) {
            var Bytes = require("dw/util/Bytes");
            var Cipher = require("dw/crypto/Cipher");
            var Encoding = require("dw/crypto/Encoding");

            var pemKey = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAtE/M4y40S6GmRmy8hudsFwe7Edk0MyA+D0osGzR751ZTYPpJxZFkwE06XauPVsH4YUzFjI9Dso/szMMe/IN1OFfe9R0PBuG7SaDmXJydXsj0tU4OirGIjrXUiqrf4LajbuRHQMif3TbHu5w3RtHhzWsiG6UT6VJ3kLJ/Ti77izQTNL523VNbBNxFT2OiipznaxXTcHNay6MztO0Bl6VkvJStv9Laidpy2XVGbxq/JjjEvySkhvSL7Hji6ucwycI8pkhl1Etl1pQ/bszijeNj7ziLR36tqwSI0UEhF94rEjs29Jzj/1m3ryt8VjsidxVLV/CJ1vK8rFyB1EoKYJHAfQIDAQAB";
            var cipher = new Cipher();
            var messageBytes = new Bytes(plain, "UTF8");
            var encryptedBytes = cipher.encryptBytes(messageBytes, pemKey, "RSA", null, 0);
            var encryptedString = Encoding.toBase64(encryptedBytes);

            return encryptedString;
        },

        // -----------------------+
        // Talkable Configuration |
        // -----------------------+

        getSiteId: function () {
            var Site = require("dw/system/Site");
            return (
                Site.current.getCustomPreferenceValue("talkableSiteId") || ""
            );
        },

        isRegisterAffiliateEnabled: function () {
            return (
                this.isDashboardEnabled()
                || this.isStandaloneEnabled()
                || this.isFloatingWidgetEnabled()
            );
        },

        // -------------------+
        // Talkable Campaigns |
        // -------------------+

        isDashboardEnabled: function () {
            return (
                this.isEnabled("talkableDashboard")
                && request.httpPath.match(/Talkable-Dashboard/i)
            );
        },

        isStandaloneEnabled: function () {
            return (
                this.isEnabled("talkableStandalone")
                && request.httpPath.match(/Talkable-Standalone/i)
            );
        },

        isPostCheckoutEnabled: function () {
            return this.isEnabled("talkablePostCheckout");
        },

        isFloatingWidgetEnabled: function () {
            return (
                this.isEnabled("talkableFloatingWidget")
                && !request.httpPath.match(/COSummary/i)
            ); // Hide Floating Widget on the Checkout Success page
        },

        // ------------+
        // Origin Data |
        // ------------+

        /* ----------------------------------------------------------------------------------//
      For debugging, put this at the bottom of talkable/head.isml:
      <isset name="order" value="${dw.order.OrderMgr.getOrder('00000001')}" scope="page">
      <isprint value="${talkable.getPurchaseData(order)}" encoding="off"/>
    //----------------------------------------------------------------------------------*/
        getPurchaseData: function (order) {
            var URLUtils = require("dw/web/URLUtils");
            var data = {
                customer: {
                    email: this.encryptParam(order.customerEmail),
                    first_name: order.billingAddress.firstName,
                    last_name: order.billingAddress.lastName,
                    customer_id: order.customerNo
                },
                purchase: {
                    order_date: order.creationDate.toISOString(),
                    order_number: order.orderNo,
                    subtotal: order
                        .getAdjustedMerchandizeTotalPrice(false)
                        .add(order.giftCertificateTotalPrice)
                        .decimalValue.toString(),
                    coupon_code: [],
                    items: []
                }
            };

            var shipments = order.shipments.iterator();
            while (shipments.hasNext()) {
                var shipment = shipments.next();
                if (
                    shipment.shippingAddress
                    && (empty(shipment.custom.shipmentType)
                        || shipment.custom.shipmentType !== "instore")
                ) {
                    data.purchase.shipping_address = this.getFullAddress(
                        shipment.shippingAddress
                    );
                    data.purchase.shipping_zip = shipment.shippingAddress.postalCode;
                    break;
                }
            }

            var clis = order.couponLineItems.iterator();
            while (clis.hasNext()) {
                data.purchase.coupon_code.push(clis.next().couponCode);
            }

            var plis = order.productLineItems.iterator();
            while (plis.hasNext()) {
                var pli = plis.next();
                // eslint-disable-next-line no-unused-expressions
                !empty(pli.product) && data.purchase.items.push({
                    image_url: !empty(pli.product.getImage("large")) ? pli.product.getImage("large").absURL.toString() : null,
                    price: pli.getAdjustedPrice(false).decimalValue.divide(pli.quantityValue).toString(),
                    product_id: pli.productID,
                    quantity: pli.quantityValue,
                    title: pli.productName,
                    url: URLUtils.http("Product-Show", "pid", pli.productID).toString()
                });
            }

            return JSON.stringify(data);
        },

        getCustomerData: function (customer) {
            var data = {};

            if (
                customer
                && customer.authenticated
                && !empty(customer.profile)
            ) {
                var profile = customer.profile;
                data = {
                    email: this.encryptParam(profile.email),
                    first_name: profile.firstName,
                    last_name: profile.lastName,
                    customer_id: profile.customerNo
                };
            }

            return JSON.stringify(data);
        },

        // --------+
        // Private |
        // --------+

        isEnabled: function (value) {
            var Site = require("dw/system/Site");
            return !!Site.current.getCustomPreferenceValue(value);
        },

        // Returns full address, e.g. "27 Merry Lane, East Hanover, NJ, 07936, United States"
        getFullAddress: function (shippingAddress) {
            var Resource = require("dw/web/Resource");
            var value = "";
            var fields = [
                "address1",
                "address2",
                "city",
                "stateCode",
                "postalCode"
            ];
            var address = [];

            // eslint-disable-next-line no-plusplus
            for (var i = 0; i < fields.length; i++) {
                value = shippingAddress[fields[i]];
                // eslint-disable-next-line no-unused-expressions
                !empty(value) && address.push(value);
            }

            if (!empty(shippingAddress.countryCode)) {
                value = shippingAddress.countryCode.displayValue;
                address.push(Resource.msg("country." + value, "forms", value));
            }

            return address.join(", ");
        }
    };
}

/**
 * @returns {boolean} If Talkable functionality is enabled or disabled.
 */
function TalkableEnabled() {
    var Site = require("dw/system/Site");
    return Site.current.getCustomPreferenceValue("talkableEnabled") || "";
}

module.exports = {
    TalkableEnabled: TalkableEnabled,
    TalkableHelper: TalkableHelper
};
