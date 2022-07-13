/* global exports require */

/**
 * Connect to a WebDAV or SFTP server, check for matching files and download the file (just one
 * file) that comes alphabetically first. To retieve the next matching file the pipelet needs to be
 * called again. If there are no more matching files the pipelet uses the ERROR exit.
 *
 * If TempFolder does not exist, it is created.
 */

var dw_io = require('dw/io');
var dw_net = require('dw/net');
var dw_util = require('dw/util');

var misc_util = require('~/cartridge/scripts/util/Miscellaneous.js');

exports.execute = function( remoteFolderURL, remoteLogin , remotePassword , remoteFilePattern , tempFolder ) 
{
	var fileReturn = "";
	misc_util.LogMessage("DownloadFeed", "Start Download with tempFolder: " + tempFolder, "debug");
	
    // check parameters
    if ( empty( remoteFolderURL ) )
    {
    	misc_util.LogMessage("DownloadFeed", "Parameter RemoteFolderURL empty", "error");
    	return fileReturn;
    }

    if ( empty( remoteFilePattern ) )
    {
    	misc_util.LogMessage("DownloadFeed", "Parameter RemoteFilePattern empty", "error");
    	return fileReturn;
    }

    if ( empty( tempFolder ) )
    {
    	misc_util.LogMessage("DownloadFeed", "Parameter TempFolder empty", "error");
    	return fileReturn;
    }
    
    // get list of all files in folder
	var remoteFiles = listRemoteFiles( remoteFolderURL, remoteLogin, remotePassword );
	if ( remoteFiles == null )
	{
		misc_util.LogMessage("DownloadFeed", "listed files is null", "debug");
		// there was a technical problem
    	return fileReturn;
	}
	
	// filter list
	remoteFiles = filterRemoteFiles( remoteFiles, remoteFilePattern );
	
	// sort list
	remoteFiles = new dw_util.SortedSet( remoteFiles );
	
	if ( remoteFiles.empty )
	{
		misc_util.LogMessage("DownloadFeed", "sorted files are null", "debug");
		return fileReturn;
	}

	// pick the first file from the collection
	var remoteFile  = remoteFiles[0];
	
	misc_util.LogMessage("DownloadFeed", "Downloading " + remoteFile, "debug");

	if ( !createTempFolder( tempFolder ) )
	{
		// couldn't create folder
		return fileReturn;
	}

	var file  = tempFolder + dw_io.File.SEPARATOR + remoteFile;
	
	misc_util.LogMessage("DownloadFeed", "Downloading file at location: " + file, "debug");
	if ( !downloadFile( remoteFolderURL, remoteLogin, remotePassword, remoteFile, file ) )
	{
		// error downloading file
		return fileReturn;
	}

	fileReturn = file;

    return fileReturn;
}

function listRemoteFiles( remoteFolderURL, remoteLogin, remotePassword )
{
	if ( remoteFolderURL.indexOf( "sftp://" ) == 0 )
	{
		return listRemoteFilesSFTP( remoteFolderURL, remoteLogin, remotePassword );
	}
	else if ( remoteFolderURL.indexOf( "ftp://" ) == 0 )
	{
		return listRemoteFilesFTP( remoteFolderURL, remoteLogin, remotePassword );
	}
	else
	{
		return listRemoteFilesWebDAV( remoteFolderURL, remoteLogin, remotePassword );
	}
}

function listRemoteFilesWebDAV( remoteFolderURL, remoteLogin, remotePassword )
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

	var files;
	
	try
	{
		// remoteFolderURL already contains full reference to folder, no path to append, we pass ""
		// The default depth of 1 makes propfind return the current folder AND files in that folder.
		files = webDAVClient.propfind( "" );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while listing " + remoteFolderURL + ": " + ex, "error");
		return null;
	}
	
	if ( !webDAVClient.succeeded() )
	{
		misc_util.LogMessage("DownloadFeed", "Error while listing " + remoteFolderURL + ": " +
			webDAVClient.statusCode + " " + webDAVClient.statusText, "error");
		return null;
	}

	webDAVClient.close();

	var remoteFiles = new dw_util.ArrayList();
	
	for (var i_counter=0;i_counter < files.length(); i_counter++ )
	{
        var file = files[i_counter];
		// filter out directories; this will automatically remove the current folder from the list
		if ( !file.directory )
		{
			misc_util.LogMessage("DownloadFeed", "Listing file: " + file.name , "debug");
			remoteFiles.add( file.name );
		}		
	}
	
	return remoteFiles;
}

function listRemoteFilesSFTP( remoteFolderURL, remoteLogin, remotePassword )
{
	// connect to server
	var sftpClient = connectSFTP( remoteFolderURL, remoteLogin, remotePassword );
	
	if ( sftpClient == null )
	{
		return null;
	}

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
	var params = /^sftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/\-_]*)?$/.exec( remoteFolderURL );
	if ( params == null || params.length != 4 )
	{
		misc_util.LogMessage("UploadFeed","Parameter RemoteFolderURL not recognized, RemoteFolderURL: " + remoteFolderURL, "error");
    	return null;
	}

	var path = null;
	
	// params[3] is undefined if there was no subdirectories provided
	if ( params[3] == undefined ) {
		path = "/";
	} else {
		path = params[3];
		
		if (path[path.length-1] != "/")
			path = path + "/";
	}

	// list files
	var files;
	
	try
	{
		files = sftpClient.list( path );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while listing " + path + ": " + ex, "error");
		return null;
	}
	
	if ( files == null )
	{
		misc_util.LogMessage("DownloadFeed", "Error while listing " + path + ": " + sftpClient.errorMessage, "error");
		return null;
	}

	sftpClient.disconnect();

	var remoteFiles = new dw_util.ArrayList();
	
	for (var i_counter=0;i_counter < files.length; i_counter++ )
	{
        var file = files[i_counter];
		// filter out directories
		if ( !file.directory )
		{
			misc_util.LogMessage("DownloadFeed", "Listing file: " + file.name, "debug");
			remoteFiles.add( file.name );
		}		
	}
	
	return remoteFiles;
}

function listRemoteFilesFTP( remoteFolderURL, remoteLogin, remotePassword )
{
	// connect to server
	var ftpClient = connectFTP( remoteFolderURL, remoteLogin, remotePassword );
	
	if ( ftpClient == null )
	{
		return null;
	}

//    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
	var params = /^ftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/\-_]*)?$/.exec( remoteFolderURL );
	if ( params == null || params.length != 4 )
	{
		misc_util.LogMessage("UploadFeed","Parameter RemoteFolderURL not recognized, RemoteFolderURL: " + remoteFolderURL, "error");
    	return null;
	}

	var path = null;
	
	// params[3] is undefined if there was no subdirectories provided
	if ( params[3] == undefined ) {
		path = "/";
	} else {
		path = params[3];
		
		if (path[path.length-1] != "/")
			path = path + "/";
	}

	// list files
	var files;
	
	try
	{
		files = ftpClient.list( path );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while listing " + path + ": " + ex, "error");
		return null;
	}
	
	if ( files == null )
	{
		misc_util.LogMessage("DownloadFeed", "Error while listing " + path + ": " + ftpClient.errorMessage, "error");
		return null;
	}

	ftpClient.disconnect();

	var remoteFiles = new dw_util.ArrayList();
	
	for (var i_counter=0;i_counter < files.length; i_counter++ )
	{
        var file = files[i_counter];
		// filter out directories
		if ( !file.directory )
		{
			misc_util.LogMessage("DownloadFeed", "Listing file: " + file.name, "debug");
			remoteFiles.add( file.name );
		}		
	}
	
	return remoteFiles;
}

function filterRemoteFiles( remoteFiles, remoteFilePattern )
{
	
	var regExp = new RegExp( remoteFilePattern);

	var filteredRemoteFiles = new dw_util.ArrayList();
	
	for (var i_counter=0;i_counter < remoteFiles.size(); i_counter++ )
	{
		
        var remoteFile = remoteFiles[i_counter];
		if ( regExp.test( remoteFile ) )
		{
			misc_util.LogMessage("DownloadFeed", "Matching file: " + remoteFile, "debug");
			filteredRemoteFiles.add( remoteFile );
		}
	}
	
	return filteredRemoteFiles;
}

function createTempFolder( tempFolder )
{
	var folder = new dw_io.File( dw_io.File.IMPEX + dw_io.File.SEPARATOR + "src" + dw_io.File.SEPARATOR + tempFolder );

	if ( folder.exists() )
	{
		// nothing to do
		return true;
	}
	
	misc_util.LogMessage("DownloadFeed", "Creating temp folder " + folder.fullPath, "debug");

	// create folder	
	var result = folder.mkdirs();
	if ( !result )
	{
		misc_util.LogMessage("DownloadFeed", "Error creating temp folder " + folder.fullPath , "error");
		return false;
	}
	
	return true;
}

function downloadFile( remoteFolderURL, remoteLogin, remotePassword, remoteFile, file )
{
	if ( remoteFolderURL.indexOf( "sftp://" ) == 0 )
	{
		return downloadFileSFTP( remoteFolderURL, remoteLogin, remotePassword, remoteFile, file );
	}
	else if ( remoteFolderURL.indexOf( "ftp://" ) == 0 )
	{
		return downloadFileFTP( remoteFolderURL, remoteLogin, remotePassword, remoteFile, file );
	}	
	else
	{
		return downloadFileWebDAV( remoteFolderURL, remoteLogin, remotePassword, remoteFile, file );
	}
}

function downloadFileWebDAV( remoteFolderURL, remoteLogin, remotePassword, remoteFile, file )
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

	var files;
	
	// figure size of remote file
	try
	{
		files = webDAVClient.propfind( remoteFile );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while listing " + remoteFolderURL + remoteFile + ": " + ex , "error");
		return false;
	}

	if ( !webDAVClient.succeeded() )
	{
		misc_util.LogMessage("DownloadFeed", "Error while listing " + remoteFolderURL + remoteFile + ": " +
			webDAVClient.statusCode + " " + webDAVClient.statusText , "error");
		return false;
	}

	if ( files.length != 1 )
	{
		misc_util.LogMessage("DownloadFeed", "Unexpected number of elements when listing " + remoteFolderURL + remoteFile + ": " + files.length , "error");
		webDAVClient.close();
		return false;
	}

	var fileSize = files[0].size;

	// file too large?	
	if ( fileSize > webDAVClient.MAX_GET_FILE_SIZE )
	{
		misc_util.LogMessage("DownloadFeed", "File " + remoteFolderURL + remoteFile + " too large to download: " +
			"file size: " + fileSize + ", MAX_GET_FILE_SIZE: " + webDAVClient.MAX_GET_FILE_SIZE, "error");
	
		webDAVClient.close();
		return false;
	}

	misc_util.LogMessage("DownloadFeed", "File size: " + fileSize , "debug");

	// download file
	var localFile = new dw_io.File( dw_io.File.IMPEX + dw_io.File.SEPARATOR + "src" + dw_io.File.SEPARATOR + file );

	try
	{
		webDAVClient.getBinary( remoteFile, localFile, WebDAVClient.MAX_GET_FILE_SIZE );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while downloading " + remoteFolderURL + remoteFile + " to " + localFile.fullPath + ": " + ex, "error");
		return false;
	}
	
	if ( !webDAVClient.succeeded() )
	{
		misc_util.LogMessage("DownloadFeed", "Error while downloading " + remoteFolderURL + remoteFile + " to " + localFile.fullPath + ": " +
			webDAVClient.statusCode + " " + webDAVClient.statusText , "error");
		return false;
	}

	webDAVClient.close();

	// compare file sizes
	var localFileSize = localFile.length();
	
	if ( fileSize != localFileSize )
	{
		misc_util.LogMessage("DownloadFeed", "Remote and local file sizes differ after download: " +
			"remote: " + fileSize + ", local: " + localFileSize , "error");
		return false;
	}

	// downloaded successfully
	return true;
}

function downloadFileSFTP( remoteFolderURL, remoteLogin, remotePassword, remoteFile, file )
{
	// connect to server
	var sftpClient = connectSFTP( remoteFolderURL, remoteLogin, remotePassword );
	
	if ( sftpClient == null )
	{
		return false;
	}

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
	var params = /^sftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/\-_]*)?$/.exec( remoteFolderURL );
	if ( params == null || params.length != 4 )
	{
		misc_util.LogMessage("UploadFeed","Parameter RemoteFolderURL not recognized, RemoteFolderURL: " + remoteFolderURL, "error");
    	return null;
	}

	var path = null;
	
	// params[3] is undefined if there was no subdirectories provided
	if ( params[3] == undefined ) {
		path = "/";
	} else {
		path = params[3];
		
		if (path[path.length-1] != "/")
			path = path + "/";
	}

	// figure size of remote file
	var fileInfo;
	
	try
	{
		fileInfo = sftpClient.getFileInfo( path + remoteFile );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while retrieving file info " + path + remoteFile + ": " + ex, "error");
		return false;
	}

	if ( fileInfo == null )
	{
		misc_util.LogMessage("DownloadFeed", "Error while retrieving file info  " + path + remoteFile + ": " +
			sftpClient.errorMessage, "error");
		return false;
	}

	var fileSize = fileInfo.size;

	// file too large?	
	if ( fileSize > dw_net.SFTPClient.MAX_GET_FILE_SIZE )
	{
		misc_util.LogMessage("DownloadFeed", "File " + path + remoteFile + " too large to download: " +
			"file size: " + fileSize + ", MAX_GET_FILE_SIZE: " + dw_net.SFTPClient.MAX_GET_FILE_SIZE, "error");
		sftpClient.disconnect();
		return false;
	}

	misc_util.LogMessage("DownloadFeed", "File size: " + fileSize, "debug");

	// download file
	var localFile = new dw_io.File( file );
	var result;

	try
	{
		result = sftpClient.getBinary( path + remoteFile, localFile );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while downloading " + path + remoteFile + " to " + localFile.fullPath + ": " + ex, "error");
		return false;
	}
	
	if ( !result )
	{
		misc_util.LogMessage("DownloadFeed", "Error while downloading " + path + remoteFile + " to " + localFile.fullPath + ": " +
			sftpClient.errorMessage, "error");
		return false;
	}

	sftpClient.disconnect();

	// compare file sizes
	var localFileSize = localFile.length();
	
	if ( fileSize != localFileSize )
	{
		misc_util.LogMessage("DownloadFeed", "Remote and local file sizes differ after download: " +
			"remote: " + fileSize + ", local: " + localFileSize, "error");
		return false;
	}

	// downloaded successfully
	return true;
}

function downloadFileFTP( remoteFolderURL, remoteLogin, remotePassword, remoteFile, file )
{
	// connect to server
	var ftpClient = connectFTP( remoteFolderURL, remoteLogin, remotePassword );
	
	if ( ftpClient == null )
	{
		return false;
	}

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
	var params = /^ftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/\-_]*)?$/.exec( remoteFolderURL );
	if ( params == null || params.length != 4 )
	{
		misc_util.LogMessage("UploadFeed","Parameter RemoteFolderURL not recognized, RemoteFolderURL: " + remoteFolderURL, "error");
    	return null;
	}

	var path = null;
	
	// params[3] is undefined if there was no subdirectories provided
	if ( params[3] == undefined ) {
		path = "/";
	} else {
		path = params[3];
		
		if (path[path.length-1] != "/")
			path = path + "/";
	}

	// figure size of remote file
	var fileInfo;
	
	try
	{
		fileInfo = ftpClient.list( path + remoteFile );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while retrieving file info " + path + remoteFile + ": " + ex, "error");
		return false;
	}

	if ( fileInfo == null )
	{
		misc_util.LogMessage("DownloadFeed", "Error while retrieving file info  " + path + remoteFile + ": " +
			ftpClient.errorMessage, "error");
		return false;
	}

	var fileSize = fileInfo[0].size;

	// file too large?	
	if ( fileSize > dw_net.FTPClient.MAX_GET_FILE_SIZE )
	{
		misc_util.LogMessage("DownloadFeed", "File " + path + remoteFile + " too large to download: " +
			"file size: " + fileSize + ", MAX_GET_FILE_SIZE: " + dw_net.SFTPClient.MAX_GET_FILE_SIZE, "error");
		ftpClient.disconnect();
		return false;
	}

	misc_util.LogMessage("DownloadFeed", "File size: " + fileSize, "debug");

	// download file
	var localFile = new dw_io.File( file );
	var result;

	try
	{
		result = ftpClient.getBinary( path + remoteFile, localFile , dw_net.FTPClient.MAX_GET_FILE_SIZE );
	}
	catch ( ex )
	{
		misc_util.LogMessage("DownloadFeed", "Error while downloading " + path + remoteFile + " to " + localFile.fullPath + ": " + ex, "error");
		return false;
	}
	
	if ( !result )
	{
		misc_util.LogMessage("DownloadFeed", "Error while downloading " + path + remoteFile + " to " + localFile.fullPath + ": " +
			ftpClient.errorMessage, "error");
		return false;
	}

	ftpClient.disconnect();

	// compare file sizes
	var localFileSize = localFile.length();
	
	if ( fileSize != localFileSize )
	{
		misc_util.LogMessage("DownloadFeed", "Remote and local file sizes differ after download: " +
			"remote: " + fileSize + ", local: " + localFileSize, "error");
		return false;
	}

	// downloaded successfully
	return true;
}


function connectSFTP( remoteFolderURL, remoteLogin, remotePassword )
{
    // for SFTP remoteLogin and remotePassword are required
    if ( empty( remoteLogin ) )
    {
    	misc_util.LogMessage("DownloadFeed", "Parameter RemoteLogin empty (required for SFTP)", "error");
    	return null;
    }

    if ( empty( remotePassword ) )
    {
    	misc_util.LogMessage("DownloadFeed", "Parameter RemotePassword empty (required for SFTP)", "error");
    	return null;
    }

    // parse URL, e.g. "sftp://sftp.myserver.com:22/folder/"
	var params = /^sftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/-]*)?$/.exec( remoteFolderURL );
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

	// create a new SFTP client
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
		misc_util.LogMessage("DownloadFeed", "Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ex, "error");
		return null;
	}

	if ( !result )
	{
		misc_util.LogMessage("DownloadFeed", "Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + sftpClient.errorMessage, "error");
		return null;
	}

	return sftpClient;
} 

function connectFTP( remoteFolderURL, remoteLogin, remotePassword )
{
    // for SFTP remoteLogin and remotePassword are required
    if ( empty( remoteLogin ) )
    {
    	misc_util.LogMessage("DownloadFeed", "Parameter RemoteLogin empty (required for SFTP)", "error");
    	return null;
    }

    if ( empty( remotePassword ) )
    {
    	misc_util.LogMessage("DownloadFeed", "Parameter RemotePassword empty (required for SFTP)", "error");
    	return null;
    }

    // parse URL, e.g. "ftp://sftp.myserver.com:22/folder/"
	var params = /^ftp:\/\/([0-9a-zA-Z\.]*):?([0-9]+)?([0-9a-zA-Z\/-]*)?$/.exec( remoteFolderURL );
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

	// create an ftp client
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
		misc_util.LogMessage("DownloadFeed", "Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ex, "error");
		return null;
	}

	if ( !result )
	{
		misc_util.LogMessage("DownloadFeed", "Error while connecting to " +
			host + ( ( port != null ) ? ( ":" + port ) : "" ) + ": " + ftpClient.errorMessage, "error");
		return null;
	}

	return ftpClient;
} 