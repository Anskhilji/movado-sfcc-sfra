import { postData } from '../utils/utils.js';

const addListeners = () => {
    const btnRefreshFeedUploadDetails = document.getElementById('refreshProductFeedUploadDetails');
    const feedUploadDetailsDiv = document.getElementById('feed-upload-details');

    btnRefreshFeedUploadDetails.addEventListener('click', async () => {
        const getFeedUploadUrl = btnRefreshFeedUploadDetails.getAttribute('data-href');
        const productFeedUploadId = btnRefreshFeedUploadDetails.getAttribute('data-feed-id');

        if (!getFeedUploadUrl || !productFeedUploadId) return;

        // get feed upload status
        feedUploadDetailsDiv.innerHTML = 'Fetching...';
        var result = await postData(getFeedUploadUrl);
        if (result.success && Object.keys(result.feedUploadDetails).length && result.feedUploadDetails.feedUploadDetailsHtml) {
            feedUploadDetailsDiv.innerHTML = result.feedUploadDetails.feedUploadDetailsHtml;
            addListeners();
        }
    });
};

window.addEventListener('load', () => {
    addListeners();
});
