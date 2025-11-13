# Step 7 - Authentication Fix for Medusa API

## 🔧 Issue Fixed

**Error:** `Unauthorized` when trying to publish products to Medusa

**Root Cause:** The Medusa Admin API client was using `Bearer` authentication for all tokens, but according to the [Medusa v2 Admin API documentation](https://docs.medusajs.com/api/admin#authentication), **API tokens require Basic authentication**, not Bearer.

## ✅ Solution Implemented

Updated `src/lib/medusa/client.ts` to automatically detect the token type and use the correct authentication method:

- **JWT Tokens** (3 parts separated by dots, e.g., `xxx.yyy.zzz`) → Use `Bearer` authentication
- **API Tokens** (all other tokens) → Use `Basic` authentication with base64 encoding

### Code Changes

```typescript
// Automatically detects token type
const isJWT = this.token.includes(".") && this.token.split(".").length === 3;
const authHeader = isJWT
  ? `Bearer ${this.token}`
  : `Basic ${Buffer.from(`${this.token}:`).toString("base64")}`;
```

## 📝 Testing Instructions

### 1. Verify Environment Variables

Make sure your `.env.local` has:
```env
MEDUSA_BASE_URL=https://your-medusa-instance.com
MEDUSA_ADMIN_API_TOKEN=your-api-token-here
```

### 2. Test Publishing

1. Navigate to a draft product page: `/drafts/[id]`
2. Ensure the product has:
   - ✅ At least one title (EN or FR)
   - ✅ A selling price
3. Click **"Publish to Medusa"**
4. Confirm the dialog

### 3. Expected Results

**If using API Token (most common):**
- ✅ Uses Basic auth automatically
- ✅ Product publishes successfully
- ✅ Success message with Medusa Product ID
- ✅ Status changes to "published"

**If using JWT Token:**
- ✅ Uses Bearer auth automatically
- ✅ Same successful result

### 4. Verify Authentication Method

Check your server logs to see which method was used:
- If token has 3 parts separated by dots → Bearer auth
- Otherwise → Basic auth (with base64 encoding)

## 🔍 Troubleshooting

### Still Getting "Unauthorized"?

1. **Verify Token Format:**
   - API tokens are typically long strings without dots
   - JWT tokens have 3 parts: `header.payload.signature`

2. **Check Token Validity:**
   ```bash
   # Test with curl
   curl -X GET \
     -H "Authorization: Basic $(echo -n 'YOUR_TOKEN:' | base64)" \
     https://your-medusa-instance.com/admin/products
   ```

3. **Verify Token Permissions:**
   - Ensure the API token has admin permissions
   - Token should be a "Secret API Key" (not publishable)

4. **Check Base URL:**
   - Ensure `MEDUSA_BASE_URL` doesn't have a trailing slash
   - Should be: `https://your-medusa-instance.com`
   - NOT: `https://your-medusa-instance.com/`

## 📚 Reference

- [Medusa Admin API Authentication](https://docs.medusajs.com/api/admin#authentication)
- [Medusa Admin API - Create Product](https://docs.medusajs.com/api/admin#products_postproducts)

## ✅ Success Criteria

After the fix:
- ✅ Can publish products to Medusa
- ✅ No "Unauthorized" errors
- ✅ Medusa IDs stored in database
- ✅ Product appears in Medusa dashboard

