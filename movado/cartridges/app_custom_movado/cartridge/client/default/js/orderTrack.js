function setHashParam(url, name, value) {

    alert(window.location.search);

    // Create URL objects for the url we want to change and a dummy url (requires a polyfill for IE)
    var urlObj = new URL(url);
    var dummyObj = new URL('https://dummy.com');

    // Copy current hash-parameters without the '#' as search-parameters
    dummyObj.search = urlObj.hash.substring(1);

    // Set or update value with the searchParams-API (requires a polyfill for IE)
    dummyObj.searchParams.set(name, value);

    // Write back as hashparameters
    urlObj.hash = dummyObj.searchParams;

    return urlObj.href;
}