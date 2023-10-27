## Custom code 
[MSS-1474] Listrak Convert Currency to USD & add local currency
## listrak/cartridges/bm_listrak/cartridge/scripts/objects/ltkOrder.js
    -Line 13 and 14: Required the custom helpre and currency.
    -Line 30: Created custom variable within the order object to store EShop World Retailer Currency Code
    -Line 46: Assigned null value to custom variable
    -Line 59: Fixed indentation
    -Line 61: Mentioned the ticket number
    -Line 63 to 66: if the order is EShop World then assign the value with the US currency code
    -Line 72: Assigned value to custom vaiable
    -Line 75: Fixed indentation
    -Line 82: Fixed indentation
    -Line 91: Fixed indentation
    -Line 114: Mentioned ticket number
    -Line 115 to 119: Implemented logic for the US currency code, if the order is EShop World then assign the value with the US currency code
## listrak/cartridges/bm_listrak/cartridge/scripts/sync/ltkOrderSync.js
    -Line 83: Added column with Meta 1 name for local price
    -Line 161: Get Local Price for product

## listrak/cartridges/bm_listrak/cartridge/scripts/objects/ltkProduct.js
    -Line 79-83: Created custom variables
    -Line 204-210: Assigned Values to custom variables
    -Line 587-642: Implemented Logic to get product attribute values 
    -Line 90-95: Created custom variables
    -Line 225-230: Assigned Values to custom variables
    -Line 670-837: Implemented Logic to get product attribute values 
## listrak/cartridges/bm_listrak/cartridge/scripts/sync/ltkProductSync.js
    -Line 127-134: Added column with name Meta2,Meta3,Meta4,Color,Style,Size
    -Line 190-194: Updated brand column of product
    -Line 306-314: Updated Meta2,Meta3,Meta4,Color,Style,Size columns of product
    -Line 46-50: Get Custom Preference Values
    -Line 150-154: Added column with name Color,Style,Size
    -Line 222-234: Updated Category and Sub Category columns of product
    -Line 349-367: Updated Color,Style,Size columns of product
