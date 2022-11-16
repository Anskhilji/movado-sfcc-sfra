/* global exports require */

/**
 * Upload a local file to a WebDAV or SFTP folder.
 *
 */

var dw_io = require('dw/io');
var dw_net = require('dw/net');

var misc_util = require('~/cartridge/scripts/util/Miscellaneous.js');

var PIPELET_NEXT = 1; 
var PIPELET_ERROR = -1;

exports.execute = function( fileString, remoteFolderURL, remoteFile, remoteLogin, remotePassword) 
{
	if (fileString.length > 0)
	{
    	// check parameters
    	if ( empty( fileString ) )
    	{
    		misc_util.LogMessage("UploadFeed","Parameter File empty", "error");
    		return PIPELET_ERROR;
    	}

    	if ( empty( remoteFolderURL ) )
    	{
    		misc_util.LogMessage("UploadFeed","Parameter RemoteFolderURL empty", "error");
    		return PIPELET_ERROR;
    	}

    	if ( empty( remoteFile ) )
    	{
    		misc_util.LogMessage("UploadFeed","Parameter RemoteFile empty", "error");
    		return PIPELET_ERROR;
    	}

    	//dw_system.Logger.getLogger("oms_kuiu_com").debug( "UploadFeed: " +
    	//	"File: " + fileString + ", " +
    	//	"RemoteFolderURL: " + remoteFolderURL + ", " +
    	//	"RemoteFile: " + remoteFile + ", " +
    	//	"RemoteLogin: " + ( !empty( remoteLogin ) ? remoteLogin : "(empty)" ) + ", " +
    	//	"RemotePassword: " + ( !empty( remotePassword ) ? "(provided)" : "(empty)" ) );

		// locate file
		var file = new dw_io.File( dw_io.File.IMPEX + dw_io.File.SEPARATOR + "src" + dw_io.File.SEPARATOR + fileString );
	
		if ( !file.exists() )
		{
			misc_util.LogMessage("UploadFeed","File " + file.fullPath + " does not exist.", "error");
	    	return PIPELET_ERROR;
		}
	
		var result;
	
		if ( remoteFolderURL.indexOf( "sftp://" ) == 0 )
		{
			result = uploadFileSFTP( file, remoteFolderURL, remoteFile, remoteLogin, remotePassword );
		}
		else if (remoteFolderURL.indexOf( "ftp://" ) == 0)
			{
			result = uploadFileFTP( file, remoteFolderURL, remoteFile, remoteLogin, remotePassword );
			}
		else
		{
			result = uploadFileWebDAV( file, remoteFolderURL, remoteFile, remoteLogin, remotePassword );
		}
	
		if ( !result )
		{
			return PIPELET_ERROR;
		}
	}
	
	return PIPELET_NEXT;
}

function uploadFileWebDAV( file, remoteFolderURL, remoteFile, remoteLogin, remotePassword )
{
	// connect
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

	// upload
	var tmpRemoteFile = remoteFile + ".tmp";
	
	try
	{
		webDAVClient.put( tmpRemoteFile, file );
	}
	catch ( ex )
	{
		misc_util.LogMessage("UploadFeed","Error while uploading " + remoteFolderURL + tmpRemoteFile + ": " + ex, "error");
		return false;
	}

	if ( !webDAVClient.succeeded() )
	{
		misc_util.LogMessage("UploadFeed","Error while uploading " + remoteFolderURL + tmpRemoteFile + ": " +
			webDAVClient.statusCode + " " + webDAVClient.statusText, "error");
		return false;
	}
	
	// rename
	try
	{
		webDAVClient.move( tmpRemoteFile, remoteFile );
	}
	catch ( ex )
	{
		misc_util.LogMessage("UploadFeed","Error while renaming " + 
			remoteFolderURL + tmpRemoteFile + " to " + remoteFolderURL + remoteFile + ": " + ex, "error");
		return false;
	}

	if ( !webDAVClient.succeeded() )
	{
		misc_util.LogMessage("UploadFeed","Error while renaming " + 
			remoteFolderURL + tmpRemoteFile + " to " + remoteFolderURL + remoteFile + ": " +
			webDAVClient.statusCode + " " + webDAVClient.statusText, "error");
		return false;
	}
	
	// disconnect
	webDAVClient.close();
	
    return true;
}

function uploadFileSFTP( file, remoteFolderURL, remoteFile, remoteLogin, remotePassword )
{
    // for SFTP remoteLogin and remotePassword are required
    if ( empty( remoteLogin ) )
    {
    	misc_util.LogMessage("UploadFeed","Parameter RemoteLogin empty (required for SFTP)", "error");
    	return false;
    }

    if ( empty( remotePassword ) )
    {
    	misc_util.LogMessage("UploadFeed","Parameter RemotePassword empty (required for SFTP)", "error");
    	return false;
    }

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
	var params = /^sftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/\-_]*)?$/.exec( remoteFolderURL );
	if ( params == null || params.length != 4 )
	{
		misc_util.LogMessage("UploadFeed","Parameter RemoteFolderURL not recognized, RemoteFolderURL: " + remoteFolderURL, "error");
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
	
	// connect
	var sftpClient = new dw_net.SFTPClient();
	sftpClient.setTimeout(2000);
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

		if ( !result )
		{
			misc_util.LogMessage("UploadFeed","Error while connecting to " +
				host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + sftpClient.replyMessage, "error");
			return false;
		}
	}
	catch ( ex )
	{
		misc_util.LogMessage("UploadFeed","Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ex , "error");
		return false;
	}

	// upload
	var tmpRemoteFile = remoteFile + ".tmp";
	
	try
	{
		result = sftpClient.putBinary( path + tmpRemoteFile, file );

		if ( !result )
		{
			misc_util.LogMessage("UploadFeed","Error while uploading " + 
				path + tmpRemoteFile + ": " + sftpClient.replyMessage, "error");
			return false;
		}
	}
	catch ( ex )
	{
		misc_util.LogMessage("UploadFeed","Error while uploading " + 
			path + tmpRemoteFile + ": " + ex , "error");
		return false;
	}
	
	// rename
	try
	{
		result = sftpClient.rename( path + tmpRemoteFile, path + remoteFile );

		if ( !result )
		{
			misc_util.LogMessage("UploadFeed","Error while renaming " + 
				path + tmpRemoteFile + " to " + path + remoteFile + ": " + sftpClient.replyMessage, "error");
			return false;
		}
	}
	catch ( ex )
	{
		misc_util.LogMessage("UploadFeed","Error while renaming " + 
			path + tmpRemoteFile + " to " + path + remoteFile + ": " + ex, "error");
		return false;
	}
	
	// disconnect
	sftpClient.disconnect();
	
    return true;
}

//Added - Anjan
function uploadFileFTP( file, remoteFolderURL, remoteFile, remoteLogin, remotePassword )
{
    // for SFTP remoteLogin and remotePassword are required
    if ( empty( remoteLogin ) )
    {
    	misc_util.LogMessage("UploadFeed","Parameter RemoteLogin empty (required for FTP)", "error");
    	return false;
    }

    if ( empty( remotePassword ) )
    {
    	misc_util.LogMessage("UploadFeed","Parameter RemotePassword empty (required for FTP)", "error");
    	return false;
    }
 
    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
	var params = /^ftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/\-_]*)?$/.exec( remoteFolderURL );
	if ( params == null || params.length != 4 )
	{
		misc_util.LogMessage("UploadFeed","Parameter RemoteFolderURL not recognized, RemoteFolderURL: " + remoteFolderURL, "error");
    	return null;
	}

	var host = params[1];
	var port = null;
	var path = null;
	
	// params[2] is undefined if there was no port provided
	if ( params[2] != undefined )
	{
		port = Number( params[2] );
	}
	
	// params[3] is undefined if there was no subdirectories provided
	if ( params[3] == undefined ) {
		path = "/";
	} else {
		path = params[3];
	}
	
	// connect
	var ftpClient = new dw_net.FTPClient();
	ftpClient.setTimeout(2000);
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
		misc_util.LogMessage("UploadFeed","Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ex , "error");
		return false;
	}

	if ( !result )
	{
		misc_util.LogMessage("UploadFeed","Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ftpClient.replyMessage, "error");
		return false;
	}

	// upload
	var tmpRemoteFile = remoteFile + ".tmp";
	
	try
	{
		result = ftpClient.putBinary( path + tmpRemoteFile, file );
	}
	catch ( ex )
	{
		misc_util.LogMessage("UploadFeed","Error while uploading " + 
			path + tmpRemoteFile + ": " + ex , "error");
		return false;
	}

	if ( !result )
	{
		misc_util.LogMessage("UploadFeed","Error while uploading " + 
			path + tmpRemoteFile + ": " + ftpClient.replyMessage, "error");
		return false;
	}
	
	// rename
	try
	{
		result = ftpClient.rename( path + tmpRemoteFile, path + remoteFile );
	}
	catch ( ex )
	{
		misc_util.LogMessage("UploadFeed","Error while renaming " + 
			path + tmpRemoteFile + " to " + path + remoteFile + ": " + ex, "error");
		return false;
	}

	if ( !result )
	{
		misc_util.LogMessage("UploadFeed","Error while renaming " + 
			path + tmpRemoteFile + " to " + path + remoteFile + ": " + ftpClient.replyMessage, "error");
		return false;
	}
	
	// disconnect
	ftpClient.disconnect();
	
    return true;
}