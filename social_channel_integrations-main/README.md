# Social Channel Integrations

## Table of Contents
<details open><summary>Click to open/close</summary>

- [Overview](#overview)
- [Integration Overview](#integration-overview)
- [Prerequisites](#prerequisites)
- [Social Integrations Installation Video](#social-integrations-installation-video-playlist)
- [Get Started](#get-started)
    - [Install Dependencies and Create dw.json](#install-dependencies-and-create-dwjson)
- [Install Social Integrations using b2c-tools](#install-social-integrations-using-b2c-tools)
  - [Install b2c-tools](#install-b2c-tools)
  - [Configure b2c-tools Account Manager API Client](#configure-b2c-tools-account-manager-api-client)
  - [Configure b2c-tools WebDAV Permissions](#configure-b2c-tools-webdav-permissions)
  - [Configure b2c-tools OCAPI Permissions](#configure-b2c-tools-ocapi-permissions)
    - [Data API](#data-api)
  - [Deploying the Social Integrations Feature](#deploying-the-social-integrations-feature)
- [Configuration Data](#configuration-data)
  - [Required Data Imports](#exclamation-required-data-imports)
  - [Optional Data Imports](#grey_question-optional-data-imports)
  - [Import Common Data](#white_check_mark-import-common-data)
    - [Option 1: Via b2c-tools](#option-1-via-b2c-tools-see-install-social-integrations-using-b2c-tools-above)
    - [Option 2: Via npm scripts using sfcc-ci](#option-2-via-npm-scripts-using-sfcc-ci)
    - [Option 3: Manual Upload and Import via Business Manager](#option-3-manually-zip-upload-and-import-via-business-manager)
  - [Import Social Integrations Channel Specific Data](#white_check_mark-import-social-integrations-channel-specific-data)
  - [Configure WebDAV Permissions](#white_check_mark-configure-webdav-permissions)
- [Postman Collection](#postman-collection)
</details>

## Overview
This repository consists of a set of cartridges (social channels, social feeds, and social checkout management) that need to be leveraged in case you want to integrate your site with different social channels in order to accomplish a complete social ad/selling/checkout experience. You need a preexisting Salesforce Commerce Cloud working site, catalog, checkout, etc. in order to benefit from this repo.

This repository contains four folders:
1. **[social_feeds](./social_feeds)**: Create social feeds directly from Business Manager, to be used by integrations that rely on a feeds based approach
2. **[social_channels](./social_channels)**: Business Manager Integration with several social channels
3. **[social_checkout](./social_checkout)**: Place orders and query order status from social channels
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
    - If you do not have a preexisting site or would like to start from scratch, use [Site Import/Export to Import the Storefront Reference Architecture (SFRA) Demo Site](https://help.salesforce.com/s/articleView?id=cc.b2c_site_import_export.htm)
2. A Salesforce Commerce Cloud site and product catalog
3. A Salesforce Commerce Cloud business user account
4. A Salesforce Commerce [API Client ID and Secret](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_add_api_client_id.htm) created in Account Manager.
5. A Salesforce Commerce Cloud ["WebDAV File Access and UX Studio" access key](https://help.salesforce.com/s/articleView?id=cc.b2c_access_keys_for_business_manager.htm)

## Social Integrations Installation Video Playlist
[![Installation Video](./docs/images/b2c-tools-install-thumbnail-play.jpg)](https://salesforce.vidyard.com/watch/9imcQvd85JvsGjctgt5gym)

## Get Started

### Install Dependencies and Create dw.json

1. Clone this repository. The name of the top-level directory is `social_channel_integrations`.
2. From the `social_channel_integrations` directory, run `npm install` to install package dependencies.
3. Create a `dw.json` file in the root directory of the `social_channel_integrations` repository. Replace the `$` strings with actual values or set the corresponding environment variables. Provide your ["WebDAV File Access and UX Studio" access key from BM](https://help.salesforce.com/s/articleView?id=cc.b2c_access_keys_for_business_manager.htm) in the `password` field.

    ```json
    {
        "name": "$NAME",
        "active": true,
        "hostname": "$SFCC_SERVER",
        "username": "$USERNAME",
        "password": "$PASSWORD",
        "code-version": "$SFCC_CODE_VERSION",
        "client-id": "$SFCC_OAUTH_CLIENT_ID",
        "client-secret": "$SFCC_OAUTH_CLIENT_SECRET",
        "short-code": "$SFCC_SHORT_CODE"
    }
    ```

> **NOTE**: In order to upload cartridges via npm scripts, you will need to replicate the dw.json in the `social_channels`, `social_checkout`, and `social_feeds` directories. The npm scripts will attempt to create a symlink, but it might be necessary for you to manually create this symlink for your operating system.

#### Uploading SFCC Cartridges
For more information on uploading SFCC cartridges, please see the following topics:
1. [Upload Code for SFRA](https://developer.salesforce.com/docs/commerce/sfra/guide/b2c-build-sfra.html#upload-code-for-sfra)
2. [Upload, configure, and customize cartridges for Salesforce B2C Commerce](https://trailhead.salesforce.com/content/learn/modules/b2c-cartridges)

## Install Social Integrations using b2c-tools
The easiest and quickest way to get started is to use the included feature migrations, powered by [b2c-tools](https://github.com/SalesforceCommerceCloud/b2c-tools). `b2c-tools` is a CLI tool and library for data migrations, import/export, scripting and other tasks with SFCC B2C instances and administrative APIs (SCAPI, ODS, etc).

Deploying the `Social Integrations` [feature](https://github.com/SalesforceCommerceCloud/b2c-tools/blob/main/docs/FEATURES.md) will automate the entire installation process by:
- uploading all or only the specific cartridges you require
- installing all metadata, jobs, and custom objects
- updating storefront and business manager cartridge paths
- updating default site preferences
- assigning OCAPI and WebDAV permissions based on your [Social Integration API Client ID and Secret](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_add_api_client_id.htm) created in Account Manager
- creating and/or updating your SCAPI client ID with the required shopper scopes
- adding a business manager role that you can assign to the necessary users

In the [installation video](https://share.vidyard.com/watch/WmrMwPsf1G1MtBKAmisQPC?second=414), the following steps are performed:
- Install `b2c-tools`
- Deploy the `Social Integrations` feature (`b2c-tools feature deploy "Social Integrations"`)
- Get/View the `Social Integrations` feature configured settings (`b2c-tools feature get "Social Integrations"`)
- Remove the `Social Integrations` feature (`b2c-tools feature remove "Social Integrations"`)
   - Note: Removing the feature removes all social cartridges from your cartridge paths and deletes the SCAPI Client ID. It does **not** remove cartridges or metadata from your sandbox.

### Install b2c-tools
To get started with b2c-tools, you will need to:
1. create an API Client ID and Secret in Account Manager. Refer to the [steps below](#configure-b2c-tools-api-client-id).
2. download and install `b2c-tools`
```shell
git clone git@github.com:SalesforceCommerceCloud/b2c-tools
cd b2c-tools

# install out of this clone
npm install
npm install -g .
```
3. Refer to the [steps below](#configure-b2c-tools-webdav-permissions) to configure the required WebDAV and OCAPI permissions.

### Configure b2c-tools Account Manager API Client
Refer to [Create a Shopper Login and API Access Service (SLAS) Client](./docs/SLASClient.md#use-an-account-manager-api-client-to-interact-with-the-slas-admin-api) for documentation on configuring the API Client ID you will use for b2c-tools.

### Configure b2c-tools WebDAV Permissions
1. Log in to Business Manager
2. Go to **Administration** > **Organization** > **WebDAV Client Permissions**
3. Update the client permissions as follows:
```json
{
    "clients": [
        {
            "client_id": "YOUR_B2C_TOOLS_CLIENT_ID",
            "permissions": [
                {
                    "path": "/cartridges",
                    "operations": ["read_write"]
                },
                {
                    "path": "/impex",
                    "operations": ["read_write"]
                }
            ]
        }
    ]
}
```

### Configure b2c-tools OCAPI Permissions

#### Data API
1. Log in to Business Manager
2. Go to **Administration** > **Site Development** > **Open Commerce API Settings**
3. Select **Type**: `Data`
4. Select **Context**: `Global`
5. Update the **Data API** settings as follows:

```json
{
    "_v": "21.3",
    "clients": [
        {
            "client_id": "[-------B2C TOOLS OCAPI Client ID-------]",
            "resources": [
                {
                    "resource_id": "/code_versions",
                    "methods": ["get"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/code_versions/*",
                    "methods": ["patch", "delete"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/custom_objects/**",
                    "methods": ["get", "put", "delete", "patch"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/custom_objects_search/*",
                    "methods": ["post"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/global_preferences/preference_groups/b2cToolkit/development",
                    "methods": ["get", "patch"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/job_execution_search",
                    "methods": ["post"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/jobs/*/executions",
                    "methods": ["post"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/jobs/*/executions/*",
                    "methods": ["get"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/sites",
                    "methods": ["get"],
                    "read_attributes": "(**)"
                },
                {
                    "resource_id": "/sites/**",
                    "methods": ["get", "put", "post", "delete", "patch"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                },
                {
                    "resource_id": "/sites/*/cartridges",
                    "methods": ["post"],
                    "read_attributes": "(**)",
                    "write_attributes": "(**)"
                }
            ]
        }
    ]
}
```

### Deploying the Social Integrations Feature
```shell
# deploy Social Integrations feature
b2c-tools feature deploy "Social Integrations"

# or deploy via npm
npm run feature:deploy
```

```shell
# get raw configuration of Social Integrations feature
b2c-tools feature get "Social Integrations"

# or deploy via npm
npm run feature:get
```

```shell
# remove Social Integration feature
b2c-tools feature remove "Social Integrations"

# or deploy via npm
npm run feature:remove
```
During feature deployment, as you can see in the [screen recording](https://github.com/SalesforceCommerceCloud/social_channel_integrations/assets/375787/91df9155-01c2-4776-ad1a-dd5313dfc6d2), you will be guided through the installation process.

You will be asked the following questions:
- [ ] `Site ID`: Specify the site ID you want to deploy (where the cartridge paths will be updated). You can view your site IDs in Business Manager at: **Administration** > **Sites** > **Manage Sites**
- [ ] `Social Channel`: Select the specific social channel you wish to install or select **All Channels** to install all social channels
- [ ] `OCAPI Client ID`: Enter your Social Integrations OCAPI client ID to have the feature automatically configure your OCAPI and WebDAV permissions; existing permissions will remain. This client ID should be used **only** for the social channel integrations and should not be shared.
- [ ] `SLAS Client ID`: The SLAS client ID will be created and/or updated with the proper site IDs and shopper scopes.<br/>Enter either:
  1. a previously created SLAS _**private**_ client ID
  2. `create` to create a new SLAS ID
  3. `skip` to skip any SLAS client ID creation and/or updates.
- [ ] `SLAS Client Secret`: This password will be used when **creating** a SLAS private client ID.
- [ ] `SCAPI Short Code`: Your SCAPI short code found at **Administration** > **Site Development** > **Salesforce Commerce API Settings** (e.g.: `kv7kzm78`). If the short code can be derived from your `.env` or `dw.json` file, this question will be skipped.
- [ ] `SCAPI Org ID`: Your SCAPI organization ID found at **Administration** > **Site Development** > **Salesforce Commerce API Settings** (e.g.: `f_ecom_zzte_053`). If the org ID can be derived from your `.env` or `dw.json` file, this question will be skipped.
- [ ] `Deploy Option`: Chose whether you want both code and data deployed, just code, or just data
- [ ] `Order Management Integration`: Chose whether you want to include the Salesforce Order Management cartridge (`int_order_som`) or the non-Salesforce Order Management cartridge (`int_order_no_oms`). This is currently available for TikTok and Snapchat. Review [Order Management System (OMS) Integration](./docs/oms.md).
- [ ] `Include Omnichannel Inventory?` Include the OCI export jobs. This is currently available for Google. Review [Omnichannel Inventory (OCI) Integration](./docs/oci.md)
- [ ] `Include Pixel Tracking Cartridges?` Include any pixel integrations in the repo. This is currently available for TikTok

## Configuration Data
All metadata and configuration files are contained in the [data](./data) folder.

### :exclamation: Required Data Imports
All social integrations will need to minimally import:
1. All data in the [data/common](./data/common) folder
2. Your channel specific `global` folder:
   - [Google](./data/google/google_global)
   - [Instagram](./data/instagram/instagram_global)
   - [Snapchat](./data/snapchat/snapchat_global)
   - [Tiktok](./data/tiktok/tiktok_global)

### :grey_question: Optional Data Imports
1. [oci_feeds](./data/oci_feeds) contains all metadata needed for exports of Omnichannel Inventory data. See [Omnichannel Inventory](./docs/oci.md)
2. Site-specific template folders based on `RefArch` demo site
    - [TikTok](./data/tiktok/tiktok_site)

### :white_check_mark: Import Common Data
#### Option 1: Via `b2c-tools`. See [Install Social Integrations using b2c-tools](#install-social-integrations-using-b2c-tools) above.

#### Option 2: Via npm scripts using [sfcc-ci](https://github.com/SalesforceCommerceCloud/sfcc-ci)
1. From the root of the repo, run: `npm run data:import:common`
    - This will zip, upload, and import the data files into the sandbox specified in your dw.json file.

#### Option 3: Manually Zip, Upload, and Import via Business Manager
1. Zip the [data/common](./data/common) folder. From the root of the repo, run: `npm run data:common:zip` (or manually zip the folder)
2. Log in to Business Manager
3. Go to **Administration** > **Site Development** > **Site Import & Export**
4. Click **Browse**
5. Select the `common.zip` file from the root of the repo
6. Click **Upload**.
7. Select `common.zip`
8. Click **Import**.
9. Click **OK**.

### :white_check_mark: Import Social Integrations Channel Specific Data
Follow the corresponding README files for installation instructions, per social channel:
1. [Google](./docs/google.md)
2. [Instagram](./docs/instagram.md)
3. [Snapchat](./docs/snapchat.md)
4. [Tiktok](./docs/tiktok.md)

> Note: The full installation process can be done via b2c-tools. See [Install Social Integrations using b2c-tools](#install-social-integrations-using-b2c-tools) above.

### :white_check_mark: Configure WebDAV Permissions

> :rocket: **NOTE**: If you installed via b2c-tools, this step has already been completed. See [Install Social Integrations using b2c-tools](#install-social-integrations-using-b2c-tools) above.

Ensure the following WebDAV permissions are set in Business Manager. You will use your [API Client ID](https://help.salesforce.com/s/articleView?id=cc.b2c_account_manager_add_api_client_id.htm) created in the [prerequisites](#prerequisites) section.

1. Log in to Business Manager
2. Go to **Administration** > **Organization** > **WebDAV Client Permissions**
3. Update the client permissions as follows:
```json
{
    "clients": [
        {
            "client_id": "YOUR_SOCIAL_INTEGRATIONS_CLIENT_ID",
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
