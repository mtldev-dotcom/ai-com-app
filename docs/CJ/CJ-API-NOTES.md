# CJ Dropshipping API Integration Notes

## Known Issues

### Product Availability

**Issue**: The CJ API `/product/list` endpoint returns products from their catalog that may no longer be available for purchase.

**Symptoms**:
- API returns products with valid SKUs and details
- When visiting the product page on CJ's website, you see "Product removed" message
- Searching for the SKU on CJ's website returns no results

**Root Cause**:
The `/product/list` endpoint appears to query CJ's product catalog/database, which includes historical and delisted products. It does not filter by current availability/stock status by default.

**Attempted Solutions**:
1. ✅ Added filtering for stock status fields: `sellStatus`, `inStock`, `stockQuantity`, `isShelved`
2. ✅ Added comprehensive logging to inspect available API response fields
3. ⚠️ **Result**: Need to verify if these fields are actually returned by the `/product/list` endpoint

**Alternative Approaches**:

1. **Use Different Endpoint**:
   - Check if CJ has a `/product/search` or `/product/available` endpoint
   - Use `/product/details` endpoint to verify availability for each product (slower, more API calls)

2. **Post-Filter by Testing URLs**:
   - After getting search results, test each product URL for availability
   - Filter out products that return 404 or "removed" pages
   - **Downside**: Requires additional HTTP requests, slows down search

3. **Add "Availability Unknown" Warning**:
   - Display a notice that some products may not be available
   - Show "Verify availability" link for each product
   - **Upside**: Simple, transparent to users

4. **Contact CJ Support**:
   - Ask about the correct API endpoint for searching only available products
   - Request documentation on stock/availability fields

## API Response Fields

Based on testing, the `/product/list` endpoint returns:

**Confirmed Fields**:
- `pid` - Product ID
- `productNameEn` - English product name
- `productImage` - Main product image URL
- `productImageList` - Array of additional images
- `sellPrice` - Selling price (can be range: "39.40 -- 41.39")
- `minPriceQuantity` - Minimum order quantity (MOQ)
- `productSku` - Product SKU
- `categoryId`, `categoryName` - Product category
- `packingWeight`, `packingLength`, `packingWidth`, `packingHeight` - Dimensions

**Confirmed Availability Fields**:
- `saleStatus` - Integer status code where `3` = "On Sale" (approved for sale)

**Fields NOT available in /product/list**:
- ❌ `inStock` - Does not exist
- ❌ `stockQuantity` - Does not exist (use /product/stock endpoints instead)
- ❌ `isShelved` - Does not exist
- ❌ `leadTime` - Does not exist in /product/list (may be in /product/query)

## Current Implementation

Location: `backend/app/providers/cj.py`

**Filtering Applied**:
```python
# Only include products with saleStatus = 3 ("On Sale")
# Per CJ API docs: saleStatus is an integer where:
#   3 = "On Sale" (approved for sale and available)
# Products with other saleStatus values are filtered out
```

**Reference**: 
- API Documentation Section 1.4 (Product List)
- Line 502: `saleStatus | Sale status | int | 20 | 3 means approved for sale`
- Line 519: Product Status Code `3` = "On Sale"

**Logging Added**:
- Logs all available fields from first product in each search
- Logs specific availability fields for debugging
- Logs skipped products with reason

## Next Steps

1. **Run a search and check worker logs** to see what fields are actually returned
2. **If availability fields are missing**:
   - Research CJ API documentation for alternative endpoints
   - Consider post-filtering approach
   - Add user-facing warning about availability
3. **If availability fields are present but wrong**:
   - Adjust filtering logic based on actual field values
   - May need to map CJ's status codes to availability

## Testing

To test the current implementation:

1. Restart the worker:
   ```bash
   cd backend
   celery -A celery_app.celery_app worker --loglevel=INFO --pool=solo
   ```

2. Run a product search

3. Check worker logs for:
   ```
   INFO: CJ API first product fields: [...]
   DEBUG: CJ API sample product: pid=..., sellStatus=..., inStock=...
   DEBUG: Skipping product ... - [reason]
   ```

4. Review which fields are actually present and their values

## References

- CJ API Docs: https://developers.cjdropshipping.com/en/api/api2/api/product.html
- Current endpoint: `GET /api2.0/v1/product/list`

