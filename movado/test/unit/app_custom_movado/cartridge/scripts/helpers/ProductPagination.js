'use strict';

/**
 * This Script tests pagination URLs
 */

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var mockCollections = require('../../../../../mocks/util/collections');
var mockStoreHelper = require('../../../../../mocks/helpers/mockStoreHelper');

describe('ProductPagination', function () {

    var endpointSearchUpdateGrid = 'Search-UpdateGrid';
    var pluckValue = 'plucked';
    var spySetPageSize = sinon.spy();
    var spySetStart = sinon.spy();
    var stubAppendPaging = sinon.stub();
    var stubGetPageSize = sinon.stub();
    var stubAppendQueryParams = sinon.stub();
    stubAppendQueryParams.returns({ toString: function () {} });

    var defaultPageSize = 18;
    var pagingModelInstance = {
        appendPaging: stubAppendPaging,
        getPageSize: stubGetPageSize,
        getEnd: function () { return 18; },
        setPageSize: spySetPageSize,
        setStart: spySetStart
    };
    var stubPagingModel = sinon.stub();
    var refinementValues = [{
        value: 1,
        selected: false
    }, {
        value: 2,
        selected: true
    }, {
        value: 3,
        selected: false
    }];
	var sortRuleUrlWithParams = 'some url with params';
	var object =  proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/ProductPagination', {
			'dw/system/Site' : mockStoreHelper.Site,
			'dw/util/HashMap': function () {
				return {
					result: {},
					put: function (key, context) {
						this.result[key] = context;
					}
				};
			},
			'*/cartridge/scripts/helpers/urlHelpers': {
				appendQueryParams: stubAppendQueryParams
			},
			'*/cartridge/scripts/util/collections' : {
				map: mockCollections.map,
				pluck: function () { return pluckValue; }
			},
			'dw/web/PagingModel': stubPagingModel,
			'*/cartridge/scripts/helpers/urlHelpers': {
				appendQueryParams: function () {
					return {
						toString: function () {
							return sortRuleUrlWithParams;
						}
					};
				}
			}
		});
	
	var apiProductSearch;
    var httpParams = {sz: 18};

    stubPagingModel.returns(pagingModelInstance);
    stubGetPageSize.returns(defaultPageSize);

    afterEach(function () {
        spySetStart.reset();
        spySetPageSize.reset();
        stubAppendQueryParams.reset();
    });

	describe('.getPaginationUrls()', function () {
        var currentPageSize = 18;
		var currentPageNum = 0;
        var expectedUrl = 'some url';

        beforeEach(function () {
            apiProductSearch = {
                isCategorySearch: true,
                refinements: {
                    refinementDefinitions: []
                },
                url: function () { return endpointSearchUpdateGrid; }
            };

            stubGetPageSize.returns(currentPageSize);
            stubAppendPaging.returns(expectedUrl);
        });
		
        afterEach(function () {
            stubGetPageSize.reset();
        });

        it('should return a map of url-string if not on final results page', function () {
            var expected = {
					"1":"some url","2":"some url","totalPages":2,"startPage":1,"endPage":2,"currentPage":1,"pagesToDisplay":5,"disablePreviousButton":"disabled","firstPage":"some url","next":"some url","lastPage":"some url"
				};
            apiProductSearch.count = 24;
            var paginationUrls = object.getPaginationUrls(apiProductSearch, httpParams, currentPageNum);
            assert.equal(JSON.stringify(paginationUrls.result), JSON.stringify(expected));
        });

        it('should not return a map if there is only one page', function () {
            var expected = '';
            apiProductSearch.count = 10;
            var paginationUrls = object.getPaginationUrls(apiProductSearch, httpParams, currentPageNum);
            assert.equal(paginationUrls, expected);
        });
    });
	
	describe('.getPaginationSortingOptions()', function () {
		var sortRuleUrl = 'some url';
		var productSearch = {
			category: {
				defaultSortingRule: {
					ID: 'defaultRule1'
				}
			},
			urlSortingRule: function () {
				return {
					toString: function () { return sortRuleUrl; }
				};
			}
		};
		var sortingOption1 = {
			displayName: 'Sort Option 1',
			ID: 'abc',
			sortingRule: 'rule1'
		};
		var sortingOption2 = {
			displayName: 'Sort Option 2',
			ID: 'cde',
			sortingRule: 'rule2'
		};
		var sortingOptions = [sortingOption1, sortingOption2];
		var pagingModel = { end: 5 };
		
		it('should set a list of sorting rule options', function () {
			var productSortOptions = object.getPaginationSortingOptions(productSearch, sortingOptions, pagingModel);
			assert.deepEqual(productSortOptions, [{
				displayName: sortingOption1.displayName,
				id: sortingOption1.ID,
				url: sortRuleUrlWithParams
			}, {
				displayName: sortingOption2.displayName,
				id: sortingOption2.ID,
				url: sortRuleUrlWithParams
			}]);
		});
	});
	
	describe('.getRadioUrl()', function () {
		var sortRuleUrlWithoutParams = 'some url without params';
		var sortRuleUrlWithParams = 'some url with params';
		var productSearch = {
			urlRelaxAttributeValue: function () {
				return {
                    relative: function () {
                        return sortRuleUrlWithoutParams;
                    },
					toString: function () {
                        return sortRuleUrlWithoutParams;
                    }
                };
			},
			urlRefineAttribute: function () {
				return {
                    relative: function () {
                        return sortRuleUrlWithParams;
                    },
					toString: function () {
                        return sortRuleUrlWithParams;
                    }
                };
			}
		};
		
		it('should return url without params if selected is true and selectable is true', function () {
            var resultUrl = object.getRadioUrl(productSearch, '', '', '', true, true);
            assert.equal(resultUrl, sortRuleUrlWithoutParams);
        });
		
		it('should return url with params if selected is false and selectable is true', function () {
            var resultUrl = object.getRadioUrl(productSearch, '', '', '', false, true);
            assert.equal(resultUrl, sortRuleUrlWithParams);
        });
	});
	
	describe('.getPriceUrl()', function () {
		var url = '/on/demandware.store/Sites-MovadoUS-Site/default/Search-Show?cgid=mens-designs&pmin=500%2e00&pmax=1%2c000%2e00';
		var expectedUrl = '/on/demandware.store/Sites-MovadoUS-Site/default/Search-Show?cgid=mens-designs&pmin=500%2e00&pmax=1000%2e00';
		it('should replace encoded comma with empty string in the url if exists', function () {
            var resultUrl = object.getPriceUrl(url);
            assert.equal(resultUrl, expectedUrl);
        });
	});
});