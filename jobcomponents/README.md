#Job Components

## Introduction
This cartridge provides a toolbox for basic operations usually done in jobs. It is supposed to represent a successor for the [CS Integration Framework](https://bitbucket.org/demandware/integrationframework)'s Standard Components

This project is part of the [Community Suite](https://xchange.demandware.com/community/developer/community-suite) set of tools.

## License
Licensed under the current NDA and licensing agreement in place with your organization. (This is explicitly not open source licensing.)

## Who do I talk to?

Feel free to create issues and enhancement requests or discuss on the existing ones, this will help us understanding in which area the biggest need is.

Contributions are always welcome (see below for details)!


* Maintainers: @dmersiowsky, @kdomachowski
* [Community Suite discussion board](https://xchange.demandware.com/community/developer/community-suite/content)
* [Commerce Cloud Community Slack](https://sfcc-community.slack.com)

## Contributing

1. Create a fork
2. Ensure your fork is caught up (message from Bitbucket shows up on your fork main page, if you are not current on commits)
3. Create a new branch in your fork to hold your changes
4. Submit a pull request

## Changelog

### [unreleased]

#### Added
 - FtpDownload step type (using Service Framework - thanks @jordanebachelet!)
 - Standard Imports
 - Standard Exports
 - Possibility for Custom Port in FtpUpload
 - .project file for use with UX Studio
 
#### Changed
 - FtpUpload Job step type to utilise Service Framework (also hides credentials)

### [0.0.1] 2017-10-26

#### Added
 - eslint configuration, package.json
 - FileCopy and FtpUpload Job step types

## Documentation

### Setup

 - Add cartridge to your code version, upload to target instance
 - Add cartridge to cartridge paths for all Sites that are used as context with the desired job
 - Go to Job Schedules tool in BM, add steps to your job using one of the `custom.CSComponents` step types
 - Configure, run job
 - done!

### List of Step Types

#### custom.CSComponents.Import* - Standard Imports

 - ImportABTests
 - ImportActiveData
 - ImportContent
 - ImportCoupons
 - ImportCustomerGroups
 - ImportCustomerList
 - ImportCustomers
 - ImportCustomObjects
 - ImportGiftCertificates
 - ImportInventoryLists
 - ImportKeyValueMapping
 - ImportPriceAdjustmentLimits
 - ImportProductLists
 - ImportPromotions
 - ImportShippingMethods
 - ImportSlots
 - ImportSourceCodes
 - ImportStores
 - ImportTaxTable


#### custom.CSComponents.Export* - Standard Exports

 - ExportABTests
 - ExportCatalog
 - ExportContent
 - ExportCouponCodes
 - ExportCoupons
 - ExportCustomerGroups
 - ExportCustomerList
 - ExportCustomers
 - ExportCustomObjects
 - ExportGiftCertificates
 - ExportInventoryLists
 - ExportMetadata
 - ExportOrders
 - ExportPriceAdjustmentLimits
 - ExportPriceBooks
 - ExportProductLists
 - ExportPromotions
 - ExportShippingMethods
 - ExportSlots
 - ExportSourceCodes
 - ExportStores

#### custom.CSComponents.MoveFiles

 - Move or copy files from one directory to another
 - Opt-in for overwrite mode
 - Set exit status in case no files were found in source directory
 - Set a file pattern to e.g. filter for specific file types

#### custom.CSComponents.FtpUpload

 - Upload files to an (S)FTP server
 - Configure a non-standard port, set username and password
 - Set exit status in case no files were found in source directory
 - Set a file pattern to e.g. filter for specific file types

#### custom.CSComponents.TimeSlotCondition

  - Determines whether the current time is inside or outside of a defined time slot
  - Let you define if you want to execute subsequent Job of Flow steps if in or outside of the time slot
  