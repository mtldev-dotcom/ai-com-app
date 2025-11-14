/**
 * Utility functions for product change detection
 */

/**
 * Deep comparison of two product data objects
 * Returns true if they are different (changes detected)
 */
export function hasDraftChanges(
  current: Record<string, unknown>,
  initial: Record<string, unknown> | null
): boolean {
  if (!initial) {
    // If no initial data, consider it as having changes (new product)
    return true;
  }

  // Compare all fields
  const fieldsToCompare = [
    "supplierId",
    "titleEn",
    "titleFr",
    "subtitle",
    "descriptionEn",
    "descriptionFr",
    "metaTitle",
    "metaDescription",
    "images",
    "cost",
    "sellingPrice",
    "margin",
    "sku",
    "handle",
    "currency",
    "supplierProductId",
    "supplierVariantId",
    "marketplaceUrl",
    "weight",
    "length",
    "width",
    "height",
    "material",
    "originCountry",
    "hsCode",
    "midCode",
    "type",
    "collectionId",
    "categoryIds",
    "salesChannelIds",
    "stockLocationIds",
    "locationInventory",
    "tags",
    "specifications",
    "status",
  ];

  for (const field of fieldsToCompare) {
    const currentValue = current[field];
    const initialValue = initial[field];

    // Handle arrays (categoryIds, tags, etc.)
    if (Array.isArray(currentValue) || Array.isArray(initialValue)) {
      const currentArray = Array.isArray(currentValue) ? currentValue : [];
      const initialArray = Array.isArray(initialValue) ? initialValue : [];
      
      if (currentArray.length !== initialArray.length) {
        return true;
      }
      
      // Sort arrays for comparison (for order-independent comparison)
      const currentSorted = [...currentArray].sort().join(",");
      const initialSorted = [...initialArray].sort().join(",");
      
      if (currentSorted !== initialSorted) {
        return true;
      }
      continue;
    }

    // Handle objects (specifications, locationInventory, etc.)
    if (
      typeof currentValue === "object" &&
      currentValue !== null &&
      typeof initialValue === "object" &&
      initialValue !== null
    ) {
      const currentStr = JSON.stringify(currentValue);
      const initialStr = JSON.stringify(initialValue);
      if (currentStr !== initialStr) {
        return true;
      }
      continue;
    }

    // Handle primitive values
    if (currentValue !== initialValue) {
      return true;
    }
  }

  return false;
}

