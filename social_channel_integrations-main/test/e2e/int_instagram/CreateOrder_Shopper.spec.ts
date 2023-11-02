import { test, expect, request } from '@playwright/test';

test.describe('Commerce Shop - Orders', () => {
    test.beforeAll(async ({ request }) => {
        const accessToken = await request.post(`https://${process.env.SHORT_CODE}.api.commercecloud.salesforce.com/shopper/auth/v1/organizations/${process.env.TENANT_ID}/oauth2/trusted-system/token`, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                'Authorization': `Basic ${Buffer.from(process.env.API_CLIENTID + ':' + process.env.API_CLIENTSECRET).toString("base64")}`
            },
            form: {
                "grant_type": "client_credentials",
                "hint": "ts_ext_on_behalf_of",
                "login_id": process.env.INSTAGRAM_EMAIL,
                "idp_origin": process.env.SOCIAL_CHANNEL,
                "channel_id": process.env.BM_SITE
            }
        });

        const test = await accessToken.text();

        expect(accessToken.ok()).toBeTruthy();

        const response = await accessToken.json();

        process.env.API_TOKEN = response.access_token;
    });

    test('Scenario 1', async ({ request }) => {
         await test.step('Can create an order on-the-fly in the Commerce Cloud platform', async () => {
            let response = await request.post(`https://${process.env.SHORT_CODE}.api.commercecloud.salesforce.com/checkout/orders/v1/organizations/${process.env.BM_ORGID}/orders?siteId=${process.env.BM_SITE}&clientId=${process.env.API_CLIENTID}`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.API_TOKEN}`
                },
                data: JSON.stringify({
                    "billingAddress": {
                        "address1": "43 Main Rd.",
                        "city": "Burlington",
                        "firstName": "Jane",
                        "lastName": "Doe"
                    },
                    "channelType": "instagramcommerce",
                    "currency": "USD",
                    "orderTotal": 66.91,
                    "taxTotal": 12.39,
                    "c_buyerNote": "buyer note",
                    "c_cancelInfo": "NONE_SPECIFIED",
                    "c_cancelInfoHistory": "None specified",
                    "c_externalOrderId": "0000001",
                    "c_externalExportStatus": 1,
                    "c_externalReturnStatus": 3,
                    "c_externalChannelOrderStatus":3,
                    "c_orderAction": "order action test",
                    "c_orderNote": "order note test",
                    "c_orderNoteHistory": "order note history",
                    "c_orderTag": "order tag",
                    "c_returnCase": "return case",
                    "c_returnCaseHistory": "return case history",
                    "paymentInstruments": [
                        {
                        "paymentMethodId": "PAYPAL",
                        "paymentTransaction": {
                            "amount": 66.91,
                            "transactionId": "abc13384ajsgdk1"
                        }
                        }
                    ],
                    "productItems": [
                        {
                        "basePrice": 30.98,
                        "grossPrice": 61.96,
                        "netPrice": 49.57,
                        "productId": "black-shoe_29347-38",
                        "productName": "special edition shoe women 38",
                        "quantity": 2,
                        "shipmentId": "shipment1",
                        "tax": 12.39
                        }
                    ],
                    "shipments": [
                        {
                        "shipmentId": "shipment1",
                        "shippingAddress": {
                            "address1": "43 Main Rd.",
                            "city": "Burlington",
                            "firstName": "Jane",
                            "lastName": "Doe"
                        },
                        "shippingMethod": "test_shipping_bm_1",
                        "shippingTotal": 4.95,
                        "taxTotal": 0
                        }
                    ]
                 })
            });

            const test = await response.text();

            expect(response.ok()).toBeTruthy();
        });
    });
});
