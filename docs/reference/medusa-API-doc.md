# **MedusaJS Admin API – Product‑Management Summary (v2.11)**

This document compiles information from Medusa’s official **Admin API** documentation and JS SDK references (v2.11.2 as of late‑2025). It focuses on product‑management tasks: creating, updating, deleting and listing products; managing variants, options, categories, tags, types and price lists; handling product imports; and applying tiered pricing and price rules. Where possible, the report cites the relevant documentation lines to enable quick navigation back to the source.

## **1\. Products – CRUD & Listing**

Medusa’s Admin API exposes REST endpoints for creating, retrieving, updating and deleting products. The JS SDK provides methods that wrap these endpoints (e.g., `sdk.admin.product`).

### **1.1 Create a Product**

* **Endpoint** – `POST /admin/products` (JS SDK: `medusa.admin.products.create(payload)`).

* **Required fields** – A product must at least have a `title` (string). Optional fields include `is_giftcard` (boolean), `discountable` (boolean), `thumbnail`, `description`, `handle`, dimensions (`weight`, `length`, `height`, `width`), `origin_country`, `hs_code`, `mid_code`, `material`, `collection_id`, `type`, `tags`, `metadata`, etc.

* **Gift cards** – Setting `is_giftcard` to `true` creates a gift‑card product[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=Create%20a%20new%20Product,true).

* **Response** – Returns an `AdminProductsRes` object containing the product details.

**Example (SDK)**

`medusa.admin.products.create({`  
  `title: "Medusa Shirt",`  
  `is_giftcard: false,`  
  `discountable: true`  
`}).then(({ product }) => console.log(product));`

### **1.2 Retrieve a Product**

* **Endpoint** – `GET /admin/products/:id` (JS SDK: `medusa.admin.products.retrieve(productId)`).

* **Usage** – Returns the product’s full details, including variants, options and relations[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=retrieve).

### **1.3 Update a Product**

* **Endpoint** – `POST /admin/products/:id` (JS SDK: `medusa.admin.products.update(productId, payload)`).

* **Functionality** – Update any of a product’s fields (e.g., `title`, `subtitle`, `description`, `handle`, `type_id`, `collection_id`, `tags`, `metadata` etc.)[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=update).

* **Response** – Returns updated product details.

### **1.4 Delete a Product**

* **Endpoint** – `DELETE /admin/products/:id` (JS SDK: `medusa.admin.products.delete(productId)`).

* **Functionality** – Deletes the product and its variants/options[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=delete).

* **Soft‑delete** – Medusa sets `deleted_at` but retains records for potential restoration or auditing.

### **1.5 List Products**

* **Endpoint** – `GET /admin/products` (JS SDK: `medusa.admin.products.list(query)`).

* **Query parameters** –

  * `q` – search string (e.g., product title or description).

  * `status` – filter by product status (`draft`, `proposed`, `published`, `rejected`).

  * `is_giftcard`, `collection_id`, `type_id`, `tags`, `sales_channel_id` and other filters.

  * `expand` – comma‑separated relations to include (e.g., `variants`, `options`, `images`, `categories`).

  * `fields` – comma‑separated fields to select.

  * `limit` & `offset` – pagination parameters[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=list).

* **Response** – Returns a list of product objects along with pagination metadata.

### **1.6 Set Product Metadata**

* **Endpoint** – `POST /admin/products/:id/metadata` (JS SDK: `medusa.admin.products.setMetadata(productId, { key, value })`).

* **Functionality** – Store arbitrary key–value pairs on a product for custom data[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=setMetadata).

## **2\. Product Variants**

Variants represent purchasable versions of a product (e.g., different sizes or colours). Each variant must have a unique combination of option values.

### **2.1 Create a Variant**

* **Endpoint** – `POST /admin/products/:id/variants` (JS SDK: `medusa.admin.products.createVariant(productId, payload)`).

* **Required fields** – `title` and `prices` (array of objects containing `amount` and `currency_code`).

* **Option values** – Provide an array of option assignments (e.g., `options: [{ option_id, value }]`). The combination of values across options must be unique[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=createVariant).

* **Other fields** – SKU (`sku`), barcode, inventory quantities (`inventory_quantity`, `allow_backorder`), manage inventory flag, dimensions, material, weight, etc.

* **Response** – Returns updated product with the new variant.

### **2.2 Update a Variant**

* **Endpoint** – `POST /admin/products/:id/variants/:variantId` (JS SDK: `medusa.admin.products.updateVariant(productId, variantId, payload)`).

* **Functionality** – Update variant properties like `title`, `sku`, `barcode`, `prices`, `options`, `inventory_quantity` etc.[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=updateVariant).

### **2.3 Delete a Variant**

* **Endpoint** – `DELETE /admin/products/:id/variants/:variantId` (JS SDK: `medusa.admin.products.deleteVariant(productId, variantId)`). Deleting a variant removes it from the product[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=deleteVariant).

### **2.4 List Variants**

* **Endpoint** – `GET /admin/products/:id/variants` (JS SDK: `medusa.admin.products.listVariants(productId, query)`).

* **Query parameters** – Filters similar to listing products (`q`, `limit`, `offset`, `expand`, `fields`)[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=listVariants).

### **2.5 Variant Inventory and Sales Channels (AdminVariantsResource)**

* **List all variants** – `GET /admin/variants` returns variants across products; you can expand relations like `options` and apply pagination[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminVariantsResource#:~:text=list).

* **Retrieve a variant** – `GET /admin/variants/:id` returns details of a specific variant including options and prices[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminVariantsResource#:~:text=list).

* **Get variant inventory** – `GET /admin/variants/:id/inventory` provides inventory and sales channel availability information[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminVariantsResource#:~:text=getInventory).

## **3\. Product Options**

Options define attributes of a product (e.g., size, colour). Each variant sets values for the product’s options.

* **Add option** – `POST /admin/products/:id/options` (JS SDK: `medusa.admin.products.addOption(productId, { title })`); creates a new option with a title (e.g., “Size”)[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=addOption).

* **Update option** – `POST /admin/products/:id/options/:optionId` (JS SDK: `medusa.admin.products.updateOption(productId, optionId, { title })`); renames the option[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=updateOption).

* **Delete option** – `DELETE /admin/products/:id/options/:optionId` (JS SDK: `medusa.admin.products.deleteOption(productId, optionId)`); removing an option deletes all variants associated with that option[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductsResource#:~:text=updateOption).

## **4\. Product Categories**

Categories allow grouping products into hierarchical structures.

* **Create category** – `POST /admin/product-categories` (JS SDK: `medusa.admin.productCategories.create({ name, handle, is_active, parent_category_id })`). At minimum, a category requires a `name`[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductCategoriesResource#:~:text=create).

* **Update category** – `POST /admin/product-categories/:id` (JS SDK: `medusa.admin.productCategories.update(id, { name, handle, is_active })`)[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductCategoriesResource#:~:text=update).

* **List categories** – `GET /admin/product-categories` with filters (`q`, `handle`) and pagination (`limit`, `offset`). You can expand `category_children` to include nested categories[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductCategoriesResource#:~:text=list).

* **Delete category** – `DELETE /admin/product-categories/:id` removes the category but **does not delete products in that category**[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductCategoriesResource#:~:text=delete).

* **Add products to a category** – `POST /admin/product-categories/:id/products/batch` with a list of product IDs to add[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductCategoriesResource#:~:text=addProducts).

* **Remove products from a category** – `DELETE /admin/product-categories/:id/products/batch` with a list of product IDs to remove[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductCategoriesResource#:~:text=removeProducts).

## **5\. Product Tags & Types**

Tags and types help organize products for filtering and analytics. They are automatically created when assigned to products and can later be listed.

### **5.1 Product Tags**

* **List tags** – `GET /admin/product-tags` (JS SDK: `medusa.admin.productTags.list(query)`) returns tags with optional filters: `q`, `value`, `limit` and `offset`[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductTagsResource#:~:text=Product%20tags%20are%20string%20values,be%20used%20to%20filter%20products). Tags are created automatically when a product includes them; there are no explicit create or delete endpoints.

### **5.2 Product Types**

* **List types** – `GET /admin/product-types` (JS SDK: `medusa.admin.productTypes.list(query)`) lists types with filters (`q`, `value`) and pagination; types are created automatically when assigned to products[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminProductTypesResource#:~:text=list). There are no separate create/update/delete routes.

## **6\. Price Lists & Pricing**

Medusa’s pricing system uses **Price Sets** and **Price Lists** to manage variant prices across currencies, regions or customer groups. Price lists group multiple variant prices and can be applied conditionally.

### **6.1 Price Lists**

Common endpoints (JS SDK methods shown):

* **Create a price list** – `POST /admin/price-lists` with `name`, `description`, `type` (`sale` or `override`), `status`, `starts_at`, `ends_at` and an array of prices (each with `amount`, `variant_id`, `currency_code`, `min_quantity`, `max_quantity`) to be included.

* **Update a price list** – `POST /admin/price-lists/:id` to modify metadata or add/remove prices. The price list remains associated with the same variants.

* **List price lists** – `GET /admin/price-lists` with filters (`q`, `status`, `type`, `customer_group_id`, `region_id`, `created_at`), as well as sorting (`order`) and pagination parameters.

* **Retrieve a price list** – `GET /admin/price-lists/:id` returns its details.

* **Delete a price list** – `DELETE /admin/price-lists/:id` removes the list.

### **6.2 Manage Prices within a Price List**

Price lists contain variant prices. The following operations modify these prices (JS SDK examples call `medusa.admin.priceLists` methods):

* **Add or update prices** – `POST /admin/price-lists/:id/prices/batch` with an array of price definitions to add or update. Each price includes `amount`, `variant_id`, `currency_code` and optionally `min_quantity`/`max_quantity` for tiered pricing[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminPriceListResource#:~:text=addPrices).

* **Delete prices** – `DELETE /admin/price-lists/:id/prices/batch` with a list of price IDs to remove from the list[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminPriceListResource#:~:text=deletePrices).

* **Delete all prices for a product** – `DELETE /admin/price-lists/:id/products/:product_id/prices` removes all variant prices belonging to a product from the list[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminPriceListResource#:~:text=deleteProductPrices).

* **Delete all prices for a variant** – `DELETE /admin/price-lists/:id/variants/:variant_id/prices` removes all prices of a specific variant[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminPriceListResource#:~:text=deleteVariantPrices).

* **Delete prices for multiple products** – `DELETE /admin/price-lists/:id/products/prices/batch` with an array of product IDs to remove all associated variant prices[docs.medusajs.com](https://docs.medusajs.com/v1/references/js-client/AdminPriceListResource#:~:text=deleteProductsPrices).

### **6.3 Tiered Pricing & Price Rules**

The **Pricing Module** supports quantity‑based tiers and conditional rules:

* **Tiered pricing** – Each variant price may specify `min_quantity` and `max_quantity` values. When the customer’s cart quantity falls within these ranges, the corresponding tiered price is applied[docs.medusajs.com](https://docs.medusajs.com/resources/commerce-modules/pricing/price-rules#:~:text=Each%20price%2C%20represented%20by%20the,used%20to%20create%20tiered%20prices).

  * Example: default price `$10`; `min_quantity:10, max_quantity:19 → $8`; `min_quantity:20 → $6`[docs.medusajs.com](https://docs.medusajs.com/resources/commerce-modules/pricing/price-rules#:~:text=Each%20price%2C%20represented%20by%20the,used%20to%20create%20tiered%20prices).

* **Creating tiered prices** – When adding or updating prices in a price list, include `min_quantity` and `max_quantity` fields[docs.medusajs.com](https://docs.medusajs.com/resources/commerce-modules/pricing/price-rules#:~:text=How%20to%20Create%20Tiered%20Prices%3F).

* **Price rules** – Use the `PriceRule` data model to restrict a price by advanced conditions (e.g., customer’s group, region, zip code). Each price’s `rules_count` indicates how many rules apply[docs.medusajs.com](https://docs.medusajs.com/resources/commerce-modules/pricing/price-rules#:~:text=Price%20Rule). Price list rules (`PriceListRule`) apply conditions across the whole list[docs.medusajs.com](https://docs.medusajs.com/resources/commerce-modules/pricing/price-rules#:~:text=Price%20List%20Rules).

## **7\. Product Imports**

Large sets of products can be imported via CSV using the **import workflow** (introduced in v2.8.5). The JS SDK exposes `import`, `createImport` and `confirmImport` methods.

* **Create import** – `POST /admin/products/import` or `POST /admin/products/imports` uploads a CSV file. The API responds with a `transaction_id` and a summary of how many products will be created or updated[docs.medusajs.com](https://docs.medusajs.com/resources/references/js-sdk/admin/product/index.html.md#:~:text=product%20,Reference). (The summary includes `toCreate` and `toUpdate` counts[docs.medusajs.com](https://docs.medusajs.com/resources/references/js-sdk/admin/product/index.html.md#:~:text=,when%20the%20import%20is%20confirmed).)

* **Confirm import** – `POST /admin/products/:transactionId/import` triggers the actual product creation/update. This confirmation step ensures that you can review the summary before committing to changes[docs.medusajs.com](https://docs.medusajs.com/resources/references/js-sdk/admin/product/index.html.md#:~:text=).

## **8\. Authentication & Access**

To call the Admin API, you must authenticate. Supported methods include:

* **JWT bearer token** – Obtain a JWT via the authentication route and send it in the `Authorization` header (`Bearer {token}`)[docs.medusajs.com](https://docs.medusajs.com/api/admin#:~:text=Authentication).

* **Admin API token** – Create an API key from the Medusa admin or via API and pass it in the `Authorization` header[docs.medusajs.com](https://docs.medusajs.com/api/admin#:~:text=2.%20API%20Token).

* **Cookie session** – After logging in, requests from the browser automatically include a session cookie[docs.medusajs.com](https://docs.medusajs.com/api/admin#:~:text=3.%20Cookie%20Session%20ID).

## **9\. Summary & Recommendations**

Medusa’s Admin API provides a robust set of endpoints to programmatically manage products and their related data. Key takeaways:

* Use the `POST /admin/products` endpoint to create products; include variants and options in separate requests.

* Manage categories, tags and types via dedicated endpoints; categories support hierarchical organisation and product assignments.

* Variants require unique option combinations; manage inventory and price information using separate endpoints.

* Price lists enable advanced pricing strategies, including tiered pricing and conditional rules; price rules allow segmenting prices by customer group or region.

* Leverage product imports for large CSV‑based data migrations; confirm imports before committing changes.

* Always authenticate API calls using JWT, API keys or session cookies.

By following these guidelines and referencing the cited documentation, developers can implement consistent product management flows in Medusa‑based applications.
