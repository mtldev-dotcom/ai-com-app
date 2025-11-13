# **🧠 CURSOR AI TASK — Upgrade Chrome Extension to Medusa Product Extractor**

You are a senior Chrome Extension engineer.  
 Your task is to refactor the existing extension files (`manifest.json`, `content.js`, `popup.html`, `popup.js`, `products.html`, `products.js`) into a **robust product data scraper \+ exporter** that extracts structured product data from marketplaces (Amazon, AliExpress, Walmart, etc.) and outputs **normalized product data** and **Medusa-ready JSON/CSV** for import via Medusa Admin APIs.

---

## **🎯 Goals**

1. **Extract** rich product data from Amazon and similar marketplaces using robust DOM parsing.

2. **Normalize** data fields into two outputs:

   * ✅ `normalizedProduct` — marketplace-native fields.

   * ✅ `medusaProduct` — valid payload for `POST /admin/products` with inline variants and prices.

3. **Enable export** of the parsed data as:

   * **JSON file**

   * **CSV file** (Medusa import format)

4. **Keep existing UI**, enhance popup to preview and export results.

5. Ensure extension works under **Manifest V3** and Chrome permissions are correct.

---

## **🧩 Files to Update**

| File | Purpose | Tasks |
| ----- | ----- | ----- |
| `manifest.json` | Define permissions, background & content scripts | Add `"downloads"`, `"storage"`, `"activeTab"`, `"scripting"`, `"contextMenus"` permissions. |
| `content.js` | Main scraper logic | Replace simple extractor with domain-aware parser \+ JSON normalizer. |
| `popup.html` | Popup UI | Add formatted preview of Normalized \+ Medusa JSON and export buttons. |
| `popup.js` | Popup behavior | Call content script, parse response, show/export results. |
| `products.html` / `products.js` | Saved products dashboard | Display parsed data and add CSV/JSON export of all saved items. |

---

## **⚙️ Extracted Data Fields**

### **From any product page, the script should capture:**

| Field | Description | Target (Medusa field) |
| ----- | ----- | ----- |
| Title | Product name | `title` |
| Subtitle | First bullet or tagline | `subtitle` |
| Description | Full description or combined bullets | `description` |
| Brand | Seller or brand field | `metadata.brand` |
| Category | Breadcrumb or category tag | `categories` |
| Price | Parsed numeric \+ currency | `variants[].prices[].{currency_code,amount}` |
| Currency | From locale or symbol | `variants[].prices[].currency_code` |
| Variants | Color, Size, Style, etc. | `options[]` \+ `variants[]` |
| SKU / ASIN | Product identifiers | `sku`, `metadata.asin` |
| Images | Main \+ gallery URLs | `images[].url`, `thumbnail` |
| Weight / Dimensions | Parsed and normalized (grams/cm) | `weight`, `length`, `height`, `width` |
| Seller / Storefront | Seller name | `metadata.seller_name` |
| Rating & Reviews | Optional quality metadata | `metadata.rating`, `metadata.reviews_count` |
| Marketplace URL | Canonical link | `metadata.marketplace_url` |
| Origin Country | Ship from / made in | `origin_country` |
| Material | Extracted if available | `material` |
| Timestamp | Capture time | `metadata.captured_at` |

---

## **🧱 Normalized Output (for internal use)**

`{`  
  `"title": "Wireless Mini Vacuum",`  
  `"brand": "Acme",`  
  `"description": "• Strong suction...\n• USB-C charging...",`  
  `"images": ["https://cdn.site/vac-1.jpg","https://cdn.site/vac-2.jpg"],`  
  `"options": ["Color", "Size"],`  
  `"variants": [`  
    `{`  
      `"option_values": {"Color": "Black", "Size": "Standard"},`  
      `"sku": "VAC-001-BLK",`  
      `"currency": "CAD",`  
      `"price": 39.99,`  
      `"images": ["https://cdn.site/vac-black.jpg"],`  
      `"ids": {"asin": "B0ABC12345"}`  
    `}`  
  `],`  
  `"marketplace": {`  
    `"url": "https://www.amazon.ca/dp/B0ABC12345",`  
    `"seller": "Acme Direct",`  
    `"rating": 4.5,`  
    `"reviews_count": 2317`  
  `},`  
  `"attributes": {"Weight": "1.2 lb", "Dimensions": "8 x 3 x 3 in"}`  
`}`

---

## **🧩 Medusa Product JSON Output**

`{`  
  `"title": "Wireless Mini Vacuum",`  
  `"status": "published",`  
  `"images": [`  
    `{ "url": "https://cdn.site/vac-1.jpg" },`  
    `{ "url": "https://cdn.site/vac-2.jpg" }`  
  `],`  
  `"thumbnail": "https://cdn.site/vac-1.jpg",`  
  `"options": [`  
    `{ "title": "Color", "values": ["Black", "White"] },`  
    `{ "title": "Size", "values": ["Standard"] }`  
  `],`  
  `"variants": [`  
    `{`  
      `"title": "Black / Standard",`  
      `"sku": "VAC-001-BLK",`  
      `"manage_inventory": true,`  
      `"options": { "Color": "Black", "Size": "Standard" },`  
      `"prices": [{ "currency_code": "cad", "amount": 3999 }],`  
      `"metadata": { "asin": "B0ABC12345" }`  
    `}`  
  `],`  
  `"metadata": {`  
    `"brand": "Acme",`  
    `"asin": "B0ABC12345",`  
    `"marketplace_url": "https://www.amazon.ca/dp/B0ABC12345",`  
    `"seller_name": "Acme Direct",`  
    `"rating": 4.5,`  
    `"reviews_count": 2317,`  
    `"source": "amazon"`  
  `}`  
`}`

---

## **📦 Export Options (in Popup)**

Add two sections below parsed results:

### **🔹 Buttons**

* **Copy Normalized JSON**

* **Copy Medusa JSON**

* **Export JSON File** → downloads `<product_title>_medusa.json`

* **Export CSV File** → downloads `<product_title>_medusa.csv`

### **🔹 CSV Format (Medusa import-ready)**

| Column | Value |
| ----- | ----- |
| title | product title |
| thumbnail | first image |
| images | pipe-joined URLs |
| option\_axes | e.g., \`Color |
| variant\_title | `"Black / M"` |
| sku | variant SKU |
| option\_map\_json | JSON string of options |
| currency\_code | `cad` |
| amount\_minor | `3999` |
| metadata\_json | flattened metadata |

---

## **🧠 Parsing Logic (in `content.js`)**

1. Detect domain:

   * if Amazon: use `#productTitle`, `#ASIN`, `.a-offscreen`, `#landingImage`, etc.

   * else fallback selectors (`[itemprop="name"]`, `[class*="price"]`, etc.).

2. Parse & normalize:

   * Convert price to minor units.

   * Normalize units for weight/dimensions.

   * Deduplicate and clean image URLs.

   * Build variant matrix from options (Color, Size, etc.).

3. Build both output JSONs (`normalizedProduct`, `medusaProduct`).

4. Return to popup via `chrome.runtime.sendMessage`.

---

## **🧰 Permissions (`manifest.json`)**

`"permissions": ["activeTab", "scripting", "storage", "downloads", "contextMenus"]`

---

## **🧪 Testing Checklist**

| Case | Expected Result |
| ----- | ----- |
| Amazon product with color/size | Extracts both variants, correct prices, ASIN, and brand |
| Simple product (no variants) | Generates one variant automatically |
| Non-Amazon product | Fallback selectors still return clean title, price, and image |
| Popup preview | Shows both Normalized \+ Medusa JSON |
| CSV export | Amounts are integers (minor units) and ISO currency lower-case |
| JSON export | Matches Medusa “Create Product” schema |

---

## **✅ Acceptance Criteria**

* All scraping works offline (no external APIs).

* JSON passes validation for `POST /admin/products`.

* CSV imports cleanly into Medusa or your n8n workflow.

* Extension UI clear, responsive, and data-driven.

* No console errors on export (JSON or CSV).

