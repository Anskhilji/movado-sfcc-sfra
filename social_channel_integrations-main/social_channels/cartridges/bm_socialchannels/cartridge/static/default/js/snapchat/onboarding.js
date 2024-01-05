import {
    handleAddOptions,
    handleRemoveOptions,
    hide,
    hideSpinner,
    postData,
    show,
    showSpinner,
    toggleRequiredState
} from '../utils/utils.js';

const addListeners = () => {
    const orgIdSelectList = document.getElementById('snapOrgId');
    const adAcctSelectList = document.getElementById('snapAdAccountId');
    const pixelIdSelectList = document.getElementById('snapPixelId');
    const catalogSelectList = document.getElementById('snapCatalogId');
    const productFeedIdSelectList = document.getElementById('snapProductFeedId');
    const createCatalogFormContainer = document.getElementById('create-catalog-form-container');
    const createProductFeedFormContainer = document.getElementById('create-product-feed-form-container');
    const productFeedsContainer = document.getElementById('snap-product-feed-ids');
    const pixelContainer = document.getElementById('snap-pixel-ids');
    const form = document.getElementById('onboarding-form');
    const spinnerContainer = document.getElementById('spinner-container');

    const refreshOrgDetails = async (orgId) => {
        const getOrgDetailsUrl = form.getAttribute('data-get-org-details');
        const adAccountsContainer = document.getElementById('snap-ad-accounts');
        const catalogsContainer = document.getElementById('snap-catalog-ids');

        if (!getOrgDetailsUrl || !orgId) {
            // reset all drop down boxes
            handleRemoveOptions(adAccountsContainer, adAcctSelectList, false, 0);
            handleRemoveOptions(pixelContainer, pixelIdSelectList, false, 0);
            handleRemoveOptions(catalogsContainer, catalogSelectList, false, 0);
            handleRemoveOptions(productFeedsContainer, productFeedIdSelectList, false, 0);
            show(adAccountsContainer);
            show(pixelContainer);
            show(catalogsContainer);
            show(productFeedsContainer);
            hide(createCatalogFormContainer);
            hide(createProductFeedFormContainer);
            toggleRequiredState(createCatalogFormContainer, false);
            toggleRequiredState(createProductFeedFormContainer, false);
            return;
        }

        // get org details
        showSpinner(spinnerContainer);
        var result = await postData(getOrgDetailsUrl, {
            orgId: orgId
        });
        hideSpinner(spinnerContainer);

        if (result) {
            if (result.adAccounts.length > 1) {
                handleAddOptions(adAccountsContainer, adAcctSelectList, result.adAccounts);
            } else {
                handleRemoveOptions(adAccountsContainer, adAcctSelectList, true);
                handleRemoveOptions(pixelContainer, pixelIdSelectList, true);
            }
            if (result.catalogs.length > 1) {
                handleAddOptions(catalogsContainer, catalogSelectList, result.catalogs);
                hide(createCatalogFormContainer);
                hide(createProductFeedFormContainer);
                toggleRequiredState(createCatalogFormContainer, false);
                toggleRequiredState(createProductFeedFormContainer, false);
            } else {
                handleRemoveOptions(catalogsContainer, catalogSelectList, true);
                handleRemoveOptions(productFeedsContainer, productFeedIdSelectList, true);
                show(createCatalogFormContainer);
                show(createProductFeedFormContainer);
                toggleRequiredState(createCatalogFormContainer, true);
                toggleRequiredState(createProductFeedFormContainer, true);
            }
        }
    };

    // refresh org details on page load
    const initOrg = () => {
        if (orgIdSelectList.value) {
            refreshOrgDetails(orgIdSelectList.value);
        } else if (orgIdSelectList.options.length === 2) {
            // if there is only 1 valid option, select it
            orgIdSelectList.selectedIndex = 1;
            refreshOrgDetails(orgIdSelectList.value);
        }
    };
    initOrg();

    orgIdSelectList.addEventListener('change', () => {
        refreshOrgDetails(orgIdSelectList.value);
    });

    adAcctSelectList.addEventListener('change', async () => {
        const getAdAcctPixelsUrl = form.getAttribute('data-get-ad-acct-pixels');

        if (!getAdAcctPixelsUrl || !adAcctSelectList.value) return;

        // get pixels from ad account
        showSpinner(spinnerContainer);
        var result = await postData(getAdAcctPixelsUrl, {
            adAccountId: adAcctSelectList.value
        });
        hideSpinner(spinnerContainer);

        if (result.pixels.length > 1) {
            handleAddOptions(pixelContainer, pixelIdSelectList, result.pixels);
        } else {
            handleRemoveOptions(pixelContainer, pixelIdSelectList, true);
        }
    });

    catalogSelectList.addEventListener('change', async () => {
        const getProductFeedsUrl = form.getAttribute('data-get-catalog-product-feeds');

        if (!getProductFeedsUrl || !catalogSelectList.value) return;

        // get product feeds from catalog ID
        showSpinner(spinnerContainer);
        var result = await postData(getProductFeedsUrl, {
            catalogId: catalogSelectList.value
        });
        hideSpinner(spinnerContainer);

        if (result.productFeeds.length > 1) {
            handleAddOptions(productFeedsContainer, productFeedIdSelectList, result.productFeeds);
            hide(createProductFeedFormContainer);
            toggleRequiredState(createProductFeedFormContainer, false);
        } else {
            handleRemoveOptions(productFeedsContainer, productFeedIdSelectList, true);
            show(createProductFeedFormContainer);
            toggleRequiredState(createProductFeedFormContainer, true);
        }
    });
};

window.addEventListener('load', () => {
    addListeners();
});
