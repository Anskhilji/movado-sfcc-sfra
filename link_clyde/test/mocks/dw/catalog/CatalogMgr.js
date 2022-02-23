var CatalogMgr = function () {};

CatalogMgr.prototype.getSiteCatalog = function () {
    return {
        getRoot: function () {
            return 'root';
        }
    };
};
