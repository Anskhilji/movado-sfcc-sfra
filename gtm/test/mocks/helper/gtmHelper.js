'use strict';

var resource = {
    msg : function(param1,param2,param3) {
        return '';
    }
}

var category = {
    displayName : "hello"
};

var root = {
    getRoot : function(){

    }
}

var catalogMgr = {
    getCategory : function(param){
        return category;
    },
    getSortingOptions : function(){

    },
    getSiteCatalog : function() {
        return root;
    }

}

var urlUtil = {
    url : function(param1,param2,param3){
        return '';
    }
}

var template={
	
};

var apiProductSearch = {
    search : function(){
			
		},
    getSearchRedirect : function(param){

    },
    category : {
        template : 'teml'
    }

} 
 


var psModel = function() {
    return apiProductSearch;
}

var productSearch = {
    count : 0
}

var pSearch = function(param1,param2,param3,param4,param5){
    return productSearch;
}

var search = {
    setProductProperties : function(param1,param2,param3,param4)
    {

    }
}

module.exports = {
    resource,
    catalogMgr,
    psModel,
    pSearch,
    search,
    urlUtil 
};