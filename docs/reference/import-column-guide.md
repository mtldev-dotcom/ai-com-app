# Import Column Mapping Guide

This guide provides recommended column naming conventions for Google Sheets, CSV, and Excel files to ensure automatic field mapping when importing products into the AI E-Commerce Management system.

---

## Quick Reference: Column Naming Conventions

The system uses **smart auto-mapping** to match your column names to product fields. Use these recommended column names for automatic detection:

### ✅ Recommended Column Names

| Category | Field | Recommended Column Names | Required |
|----------|-------|-------------------------|----------|
| **Basic Information** | Title (English) | `Title`, `Title (English)`, `Product Title`, `Product Name`, `Name` | ✅ Yes |
| | Title (French) | `Title (French)`, `Title FR`, `French Title`, `Titre`, `Titre (Français)` | No |
| | Description (English) | `Description`, `Description (English)`, `Product Description`, `Details`, `About` | No |
| | Description (French) | `Description (French)`, `Description FR`, `French Description`, `Description FR`, `Détails` | No |
| **Pricing** | Cost (CAD) | `Cost`, `Supplier Price`, `Cost (CAD)`, `Price`, `Cost Price` | ✅ Yes |
| | Selling Price | `Selling Price`, `Retail Price`, `Sale Price`, `Price (CAD)` | No |
| | Margin (%) | `Margin`, `Profit Margin`, `Margin %`, `Margin Percentage` | No |
| **SEO & Metadata** | Meta Title | `Meta Title`, `SEO Title`, `Page Title`, `Meta Title (SEO)` | No |
| | Meta Description | `Meta Description`, `SEO Description`, `Meta Desc`, `Description (SEO)` | No |
| | Handle/Slug | `Handle`, `Slug`, `URL Slug`, `Product URL`, `URL` | No |
| **Physical Attributes** | Weight | `Weight`, `Product Weight`, `Weight (kg)`, `Weight (lbs)` | No |
| | Length | `Length`, `Product Length`, `Length (cm)`, `Length (inches)`, `Long` | No |
| | Width | `Width`, `Product Width`, `Width (cm)`, `Width (inches)`, `Wide` | No |
| | Height | `Height`, `Product Height`, `Height (cm)`, `Height (inches)`, `Tall`, `High` | No |
| | Material | `Material`, `Fabric`, `Product Material`, `Materials`, `Composition` | No |
| **Inventory & Identification** | SKU | `SKU`, `Product SKU`, `Stock Keeping Unit`, `Item Code` | No |
| | Currency | `Currency`, `Currency Code`, `Curr`, `CAD`, `USD` | No |
| | Status | `Status`, `Product Status`, `State`, `Draft Status` | No |
| **Product Organization** | Type | `Type`, `Product Type`, `Category`, `Product Category` | No |
| | Collection ID | `Collection`, `Collection ID`, `Collection ID (Medusa)` | No |
| | Category IDs | `Category IDs`, `Category ID`, `Categories`, `Category ID (Medusa)` | No |
| | Tags | `Tags`, `Product Tags`, `Tag`, `Keywords` | No |
| **Shipping & Customs** | Origin Country | `Origin Country`, `Country`, `Country of Origin`, `Made In` | No |
| | HS Code | `HS Code`, `HS Code (Customs)`, `Harmonized System Code` | No |
| | MID Code | `MID Code`, `MID Code (Customs)`, `Manufacturer ID Code` | No |
| **Media** | Images | `Images`, `Image`, `Image URLs`, `Photo`, `Picture`, `Product Images` | No |
| **Variants & Options** | Variant: Size | `Size`, `Product Size`, `Size Option`, `Variant Size` | No |
| | Variant: Color | `Color`, `Colour`, `Product Color`, `Color Option`, `Variant Color` | No |
| | Variant: Material | `Variant Material`, `Material Variant`, `Material Option` | No |
| | Variant: Style | `Style`, `Product Style`, `Style Variant`, `Style Option` | No |
| | Variant Options (JSON) | `Variant Options`, `Variants`, `Variant Data`, `Options (JSON)` | No |
| **Advanced** | Specifications (JSON) | `Specifications`, `Specs`, `Attributes`, `Properties`, `Features`, `JSON Specs` | No |

---

## Perfect Table Example

Here's a complete example of a well-structured product import table:

### Example Google Sheet / CSV Structure

```csv
Title,Title (French),Description,Description (French),Cost,Selling Price,Margin,SKU,Handle,Weight,Length,Width,Height,Material,Color,Size,Category IDs,Tags,Images,Origin Country,HS Code,Meta Title,Meta Description
"Premium Cotton T-Shirt","T-Shirt en Coton Premium","Comfortable 100% organic cotton t-shirt perfect for everyday wear. Soft, breathable fabric with reinforced stitching.","T-shirt confortable en coton biologique 100%, idéal pour le port quotidien. Tissu doux et respirant avec coutures renforcées.",15.99,29.99,87.5,"TSH-COT-001","premium-cotton-tshirt","0.2","75","50","5","100% Organic Cotton","Black","M","cat_clothing_001,cat_shirts","casual,organic,cotton","https://example.com/images/tshirt-1.jpg,https://example.com/images/tshirt-2.jpg","CA","6109.10","Premium Cotton T-Shirt - Organic & Sustainable","Shop premium organic cotton t-shirts. Sustainable fashion with comfort and style."
"Leather Wallet","Portefeuille en Cuir","Genuine leather wallet with RFID blocking technology. Multiple card slots and cash compartment.","Portefeuille en cuir véritable avec technologie de blocage RFID. Plusieurs fentes pour cartes et compartiment pour espèces.",25.50,59.99,135.3,"WL-LTH-001","leather-wallet-rfid","0.15","12","9","2","Genuine Leather","Brown","One Size","cat_accessories_001,cat_wallets","leather,rfid,premium","https://example.com/images/wallet-1.jpg","IT","4203.21","Genuine Leather RFID Wallet - Premium Quality","Protect your cards with our premium leather RFID blocking wallet. Made in Italy."
"Wireless Headphones","Écouteurs Sans Fil","Noise-canceling Bluetooth headphones with 30-hour battery life. Premium sound quality and comfortable design.","Écouteurs Bluetooth avec réduction de bruit. Autonomie de 30 heures. Qualité sonore premium et design confortable.",89.99,199.99,122.3,"HP-BT-001","wireless-headphones-noise-cancel","0.35","20","18","8","Plastic, Metal, Foam","Black","One Size","cat_electronics_001,cat_audio","bluetooth,wireless,noise-canceling","https://example.com/images/headphones-1.jpg,https://example.com/images/headphones-2.jpg","CN","8518.30","Wireless Noise-Canceling Headphones - 30h Battery","Experience premium sound with our wireless noise-canceling headphones. 30-hour battery life."
```

### Visual Table Example

| Title | Title (French) | Description | Cost | Selling Price | Margin | SKU | Weight | Material | Color | Size | Images | Tags |
|-------|----------------|-------------|------|---------------|--------|-----|--------|----------|-------|------|--------|------|
| Premium Cotton T-Shirt | T-Shirt en Coton Premium | Comfortable 100% organic cotton... | 15.99 | 29.99 | 87.5 | TSH-COT-001 | 0.2 | 100% Organic Cotton | Black | M | https://... | casual,organic |
| Leather Wallet | Portefeuille en Cuir | Genuine leather wallet with RFID... | 25.50 | 59.99 | 135.3 | WL-LTH-001 | 0.15 | Genuine Leather | Brown | One Size | https://... | leather,rfid |
| Wireless Headphones | Écouteurs Sans Fil | Noise-canceling Bluetooth... | 89.99 | 199.99 | 122.3 | HP-BT-001 | 0.35 | Plastic, Metal | Black | One Size | https://... | bluetooth,wireless |

---

## Best Practices

### 1. **Column Naming**

- ✅ **Do**: Use exact matches from the recommended list above
- ✅ **Do**: Include language indicators when needed (e.g., "Title (French)")
- ✅ **Do**: Use clear, descriptive names
- ❌ **Don't**: Use abbreviations unless listed (e.g., don't use "T" for Title)
- ❌ **Don't**: Use special characters in column headers

### 2. **Data Formatting**

#### **Images (Multiple URLs)**
- Use comma-separated URLs: `https://example.com/img1.jpg,https://example.com/img2.jpg`
- Or single URL: `https://example.com/img1.jpg`

#### **Tags (Multiple)**
- Use comma-separated values: `casual,organic,cotton,summer`
- Spaces around commas are automatically trimmed

#### **Category IDs (Multiple)**
- Use comma-separated IDs: `cat_clothing_001,cat_shirts,cat_summer`
- Must be valid Medusa category IDs

#### **Variant Options**
- For individual variants: Use separate columns (`Color`, `Size`, `Material`)
- For complex variants: Use JSON in `Variant Options` column:
  ```json
  {
    "Color": "Black",
    "Size": "M",
    "Material": "Cotton"
  }
  ```

#### **Specifications (JSON)**
- Provide as valid JSON:
  ```json
  {
    "warranty": "1 year",
    "battery": "3000mAh",
    "connectivity": "Bluetooth 5.0"
  }
  ```

#### **Pricing**
- Use decimal numbers: `15.99` (not `15,99` or `$15.99`)
- Currency symbol will be removed automatically

#### **Dimensions & Weight**
- Numbers only: `0.2` (kg), `75` (cm)
- Unit conversion should be done before import

### 3. **Required Fields**

These fields **must** be present in your spreadsheet:

1. **Title (English)** - At minimum, one of the title fields
2. **Cost** - Required for pricing calculations

All other fields are optional but highly recommended for complete product data.

### 4. **Data Quality Tips**

- ✅ **Complete as much data as possible** - Better data = better AI enrichment
- ✅ **Use consistent formatting** - Same currency, same units throughout
- ✅ **Validate URLs** - Ensure image URLs are accessible
- ✅ **Check for duplicates** - Handle SKUs and handles are unique
- ✅ **Bilingual content** - Include both English and French when possible

---

## Auto-Mapping Examples

### Example 1: Simple Product

**Column Headers:**
```
Title | Cost | Description | Images
```

**Auto-mapped to:**
- `Title` → Title (English) ✅
- `Cost` → Cost (CAD) ✅
- `Description` → Description (English) ✅
- `Images` → Images (URLs) ✅

### Example 2: Complete Product

**Column Headers:**
```
Product Name | Title FR | Supplier Price | Selling Price | Margin % | SKU | Weight (kg) | Length (cm) | Material | Color Variant | Size | Tags | Image URLs | Collection ID
```

**Auto-mapped to:**
- `Product Name` → Title (English) ✅
- `Title FR` → Title (French) ✅
- `Supplier Price` → Cost (CAD) ✅
- `Selling Price` → Selling Price (CAD) ✅
- `Margin %` → Margin (%) ✅
- `SKU` → SKU ✅
- `Weight (kg)` → Weight ✅
- `Length (cm)` → Length ✅
- `Material` → Material ✅
- `Color Variant` → Variant: Color ✅
- `Size` → Variant: Size ✅
- `Tags` → Tags ✅
- `Image URLs` → Images (URLs) ✅
- `Collection ID` → Collection ID ✅

### Example 3: Variant Product

**Column Headers:**
```
Title | Cost | Size | Color | Material Variant
```

**Auto-mapped to:**
- `Title` → Title (English) ✅
- `Cost` → Cost (CAD) ✅
- `Size` → Variant: Size ✅
- `Color` → Variant: Color ✅
- `Material Variant` → Variant: Material ✅

---

## Troubleshooting

### Auto-Mapping Not Working?

1. **Check column name spelling** - Use exact names from the recommended list
2. **Case sensitivity** - Column names are case-insensitive, but exact matches work better
3. **Special characters** - Avoid special characters in column headers
4. **Manual mapping** - You can always manually map columns using the dropdown

### Common Issues

| Issue | Solution |
|-------|----------|
| Images not importing | Ensure URLs are comma-separated and accessible |
| Tags not parsing | Use comma-separated format: `tag1,tag2,tag3` |
| JSON fields failing | Validate JSON syntax before importing |
| Prices showing as text | Remove currency symbols, use decimal numbers only |
| Variants not working | Use separate columns for each variant or JSON in "Variant Options" |

---

## Advanced: Custom Specifications

For products with unique attributes not covered by standard fields, use the `Specifications (JSON)` column:

```json
{
  "warranty_period": "2 years",
  "power_consumption": "50W",
  "certifications": ["CE", "FCC", "RoHS"],
  "manufacturer_part_number": "MPN-12345",
  "custom_field_1": "Custom value"
}
```

This JSON will be merged with other specifications during import.

---

## Next Steps

After importing:

1. Review imported products in the **Produits** page
2. Use **AI Enrichment** to fill missing fields
3. Edit individual products to add details
4. Set product status to "Ready" when complete
5. **Publish to Medusa** when products are finalized

---

## Support

For issues with imports:

1. Check this guide for column naming conventions
2. Review the **Imports** page error messages
3. Verify your data format matches the examples
4. Check the **Monitoring** page for import job status

---

**Last Updated**: 2024  
**Version**: 1.0

