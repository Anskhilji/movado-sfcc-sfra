'use strict';

var assert = require('chai').assert;
var mockSearchCustomHelper = require('../../../../../mocks/helpers/mockSearchCustomHelper');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe("searchCustomHelper",() => {

    describe("getBreadCrumbs",() => {

        it("Should return breadcrumbs",() => {

            var classificationFolder = {
                displayName : "Display Name",
                getParent : function(){
                    return "a";
                }
            };
    
            var breadcrumbs = {
                push : function(param1,param2){
                    return "breadcrumb";
                }
            };
            
            var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/searchCustomHelper', {
                'dw/web/URLUtils':mockSearchCustomHelper.Utils,
                'dw/web/Resource':mockSearchCustomHelper.Resource
            });
    
            var getBreadCrumbs = object.getBreadCrumbs(classificationFolder,breadcrumbs);

        });

    });

    describe("setupContentFolderSearch",() => {

        it("should return folder search",() => {

            var folderId = {};

            var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/searchCustomHelper', {
                'dw/content/ContentSearchModel':mockSearchCustomHelper.ContentSearchModel,
                '*/cartridge/models/search/folderSearch':mockSearchCustomHelper.FolderSearch
            });

            var folderSearch = object.setupContentFolderSearch(folderId);

        })

    });

});