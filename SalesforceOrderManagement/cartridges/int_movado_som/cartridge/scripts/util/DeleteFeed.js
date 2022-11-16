/**
 * Delete a remote file on a WebDAV or SFTP server.
 *
 * To delete or archive a local file see pipelet ArchiveFeed.
 *
 */

var dw_system = require( 'dw/system' );
var dw_net = require('dw/net');

var oms_core_misc = require('~/cartridge/scripts/util/Miscellaneous.js');

var PIPELET_NEXT = 1; 
var PIPELET_ERROR = -1;

exports.execute = function( remoteFolderURL, remoteFile, remoteLogin, remotePassword  ) 
{
    // check parameters
    if ( empty( remoteFolderURL ) )
    {
    	oms_core_misc.LogMessage("DeleteFeed", "Parameter RemoteFolderURL empty", "error");
    	return PIPELET_ERROR;
    }

    if ( empty( remoteFile ) )
    {
    	oms_core_misc.LogMessage("DeleteFeed", "Parameter RemoteFile empty", "error");
    	return PIPELET_ERROR;
    }
    
	var result;

	if ( remoteFolderURL.indexOf( "sftp://" ) == 0 )
	{
		result = deleteRemoteFileSFTP( remoteFolderURL, remoteFile, remoteLogin, remotePassword );
	}
	else if (remoteFolderURL.indexOf( "ftp://" ) == 0)
	{
		result = deleteRemoteFileFTP( remoteFolderURL, remoteFile, remoteLogin, remotePassword );
	}
	else
	{
		result = deleteRemoteFileWebDAV( remoteFolderURL, remoteFile, remoteLogin, remotePassword );
	}
	
	if ( !result )
	{
		return PIPELET_ERROR;
	}
	
	return PIPELET_NEXT;
}	

function deleteRemoteFileWebDAV( remoteFolderURL, remoteFile, remoteLogin, remotePassword )
{	
	var webDAVClient;
	
	if ( !empty( remoteLogin ) && !empty( remotePassword ) )
	{
		// use authentication
		webDAVClient = new dw_net.WebDAVClient( remoteFolderURL, remoteLogin, remotePassword );
	}
	else
	{
		// no authentication
		webDAVClient = new dw_net.WebDAVClient( remoteFolderURL );
	}

	try
	{
		webDAVClient.del( remoteFile );
	}
	catch ( ex )
	{
		oms_core_misc.LogMessage("DeleteFeed", "Error while deleting " + remoteFolderURL + remoteFile + ": " + ex , "error");
		return false;
	}

	if ( !webDAVClient.succeeded() )
	{
		oms_core_misc.LogMessage("DeleteFeed", "Error while deleting " + remoteFolderURL + remoteFile + ": " +
			webDAVClient.statusCode + " " + webDAVClient.statusText, "error");
		return false;
	}
	
	webDAVClient.close();
	
    return true;
}

function deleteRemoteFileSFTP( remoteFolderURL, remoteFile, remoteLogin, remotePassword )
{	
    // for SFTP remoteLogin and remotePassword are required
    if ( empty( remoteLogin ) )
    {
    	oms_core_misc.LogMessage("DeleteFeed", "Parameter RemoteLogin empty (required for SFTP)" , "error");
    	return false;
    }

    if ( empty( remotePassword ) )
    {
    	oms_core_misc.LogMessage("DeleteFeed", "Parameter RemotePassword empty (required for SFTP)", "error");
    	return false;
    }

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    var params = /^sftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/\-_]*)?$/.exec(remoteFolderURL);
	if ( params == null || params.length != 4 )
	{
		oms_core_misc.LogMessage("UploadFeed","Parameter RemoteFolderURL not recognized, RemoteFolderURL: " + remoteFolderURL, "error");
    	return null;
	}

	var host = params[1];
	var port = null;
	var path = null;
	
	// params[2] is undefined if there was no port provided
	if ( params[2] != undefined )
	{
		port = Number(params[2]);
	}
	
	// params[3] is undefined if there was no subdirectories provided
	if ( params[3] == undefined ) {
		path = "/";
	} else {
		path = params[3];
		
		if (path[path.length-1] != "/")
			path = path + "/";
	}
	
	var sftpClient = new dw_net.SFTPClient();
	var result;
	
	try
	{
		if ( port != null )
		{
			result = sftpClient.connect( host, port, remoteLogin, remotePassword );
		}
		else
		{
			// use default port
			result = sftpClient.connect( host, remoteLogin, remotePassword );
		}
	}
	catch ( ex )
	{
		oms_core_misc.LogMessage("DeleteFeed", "Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ex , "error");
		return false;
	}

	if ( !result )
	{
		oms_core_misc.LogMessage("DeleteFeed", "Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + sftpClient.replyMessage  , "error");
		return false;
	}

	try
	{
		result = sftpClient.del( path + remoteFile );
	}
	catch ( ex )
	{
		oms_core_misc.LogMessage("DeleteFeed", "DeleteFeed: Error while deleting " + path + remoteFile + ": " + ex, "error");
		return false;
	}

	if ( !result )
	{
		oms_core_misc.LogMessage("DeleteFeed", "Error while deleting " + path + remoteFile + ": " + sftpClient.replyMessage, "error");
		return false;
	}
	
	sftpClient.disconnect();
	
    return true;
} 

function deleteRemoteFileFTP( remoteFolderURL, remoteFile, remoteLogin, remotePassword )
{	
    // for FTP remoteLogin and remotePassword are required
    if ( empty( remoteLogin ) )
    {
    	oms_core_misc.LogMessage("DeleteFeed", "Parameter RemoteLogin empty (required for FTP)" , "error");
    	return false;
    }

    if ( empty( remotePassword ) )
    {
    	oms_core_misc.LogMessage("DeleteFeed", "Parameter RemotePassword empty (required for FTP)", "error");
    	return false;
    }

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    var params = /^ftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/\-_]*)?$/.exec(remoteFolderURL);
	if ( params == null || params.length != 4 )
	{
		oms_core_misc.LogMessage("UploadFeed","Parameter RemoteFolderURL not recognized, RemoteFolderURL: " + remoteFolderURL, "error");
    	return null;
	}

	var host = params[1];
	var port = null;
	var path = null;
	
	// params[2] is undefined if there was no port provided
	if ( params[2] != undefined )
	{
		port = Number(params[2]);
	}
	
	// params[3] is undefined if there was no subdirectories provided
	if ( params[3] == undefined ) {
		path = "/";
	} else {
		path = params[3];
		
		if (path[path.length-1] != "/")
			path = path + "/";
	}
	
	var ftpClient = new dw_net.FTPClient();
	var result;
	
	try
	{
		if ( port != null )
		{
			result = ftpClient.connect( host, port, remoteLogin, remotePassword );
		}
		else
		{
			// use default port
			result = ftpClient.connect( host, remoteLogin, remotePassword );
		}
	}
	catch ( ex )
	{
		oms_core_misc.LogMessage("DeleteFeed", "Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ex , "error");
		return false;
	}

	if ( !result )
	{
		oms_core_misc.LogMessage("DeleteFeed", "Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ftpClient.replyMessage  , "error");
		return false;
	}

	try
	{
		result = ftpClient.del( path + remoteFile );
	}
	catch ( ex )
	{
		oms_core_misc.LogMessage("DeleteFeed", "DeleteFeed: Error while deleting " + path + remoteFile + ": " + ex, "error");
		return false;
	}

	if ( !result )
	{
		oms_core_misc.LogMessage("DeleteFeed", "Error while deleting " + path + remoteFile + ": " + ftpClient.replyMessage, "error");
		return false;
	}
	
	ftpClient.disconnect();
	
    return true;
} 