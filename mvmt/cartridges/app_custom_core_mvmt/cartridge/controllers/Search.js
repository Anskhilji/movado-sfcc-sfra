'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var URLUtils = require('dw/web/URLUtils');

server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();
        if(viewData.productSearch && viewData.productSearch.category && viewData.productSearch.category.id) {
            viewData = {
                relativeURL: URLUtils.url('Search-Show','cgid', viewData.productSearch.category.id)
            };
        }
        res.setViewData(viewData);
        next();
    }
);

server.append(
    'ShowContent',
    function (req, res, next) {
        var viewData = res.getViewData();
        if (viewData.folderID) {
            viewData = {
                relativeURL: URLUtils.url('Search-ShowContent','fdid', viewData.folderID)
            };
        }
        res.setViewData(viewData);
        next();
    }
);


module.exports = server.exports();
