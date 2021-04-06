var system = require( 'dw/system' );
var catalog = require( 'dw/catalog' );
var job = require( 'dw/job' ); 
var io = require( 'dw/io' );

var products;
var fileWriter;
 
exports.beforeStep = function( parameters, stepExecution )
{
  fileWriter = new io.FileWriter( new io.File( io.File.IMPEX ), parameters.ExportFileName );
  products = catalog.ProductMgr.queryAllSiteProducts();
  fileWriter.writeLine( "<products>" );
}
 
exports.getTotalCount = function( parameters, stepExecution )
{
  return products.count;
}


exports.read = function( parameters, stepExecution )
{
  if( products.hasNext() )
    {
    return products.next();
    }
}
 
exports.process = function( product, parameters, stepExecution )
{
  if( product.isOnline() )
  {
    return "<product>" + product.getID() + "</product>";
  }
}
 
exports.write = function( lines, parameters, stepExecution )
{
  for ( i = 0; i < lines.size(); i++ ) 
  {
    fileWriter.writeLine( lines.get(i) );
  }
} 
 
exports.afterStep = function (success, parameters, stepExecution) {
    if (success) {
        fileWriter.writeLine("</products>");
    }
    fileWriter.close();
    products.close();
}