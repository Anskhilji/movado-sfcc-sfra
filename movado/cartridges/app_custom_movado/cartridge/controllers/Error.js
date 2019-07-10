'use strict';

var server = require('server');
var system = require('dw/system/System');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var ContentMgr = require('dw/content/ContentMgr');
var ContentModel = require('*/cartridge/models/content');

server.use('Start', consentTracking.consent, function (req, res, next) {
    if (req.httpHeaders.get('x-requested-with') === 'XMLHttpRequest') {
        res.json({
            error: req.error || {},
            message: Resource.msg('subheading.error.general', 'error', null)
        });
    } else {
    		res.setStatusCode(410);
    	    var result = { content404Page: '' };

    	    var apiContent = ContentMgr.getContent('ca-404page');
    	    if (apiContent) {
    	        var content = new ContentModel(apiContent, 'components/content/contentAssetInc');
    	        result.content404Page = content;
    	    }
    	    res.render('error/notFound', result);
    	    //next();
        //res.redirect(URLUtils.url('Home-ErrorNotFound'));
    }
    next();
});

server.use('ErrorCode', consentTracking.consent, function (req, res, next) {
	
	res.setStatusCode(410);
    var result = { content404Page: '' };

    var apiContent = ContentMgr.getContent('ca-404page');
    if (apiContent) {
        var content = new ContentModel(apiContent, 'components/content/contentAssetInc');
        result.content404Page = content;
    }
    res.render('error/notFound', result);
    next();
});

module.exports = server.exports();
