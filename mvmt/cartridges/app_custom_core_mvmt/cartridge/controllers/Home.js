var server = require('server');
var page = module.superModule;
server.extend(page);

var URLUtils = require('dw/web/URLUtils');

server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();
        viewData = {
            relativeURL: ""
        };
        res.setViewData(viewData);
        next();
    }
);

module.exports = server.exports();