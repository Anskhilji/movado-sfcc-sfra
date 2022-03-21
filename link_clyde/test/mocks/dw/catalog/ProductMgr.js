var ProductMgr = function () {};

ProductMgr.queryAllSiteProducts = function () {
    return {
        hasNext: function () {
            return true;
        },
        next: function () {
            return {product:'123', image:'test'}
        }
    };
};

module.exports = ProductMgr;