'use strict';

/**
 * This Script does only test the positive case, i.e. that Dynamic imaging service
 * has been enabled for the target environment.
 */

var expect = require('chai').expect;
var proxyquire = require('proxyquire').noCallThru();
var sinon = require('sinon');

var mockLogger = {
    error: function (message) {
        console.log(message);
    }
};

var mockArrayList = function () {
    this.elements = [];
    this.length = 0;
    this.add = function (el) {
        if (el) {
            this.elements.push(el);
            this.length = this.elements.length;
        }
    };
    this.get = function (indx) {
        return this.elements[indx];
    };
    this.size = function () {
        return this.length;
    };
};

var mockDISConfiguration = {
    viewTypeMapping: {
        large2: 'missing',
        medium: 'large',
        swatch: 'large'
    },
    large: {
		scaleWidth: 800,
		scaleHeight: 800
    },
    large2: {
		scaleWidth: 800,
		scaleHeight: 800
	},
    medium: {
		scaleWidth: 400,
		scaleHeight: 400
	},
    small: {
		scaleWidth: 140,
		scaleHeight: 140
	},
    missingImages: {
		large: 'large_missing.jpg',
        medium: 'medium_missing.jpg',
        small: 'small_missing.jpg',
        missing: 'missing.jpg'
	},
};

var mockDISConfiguration2 = {
    viewTypeMapping: {
        medium: 'large'
    },
    medium: {
		scaleWidth: 400,
		scaleHeight: 400
	},
};

function MockProductVariationModel(master, selectedVariants) {
    this.master = master;
    this.displayName = 'MockProductVariationModel';
	this.selectedVariants = selectedVariants ? selectedVariants : [];
}

function MockProductVariationAttributeValue(images) {
    extendImageObject(this, images);
    this.displayName = 'MockProductVariationAttributeValue';
}

function MockProduct(images) {
    this.name = 'MockProduct';
    extendImageObject(this, images);
}

var mockSite = {
    current: {
        ID: 'MySite',
        getCustomPreferenceValue: function (attributeID) {
            if (attributeID === 'disImageSourceEnvironment') {
                return { value: 'PRD' };
            }
        }
    },
    getCurrent: function () {
        return this.current;
    }
};


var sandboxURLOffset = 'https://www.mytestdomain.com/dw/image/v2/ANY_S01/on/demandware.static/';
var productionURLOffset = 'https://www.mytestdomain.com/dw/image/v2/ANY_PRD/on/demandware.static/';
var mockURLUtils = {
    error: function (message) {
        console.log(message);
    },
    httpImage: function (context, contextID, relPath, transform) {
        return [sandboxURLOffset, 'httpImage', context, contextID, relPath, !transform ? '' : JSON.stringify(transform)].join(':');
    },
    httpStatic: function (context, contextID, relPath) {
        return [sandboxURLOffset, 'httpStatic', context, contextID, relPath].join(':');
    },
    httpsStatic: function (context, contextID, relPath) {
        return [sandboxURLOffset, 'httpsStatic', context, contextID, relPath].join(':');
    },
    getHttpsURL: function (context, contextID, relPath) {
        return [sandboxURLOffset,'getHttpsImageURL', context, contextID, relPath].join(':');
    }
};

var MockMediaFile = function (imagePath) {
    this.imagePath = imagePath;
    this.getHttpsURL = function () {
        return 'getHttpsURL:' + this.imagePath;
    };
    this.getHttpURL = function () {
        return 'getHttpURL:' + this.imagePath;
    };
    this.getURL = function () {
        return 'getURL:' + this.imagePath;
    };
    this.getAbsURL = function () {
        return 'getAbsURL:' + this.imagePath;
    };
    this.getHttpImageURL = function (transformationObject) {
        return 'getHttpImageURL:' + this.imagePath + ':' + JSON.stringify(transformationObject);
    };
    this.getHttpsImageURL = function (transformationObject) {
        return 'getHttpsImageURL:' + this.imagePath + ':' + JSON.stringify(transformationObject);
    };
    this.getAbsImageURL = function (transformationObject) {
        return 'getAbsImageURL:' + this.imagePath + ':' + JSON.stringify(transformationObject);
    };
    this.getImageURL = function (transformationObject) {
        return 'getImageURL:' + this.imagePath + ':' + JSON.stringify(transformationObject);
    };
    this.getAlt = function () {
        return 'getAlt:' + this.imagePath;
    };
};

function extendImageObject(imageObject, images) {
    imageObject.images = images;
    imageObject.getImage = function (viewType, index) {
        if (viewType && this.images[viewType]) { 
            let imagePath = this.images[viewType][(index || 0)];
            let image = new MockMediaFile(imagePath);
            return image;
        }
        return null;
    };
    imageObject.getImages = function (viewType) {
        if (viewType && this.images[viewType]) {
            var result = [];
            for (var i = 0; i < this.images[viewType].length; i++) {
                let imagePath = this.images[viewType][(i)];
                let image = new MockMediaFile(imagePath);
                result.push(image);
            }
            return result;
        }
        return null;
    };
}

var imageConfigNoImages = {
    large: [],
};
var imageConfig = {
    swatch: ['swatch/prod1.jpg'],
    large: ['large/prod1_0.jpg', 'large/prod1_1.jpg', 'large/prod1_2.jpg']
};

var mockProduct = new MockProduct(imageConfig);
var mockProductWithoutImages = new MockProduct(imageConfigNoImages);

var mockProductVariationAttributeValue = new MockProductVariationAttributeValue(imageConfig);
var mockProductVariationAttributeValueWithoutImages = new MockProductVariationAttributeValue(imageConfigNoImages);

var mockProductVariationModel = new MockProductVariationModel(mockProduct);
var mockProductVariationModelWithoutImages = new MockProductVariationModel(mockProductWithoutImages);

var imageObjectTestRuns =
    [{ name: 'Product', imageObjects: [mockProduct, mockProductWithoutImages] },
    { name: 'ProductVariationAttributeValue', imageObjects: [mockProductVariationAttributeValue, mockProductVariationAttributeValueWithoutImages] },
    { name: 'ProductVariationModel', imageObjects: [mockProductVariationModel, mockProductVariationModelWithoutImages] }
    ];

var ProductImage = proxyquire('../../../../../../cartridges/plugin_dis/cartridge/scripts/helpers/ProductImageDIS', {
    'dw/system/Logger': mockLogger,
    'dw/web/URLUtils': mockURLUtils,
    'dw/util/ArrayList': mockArrayList,
    'dw/system/Site': mockSite,
    'dw/catalog/ProductVariationModel': MockProductVariationModel,
    'dw/catalog/ProductVariationAttributeValue': MockProductVariationAttributeValue,
    'dw/system/System': {},
    '*/cartridge/preferences/image_config_DIS': mockDISConfiguration
});

var ProductImage2 = proxyquire('../../../../../../cartridges/plugin_dis/cartridge/scripts/helpers/ProductImageDIS', {
    'dw/system/Logger': mockLogger,
    'dw/web/URLUtils': mockURLUtils,
    'dw/util/ArrayList': mockArrayList,
    'dw/system/Site': mockSite,
    'dw/catalog/ProductVariationModel': MockProductVariationModel,
    'dw/catalog/ProductVariationAttributeValue': MockProductVariationAttributeValue,
    'dw/system/System': {},
    '*/cartridge/preferences/image_config_DIS': mockDISConfiguration2
});

imageObjectTestRuns.forEach(
    function (testRun) {

        describe(testRun.name, function () {
            var sandbox;

            var imageObject = testRun.imageObjects[0];
            var imageObjectWithoutImages = testRun.imageObjects[1];
            beforeEach(function () {
                sandbox = sinon.sandbox.create();
            });

            afterEach(function () {
                sandbox.restore();
                delete global.response;
            });
            it('Get unscaled product image for scalable view type large via getURL, no index provided', function () {
                var productImage = new ProductImage(imageObject, 'large');
                var actualURL = productImage.getURL();
                var expectedURL = 'getURL:large/prod1_0.jpg';
                expect(actualURL).to.equal(expectedURL);
            });
            it('Get unscaled product image for scalable view type large via getHttpsURL, index===2', function () {
                var productImage = new ProductImage(imageObject, 'large', 2);
                var actualURL = productImage.getHttpsURL();
                var expectedURL = 'getHttpsURL:large/prod1_2.jpg';
                expect(actualURL).to.equal(expectedURL);
            });
            it('Get unscaled product image for scalable view type swatch via getHttpURL().', function () {
                var productImage = new ProductImage(imageObject, 'swatch', 0);
                var actualURL = productImage.getHttpURL();
                var expectedURL = 'getHttpURL:swatch/prod1.jpg';
                expect(actualURL).to.equal(expectedURL);
            });
            it('Get scaled product image for view type medium via getHttpURL().', function () {
                var productImage = new ProductImage(imageObject, 'medium', 0);
                var actualURL = productImage.getHttpURL();
                var expectedURL = 'getHttpImageURL:large/prod1_0.jpg:' + JSON.stringify(mockDISConfiguration.medium);
                expect(actualURL).to.equal(expectedURL);
            });
            it('Get scaled product image for view type medium via getImageURL().', function () {
                var productImage = new ProductImage(imageObject, 'medium', 0);
                var actualURL = productImage.getImageURL();
                var expectedURL = 'getImageURL:large/prod1_0.jpg:' + JSON.stringify(mockDISConfiguration.medium);
                expect(actualURL).to.equal(expectedURL);
            });
            it('Get scaled product image for view type medium via getHttpsURL().', function () {
                var productImage = new ProductImage(imageObject, 'medium', 2);
                var actualURL = productImage.getHttpsURL();
                var expectedURL = 'getHttpsImageURL:large/prod1_2.jpg:' + JSON.stringify(mockDISConfiguration.medium);
                expect(actualURL).to.equal(expectedURL);
            });
            it('Get product image for unknow view type large2 via getHttpsURL().', function () {
                var productImage = new ProductImage(imageObject, 'large2', 2);
                var actualURL = productImage.getHttpsURL();
                var expectedURL = productionURLOffset + ':httpsStatic::MySite:missing.jpg';
                expect(actualURL).to.equal(expectedURL);
            });
            it('Get all images for view type medium via getAbsURL()', function () { 
                var images = ProductImage.getImages(imageObject, 'medium'); 
                var actualResult = [];
                if (images) {
                    for (let i = 0; i < images.length; i++) {
                        actualResult.push(images.get(i).getAbsURL());
                    }
                }
                actualResult = actualResult.join(':');

                var expectedResult = [];
                for (let i = 0; i < mockProduct.images.large.length; i++) {
                    expectedResult.push('getAbsImageURL');
                    expectedResult.push(mockProduct.images.large[i]);
                    expectedResult.push(JSON.stringify(mockDISConfiguration.medium));
                }
                expectedResult = expectedResult.join(':');
                expect(actualResult).to.equal(expectedResult);
            });
            it('Get image for product without defined images view type small via getHttpsURL().', function () {  
                var productImage = new ProductImage(imageObjectWithoutImages, 'small');
                var actualURL = productImage.getHttpsURL();
                var expectedURL = productionURLOffset + ':httpsStatic::MySite:small_missing.jpg';
                expect(actualURL).to.equal(expectedURL);
            });
            /** 
            it('Get image for product without defined images view type medium via getAllImages().', function () {  // new
                var productImage = new ProductImage(imageObjectWithoutImages, 'medium');
                var actual = productImage.getAllImages();
                expect(actual).to.be.an('array').that.is.empty;
            });
            */
            /*
            it('Get product image alt text for', function () { // new TODO
                var productImage = new ProductImage(imageObject, 'medium');
                var actualResult = productImage.getAlt();
                var expectedResult = "alt text";
                expect(actualResult).to.equal(expectedResult);
            });
            */
        
        });

    }
);

describe("ProductVariationModel with Selected Variant", function () {
	var imageConfigVariant = {
		swatch: ['swatch/prod2.jpg'],
		large: ['large/prod2_0.jpg', 'large/prod2_1.jpg', 'large/prod2_2.jpg']
	};
	var mockVariant = new MockProduct(imageConfigVariant);
	mockVariant.name = 'MockVariant';

	var mockProductVariationModelSelectedVariant = new MockProductVariationModel(mockProduct, [mockVariant]);

    var imageObject = mockProductVariationModelSelectedVariant;

    var sandbox;

    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
        delete global.response;
    });
    var ProductImage = proxyquire('../../../../../../cartridges/plugin_dis/cartridge/scripts/helpers/ProductImageDIS', {
        'dw/system/Logger': mockLogger,
        'dw/web/URLUtils': mockURLUtils,
        'dw/util/ArrayList': mockArrayList,
        'dw/system/Site': mockSite,
        'dw/catalog/ProductVariationModel': MockProductVariationModel,
        'dw/catalog/ProductVariationAttributeValue': MockProductVariationAttributeValue,
        'dw/system/System': {},
        '*/cartridge/preferences/image_config_DIS': mockDISConfiguration
    });
    it('Get unscaled product image for scalable view type large via getURL, no index provided', function () {
        var productImage = new ProductImage(imageObject, 'large');
        var actualURL = productImage.getURL();
        var expectedURL = 'getURL:large/prod2_0.jpg';;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get unscaled product image for scalable view type large via getHttpsURL, index===2', function () {
        var productImage = new ProductImage(imageObject, 'large', 2);
        var actualURL = productImage.getHttpsURL();
        var expectedURL = 'getHttpsURL:large/prod2_2.jpg';;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get unscaled product image for scalable view type swatch via getHttpURL().', function () {
        var productImage = new ProductImage(imageObject, 'swatch', 0);
        var actualURL = productImage.getHttpURL();
        var expectedURL = 'getHttpURL:swatch/prod2.jpg';
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get scaled product image for view type medium via getHttpURL().', function () {
        var productImage = new ProductImage(imageObject, 'medium', 0);
        var actualURL = productImage.getHttpURL();
        var expectedURL = 'getHttpImageURL:large/prod2_0.jpg:' + JSON.stringify(mockDISConfiguration.medium);
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get scaled product image for view type medium via getHttpsURL().', function () {
        var productImage = new ProductImage(imageObject, 'medium', 2);
        var actualURL = productImage.getHttpsURL();
        var expectedURL = 'getHttpsImageURL:large/prod2_2.jpg:' + JSON.stringify(mockDISConfiguration.medium);
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get product image for unknow view type large2 via getHttpsURL().', function () {
        var productImage = new ProductImage(imageObject, 'large2', 2);
        var actualURL = productImage.getHttpsURL();
        var expectedURL = productionURLOffset + ':httpsStatic::MySite:missing.jpg';
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get all images for view type medium - via ProductImage.getImages.getAbsURL()', function () {
        var images = ProductImage.getImages(imageObject, 'medium');
        var actualResult = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                actualResult.push(images.get(i).getAbsURL());
            }
        }
        actualResult = actualResult.join(':');

		var expectedResult = [];
		for (let i = 0; i < mockVariant.images.large.length; i++) {
			expectedResult.push('getAbsImageURL');
			expectedResult.push(mockVariant.images.large[i]);
			expectedResult.push(JSON.stringify(mockDISConfiguration.medium));
		}
		expectedResult = expectedResult.join(':');
		expect(actualResult).to.equal(expectedResult);

    });

    it('Get all images for view type medium - via productImage.getAllImages.getAbsURL()', function () {
        var productImage = new ProductImage(imageObject, 'medium');
        var images = productImage.getAllImages();
        var actualResult = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                actualResult.push(images.get(i).getAbsURL());
            }
        }
        actualResult = actualResult.join(':');

		var expectedResult = [];
		for (let i = 0; i < mockVariant.images.large.length; i++) {
			expectedResult.push('getAbsImageURL');
			expectedResult.push(mockVariant.images.large[i]);
			expectedResult.push(JSON.stringify(mockDISConfiguration.medium));
		}
		expectedResult = expectedResult.join(':');
		expect(actualResult).to.equal(expectedResult);
    });

    it('Get product image title for the selected variant.', function () {
        var productImage = new ProductImage(imageObject, 'medium');
        var actualResult = productImage.getTitle();
        var expectedResult = 'MockVariant';
        expect(actualResult).to.equal(expectedResult);
    });
    it('Get product image alt text for the selected variant.', function () {
        var productImage = new ProductImage(imageObject, 'medium');
        var actualResult = productImage.getAlt();
        var expectedResult = 'MockVariant';
        expect(actualResult).to.equal(expectedResult);
    });
});



describe("Image Object is null", function () {
    var sandbox;

    var imageObject = null;
    beforeEach(function () {
        sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
        sandbox.restore();
        delete global.response;
    });
    var ProductImage = proxyquire('../../../../../../cartridges/plugin_dis/cartridge/scripts/helpers/ProductImageDIS', {
        'dw/system/Logger': mockLogger,
        'dw/web/URLUtils': mockURLUtils,
        'dw/util/ArrayList': mockArrayList,
        'dw/system/Site': mockSite,
        'dw/catalog/ProductVariationModel': MockProductVariationModel,
        'dw/catalog/ProductVariationAttributeValue': MockProductVariationAttributeValue,
        'dw/system/System': {},
        '*/cartridge/preferences/image_config_DIS': mockDISConfiguration
    });
    it('Get unscaled product image for scalable view type large via getURL, no index provided', function () {
        var productImage = new ProductImage(imageObject, 'large');
        var actualURL = productImage.getURL();
        var expectedURL = null;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get unscaled product image for scalable view type large via getHttpsURL, index===2', function () {
        var productImage = new ProductImage(imageObject, 'large', 2);
        var actualURL = productImage.getHttpsURL();
        var expectedURL = null;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get unscaled product image for scalable view type swatch via getHttpURL().', function () {
        var productImage = new ProductImage(imageObject, 'swatch', 0);
        var actualURL = productImage.getHttpURL();
        var expectedURL = null;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get scaled product image for view type medium via getHttpURL() expected null.', function () {
        var productImage = new ProductImage(imageObject, 'medium', 0);
        var actualURL = productImage.getHttpURL();
        var expectedURL = null;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get scaled product image for view type medium via getHttpsURL().', function () {
        var productImage = new ProductImage(imageObject, 'medium', 2);
        var actualURL = productImage.getHttpsURL();
        var expectedURL = null;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get product image for unknow view type large2 via getHttpsURL().', function () {
        var productImage = new ProductImage(imageObject, 'large2', 2);
        var actualURL = productImage.getHttpsURL();
        var expectedURL = null;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get all images for view type medium - via ProductImage.getImages', function () {
        var images = ProductImage.getImages(imageObject, 'medium');
        var actualResult = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                actualResult.push(images.get(i).getAbsURL());
            }
        }
        actualResult = actualResult.join(':');
        var expectedResult = '';

        expect(actualResult).to.equal(expectedResult);
    });
    it('Get all images for view type medium - via productImage.getAllImages', function () {
        var productImage = new ProductImage(imageObject, 'medium');
        var images = productImage.getAllImages();
        var actualResult = [];
        if (images) {
            for (let i = 0; i < images.length; i++) {
                actualResult.push(images.get(i).getAbsURL());
            }
        }
        actualResult = actualResult.join(':');
        var expectedResult = '';

        expect(actualResult).to.equal(expectedResult);
    });
    it('Get product images for view type; scalable image missing getHttpsURL().', function () {
        var productImage = new ProductImage(imageObject, 'large3');
        var actualURL = productImage.getHttpsURL();
        var expectedURL = null;
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get product image for a none-existing object.', function () {
        var actualResult = ProductImage.getImage(imageObject, 'large2');
        var expectedResult = null;
        expect(actualResult).to.equal(expectedResult);
    });
    it('Get product image title for a none-existing object.', function () {
        var productImage = new ProductImage(imageObject, 'medium');
        var actualResult = productImage.getTitle();
        var expectedResult = null;
        expect(actualResult).to.equal(expectedResult);
    });
    it('Get product image alt text for a none-existing object.', function () {
        var productImage = new ProductImage(imageObject, 'medium');
        var actualResult = productImage.getAlt();
        var expectedResult = null;
        expect(actualResult).to.equal(expectedResult);
    });
    it('Get product image URL text for a none-existing object.', function () {
        var productImage = new ProductImage(imageObject, 'medium');
        var actualResult = productImage.getImageURL();
        var expectedResult = null;
        expect(actualResult).to.equal(expectedResult);
    });
    it('Get product absolute image URL text for a none-existing object.', function () {
        var productImage = new ProductImage(imageObject, 'medium');
        var actualResult = productImage.getAbsURL();
        var expectedResult = null;
        expect(actualResult).to.equal(expectedResult);
    });
    it('Get nonexistent product image for view type small via getHttpsURL().', function () {
        var productImage = new ProductImage2(mockProductWithoutImages, 'small');
        var actualURL = productImage.getHttpsURL();
        var expectedURL = sandboxURLOffset + ':httpsStatic:/images/noimagesmall.png::';
        expect(actualURL).to.equal(expectedURL);
    });
    it('Get product image for view type swatch via getHttpsURL().', function () {
        var productImage = new ProductImage2(mockProductWithoutImages, 'swatch');
        var actualURL = productImage.getHttpsURL();
        var expectedURL = sandboxURLOffset + ':httpsStatic:/images/noimageswatch.png::';
        expect(actualURL).to.equal(expectedURL);
    });
});