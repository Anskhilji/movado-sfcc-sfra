import { test, expect, request } from '@playwright/test';

let orderNo;

test.describe('Orders', () => {
    test.beforeAll(async ({ request }) => {
        const accessToken = await request.post(`https://${process.env.SFCC_HOST}/dw/oauth2/access_token?client_id=${process.env.API_CLIENTID}`, {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                'Authorization': `Basic ${Buffer.from(process.env.BM_USERNAME + ':' + process.env.BM_PASSWORD + ':' + process.env.API_CLIENTSECRET).toString("base64")}`
            },
            data: "grant_type=urn:demandware:params:oauth:grant-type:client-id:dwsid:dwsecuretoken"
        });

        const test = await accessToken.text();

        expect(accessToken.ok()).toBeTruthy();

        const response = await accessToken.json();

        process.env.API_TOKEN = response.access_token;
    });

    test('An external channel is able to call the create order API to create orders, get order API to get order status and update order to update order status (cancellations and returns). The hooks for get order and update order to call SF OMS APIs to get order summary or update order status are succesful.', async ({ request }) => {
        await test.step('Create a external order', async () => {
            let response = await request.post(`https://${process.env.SFCC_HOST}/s/${process.env.BM_SITE}/CreateExternalOrder`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.API_TOKEN}`
                },
                data: JSON.stringify({
                    "currency": `${process.env.ORDER_CURRENCYCODE}`,
                    "c_buyerNote": "note from buyer",
                    "c_orderNote": "note for the order",
                    "c_orderTag": "Tag for the order",
                    "c_externalOrderId": `${process.env.ORDER_EXTERNALORDERID}`,
                    "retry": false,
                    "social_channel_id": 14,
                    "customer": {
                        "customer_name": "TikTok Shop",
                        "customer_email": "tiktokshop@salesforce.com",
                        "billing_address": {
                            "first_name": "TikTok",
                            "last_name": "Shop",
                            "address1": "54 Ocean Ave",
                            "city": "Santa Monica",
                            "postal_code": "90211",
                            "state_code": "CA",
                            "country_code": "US",
                            "phone": "6718891111"
                        }
                    },
                    "product_lineitems": [
                        {
                            "net_price": 299.00,
                            "product_id": `${process.env.ORDER_PRODUCTID}`,
                            "quantity": 1.0,
                        }
                    ],
                    "shipment": {
                        "shipping_method": "TTS001",
                        "shipping_address": {
                            "first_name": "Return",
                            "last_name": "Johnson",
                            "address1": "31 Ocean Ave",
                            "city": "Santa Monoca",
                            "postal_code": "90211",
                            "state_code": "CA",
                            "country_code": "US",
                            "phone": "6718891114"
                        }
                    },
                    "totals": {
                        "adjusted_shipping_total": {
                            "net_price": 8.99,
                            "tax": 1.01,
                            "gross_price": 10.00
                        }                        
                    },
                    "payment": {
                        "payment_method": "SOCIAL_PAY",
                        "amount": 299.00
                    }
                })
            });

            const test = await response.text();

            expect(response.ok()).toBeTruthy();

            let jsonData = await response.json()

            expect(jsonData).toEqual(expect.objectContaining({
                error: false
            }));

            orderNo = jsonData['orderNo'];
        });

        if (process.env['ORDER_SOM_INTEGRATION'] !== null && process.env.ORDER_SOM_INTEGRATION == 'true') {
            await test.step('Gets the SOM orders objects and check for status updates', async () => {
                await expect(async () => {
                    let response = await request.get(`https://${process.env.HOSTNAME}/on/demandware.store/Sites-${process.env.BM_SITE}-Site/default/SOMOrderTestHelper-GetDetails?orderNo=${ orderNo }`, {
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": `Bearer ${process.env.API_TOKEN}`
                        }
                    });
    
                    const test = await response.text();
    
                    expect(response.ok()).toBeTruthy();
    
                    expect(await response.json()).toEqual(expect.objectContaining({
                        error: false
                    }));
    
                }).toPass({
                    intervals: [10_000, 20_000, 60_000, 300_000, 600_000],
                    timeout: 600_000
                });
            });
        }
    });
});   