
function getRelativeURL(request) {
    var seoURL = request.httpHeaders.get('x-is-path_translated');
    var relativeURL = seoURL && request.locale && request.locale.id ? ( seoURL.split(request.locale.id)[1] ? seoURL.split(request.locale.id)[1] 
    : ( request.locale.id.toString().split('_')[0] ? seoURL.split(request.locale.id.toString().split('_')[0])[1] : null)) : null;
    return relativeURL;
}

module.exports = {
    getRelativeURL: getRelativeURL
};
