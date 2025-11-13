# Step 7 – Medusa Admin API Integration: Testing Guide

## 📋 What Has Been Implemented

### 1. **Medusa API Client Library** (`src/lib/medusa/client.ts`)
   - ✅ Medusa Admin API client with TypeScript types
   - ✅ Handles authentication with Bearer token
   - ✅ Methods for:
     - `createProduct()` - Creates product in Medusa
     - `createVariant()` - Creates product variants in Medusa
     - `getProduct()` - Retrieves product by ID
     - `updateProduct()` - Updates product (for future use)
   - ✅ Proper error handling with detailed error messages

### 2. **Publish Function** (`src/lib/medusa/publish.ts`)
   - ✅ `publishDraft(productDraftId)` function that:
     - Fetches draft and its variants from database
     - Validates required fields (title, selling price)
     - Prevents duplicate publishing
     - Creates product in Medusa with:
       - Title and description (bilingual support)
       - Images
       - Metadata (includes supplier ID, cost, margin, draft ID)
       - Status set to "published"
     - Creates variants:
       - Creates custom variants if they exist in `variants_draft` table
       - Creates default variant if no variants exist
       - Includes pricing, SKU, inventory management
     - Updates draft record with:
       - `medusaProductId` - The Medusa product ID
       - `medusaVariantIds` - Array of variant IDs
       - Status changed to "published"

### 3. **Server Action** (`src/app/actions/medusa.ts`)
   - ✅ `publishDraftAction()` - Server action wrapper with authentication
   - ✅ Revalidates cache after publishing

### 4. **UI Integration** (`src/app/drafts/[id]/page.tsx`)
   - ✅ "Publish to Medusa" button in draft detail page
   - ✅ Button disabled when:
     - Product already published
     - Missing selling price
     - Other operations in progress
   - ✅ Success/error messaging
   - ✅ "Published" status badge after successful publish
   - ✅ Confirmation dialog before publishing

---

## 🧪 Testing & Validation Steps

### Prerequisites Setup

1. **Configure Environment Variables**
   ```bash
   # Add to .env.local (or your environment)
   MEDUSA_BASE_URL=https://your-medusa-instance.com
   MEDUSA_ADMIN_API_TOKEN=your-admin-api-token-here
   ```

2. **Verify Medusa Instance is Running**
   - Ensure your Medusa backend is accessible
   - Verify Admin API token has correct permissions
   - Test token manually (optional):
     ```bash
     curl -H "Authorization: Bearer YOUR_TOKEN" \
          https://your-medusa-instance.com/admin/products
     ```

### Test 1: Basic Publish Functionality ✅

**Steps:**
1. Navigate to `/drafts` page
2. Select a draft product (or create one with required fields)
3. Click to open draft detail page (`/drafts/[id]`)
4. Ensure product has:
   - ✅ At least one title (EN or FR)
   - ✅ Selling price set
5. Click **"Publish to Medusa"** button
6. Confirm the confirmation dialog

**Expected Results:**
- ✅ Success message appears: "Product published successfully! Medusa Product ID: [id]"
- ✅ Draft status changes to "published"
- ✅ "Published" badge appears instead of publish button
- ✅ Publish button is hidden/disabled

**Verify in Database:**
```sql
SELECT id, title_en, medusa_product_id, medusa_variant_ids, status 
FROM products_draft 
WHERE id = '[your-draft-id]';
```
- ✅ `medusa_product_id` is populated
- ✅ `medusa_variant_ids` is populated (JSON array)
- ✅ `status` = 'published'

### Test 2: Verify in Medusa Dashboard ✅

**Steps:**
1. Open your Medusa Admin dashboard
2. Navigate to Products section
3. Find the newly published product

**Expected Results:**
- ✅ Product appears in Medusa dashboard
- ✅ Product title matches draft title
- ✅ Product description matches draft description
- ✅ Product images are present (if uploaded)
- ✅ Product status is "published"

**Verify Product Details:**
- ✅ Check product metadata:
  - Should contain `supplier_id`
  - Should contain `cost`
  - Should contain `margin`
  - Should contain `draft_id`

### Test 3: API Token Validation ✅

**Steps:**
1. Test with invalid/missing token:
   - Remove or set wrong `MEDUSA_ADMIN_API_TOKEN` in `.env.local`
   - Restart dev server
   - Try to publish a draft

**Expected Results:**
- ✅ Error message appears indicating authentication failure
- ✅ Product is NOT published
- ✅ Draft status remains unchanged

### Test 4: Metadata Verification ✅

**Steps:**
1. Publish a product with supplier and cost information
2. In Medusa dashboard, check product metadata/metadata section

**Expected Results:**
- ✅ `supplier_id` - Matches the draft's supplier
- ✅ `cost` - Matches the draft's cost
- ✅ `margin` - Matches the draft's margin percentage
- ✅ `draft_id` - Matches the original draft ID
- ✅ Any specifications from draft are included

### Test 5: Variant Creation ✅

**Test 5a: With Custom Variants**
1. Create a draft with variants in `variants_draft` table
2. Publish the draft
3. Check Medusa dashboard

**Expected Results:**
- ✅ Product has multiple variants
- ✅ Each variant has correct:
  - Title (from variant name)
  - SKU (if provided)
  - Price (base price + price adjustment)
  - Inventory quantity

**Test 5b: Without Variants (Default Variant)**
1. Create a draft WITHOUT any variants
2. Publish the draft
3. Check Medusa dashboard

**Expected Results:**
- ✅ Product has one "Default Variant"
- ✅ Default variant price matches product selling price
- ✅ Variant is created automatically

### Test 6: Validation & Error Handling ✅

**Test 6a: Missing Required Fields**
- Try to publish draft without title:
  - ✅ Error: "Product must have at least one title (EN or FR)"
- Try to publish draft without selling price:
  - ✅ Error: "Product must have a selling price"

**Test 6b: Duplicate Publish Prevention**
1. Publish a draft successfully
2. Try to publish the same draft again

**Expected Results:**
- ✅ Error: "Product has already been published to Medusa"
- ✅ Draft status remains "published"
- ✅ No duplicate products created in Medusa

**Test 6c: Non-existent Draft**
- Try to publish with invalid draft ID:
  - ✅ Error: "Product draft not found"

### Test 7: Currency & Pricing ✅

**Steps:**
1. Check published product/variant prices in Medusa
2. Verify price format

**Expected Results:**
- ✅ Prices are in cents (correctly converted)
- ✅ Currency code is "CAD" (default)
- ✅ Variant prices = base price + adjustment (if applicable)

### Test 8: Image Handling ✅

**Steps:**
1. Create draft with images (URLs or base64 data URLs)
2. Publish the draft
3. Check Medusa dashboard

**Expected Results:**
- ✅ Product images appear in Medusa
- ✅ Image URLs are correctly formatted
- ✅ Images are accessible

---

## 🔍 Debugging Tips

### Check Server Logs
Look for console logs in terminal:
- `Publish draft error:` - Shows detailed error messages
- Success logs should show product creation

### Verify API Connection
Test Medusa API directly:
```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  https://your-medusa-instance.com/admin/products
```

### Common Issues

1. **"MEDUSA_BASE_URL environment variable is required"**
   - ✅ Solution: Add `MEDUSA_BASE_URL` to `.env.local`

2. **"MEDUSA_ADMIN_API_TOKEN environment variable is required"**
   - ✅ Solution: Add `MEDUSA_ADMIN_API_TOKEN` to `.env.local`

3. **401 Unauthorized**
   - ✅ Solution: Check token is valid and has admin permissions
   - ✅ Verify token format: Should be `Bearer [token]`

4. **Product created but variants missing**
   - ✅ Check: Are variants in `variants_draft` table?
   - ✅ Check: Variant creation error in logs

5. **Prices are incorrect**
   - ✅ Check: Price conversion (multiplied by 100 for cents)
   - ✅ Verify: Currency code is correct

---

## ✅ Testing Checklist

- [ ] Environment variables configured
- [ ] Can publish draft without variants (default variant created)
- [ ] Can publish draft with custom variants
- [ ] Product appears in Medusa dashboard
- [ ] Metadata includes supplier + cost info
- [ ] Medusa IDs stored in database
- [ ] Status updated to "published"
- [ ] Duplicate publish prevented
- [ ] Validation errors work (missing title/price)
- [ ] Images transferred correctly
- [ ] Pricing converted correctly (to cents)
- [ ] Error handling works (invalid token, network errors)

---

## 📝 Next Steps After Testing

Once all tests pass:
1. ✅ Document any Medusa-specific configuration needed
2. ✅ Add currency code configuration (if needed for multiple currencies)
3. ✅ Consider adding collection/category assignment
4. ✅ Test with bulk publish (future enhancement)

---

## 🎯 Success Criteria (from PRD)

✅ **Click "Publish" → Medusa dashboard shows new product**
✅ **API token works from `.env`**
✅ **Metadata includes supplier + cost info**

All three criteria must pass before moving to Step 8.

