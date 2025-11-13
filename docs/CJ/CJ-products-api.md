# **3 Product**

## **1 Products**

### **1.1 Category List(GET)**

Get product categories from CJ.

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/getCategory

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/getCategory' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

#### **Return**

success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": [`  
        `{`  
            `"categoryFirstName": "Computer & Office",`  
            `"categoryFirstList": [`  
                `{`  
                    `"categorySecondName": "Office Electronics",`  
                    `"categorySecondList": [`  
                        `{`  
                            `"categoryId": "2252588B-72E3-4397-8C92-7D9967161084",`  
                            `"categoryName": "Office & School Supplies"`  
                        `},`  
                    `]...`  
                `}`  
            `]`      
        `}`  
    `],`  
    `"requestId": "ae543fd1-cdd7-4a61-974a-1340fea678c6"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| categoryFirstName | First level category name | string | 200 |  |
| categoryFirstList | First level category list | Array | \- |  |
| categorySecondName | Second level category name | string | 200 |  |
| categorySecondList | Second level category list | Array | \- |  |
| categoryId | Third level category ID | string | 200 |  |
| categoryName | Third level category name | string | 200 |  |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **1.2 Product List V2(GET)**

Get all available products from CJ with criteria inquiry supported. V2 version uses elasticsearch search engine for higher performance product search capabilities.

Note:

1. Supports keyword search  
2. Supports multiple filter conditions such as price range, category, country, etc.  
3. Supports sorting functionality  
4. Through the features parameter, you can selectively return product details and category information  
5. page minimum value 1, maximum value 1000; size minimum value 1, maximum value 100

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/listV2

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/listV2?page=1&size=20&keyWord=hoodie' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| keyWord | Search keyword | string | N | 200 | Product name or SKU keyword search |
| page | Page number | int | N | 20 | Default 1, minimum 1, maximum 1000 |
| size | Quantity of results on each page | int | N | 20 | Default 10, minimum 1, maximum 100 |
| categoryId | Category ID | string | N | 200 | Filter products by third level category ID |
| lv2categoryList | Second level category ID list | array | N |  | Filter products by second level category ID list |
| lv3categoryList | Third level category ID list | array | N |  | Filter products by third level category ID list |
| countryCode | Country code | string | N | 200 | Format: CN,US,GB,FR etc., filter products with inventory in specified countries |
| startSellPrice | Start sell price | decimal | N |  | Price filter start value |
| endSellPrice | End sell price | decimal | N |  | Price filter end value |
| addMarkStatus | Is free shipping | int | N | 1 | 0-not free shipping, 1-free shipping |
| productType | Product type | int | N | 15 | 4-Supplier product, 10-Video product, 11-Non-video product |
| productFlag | Product flag | int | N | 1 | 0-Trending products, 1-New products, 2-Video products, 3-Slow-moving products |
| startWarehouseInventory | Start warehouse inventory | int | N |  | Filter products with inventory greater than or equal to this value |
| endWarehouseInventory | End warehouse inventory | int | N |  | Filter products with inventory less than or equal to this value |
| verifiedWarehouse | Verified warehouse type | int | N | 1 | null/0-All(default), 1-Verified inventory, 2-Unverified inventory |
| timeStart | Listing time filter start | long | N |  | Listing start time timestamp (milliseconds) |
| timeEnd | Listing time filter end | long | N |  | Listing end time timestamp (milliseconds) |
| zonePlatform | Zone platform suggestion | string | N | 200 | Such as: shopify,ebay,amazon,tiktok,etsy etc. |
| isWarehouse | Is global warehouse search | boolean | N | 1 | true-yes, false-no |
| currency | Currency | string | N | 10 | Such as: USD,AUD,EUR etc. |
| sort | Sort direction | string | N | 4 | desc-descending(default) / asc-ascending |
| orderBy | Sort field | int | N | 20 | 0=best match(default); 1=listing count; 2=sell price; 3=create time; 4=inventory |
| features | Features list | array | N | 200 | Supported values: enable\_description(return product details), enable\_category(return product category information), enable\_combine(return combine product info), enable\_video(return video IDs) |
| supplierId | Supplier ID | string | N | 200 | Filter products by supplier ID |
| hasCertification | Has certification | int | N | 1 | 0-No, 1-Yes |
| isSelfPickup | Is self pickup | int | N | 1 | 0-No, 1-Yes |
| customization | Is customization product | int | N | 1 | 0-No, 1-Yes |

#### **Return**

success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": {`  
        `"pageSize": 20,`  
        `"pageNumber": 1,`  
        `"totalRecords": 1000,`  
        `"totalPages": 50,`  
        `"content": [`  
            `{`  
                `"productList": [`  
                    `{`  
                        `"id": "04A22450-67F0-4617-A132-E7AE7F8963B0",`  
                        `"nameEn": "Personalized Belly-baring Cat Ear Hoody Coat",`  
                        `"sku": "CJNSSYWY01847",`  
                        `"spu": "CJNSSYWY01847",`  
                        `"bigImage": "https://cc-west-usa.oss-us-west-1.aliyuncs.com/20210129/2167381084610.png",`  
                        `"sellPrice": "11.85",`  
                        `"nowPrice": "9.50",`  
                        `"listedNum": 100,`  
                        `"categoryId": "5E656DFB-9BAE-44DD-A755-40AFA2E0E686",`  
                        `"threeCategoryName": "Hoodies & Sweatshirts",`  
                        `"twoCategoryId": "5E656DFB-9BAE-44DD-A755-40AFA2E0E685",`  
                        `"twoCategoryName": "Tops & Sets",`  
                        `"oneCategoryId": "5E656DFB-9BAE-44DD-A755-40AFA2E0E684",`  
                        `"oneCategoryName": "Women's Clothing",`  
                        `"addMarkStatus": 1,`  
                        `"isVideo": 0,`  
                        `"videoList": [],`  
                        `"productType": "ORDINARY_PRODUCT",`  
                        `"supplierName": "",`  
                        `"createAt": 1609228800000,`  
                        `"warehouseInventoryNum": 500,`  
                        `"totalVerifiedInventory": 500,`  
                        `"totalUnVerifiedInventory": 0,`  
                        `"verifiedWarehouse": 1,`  
                        `"customization": 0,`  
                        `"hasCECertification": 0,`  
                        `"isCollect": 0,`  
                        `"myProduct": false,`  
                        `"currency": "USD",`  
                        `"discountPrice": "9.50",`  
                        `"discountPriceRate": "20",`  
                        `"description": "Product description...",`  
                        `"deliveryCycle": "3-5",`  
                        `"saleStatus": "3",`  
                        `"authorityStatus": "1",`  
                        `"isPersonalized": 0`  
                    `}`  
                `],`  
                `"relatedCategoryList": [`  
                    `{`  
                        `"categoryId": "xxx",`  
                        `"categoryName": "Hoodies"`  
                    `}`  
                `],`  
                `"storeList": [`  
                    `{`  
                        `"warehouseId": "1",`  
                        `"warehouseName": "China Warehouse",`  
                        `"countryCode": "CN"`  
                    `}`  
                `],`  
                `"keyWord": "hoodie",`  
                `"keyWordOld": "hoodie",`  
                `"searchHit": "1::1000"`  
            `}`  
        `]`  
    `},`  
    `"requestId": "f95cd31d-3907-47ce-ac1a-dfdee4315960"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| pageSize | Page size | long | 20 | Number of products per page |
| pageNumber | Current page number | long | 20 | Current requested page number, starts from 1 |
| totalRecords | Total records | long | 20 | Total number of products matching criteria |
| totalPages | Total pages | long | 20 | Total pages |
| content | Content list | array |  | Product data list |

CjProductInfoSearchV2DTO object in content:

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| productList | Product list | array |  | Product information array |
| relatedCategoryList | Related category list | array |  | Related categories matched by search keyword list |
| keyWord | Search keyword | string | 200 | Actual search keyword used |
| keyWordOld | Original search keyword | string | 200 | Original search keyword entered by user |

Product object in productList:

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| id | Product ID | string | 200 | Unique product identifier |
| nameEn | Product name (English) | string | 200 | Product English name |
| sku | Product SKU | string | 200 | Product SKU code |
| spu | Product SPU | string | 200 | Product SPU code, same as SKU |
| bigImage | Product main image | string | 200 | Product main image URL |
| sellPrice | Sell price | string | 20 | Product sell price, unit: USD |
| nowPrice | Discount price | string | 20 | Product discount price |
| discountPrice | Best discount price | string | 20 | Best discount price |
| discountPriceRate | Discount rate | string | 20 | Discount percentage |
| listedNum | Listed number | int | 20 | Number of times this product is listed on the platform |
| isCollect | Is collected | int | 1 | 0-not collected, 1-collected |
| categoryId | Third level category ID | string | 200 | Product third level category ID |
| threeCategoryName | Third level category name | string | 200 | Third level category name (returned only when features contains enable\_category) |
| twoCategoryId | Second level category ID | string | 200 | Product second level category ID |
| twoCategoryName | Second level category name | string | 200 | Second level category name (returned only when features contains enable\_category) |
| oneCategoryId | First level category ID | string | 200 | Product first level category ID |
| oneCategoryName | First level category name | string | 200 | First level category name (returned only when features contains enable\_category) |
| addMarkStatus | Is free shipping | int | 1 | 0-not free shipping, 1-free shipping |
| isVideo | Has video | int | 1 | 0-no video, 1-has video |
| videoList | Video ID list | array |  | Product video ID collection (returned only when features contains enable\_video) |
| productType | Product type | string | 20 | Product type code |
| supplierName | Supplier name | string | 200 | Product supplier name |
| createAt | Create time | long | 20 | Product create timestamp (milliseconds) |
| setRecommendedTime | Recommended time | long | 20 | Set recommended timestamp |
| warehouseInventoryNum | Warehouse inventory number | long | 20 | Total inventory number |
| totalVerifiedInventory | Total verified inventory | int | 20 | Total verified inventory |
| totalUnVerifiedInventory | Total unverified inventory | int | 20 | Total unverified inventory |
| verifiedWarehouse | Verified warehouse identifier | int | 1 | 1-Verified inventory, 2-Unverified inventory |
| customization | Is customization product | int | 1 | 0-No, 1-Yes |
| isPersonalized | Is personalized customization | int | 1 | 0-No, 1-Yes |
| hasCECertification | Has CE certification | int | 1 | 0-No, 1-Yes |
| myProduct | Is added to my products | boolean | 1 | true-added, false-not added |
| currency | Currency | string | 10 | Such as: USD, AUD, EUR etc. |
| description | Product description | string | 2000 | Detailed product description (returned only when features contains enable\_description) |
| deliveryCycle | Delivery cycle | string | 20 | Product delivery cycle in days |
| saleStatus | Sale status | string | 2 | 3-approved for sale |
| authorityStatus | User visible permission | string | 1 | 0-private visible, 1-all visible |
| autStatus | Product visibility | string | 1 | Product visibility status |
| isAut | Is permanent private | string | 1 | 0-not permanent private, 1-permanent private |
| isList | Is listed | int | 1 | 0-not listed, 1-listed |
| syncListedProductStatus | Listing status | string | 1 | 0-pending, 1-listing, 2-failed, 3-success, 4-cancelled |
| isAd | Is advertisement product | int | 1 | 0-not ad, 1-ad product |
| activityId | Advertisement product ID | string | 200 | Advertisement activity ID |
| directMinOrderNum | Minimum order quantity | string | 20 | Minimum order quantity |
| zoneRecommendJson | Zone recommend list | set |  | Zone recommend tag collection |
| inventoryInfo | Warehouse inventory info | string |  | Warehouse inventory details JSON |
| variantKeyEn | Variant property | string | 200 | Variant property English description |
| variantInventories | Variant inventory info | string |  | Variant inventory details JSON |
| propertyKey | Product logistics property key | string | 200 | Product logistics property keywords |

Product Type

| Product Type | Description | Note |
| :---- | :---- | :---- |
| ORDINARY\_PRODUCT | Ordinary product, managed by CJ for inventory management | Managed by CJ for inventory and shipping |
| SERVICE\_PRODUCT | Service product, If you need to transfer your own goods to CJ warehouse and CJ provides warehousing services, we will mark it as a service item | Your own products with CJ warehousing services |
| PACKAGING\_PRODUCT | Packaging product are used for packaging when shipped from the warehouse. They do not support separate shipping and need to be shipped together with other goods | For packaging only, cannot be sold separately |
| SUPPLIER\_PRODUCT | Supplier product, It is a merchant that collaborates with CJ to manage inventory of goods | Supplier products, managed and shipped by CJ |
| SUPPLIER\_SHIPPED\_PRODUCT | Shipped by supplier management | Supplier products, managed and shipped by suppliers |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | Error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | Return message | string | 200 |  |
| data | Return data | object |  | Business data |
| requestId | Request ID | string | 48 | Flag request for logging errors |

### **1.3 Global Warehouse List(GET)**

Get the list of all available global warehouses.

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/globalWarehouseList

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/globalWarehouseList' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

#### **Request Parameters**

No parameters required

#### **Return**

success

`{`  
    `"code": 200,`  
    `"success": true,`  
    `"message": "Success",`  
    `"data": [`  
        `{`  
            `"areaCn": "中国仓",`  
            `"areaEn": "China Warehouse",`  
            `"areaId": 1,`  
            `"countryCode": "CN",`  
            `"nameEn": "China",`  
            `"valueEn": "CN",`  
            `"disabled": false,`  
            `"zh": "中国仓",`  
            `"en": "China Warehouse",`  
            `"de": "China-Lager",`  
            `"fr": "Entrepôt Chine",`  
            `"th": "คลังสินค้าจีน",`  
            `"id": "1"`  
        `},`  
        `{`  
            `"areaCn": "美国仓",`  
            `"areaEn": "US Warehouse",`  
            `"areaId": 2,`  
            `"countryCode": "US",`  
            `"nameEn": "United States",`  
            `"valueEn": "US",`  
            `"disabled": false,`  
            `"zh": "美国仓",`  
            `"en": "US Warehouse",`  
            `"de": "US-Lager",`  
            `"fr": "Entrepôt américain",`  
            `"th": "คลังสินค้าสหรัฐ",`  
            `"id": "2"`  
        `}`  
    `],`  
    `"requestId": "ae543fd1-cdd7-4a61-974a-1340fea678c6"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| areaCn | Warehouse name (CN) | string | 200 | Chinese name of the warehouse |
| areaEn | Warehouse name (EN) | string | 200 | English name of the warehouse |
| areaId | Warehouse ID | int | 20 | Unique warehouse identifier |
| countryCode | Country code | string | 10 | ISO country code, e.g., CN, US, GB |
| nameEn | Country name (EN) | string | 200 | English name of the country |
| valueEn | Warehouse code | string | 10 | Warehouse code value, usually matches country code |
| disabled | Is disabled | boolean | 1 | true-disabled, false-available |
| zh | Chinese name | string | 200 | Multi-language support \- Chinese |
| en | English name | string | 200 | Multi-language support \- English |
| de | German name | string | 200 | Multi-language support \- German |
| fr | French name | string | 200 | Multi-language support \- French |
| th | Thai name | string | 200 | Multi-language support \- Thai |
| id | Warehouse string ID | string | 20 | String format of warehouse ID |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | Error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | Return message | string | 200 |  |
| data | Return data | object |  | Business data |
| requestId | Request ID | string | 48 | Flag request for logging errors |

### **1.4 Product List(GET)**

Get all available products from CJ, criteria inquiry supported. 20 results for each page, fixed.

Note:

1. Maximum return of 200 data per page.  
2. Free users or v1 users are limited to a maximum of 1000 requests per day.(2024-09-30 update)  
3. One IP is limited to a maximum of three users.(2024-09-30 update)  
4. Query the product list and add "deliveryTime" field (hours). The values are 24, 48, 72, or null (2024-11-15 update)

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/list

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/list' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| pageNum | Page number | int | N | 20 | Default 1, specifies the page number of the product list to retrieve |
| pageSize | Quantity of results on each page | int | N | 20 | Default 20, number of products returned per page, maximum 200 |
| categoryId | category id | string | N | 200 | Inquiry criteria, filter products by category ID |
| pid | Product id | string | N | 200 | Filter products by unique product identifier |
| productSku | Product sku | string | N | 200 | Filter products by SKU |
| productName | Product name | string | N | 200 | Fuzzy match by product Chinese name |
| productNameEn | Product name(en) | string | N | 200 | Fuzzy match by product English name |
| productType | Product type | string | N | 200 | Optional values: ORDINARY\_PRODUCT, SUPPLIER\_PRODUCT \- Returns all types if not provided |
| countryCode | countryCode | string | N | 200 | Example: CN, US \- Filter products with inventory in specified countries |
| deliveryTime | Delivery Time (hours) | string | N | 200 | Optional values: 24 (ships within 24 hours), 48 (ships within 48 hours), 72 (ships within 72 hours) \- Returns only products meeting the specified delivery time |
| verifiedWarehouse | Verified Inventory Type | number | N | 1 | Optional values: 1 (Verified), 2 (Unverified) \- Not passing values means not restricting queries based on that type |
| startInventory | the minimum inventory | number | N |  | eg: 2, filter products with inventory greater than or equal to this value |
| endInventory | the highest inventory | number | N |  | eg: 10, filter products with inventory less than or equal to this value |
| createTimeFrom | create time(start) | string | N | 200 | format: yyyy-MM-dd hh:mm:ss, filter products created after this time |
| createTimeTo | create time(end) | string | N | 200 | format: yyyy-MM-dd hh:mm:ss, filter products created before this time |
| brandOpenId | brand id | long | N | 200 | Inquiry criteria, filter by brand ID |
| minPrice | minimum price | number | N | 200 | Example: 1.0 \- Filter products with price greater than or equal to this value |
| maxPrice | maximum price | number | N | 200 | Example: 2.5 \- Filter products with price less than or equal to this value |
| searchType | Search Type | number | N | 5 | Optional values: 0 (All products), 2 (Trending Products), 21 (Trending Products View More) \- Default is 0 |
| minListedNum | Minimum Listed Num | number | N | 10 | Example: 1 \- Returns products with listing count greater than or equal to this value |
| maxListedNum | Maximum Listed Num | number | N | 10 | Example: 10 \- Returns products with listing count less than or equal to this value |
| sort | Sort Type | string | N | 4 | Optional values: desc (descending order), asc (ascending order) \- Default: desc |
| orderBy | Sort field | string | N | 20 | Optional values: createAt (sort by creation time), listedNum (sort by listing count) \- Default: createAt |
| isSelfPickup | Does the product support self pickup | number | N | 1 | Optional values: 1 (supported), 0 (not supported) |
| supplierId | Supplier Id | string | N | 40 | Filter products by supplier ID |
| isFreeShipping | Is Free Shipping? | int | N | 1 | Optional values: 0 (not free), 1 (free shipping) |
| customizationVersion | Customization Version | int | N | 1 | Optional values: 1 (Platform Customized Version V1), 2 (Platform Customized Version V2), 3 (Customer Customized Version V1), 4 (Customer Customized Version V2), 5 (POD 3.0 Platform Customized) \- Filter POD products by customization version |

#### **Return**

success

`{`  
     `"code": 200,`  
     `"result": true,`  
     `"message": "Success",`  
     `"data": {`  
         `"pageNum": 1,`  
         `"pageSize": 20,`  
         `"total": 1,`  
         `"list": [`  
             `{`  
                 `"pid": "04A22450-67F0-4617-A132-E7AE7F8963B0",`  
                 `"productName": "[\"猫耳朵卫衣\",\"定制卫衣\",\"个性化定制\"]",`  
                 `"productNameEn": "Personalized Belly-baring Cat Ear Hoody Coat",`  
                 `"productSku": "CJNSSYWY01847",`  
                 `"productImage": "https://cc-west-usa.oss-us-west-1.aliyuncs.com/20210129/2167381084610.png",`  
                 `"productWeight": 0,`  
                 `"productType": null,`  
                 `"productUnit": "unit(s)",`  
                 `"sellPrice": 11.85,`  
                 `"categoryId": "5E656DFB-9BAE-44DD-A755-40AFA2E0E686",`  
                 `"categoryName": "Women's Clothing / Tops & Sets / Hoodies & Sweatshirts",`  
                 `"remark": "",`  
                 `"createTime": null,`  
                 `"customizationVersion": 1`  
             `}`  
         `]`  
     `},`  
     `"requestId": "f95cd31d-3907-47ce-ac1a-dfdee4315960"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| pageNum | Page number | int | 20 | Current page number |
| pageSize | Quantity of results on each page | int | 20 | Number of products per page |
| total | Total quantity of results | int | 20 | Total number of products matching criteria |
| list | Product list | Product\[\] |  | List of product data |
| pid | Product ID | string | 200 | Unique product identifier |
| productName | Product name | string | 200 | Product Chinese name, may be a JSON array string with multiple names |
| productNameEn | Product name(EN) | string | 200 | Product English name |
| productSku | Product sku | string | 200 | Product SKU code |
| productImage | Product image | string | 200 | Product main image URL |
| productWeight | Product weight | int | 200 | Unit: g |
| productType | Product type | byte | 200 | Product type code |
| productUnit | Product unit | string | 48 | Product selling unit |
| categoryId | Category id | string | 200 | Product category ID |
| categoryName | Category name | string | 200 | Product category name |
| remark | Remark | string | 200 | Product remark information |
| addMarkStatus | Is shipping free? (Deprecated, please use isFreeShipping) | int | 1 | 0=Not free shipping, 1=free shipping |
| isFreeShipping | Is shipping free? | boolean | 1 | true for free shipping, false for paid shipping |
| listedNum | Listed number | int | 200 | Number of listings for this product on the platform |
| supplierName | Supplier name | string | 200 | Product supplier name |
| supplierId | Supplier id | string | 200 | Product supplier ID |
| sellPrice | Sell price | decimal | \- | Product selling price |
| createTime | Create time | string | \- | Product creation time on the platform |
| isVideo | Has video | int | 1 | 1 means includes video, 0 means no video |
| saleStatus | Sale status | int | 20 | 3 means approved for sale |
| customizationVersion | Customization Version | int | 1 | Custom product version number |

Product Type

| Product Type | Description |
| :---- | :---- |
| ORDINARY\_PRODUCT | Ordinary product， managed by CJ for inventory management |
| SERVICE\_PRODUCT | Service product, If you need to transfer your own goods to CJ warehouse and CJ provides warehousing services, we will mark it as a service item; |
| PACKAGING\_PRODUCT | Packaging product are used for packaging when shipped from the warehouse. They do not support separate shipping and need to be shipped together with other goods; |
| SUPPLIER\_PRODUCT | Supplier product, It is a merchant that collaborates with CJ to manage inventory of goods |
| SUPPLIER\_SHIPPED\_PRODUCT | shipped by supplier management |

Product Status

| Status Code | Description |
| :---- | :---- |
| 3 | On Sale |

Customization Version

| Customization Version | remark |
| :---- | :---- |
| 0 | Non-pod products |
| 1 | Platform Customized Version V1 |
| 2 | Platform Customized Version V2 |
| 3 | Customer Customized Version V1 |
| 4 | Customer Customized Version V2 |
| 5 | POD 3.0 Platform Customized |

Error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **1.3 Product Details(GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/query

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=000B9312-456A-4D31-94BD-B083E2A198E8' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| pid | Product id | string | Choose one of pid, productSku, variantSku | 200 | Inquiry criteria, unique product identifier |
| productSku | Product sku | string | Choose one of pid, productSku, variantSku | 200 | Inquiry criteria, product SPU code |
| variantSku | variant sku | string | Choose one of pid, productSku, variantSku | 200 | Inquiry criteria, variant SKU code |
| features | features | List | N | 200 | Optional values: enable\_combine (includes combination variants, returns combination product info when passed), enable\_video (includes videos, returns product video info when passed) |
| countryCode | Country Code | string | N | 2 | Country code such as CN, US \- Only returns variants with inventory in that country, no restriction if not passed |

#### **Return**

Success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": {`  
        `"pid": "000B9312-456A-4D31-94BD-B083E2A198E8",`  
        `"productName": "[\"攀爬车 拖斗车 \",\"攀爬车 \",\"拖斗车 \"]",`  
        `"productNameEn": "Small trailer model",`  
        `"productSku": "CJJJJTJT05843",`  
        `"productImage": "https://cc-west-usa.oss-us-west-1.aliyuncs.com/2054/1672872416690.jpg",`  
        `"productWeight": "1500.0",`  
        `"productUnit": "unit(s)",`  
        `"productType": "ORDINARY_PRODUCT",`  
        `"categoryId": "87CF251F-8D11-4DE0-A154-9694D9858EB3",`  
        `"categoryName": "Home & Garden, Furniture / Home Storage / Home Office Storage",`  
        `"entryCode": "8712008900",`  
        `"entryName": "模型",`  
        `"entryNameEn": "model",`  
        `"materialName": "[\"\",\"金属\"]",`  
        `"materialNameEn": "[\"\",\"metal\"]",`  
        `"materialKey": "[\"METAL\"]",`  
        `"packingWeight": "1580.0",`  
        `"packingName": "[\"\",\"塑料袋\"]",`  
        `"packingNameEn": "[\"\",\"plastic_bag\"]",`  
        `"packingKey": "[\"PLASTIC_BAG\"]",`  
        `"productKey": "[\"颜色\"]",`  
        `"productKeyEn": "Color",`  
        `"productPro": "[\"普货\"]",`  
        `"productProSet": ["普货"],`  
        `"productProEn": "[\"COMMON\"]",`  
        `"productProEnSet": ["COMMON"],`  
        `"sellPrice": 58.09,`  
        `"description": "....",`  
        `"suggestSellPrice": "0.97-4.08",`  
        `"listedNum": 392,`  
        `"status": "3",`  
        `"supplierName": "",`  
        `"supplierId": "",`  
        `"customizationVersion": 1,`  
        `"customizationJson1": "",`  
        `"customizationJson2": "",`  
        `"customizationJson3": "",`  
        `"customizationJson4": "",`  
        `"variants": [`  
            `{`  
                `"vid": "D4057F56-3F09-4541-8461-9D76D014846D",`  
                `"pid": "000B9312-456A-4D31-94BD-B083E2A198E8",`  
                `"variantName": null,`  
                `"variantNameEn": "Small trailer model Black",`  
                `"variantSku": "CJJJJTJT05843-Black",`  
                `"variantUnit": null,`  
                `"variantProperty": null,`  
                `"variantKey": "Black",`  
                `"variantLength": 300,`  
                `"variantWidth": 200,`  
                `"variantHeight": 100,`  
                `"variantVolume": 6000000,`  
                `"variantWeight": 1580.00,`  
                `"variantSellPrice": 58.09,`  
                `"createTime": "2019-12-31T11:14:12.000+00:00"`  
                `"variantStandard": "long=110,width=110,height=30",`  
                `"variantSugSellPrice": 0.97`  
                `"combineVariants":[{}]`  
            `}...`  
        `],`  
        `"createrTime": "2019-12-24T01:06:37+08:00"`  
    `},`  
    `"requestId": "d8dc0b6d-0ed8-4e19-8f63-3f207ac39832"`  
`}`

Product

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| pid | Product ID | string | 200 | Unique product identifier |
| productName | Product name | string | 20 | Product Chinese name, in JSON array format |
| productNameEn | Product name(EN) | string | 200 | Product English name |
| productSku | Product sku | string | 200 | Product SKU code |
| productImage | Product image | string | 200 | Product main image URL |
| productWeight | Product weight | int | 200 | Unit: g |
| productType | Product type | byte | 200 | Product type code |
| productUnit | Product unit | string | 48 | Product selling unit |
| categoryId | Category id | string | 200 | Product category ID |
| categoryName | Category name | string | 200 | Product category name |
| entryCode | HS code | string | 200 | Product customs code |
| entryName | Customs name | string | 200 | Product customs Chinese name |
| entryNameEn | Customs name (EN) | string | 200 | Product customs English name |
| materialName | Material | string | 200 | Product material Chinese name |
| materialNameEn | Material (EN) | string | 200 | Product material English name |
| materialKey | Material attribute | string | 200 | Product material attribute keywords |
| packWeight | Package weight | int | 200 | Unit: g, total weight including packaging |
| packingName | Package name | string | 200 | Packaging material Chinese name |
| packingNameEn | Package name (EN) | string | 200 | Packaging material English name |
| packingKey | Package attribute | string | 200 | Packaging material attribute keywords |
| productKey | Product attribute | string | 200 | Product attribute keywords |
| productKeyEn | Product attribute (EN) | string | 200 | Product attribute English keywords |
| productProSet | Product logistics attributes(Chinese) | string\[\] |  | Chinese description of product logistics attributes |
| productProEnSet | Product logistics attributes(English) | string\[\] |  | English description of product logistics attributes |
| addMarkStatus | Is Free Shipping? | int | 1 | 0=not Free, 1=Free |
| description | Description | string | 200 | Detailed product description |
| sellPrice | sell price | string | 200 | Product selling price |
| createrTime | creater time | string | 20 | Product creation time on the platform |
| productVideo | Product video ID list | string\[\] | 200 | If the product contains videos and features are passed in enable\_video, it will return |
| status | status | string | 20 | 3 means approved for sale |
| suggestSellPrice | suggest sell price | string | 20 | Suggested retail price range |
| listedNum | listed number | int | 20 | Number of listings for this product |
| supplierName | supplier name | string | 20 | Product supplier name |
| supplierId | supplier Id | string | 20 | Product supplier ID |
| customizationVersion | customization version | int | 20 | Custom product version number |
| customizationJson1 | customization json | string | 200 | Custom information JSON data 1 |
| customizationJson2 | customization json | string | 200 | Custom information JSON data 2 |
| customizationJson3 | customization json | string | 200 | Custom information JSON data 3 |
| customizationJson4 | customization json | string | 200 | Custom information JSON data 4 |
| variants | Variants | Variant\[\] |  | List of product variants |

Variant

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| vid | Variant Id | string | 200 | Unique variant identifier |
| pid | Product Id | string | 20 | Parent product identifier |
| variantName | Variant Name | string | 200 | Variant Chinese name |
| variantNameEn | Variant Name(en) | string | 200 | Variant English name |
| variantSku | Variant SKU | string | 200 | Variant SKU code |
| variantImage | Variant Image | string | 200 | Variant image URL |
| variantStandard | Variant Standard | string | 200 | Variant specification description |
| variantUnit | Variant Unit | string | 200 | Variant selling unit |
| variantProperty | Variant Property | string | 200 | Variant property type |
| variantKey | Variant Key | string | 200 | Variant attribute keywords |
| variantLength | Variant Length | int | 200 | Unit: mm |
| variantWidth | Variant Width | int | 200 | Unit: mm |
| variantHeight | Variant Height | int | 200 | Unit: mm |
| variantVolume | Variant Volume | int | 200 | Unit: mm3 |
| variantWeight | Variant Weight | double | 200 | Unit: g |
| variantSellPrice | Variant SellPrice | double | 200 | unit: $ (USD) |
| variantSugSellPrice | Variant Suggest SellPrice | double | 200 | unit: $ (USD) |
| createTime | Vreater Time | string | 200 | Variant creation time |
| combineNum | number of Combine Variants | int |  | Number of sub-variants in combined products |
| combineVariants | Combine Variants | Variant\[\] | 200 | List of sub-variants for combined products |

Product Type

| Product Type | Description |
| :---- | :---- |
| ORDINARY\_PRODUCT | Ordinary product |
| SERVICE\_PRODUCT | Service product |
| PACKAGING\_PRODUCT | Packaging product |
| SUPPLIER\_PRODUCT | Supplier product |
| SUPPLIER\_SHIPPED\_PRODUCT | Supplier shipped product |

Product Status

| product status | remark |
| :---- | :---- |
| 3 | On Sale |

Customization Version

| Customization Version | remark |
| :---- | :---- |
| 0 | Non-pod products |
| 1 | Platform Customized Version V1 |
| 2 | Platform Customized Version V2 |
| 3 | Customer Customized Version V1 |
| 4 | Customer Customized Version V2 |
| 5 | POD 3.0 Platform Customized |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **1.4 Add to My Product (POST)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/addToMyProduct

#### **CURL**

`curl --location 'http://localhost:8081/api2.0/v1/product/addToMyProduct' \`  
`--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' \`  
`--header 'Content-Type: application/json' \`  
`--data '{`  
    `"productId": "1658748072937136128"`  
`}'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| productId | CJ product id | string | Y | 100 |  |

#### **Return**

success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": true,`  
    `"requestId": "a7d4d01b1eed4db9ac2cc1ab7903c98c",`  
    `"success": true`  
`}`

error

`{`  
    `"code": 1600000,`  
    `"result": false,`  
    `"message": "The product has been added to My Products.",`  
    `"data": null,`  
    `"requestId": "b626475ff68242c3abfea562f9d4f899",`  
    `"success": false`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **1.3 My Product List(GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/myProduct/query

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/myProduct/query?keyword=CJWJWJYZ02543' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| keyword | sku/spu/product name | string | N | 200 |  |
| categoryId | category id | string | N | 200 |  |
| startAt | start time | string | N | 200 |  |
| endAt | ent time | string | N | 200 |  |
| isListed | isListed | int | N | 200 |  |
| visiable | visiable | int | N | 200 |  |
| hasPacked | hasPacked | int | N | 200 |  |
| hasVirPacked | hasVirPacked | int | N | 200 |  |

#### **Return**

success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": {`  
        `"pageSize": 10,`  
        `"pageNumber": 1,`  
        `"totalRecords": 536,`  
        `"totalPages": 54,`  
        `"content": [`  
            `{`  
                `"productId": "01118E21-A8B9-45CE-A16C-75232FB8A14A",`  
                `"packWeight": "530.0",`  
                `"weight": "480.0",`  
                `"productType": "0",`  
                `"propertyKeyList": [`  
                    `"COMMON"`  
                `],`  
                `"bigImage": "https://cf.cjdropshipping.com/15926688/9714688036284.jpg",`  
                `"nameEn": "3D wooden three-dimensional puzzle",`  
                `"sku": "CJWJWJJM00719",`  
                `"hasPacked": 0,`  
                `"sellPrice": "2.4",`  
                `"discountPrice": null,`  
                `"discountPriceRate": null,`  
                `"defaultArea": "China Warehouse",`  
                `"shopMethod": "CAI NIAO",`  
                `"trialFreight": "0",`  
                `"totalPrice": "2.40",`  
                `"listedShopNum": "0",`  
                `"vid": "7986724D-7214-4B4B-A184-493E7BD78F47",`  
                `"areaId": "1",`  
                `"areaCountryCode": "CN",`  
                `"freightDiscount": "0",`  
                 `"createAt": 1743218214000,`  
                `"lengthList": [`  
                    `335,`  
                    `335`  
                `],`  
                `"heightList": [`  
                    `200,`  
                    `200`  
                `],`  
                `"widthList": [`  
                    `225,`  
                    `225`  
                `],`  
                `"volumeList": [`  
                    `15075000,`  
                    `15075000`  
                `],`  
                `"hasVirPacked": 1`  
            `}`  
        `]`  
    `},`  
    `"requestId": "b0f251412bd0446cb56ba5988706d964",`  
    `"success": true`  
`}`

product

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| productId | Product ID | string | 200 |  |
| productName | Product name | list | 20 |  |
| nameEn | Product name(EN) | string | 200 |  |
| sku | Product sku | string | 200 |  |
| bigImage | Product image | string | 200 |  |
| totalPrice | Product weight | double | 200 | unit: $ (USD) |
| productType | Product type | byte | 200 |  |
| listedShopNum | listed Shop Num | string | 48 |  |
| createAt | Added Time | string | 200 |  |
| trialFreight | trial Freight | string | 200 |  |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

## **2 Variant**

### **2.1 Inquiry Of All Variants (GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/variant/query

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/variant/query?pid=00006BC5-E1F5-4C65-BE2B-3FE0956DA21C' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| pid | Product id | string | Choose one of three | 200 | Inquiry criteria |
| productSku | Product sku | string | Choose one of three | 200 | Inquiry criteria |
| variantSku | variant sku | string | Choose one of three | 200 | Inquiry criteria |
| countryCode | Country Code | string | N | 2 | If the parameter has a value, only variants with inventory in that country will be returned. If no value is passed, inventory will not be restricted |

#### **Return**

success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": [`  
        `{`  
            `"vid": "1D72A20A-D113-4FAB-B4BA-6FE1A6A14A3A",`  
            `"pid": "77501FB4-7146-452E-9889-CDF41697E5CF",`  
            `"variantName": null,`  
            `"variantNameEn": "Wwerwieurieowursdklfjskldjfklsdjfksljfklsdjfkldsjfksdjfksljfksdlfsfdfgf XS",`  
            `"variantSku": "CJJSBGBG01517-XS",`  
            `"variantStandard": "long=5,width=5,height=5",`  
            `"variantUnit": null,`  
            `"variantProperty": null,`  
            `"variantKey": "[\"XS\"]",`  
            `"variantLength": 5,`  
            `"variantWidth": 5,`  
            `"variantHeight": 5,`  
            `"variantVolume": 27,`  
            `"variantWeight": 3.00,`  
            `"variantSellPrice": 3.00,`  
            `"createTime": null`  
        `}`  
    `],`  
    `"requestId": "00765963-35d0-4a6a-b5cf-aa6731793b10"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| vid | Variant ID | string | 200 |  |
| pid | Product ID | string | 200 |  |
| variantName | Variant name | string | 200 |  |
| variantNameEn | Variant name (EN) | string | 200 |  |
| variantImage | Variant image | string | 200 |  |
| variantSku | Variant sku | string | 200 |  |
| variantUnit | Variant unit | string | 200 |  |
| variantProperty | Variant property | string | 200 |  |
| variantKey | Variant Key | string | 200 |  |
| variantLength | Variant length | int | 200 | Unit: mm |
| variantWidth | Variant width | int | 200 | Unit: mm |
| variantHeight | Variant height | int | 200 | Unit: mm |
| variantVolume | Variant volume | int | 200 | Unit: mm3 |
| variantWeight | Variant weight | int | 200 | Unit: g |
| variantSellPrice | Variant sell price | BigDecimal | 200 | Unit: $ (USD) |
| createTime | Create time | string | 200 |  |
| variantStandard | variant standard | string | 200 |  |
| variantSugSellPrice | variant suggest sell price | BigDecimal | 200 | Unit: $ (USD) |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **2.2 Variant Id Inquiry (GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/variant/queryByVid

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/variant/queryByVid?vid=1371342252697325568' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| vid | Variant ID | string | Y | 200 | Inquiry criteria |

#### **Return**

success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": {`  
        `"vid": "1371342252697325568",`  
        `"pid": "00006BC5-E1F5-4C65-BE2B-3FE0956DA21C",`  
        `"variantName": null,`  
        `"variantNameEn": "a-Baby pacifier chain test1 Grey",`  
        `"variantSku": "CJJSBGDY00002-Grey",`  
        `"variantUnit": null,`  
        `"variantProperty": "[]",`  
        `"variantKey": "Grey",`  
        `"variantLength": 3,`  
        `"variantWidth": 3,`  
        `"variantHeight": 3,`  
        `"variantVolume": 27,`  
        `"variantWeight": 3.00,`  
        `"variantSellPrice": 3.00,`  
        `"createTime": "2021-03-15T14:07:26.000+00:00"`  
    `},`  
    `"requestId": "9b86a5e2-40c3-492c-92b2-4634fa4c4a21"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| vid | Variant id | string | 200 |  |
| pid | Product id | string | 200 |  |
| variantName | Variant name | string | 200 |  |
| variantNameEn | Variant name (EN) | string | 200 |  |
| variantImage | Variant image | string | 200 |  |
| variantSku | Variant sku | string | 200 |  |
| variantUnit | Variant unit | string | 200 |  |
| variantProperty | Variant property | string | 200 |  |
| variantKey | Variant key | string | 200 |  |
| variantLength | Variant length | int | 200 | Unit: mm |
| variantWidth | Variant width | int | 200 | Unit: mm |
| variantHeight | Variant height | int | 200 | Unit: mm |
| variantVolume | Variant volume | int | 200 | Unit: mm3 |
| variantWeight | Variant weight | int | 200 | Unit: g |
| variantSellPrice | Variant sell price | BigDecimal | 200 | Unit: $ (USD) |
| createTime | Create time | string | 200 |  |
| variantStandard | Variant standard | string | 200 |  |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

## **3 Inventory**

### **3.1 Inventory Inquiry(GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=7874B45D-E971-4DC8-8F59-40530B0F6B77

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryByVid?vid=7874B45D-E971-4DC8-8F59-40530B0F6B77' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| vid | Variant id | string | Y | 200 | Unique variant identifier |

#### **Return**

success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": [`  
        `{`  
            `"vid": "7874B45D-E971-4DC8-8F59-40530B0F6B77",`  
            `"areaId": "1",`  
            `"areaEn": "China Warehouse",`  
            `"countryCode": "CN",`  
            `"storageNum": 10877`  
            `"totalInventoryNum": 10877`  
            `"cjInventoryNum": 700`  
            `"factoryInventoryNum": 10177`  
        `}...`  
    `],`  
    `"requestId": "bcde45ac-da31-4fc7-a05e-e3b23a1e6694"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| vid | Variant id | bigint | 200 | Unique variant identifier |
| areaId | Warehouse id | int | 20 | Warehouse area ID |
| areaEn | Warehouse name | string | 200 | Warehouse area name |
| countryCode | Country code(EN) | string | 20 | Country code where warehouse is located |
| storageNum | total inventory number, please use totalInventoryNum | int | 20 | Deprecated, please use totalInventoryNum |
| totalInventoryNum | total inventory number | int | 20 | Total inventory quantity of this variant in the warehouse |
| cjInventoryNum | Inventory management in CJ warehouse | int | 20 | Inventory quantity managed directly by CJ |
| factoryInventoryNum | Inventory management in factory | int | 20 | Inventory quantity managed by the factory |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **3.2 Query Inventory by SKU (GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryBySku?sku=CJDS2012593

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/stock/queryBySku?sku=CJDS2012593' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| sku | SKU or SPU | string | Y | 200 |  |

#### **Return**

success

`{`  
    `"code": 200,`  
    `"result": true,`  
    `"message": "Success",`  
    `"data": [`  
        `{`  
            `"areaEn": "China Warehouse",`  
            `"areaId": 1,`  
            `"countryCode": "CN",`  
            `"totalInventoryNum": 777566,`  
            `"cjInventoryNum": 0,`  
            `"factoryInventoryNum": 777566,`  
            `"countryNameEn": "China"`  
        `},`  
        `{`  
            `"areaEn": "US Warehouse",`  
            `"areaId": 2,`  
            `"countryCode": "US",`  
            `"totalInventoryNum": 36,`  
            `"cjInventoryNum": 36,`  
            `"factoryInventoryNum": 0,`  
            `"countryNameEn": "United States of America (the)"`  
        `}`  
    `],`  
    `"requestId": "dd4c7d122df24b80a094a4aba073724f",`  
    `"success": true`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| vid | Variant id | bigint | 200 |  |
| areaId | Warehouse id | int | 20 |  |
| areaEn | Warehouse name | string | 200 |  |
| countryCode | Country code(EN) | string | 200 |  |
| countryNameEn | Country name | string | 200 |  |
| totalInventoryNum | total inventory number | int | 20 |  |
| cjInventoryNum | Inventory management in CJ warehouse | int | 20 |  |
| factoryInventoryNum | Inventory management in factory | int | 20 |  |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **3.3 Query inventory by product ID (GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/stock/getInventoryByPid?pid=1444929719182168064

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/stock/getInventoryByPid?pid=1444929719182168064' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| pid | Product Id | string | Y | 40 |  |

#### **Return**

success

`{`  
    `"success": true,`  
    `"code": 200,`  
    `"message": "",`  
    `"data": {`  
        `"inventories": [`  
            `{`  
                `"areaEn": "US Warehouse",`  
                `"areaId": 2,`  
                `"countryCode": "US",`  
                `"totalInventoryNum": 264,`  
                `"cjInventoryNum": 264,`  
                `"factoryInventoryNum": 0,`  
                `"countryNameEn": "US Warehouse"`  
            `}`  
        `],`  
        `"variantInventories": [`  
            `{`  
                `"vid": "1796078021431009280",`  
                `"inventory": [`  
                    `{`  
                        `"countryCode": "CN",`  
                        `"totalInventory": 10044,`  
                        `"cjInventory": 0,`  
                        `"factoryInventory": 10044,`  
                        `"verifiedWarehouse": 2`  
                    `}`  
                `]`  
            `}`  
        `]`  
    `},`  
    `"requestId": "cb927bfa8400421e923a55f81eaafce0"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | Product Inventory Object | object |  |  |
| \- inventories | product inventory list | list |  |  |
| \-- areaEn | Warehouse Name | string | 20 | China Warehouse |
| \-- areaId | Warehouse id | int | 1 | 1 |
| \-- countryCode | Country Code | string | 2 | CN |
| \-- totalInventoryNum | total inventory number | int | 20 |  |
| \-- cjInventoryNum | Inventory management in CJ warehouse | int | 20 |  |
| \-- factoryInventoryNum | Inventory management in factory | int | 20 |  |
| \-- countryNameEn | Country Name | string | 200 | China Warehouse |
| \- variantInventories | variant inventory list | list |  |  |
| \-- vid | variant id | string | 20 | China Warehouse |
| \-- inventory | inventory list | list |  | 1 |
| \--- countryCode | Country Code | string | 2 | CN |
| \--- totalInventoryNum | total inventory number | int | 20 |  |
| \--- cjInventoryNum | Inventory management in CJ warehouse | int | 20 |  |
| \--- factoryInventoryNum | Inventory management in factory | int | 20 |  |
| \--- verifiedWarehouse | Verified Inventory type | int | 200 | 1: verified, 2: unverified |
| requestId | requestId | string | 48 | Flag request for logging errors |

## **4 Product Reviews**

### **4.1 Inquiry Reviews (GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/comments

Will be deprecated on June 1, 2024, Please use the new api [Inquiry Reviews](https://developers.cjdropshipping.com/en/api/api2/api/product.html#_4-2-inquiry-reviews-get)

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/comments?pid=7874B45D-E971-4DC8-8F59-40530B0F6B77' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| pid | Product id | string | Y | 200 | Inquiry criteria |
| score | score | integer | N | 20 | Inquiry criteria |
| pageNum | page number | int | N | 20 | default: 1 |
| pageSize | page size | int | N | 20 | default: 20 |

#### **Return**

success

`{`  
    `"success": true,`  
    `"code": 0,`  
    `"message": null,`  
    `"data": {`  
        `"pageNum": "1",`  
        `"pageSize": "1",`  
        `"total": "285",`  
        `"list": [`  
            `{`  
                `"commentId": 1536993287524069376,`  
                `"pid": "1534092419615174656",`  
                `"comment": "excelente estado, llegó en una semana, cumple con lo descrito.\nBuena calidad de audio.",`  
                `"commentDate": "2022-06-13T00:00:00+08:00",`  
                `"commentUser": "F***o",`  
                `"score": "5",`  
                `"commentUrls": [`  
                    `"https://cc-west-usa.oss-us-west-1.aliyuncs.com/comment/additional/0001/image/2022-06-15/1126211e-ca15-45ed-95f2-880567ebba37.jpg",`  
                    `"https://cc-west-usa.oss-us-west-1.aliyuncs.com/comment/additional/0001/image/2022-06-15/291ab894-068f-4f4e-b01f-57df72902f58.jpg"`  
                `],`  
                `"countryCode": "MX",`  
                `"flagIconUrl": "https://cc-west-usa.oss-us-west-1.aliyuncs.com/national-flags/phone/US.png"`  
            `}`  
        `],`  
    `"requestId": "bcde45ac-da31-4fc7-a05e-e3b23a1e6694"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| pid | Product id | String | 200 |  |
| commentId | Comment id | long | 20 |  |
| comment | Comment | string | 200 |  |
| commentUrls | Comment url | string\[\] | 200 |  |
| commentUser | Comment user | string | 200 |  |
| score | score | int | 20 |  |
| countryCode | Country code | string | 20 |  |
| commentDate | Comment date | string | 200 |  |
| flagIconUrl | FlagIcon url | string | 200 |  |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **4.2 Inquiry Reviews (GET)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/productComments

#### **CURL**

`curl --location --request GET 'https://developers.cjdropshipping.com/api2.0/v1/product/productComments?pid=7874B45D-E971-4DC8-8F59-40530B0F6B77' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| pid | Product id | string | Y | 200 | Inquiry criteria |
| score | score | integer | N | 20 | Inquiry criteria |
| pageNum | page number | int | N | 20 | default: 1 |
| pageSize | page size | int | N | 20 | default: 20 |

#### **Return**

success

`{`  
    `"success": true,`  
    `"code": 0,`  
    `"message": null,`  
    `"data": {`  
        `"pageNum": "1",`  
        `"pageSize": "1",`  
        `"total": "285",`  
        `"list": [`  
            `{`  
                `"commentId": 1536993287524069376,`  
                `"pid": "1534092419615174656",`  
                `"comment": "excelente estado, llegó en una semana, cumple con lo descrito.\nBuena calidad de audio.",`  
                `"commentDate": "2022-06-13T00:00:00+08:00",`  
                `"commentUser": "F***o",`  
                `"score": "5",`  
                `"commentUrls": [`  
                    `"https://cc-west-usa.oss-us-west-1.aliyuncs.com/comment/additional/0001/image/2022-06-15/1126211e-ca15-45ed-95f2-880567ebba37.jpg",`  
                    `"https://cc-west-usa.oss-us-west-1.aliyuncs.com/comment/additional/0001/image/2022-06-15/291ab894-068f-4f4e-b01f-57df72902f58.jpg"`  
                `],`  
                `"countryCode": "MX",`  
                `"flagIconUrl": "https://cc-west-usa.oss-us-west-1.aliyuncs.com/national-flags/phone/US.png"`  
            `}`  
        `],`  
    `"requestId": "bcde45ac-da31-4fc7-a05e-e3b23a1e6694"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| pid | Product id | String | 200 |  |
| commentId | Comment id | long | 20 |  |
| comment | Comment | string | 200 |  |
| commentUrls | Comment url | string\[\] | 200 |  |
| commentUser | Comment user | string | 200 |  |
| score | score | int | 20 |  |
| countryCode | Country code | string | 20 |  |
| commentDate | Comment date | string | 200 |  |
| flagIconUrl | FlagIcon url | string | 200 |  |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

## **5 Sourcing**

### **5.1 Create Sourcing (POST)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/sourcing/create

#### **CURL**

`curl --location --request POST 'https://developers.cjdropshipping.com/api2.0/v1/product/sourcing/create' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`  
                `--header 'Content-Type: application/json' \`  
                `--data-raw '{`  
                    `"thirdProductId": "",`  
                    `"thirdVariantId": "",`  
                    `"thirdProductSku": "",`  
                    `"productName": "",`  
                    `"productImage": "",`  
                    `"productUrl": "",`  
                    `"remark": "",`  
                    `"price": ""`  
                `}'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| thirdProductId | third product id | string | N | 200 |  |
| thirdVariantId | third variant id | string | N | 200 |  |
| thirdProductSku | third product sku | string | N | 200 |  |
| productName | product name | string | Y | 200 |  |
| productImage | product image | string | Y | 200 |  |
| productUrl | product url | string | N | 200 |  |
| remark | remark | string | N | 200 |  |
| price | price | BigDecimal | 200 | Unit: $ (USD) |  |

#### **Return**

success

`{`  
    `"success": true,`  
    `"code": 0,`  
    `"message": null,`  
    `"data": {`  
        `"cjSourcingId": "285",`  
        `"result"："success",`  
     `}`  
    `"requestId": "bcde45ac-da31-4fc7-a05e-e3b23a1e6694"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| cjSourcingId | CJ sourcing id | string | 50 |  |
| result | search results | string | 20 |  |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |

### **5.2 Query Sourcing(POST)**

#### **URL**

https://developers.cjdropshipping.com/api2.0/v1/product/sourcing/query

#### **CURL**

`curl --location --request POST 'https://developers.cjdropshipping.com/api2.0/v1/product/sourcing/query' \`  
                `--header 'CJ-Access-Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'`  
                `--header 'Content-Type: application/json' \`  
                `--data-raw '{`  
                    `"sourceIds": []`  
                `}'`

| Parameter | Definition | Type | Required | Length | Note |
| :---- | :---- | :---- | :---- | :---- | :---- |
| sourceIds | CJ sourcing id | string\[\] | Y | 200 |  |

#### **Return**

success

`{`  
    `"success": true,`  
    `"code": 0,`  
    `"message": null,`  
    `"data": {`  
        `"sourceId": "285",`  
        `"sourceNumber"："223333",`  
        `"productId": "3324343434",`  
        `"variantId"："4545456",`  
        `"shopId": "285",`  
        `"shopName"："aaaaaaa",`  
        `"sourceStatus": "5",`  
        `"sourceStatusStr"："搜品失败",`  
        `"cjProductId": "285",`  
        `"cjVariantSku"："CJ287690900",`  
     `}`  
    `"requestId": "bcde45ac-da31-4fc7-a05e-e3b23a1e6694"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| sourceId | CJ sourcing id | string | 50 |  |
| sourceNumber | Search short code | string | 20 |  |
| productId | product id | string | 50 |  |
| variantId | variant id | string | 50 |  |
| shopId | shop id | string | 50 |  |
| shopName | shop name | string | 50 |  |
| sourceStatus | status | string | 10 |  |
| sourceStatusStr | status (chinese) | string | 50 |  |
| cjProductId | CJ product id | string | 50 |  |
| cjVariantSku | CJ variant sku | string | 50 |  |

error

`{`  
    `"code": 1600100,`  
    `"result": false,`  
    `"message": "Param error",`  
    `"data": null,`  
    `"requestId": "323fda9d-3c94-41dc-a944-5cc1b8baf5b1"`  
`}`

| Field | Definition | Type | Length | Note |
| :---- | :---- | :---- | :---- | :---- |
| code | error code | int | 20 | [Reference error code](https://developers.cjdropshipping.com/en/api/api2/standard/ps-code.html) |
| result | Whether or not the return is normal | boolean | 1 |  |
| message | return message | string | 200 |  |
| data | return data | object |  | interface data return |
| requestId | requestId | string | 48 | Flag request for logging errors |
