import { test, expect, chromium, type Page} from '@playwright/test';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getFormattedDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day}-${hours}-${minutes}-${seconds}`;
}

async function jobExecutionRequest(process, jobID){
      const url = 'https://account.demandware.com/dw/oauth2/access_token';
      const clientId = process.env.GOOGLE_OCAPI_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_OCAPI_CLIENT_SECRET;
      const grantType = 'client_credentials';
      const authHeader = `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`;
      const data = new URLSearchParams();
      data.append('grant_type', grantType);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': authHeader,
        },
        body: data,
      });

      const dataJson = await response.json();
      const accessToken = dataJson.access_token;
      if(!accessToken){
        throw new Error(dataJson.error + ": " + dataJson.error_description);
      }
      console.log('Successful authentication...');

      const responseJobExecution = await fetch(process.env.BM_URL + '/s/Sites-Site/dw/data/v21_3/jobs/'+jobID+'/executions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + accessToken,
        },
        body: null,
      });

      const responseJobExecutionParsed = await responseJobExecution.json();

      if(responseJobExecutionParsed.fault){
        throw new Error(responseJobExecutionParsed.fault.type + ": " + responseJobExecutionParsed.fault.message);
      }

      const getStatusUrl = process.env.BM_URL + '/s/Sites-Site/dw/data/v21_3/jobs/'+jobID+'/executions/' + responseJobExecutionParsed.id;

      let status = 'RUNNING';

      while(status !=='OK'){
        const responseJobExecutionStatus = await fetch(getStatusUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken,
          },
          body: null,
        });

        const responseJobExecutionStatusJson = await responseJobExecutionStatus.json();
        status = responseJobExecutionStatusJson.status;

        if(status === 'RUNNING'){
          await delay(1000);
        }
      }

      return status;
}

test.describe('Google Jobs Export Creation and Execution', () => {
    test('Google Jobs Export Creation and Execution', async ({page}) => {
        const browser = await chromium.launch();

        //Logging in to business manager
        await page.goto(process.env.BM_URL + '/on/demandware.store/Sites-Site');
        await page.getByPlaceholder('User Name').click();
        await page.getByPlaceholder('User Name').fill(String(process.env.BM_USERNAME));
        await page.getByRole('button', { name: 'Log in' }).click();
        await page.getByRole('button', { name: 'Log in with SFDC Okta' }).click();
        await page.getByRole('textbox', { name: 'Username' }).click();
        await page.getByRole('textbox', { name: 'Username' }).fill(String(process.env.BM_USERNAME));
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('textbox', { name: 'Password' }).fill(String(process.env.BM_PASSWORD));
        await page.getByRole('button', { name: 'Verify' }).click();
        await page.getByRole('link', { name: 'Select' }).nth(2).click();
        await page.waitForURL(process.env.BM_URL + '/on/demandware.store/Sites-Site/default/ViewApplication-DisplayWelcomePage');
        console.log('Logged in on BM');

        //Opening the job list screen
        await page.getByRole('link', { name: 'Administration' }).click();
        console.log('Click on Administration');
        await page.getByRole('link').filter({ hasText: 'Operations' }).click();
        await page.getByRole('link').filter({ hasText: 'Jobs Jobs Manage job schedules.' }).click();
        console.log('Click on Jobs');

        //Creating a new Job for google file export
        await page.getByRole('button', { name: 'New Job' }).click();
        await page.getByLabel('ID').click();
        const jobID = "E2E-GOOGLE-TEST-" + getFormattedDateTime();
        await page.getByLabel('ID').fill(jobID);
        await page.getByLabel('ID').click();
        await page.getByRole('button', { name: 'Create' }).click();
        await page.click('[ng-click="switchTab(\'step-configurator\')"]');

        //Creating the product export step.
        await page.getByText(/Configure a step/).click();
        await page.getByPlaceholder('Filter:').click();
        await page.getByPlaceholder('Filter:').fill('custom.CustomFeeds.Script');
        await page.getByText('custom.CustomFeeds.Script').click();
        await page.locator('form[name="stepForm"] input[name="id"]').click();
        await page.locator('form[name="stepForm"] input[name="id"]').fill('e2e-custom-feed');
        await page.locator('form[name="stepForm"] input[type="checkbox"][name="ExportCatalogs"]').check();
        await page.locator('form[name="stepForm"] input[name="CustomObjectIds"]').click();
        await page.locator('form[name="stepForm"] input[name="CustomObjectIds"]').fill('google-shopping-e2e-test');
        await page.locator('form[name="stepForm"] input[name="Hostname"]').click();
        await page.locator('form[name="stepForm"] input[name="Hostname"]').fill('www.example.com');
        await page.getByRole('button', { name: 'Assign' }).click();
        await delay(500);
        await page.locator('.job-flow-sites-badge').click();
        await page.locator('.job-flow-scope-label').dblclick();
        await delay(500);
        await page.keyboard.press('Tab');
        await page.keyboard.press('ArrowDown');
        await page.getByRole('combobox').selectOption('specificSites');
        await page.keyboard.press('Enter');
        await delay(500);
        await page.getByRole('row', { name: process.env.GOOGLE_OCAPI_SITE + ' ' + process.env.GOOGLE_OCAPI_SITE + ' online' }).getByRole('checkbox').check();
        await page.evaluate("document.getElementsByClassName('dw-button dw-nc-button-primary')[1].click()");
        await delay(500);

        //Creating the price book export step.
        await page.getByRole('button', { name: 'Add a sequential flow.' }).click();
        await delay(500);
        await page.getByText(/Configure a step/).nth(1).click();
        await page.getByPlaceholder('Filter:').click();
        await page.getByPlaceholder('Filter:').fill('exportprice');
        await page.getByRole('listitem').filter({ hasText: 'ExportPriceBook Exports price data. Context: Organization' }).click();
        await page.locator('form[name="stepForm"] input[name="id"]').fill('Export Price Book');
        await page.locator('form[name="stepForm"] input[name="PriceBookID"]').fill('usd-m-list-prices');
        await page.locator('form[name="stepForm"] input[name="FileNamePrefix"]').fill('feeds/export/social/google/e2e-test/'+jobID+'/pricebook/pricebook');
        await page.getByRole('button', { name: 'Assign' }).click();
        await delay(500);

        //Creating the inventory export step
        await page.getByRole('button', { name: 'Add a sequential flow.' }).nth(1).click();
        await delay(500);
        await page.getByText(/Configure a step/).nth(2).click();
        await page.getByPlaceholder('Filter:').click();
        await page.getByPlaceholder('Filter:').fill('ExportInventory');
        await page.getByText('ExportInventoryLists Exports inventory lists. Context: Site').click();
        await page.locator('form[name="stepForm"] input[name="id"]').fill('Export Inventory');
        await page.locator('form[name="stepForm"] input[name="InventoryListIDs"]').fill('oci_loc1');
        await page.locator('form[name="stepForm"] input[name="FileNamePrefix"]').fill('feeds/export/social/google/e2e-test/'+jobID+'/inventory/inventory');
        await page.getByRole('button', { name: 'Assign' }).click();
        await delay(500);
        await page.locator('.job-flow-sites-badge').nth(2).click();
        await page.locator('.job-flow-scope-label').nth(2).dblclick();
        await delay(500);
        await page.keyboard.press('Tab');
        await page.keyboard.press('ArrowDown');
        await page.getByRole('combobox').selectOption('specificSites');
        await page.keyboard.press('Enter');
        await delay(500);
        await page.getByRole('row', { name: process.env.GOOGLE_OCAPI_SITE + ' ' + process.env.GOOGLE_OCAPI_SITE + ' online' }).getByRole('checkbox').check();
        await page.evaluate("document.getElementsByClassName('dw-button dw-nc-button-primary')[3].click()");
        await delay(500);

        //Creating store export step.
        await page.getByRole('button', { name: 'Add a sequential flow.' }).nth(2).click();
        await delay(500);
        await page.getByText(/Configure a step/).nth(3).click();
        await page.getByPlaceholder('Filter:').click();
        await page.getByPlaceholder('Filter:').fill('ExportStore');
        await page.getByText('ExportStores Exports stores. Context: Site').click();
        await page.locator('form[name="stepForm"] input[name="id"]').fill('Export Stores');
        await page.locator('form[name="stepForm"] input[name="StoreID"]').fill('*');
        await page.locator('form[name="stepForm"] input[name="FileNamePrefix"]').fill('feeds/export/social/google/e2e-test/'+jobID+'/store/store');
        await page.getByRole('button', { name: 'Assign' }).click();
        await delay(500);
        await page.locator('.job-flow-sites-badge').nth(3).click();
        await page.locator('.job-flow-scope-label').nth(3).dblclick();
        await delay(500);
        await page.keyboard.press('Tab');
        await page.keyboard.press('ArrowDown');
        await page.getByRole('combobox').selectOption('specificSites');
        await page.keyboard.press('Enter');
        await delay(500);
        await page.getByRole('row', { name: process.env.GOOGLE_OCAPI_SITE + ' ' + process.env.GOOGLE_OCAPI_SITE + ' online' }).getByRole('checkbox').check();
        await page.evaluate("document.getElementsByClassName('dw-button dw-nc-button-primary')[4].click()");
        await delay(500);

        //Returning for job list screen
        await page.getByRole('link', { name: 'Jobs' }).click();

        //Executing and verifying the request for the created job.
        const result = await jobExecutionRequest(process,jobID);
        expect(result).toEqual("OK");
    });
});