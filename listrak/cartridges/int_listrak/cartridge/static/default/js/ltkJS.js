var scriptVars = document.querySelector('script[src*="ltkJS.js"]');
var config = scriptVars.getAttribute('ltk-data');

if (typeof config === 'undefined') {
    config = '';
}
var biJsHost = ((document.location.protocol === 'https:') ? 'https://' : 'http://');
(function (d, s, id, tid, vid) {
    var js;
    var ljs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return; js = d.createElement(s); js.id = id;

    js.src = biJsHost + 'cdn.listrakbi.com/scripts/script.js?m=' + tid + '&v=' + vid;
    ljs.parentNode.insertBefore(js, ljs);
}(document, 'script', 'ltkSDK', config, '1'));

