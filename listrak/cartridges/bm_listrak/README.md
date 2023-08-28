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
    -Line 88: Created custom variable
    -Line 217: Assigned Value to custom variables
    -Line 657-679: Implemented Logic to get product attribute value

## listrak/cartridges/bm_listrak/cartridge/scripts/sync/ltkProductSync.js
    -Line 127-134: Added column with name Meta2,Meta3,Meta4,Color,Style,Size
    -Line 190-194: Updated brand column of product
    -Line 306-314: Updated Meta2,Meta3,Meta4,Color,Style,Size columns of product
    -Line 120: Removed Condition and moved field value outside 
    -Line 137-148: Added column with name Meta2,Meta3,Color,Style,Size
    -Line 308: Updated column Meta4 source value
    -Line 325-330: Added Meta2,Meta3,Color,Style,Size columns of product
