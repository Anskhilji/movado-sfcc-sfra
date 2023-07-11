import { test, expect, request } from '@playwright/test';

test.describe('Feeds', () => {
    test.beforeAll(async ({ request }) => {
        const accessToken = await request.post('https://account.demandware.com/dw/oauth2/access_token', {
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                'Authorization': `Basic ${Buffer.from(process.env.API_CLIENTID + ':' + process.env.API_CLIENTSECRET).toString("base64")}`
            },
            form: {
                'grant_type': 'client_credentials'
            },
        });

        expect(accessToken.ok()).toBeTruthy();

        const response = await accessToken.json();

        process.env.API_TOKEN = response.access_token;
    });

    test('Scenario 1', async ({ page, request, context }) => {
        await test.step('A merchandizer goes into the jobs module, sets up the catalog job step along with the notification step - TikTok should be notified that there is file available to be processed.', async () => {
            let response = await request.post(`https://${ process.env.SFCC_HOST }/s/-/dw/data/v23_2/jobs/TikTok-ExportFeeds/executions`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ process.env.API_TOKEN }`
                },
                data: JSON.stringify({
                    "parameters" : [{
                        "name": "DeltaCatalogExportInDays",
                        "value": "0"
                    }]
                })
            });

            expect(response.ok()).toBeTruthy();
            
            let jsonData = await response.json()
            
            expect(jsonData).toEqual(expect.objectContaining({
                execution_status: 'pending'
            }));

            await expect(async () => {
                const response = await request.get(`https://${process.env.SFCC_HOST}/s/-/dw/data/v23_2/jobs/TikTok-ExportFeeds/executions/${ jsonData["id"] }`, {
                    headers: {
                        "Authorization": `Bearer ${ process.env.API_TOKEN }`
                    }
                });

                expect(response.ok).toBeTruthy();

                expect(await response.json()).toEqual(expect.objectContaining({
                    execution_status: 'finished'
                }));

            }).toPass({
                intervals: [10_000, 20_000, 60_000, 100_000],
                timeout: 100_000
            });
        });
    });

    test('Scenario 2', async ({ page, request, context }) => {
        await test.step('A merchandizer goes into the jobs module, sets up the catalog job step - adds 1 in the DeltaCatalogInDays attribute, fills in the correct site Id and host name, to export the products that were updated in the last 1 day pushed into the webdav location.', async () => {
            let response = await request.post(`https://${ process.env.SFCC_HOST }/s/-/dw/data/v23_2/jobs/TikTok-ExportFeeds/executions`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ process.env.API_TOKEN }`
                },
                data: JSON.stringify({
                    "parameters" : [{
                        "name": "DeltaCatalogExportInDays",
                        "value": "1"
                    }]
                })
            });

            expect(response.ok()).toBeTruthy();
            
            let jsonData = await response.json()
            
            expect(jsonData).toEqual(expect.objectContaining({
                execution_status: 'pending'
            }));

            await expect(async () => {
                const response = await request.get(`https://${process.env.SFCC_HOST}/s/-/dw/data/v23_2/jobs/TikTok-ExportFeeds/executions/${ jsonData["id"] }`, {
                    headers: {
                        "Authorization": `Bearer ${ process.env.API_TOKEN }`
                    }
                });

                expect(response.ok).toBeTruthy();

                expect(await response.json()).toEqual(expect.objectContaining({
                    execution_status: 'finished'
                }));

            }).toPass({
                intervals: [10_000, 20_000, 60_000, 100_000],
                timeout: 100_000
            });
        });
    });

    test('Scenario 3', async ({ page, request, context }) => {
        await test.step('A merchandizer goes into the jobs module, sets up the catalog job step along with the notification step - TikTok should be notified that there is file available to be processed.', async () => {
            let response = await request.post(`https://${ process.env.SFCC_HOST }/s/-/dw/data/v23_2/jobs/TikTok-ExportFeeds/executions`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ process.env.API_TOKEN }`
                },
                data: JSON.stringify({
                    "parameters": [
                        {
                            "name": "FeedTypeInventory",
                            "value": `${ process.env.PARAM_FEEDTYPEINVENTORY }`
                        },
                        {
                            "name": "UpdateTypeInventory",
                            "value": `${ process.env.PARAM_UPDATETYPEINVENTORY }`
                        },
                        {
                            "name": "BMHostDomain",
                            "value": `${ process.env.PARAM_BMHOSTDOMAIN }`
                        }]
                })
            });

            expect(response.ok()).toBeTruthy();
            
            let jsonData = await response.json()
            
            expect(jsonData).toEqual(expect.objectContaining({
                execution_status: 'pending'
            }));

            await expect(async () => {
                const response = await request.get(`https://${process.env.SFCC_HOST}/s/-/dw/data/v23_2/jobs/TikTok-ExportFeeds/executions/${ jsonData["id"] }`, {
                    headers: {
                        "Authorization": `Bearer ${ process.env.API_TOKEN }`
                    }
                });

                expect(response.ok).toBeTruthy();

                expect(await response.json()).toEqual(expect.objectContaining({
                    execution_status: 'finished'
                }));

            }).toPass({
                intervals: [10_000, 20_000, 60_000, 100_000],
                timeout: 100_000
            });
        });
    });
    
    test('Scenario 4', async ({ page, request, context }) => {
        await test.step('A merchandizer goes into the jobs module, sets up the inventory job step along with the notification step - adds the relevant site id, and the inventory assigned to the site will be exported, and Tiktok should be notified that there is file available to be processed.', async () => {
            let response = await request.post(`https://${ process.env.SFCC_HOST }/s/-/dw/data/v23_2/jobs/TikTok-ExportFeeds/executions`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ process.env.API_TOKEN }`
                },
                data: JSON.stringify({
                    "parameters": [
                        {
                            "name": "InventoryListIDs",
                            "value": `${process.env.PARAM_INVENTORYLISTIDS}`
                        },
                        {
                            "name": "FileNamePrefix",
                            "value": `${process.env.PARAM_FILENAMEPREFIX}`
                        },
                        {
                            "name": "OverwriteExportFile",
                            "value": `${process.env.PARAM_OVERWRITEEXPORTFILE}`
                        },
                        {
                            "name": "BMHostDomain",
                            "value": `${process.env.PARAM_BMHOSTDOMAIN}`
                        }]
                })
            });

            expect(response.ok()).toBeTruthy();
            
            let jsonData = await response.json()

            expect(jsonData).toEqual(expect.objectContaining({
                execution_status: 'pending'
            }));

            await expect(async () => {
                const response = await request.get(`https://${process.env.SFCC_HOST}/s/-/dw/data/v23_2/jobs/TikTok-ExportFeeds/executions/${ jsonData["id"] }`, {
                    headers: {
                        "Authorization": `Bearer ${ process.env.API_TOKEN }`
                    }
                });

                expect(response.ok).toBeTruthy();

                expect(await response.json()).toEqual(expect.objectContaining({
                    execution_status: 'finished'
                }));

            }).toPass({
                intervals: [10_000, 20_000, 60_000, 100_000],
                timeout: 100_000
            });
        });
    });

    test('Scenario 5', async ({ page, request, context }) => {
        await test.step('A merchandizer goes into the jobs module, sets up the order status job step along with the notification step - this should export all orders that have changed status since the last run and create an order status file in a webdav location and then notify TikTOk', async () => {
            let response = await request.post(`https://${ process.env.SFCC_HOST }/s/-/dw/data/v23_2/jobs/TikTok-ExportOrderStatus/executions`, {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${ process.env.API_TOKEN }`
                },
                data: JSON.stringify({
                    "parameters": [
                        {
                            "name": "FileNameOrderExport",
                            "value": `${process.env.PARAM_FILENAMEORDEREXPORT}`
                        },
                        {
                            "name": "FileFolderOrderExport",
                            "value": `${process.env.PARAM_FILEFOLDERORDEREXPORT}`
                        }]
                })
            });

            expect(response.ok()).toBeTruthy();
            
            let jsonData = await response.json()

            expect(jsonData).toEqual(expect.objectContaining({
                execution_status: 'pending'
            }));

            await expect(async () => {
                const response = await request.get(`https://${process.env.SFCC_HOST}/s/-/dw/data/v23_2/jobs/TikTok-ExportOrderStatus/executions/${ jsonData["id"] }`, {
                    headers: {
                        "Authorization": `Bearer ${ process.env.API_TOKEN }`
                    }
                });

                expect(response.ok).toBeTruthy();

                expect(await response.json()).toEqual(expect.objectContaining({
                    execution_status: 'finished'
                }));

            }).toPass({
                intervals: [10_000, 20_000, 60_000, 100_000],
                timeout: 100_000
            });

        });
    });
});   
