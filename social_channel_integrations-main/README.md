# Social Channel Integrations

## Table of Contents
<details open><summary>Click to open/close</summary>

- [Overview](#overview)
- [Integration Overview](#integration-overview)
- [Prerequisites](#prerequisites)
- [Get Started](#get-started)
  - [Install Dependencies and Create dw.json](#install-dependencies-and-create-dwjson)
  - [Import and Update Configuration Data](#import-and-update-configuration-data)
    - [Required Data Imports](#exclamation-required-data-imports)
    - [Optional Data Imports](#grey_question-optional-data-imports)
    - [Import Common Data](#white_check_mark-import-common-data)
      - [Option 1: Via npm scripts using sfcc-ci](#option-1-via-npm-scripts-using-sfcc-ci)
      - [Option 2: Manual Upload and Import via Business Manager](#option-2-manual-upload-and-import-via-business-manager)
    - [Import Social Integrations Channel Specific Data](#white_check_mark-import-social-integrations-channel-specific-data)
  - [Configure WebDAV Permissions](#white_check_mark-configure-webdav-permissions)
- [Postman Collection](#postman-collection)
</details>

## Overview
This repository consists of a set of cartridges (social channels, social feeds, and social checkout management) that need to be leveraged in case you want to integrate your site with different social channels in order to accomplish a complete social ad/selling/checkout experience. You need a preexisting Salesforce Commerce Cloud working site, catalog, checkout, etc. in order to benefit from this repo.

This repository contains four folders:
1. **[social_feeds](./social_feeds)**: Create social feeds directly from Business Manager, to be used by integrations that rely on a feeds based approach (Google, TikTok)
2. **[social_channels](./social_channels)**: Business Manager Integration with several social channels (Google, Snapchat, TikTok)
3. **[social_checkout](./social_checkout)**: Place orders and query order status from social channels (TikTok)
4. **[social_oms_integration](./social_oms_integration)**: Salesforce OMS package that enables customers to integrate order status from SF OMS to SFCC. The Order status exports from SFCC can then be consumed by the external social channels.

## Integration Overview
Social Channels Integrations is set of business manager cartridges, and a Salesforce OMS (SF OMS) package enabling commerce cloud merchandisers to improve discoverability of products, increase traffic into commerce cloud storefronts, and sell on external channels.

The business cartridges enables customers to:
1. Launch direct integrations into social channels from within Salesforce Commerce Cloud (SFCC) Business Manager
2. Create product and inventory feeds to publish products into the social channel
3. Inject the social channel's pixel into the SFCC storefront for a particular site, enable server side activity tracking
4. Integrate orders from the social channels into Commerce Cloud

## Prerequisites
This repo requires that you have:
1. [Storefront-Reference-Architecture](https://github.com/SalesforceCommerceCloud/storefront-reference-architecture) (SFRA)
    - If you do not have a preexisting site or would like to start from scratch, use [Site Import/Export to Import Reference Application Demo Sites](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/content/b2c_commerce/topics/import_export/b2c_using_site_import_for_reference_application_demos.html)
2. A Salesforce Commerce Cloud site and product catalog
3. A Salesforce Commerce Cloud business user account
4. A Salesforce Commerce [API Client ID and Secret](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/content/b2c_commerce/topics/account_manager/b2c_account_manager_add_api_client_id.html) created in Account Manager.
5. A Salesforce Commerce Cloud ["WebDAV File Access and UX Studio" access key](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/content/b2c_commerce/topics/admin/b2c_access_keys_for_business_manager.html)

## Get Started

### Install Dependencies and Create dw.json

1. Clone this repository. The name of the top-level directory is `social_channel_integrations`.
2. From the `social_channel_integrations` directory, run `npm install` to install package dependencies.
3. Create a `dw.json` file in the root directory of the `social_channel_integrations` repository. Replace the `$` strings with actual values or set the corresponding environment variables. Provide your ["WebDAV File Access and UX Studio" access key from BM](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/content/b2c_commerce/topics/admin/b2c_access_keys_for_business_manager.html) in the `password` field.

    ```json
    {
        "hostname": "$HOST",
        "username": "$USERNAME",
        "password": "$PASSWORD",
        "code-version": "$VERSION"
    }
    ```

> **NOTE**: In order to upload cartridges via npm scripts, you will need to replicate the dw.json in the `social_channels`, `social_checkout`, and `social_feeds` directories. The npm scripts will attempt to create a symlink, but it might be necessary for you to manually create this symlink for your operating system.

#### Uploading SFCC Cartridges
For more information on uploading SFCC cartridges, please see the following topics:
1. [Upload Code for SFRA](https://documentation.b2c.commercecloud.salesforce.com/DOC2/topic/com.demandware.dochelp/content/b2c_commerce/topics/sfra/b2c_uploading_code.html)
2. [Upload, configure, and customize cartridges for Salesforce B2C Commerce](https://trailhead.salesforce.com/content/learn/modules/b2c-cartridges)

### Import and Update Configuration Data
All metadata and configuration files are contained in the [data](./data) folder.

#### :exclamation: Required Data Imports
All social integrations will need to minimally import:
1. All data in the [data/common](./data/common) folder
2. Your channel specific `global` folder:
   - [Google](./data/google/google_global)
   - [Snapchat](./data/snapchat/snapchat_global)
   - [Tiktok](./data/tiktok/tiktok_global)

#### :grey_question: Optional Data Imports
1. [oci_feeds](./data/oci_feeds) contains all metadata needed for exports of Omnichannel Inventory data. See [Omnichannel Inventory](./docs/oci.md)
2. Site-specific template folders based on `RefArch` demo site
    - [TikTok](./data/tiktok/tiktok_site)

#### :white_check_mark: Import Common Data

##### Option 1: Via npm scripts using [sfcc-ci](https://github.com/SalesforceCommerceCloud/sfcc-ci)
1. From the root of the repo, run: `npm run data:import:common`
    - This will zip, upload, and import the data files into the sandbox specified in your dw.json file.

##### Option 2: Manually Zip, Upload, and Import via Business Manager
1. Zip the [data/common](./data/common) folder. From the root of the repo, run: `npm run data:common:zip` (or manually zip the folder)
2. Go to **Administration** > **Site Development** > **Site Import & Export**
3. Click **Browse**
4. Select the `common.zip` file from the root of the repo
5. Click **Upload**.
6. Select `common.zip`
7. Click **Import**.
8. Click **OK**.

#### :white_check_mark: Import Social Integrations Channel Specific Data
Follow the corresponding README files for installation instructions, per social channel:
1. [Google](./docs/google.md)
2. [Snapchat](./docs/snapchat.md)
3. [Tiktok](./docs/tiktok.md)

### :white_check_mark: Configure WebDAV Permissions

Ensure the following WebDAV permissions are set in Business Manager. You will use your [API Client ID](https://documentation.b2c.commercecloud.salesforce.com/DOC1/topic/com.demandware.dochelp/content/b2c_commerce/topics/account_manager/b2c_account_manager_add_api_client_id.html) created in the [prerequisites](#prerequisites) section.

1. Go to **Administration** > **Organization** > **WebDAV Client Permissions**
2. Update the client permissions as follows:
```json
{
    "clients": [
        {
            "client_id": "YOUR_CLIENT_ID",
            "permissions": [
                {
                    "path": "/impex/src/feeds/export",
                    "operations": ["read_write"]
                }
            ]
        }
    ]
}
```

## Postman Collection
A Postman Collection to help troubleshoot API responses, create test orders, etc. can be found in the [docs/postman](./docs/postman) folder.
