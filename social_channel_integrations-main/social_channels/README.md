# Social Channels Integration

## Channel Specific Installation Guides
Follow the corresponding README files for installation instructions, per social channel:
1. [Google](./docs/google.md)
2. [Snapchat](./docs/snapchat.md)
3. [Tiktok](./docs/tiktok.md)

## Additional Cartridges

- `app_storefront_social`: Install this cartridge in case you want to include multiple Pixels from different social channels in your storefront (i.e. TikTok pixel + Snapchat pixel).

### Upload Additional Cartridges
1. From the root of the repo (`social_channel_integrations`), run: `npm run code:upload:social:pixel` to upload the `app_storefront_social` cartridge to your instance. Alternatively, manually upload the cartridge using the instructions below:
    - [Uploading SFCC Cartridges](../README.md#uploading-sfcc-cartridges)

### Update Cartridge Paths
To update your **Site** cartridge path:
1. Log in to Business Manager
2. Go to **Administration** > **Sites** > **Manage Sites**
3. Select the site that you want to use. Example site identifier: `RefArch`
4. Click the **Settings** tab
5. In the Cartridges field, add the new cartridge `app_storefront_social`. Example path: `app_storefront_social:int_tiktok:app_storefront_base`
