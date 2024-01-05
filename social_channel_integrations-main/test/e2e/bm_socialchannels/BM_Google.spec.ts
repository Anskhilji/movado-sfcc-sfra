import { test, expect, chromium, type Page} from '@playwright/test';

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

test.describe('Google Onboarding', () => {
    test('Try to setup Google Merchant Integration on Business Manager', async () => {
        const browser = await chromium.launch();
        const page = await browser.newPage();
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
        await page.getByText(/Select a SiteSelect a /).click();
        await page.getByTitle(String(process.env.BM_SITE), { exact: true }).click();
        console.log('Select ' + process.env.BM_SITE + ' site');
        await page.getByRole('link', { name: 'Merchant Tools' }).click();
        console.log('Click on Merchant Tools');
        await page.getByRole('link').filter({ hasText: 'Social Channels Social Channels Setup and Manage integrations with social channe' }).click();
        await page.getByRole('link').filter({ hasText: 'Google Channel' }).click();
        console.log('Click on Google Channel');
        page.getByRole('link').filter({ hasText: 'Accept Terms' }).click();
        await page.getByLabel('Name').click();
        await page.getByLabel('Name').fill(process.env.GOOGLE_NAME);
        await page.getByLabel('Email').click();
        await page.getByLabel('Email').fill(process.env.GOOGLE_EMAIL);
        await page.getByLabel('Phone').click();
        await page.getByLabel('Phone').fill(process.env.GOOGLE_PHONE);
        await page.getByLabel('Account Manager Client Id').click();
        await page.getByLabel('Account Manager Client Id').fill(process.env.GOOGLE_CLIENT_ID);
        await page.getByLabel('Account Manager Client Secret').click();
        await page.getByLabel('Account Manager Client Secret').fill(process.env.GOOGLE_CLIENT_SECRET);
        await page.getByLabel('Org Id').click();
        await page.getByLabel('Org Id').fill(process.env.GOOGLE_ORGID);
        await page.getByLabel('Google Merchant Center ID').click();
        await page.getByLabel('Google Merchant Center ID').fill(process.env.GOOGLE_MERCHANT);
        await page.getByRole('button', { name: 'Submit' }).click();
        await delay(5000);
        await page.getByText('Disconnect Connection').click();
        setTimeout(function () { page.close() }, 15000);
    });
});
