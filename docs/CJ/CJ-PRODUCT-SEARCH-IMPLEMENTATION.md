# CJ Dropshipping Product Search - Complete Implementation Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [API Integration](#api-integration)
4. [Authentication](#authentication)
5. [Request Format](#request-format)
6. [Response Format](#response-format)
7. [Implementation Details](#implementation-details)
8. [Code Structure](#code-structure)
9. [Advanced Filters](#advanced-filters)
10. [Error Handling](#error-handling)
11. [Rate Limiting](#rate-limiting)
12. [Relevance Scoring](#relevance-scoring)
13. [Integration Points](#integration-points)
14. [Examples](#examples)
15. [Troubleshooting](#troubleshooting)

---

## Overview

The CJ Dropshipping product search integration provides a comprehensive solution for searching products on the CJ Dropshipping platform using their official API v2.0. This implementation focuses on the `/product/listV2` endpoint, which uses Elasticsearch-based search for better quality results.

### Key Features

- ✅ **API-Based Integration**: Official CJ Dropshipping API v2.0
- ✅ **Elasticsearch Search**: Uses `/product/listV2` endpoint for better search quality
- ✅ **Advanced Filtering**: Supports price range, MOQ, lead time, shipping origin
- ✅ **Intelligent Relevance Scoring**: Keyword-based ranking with position weighting
- ✅ **Rate Limiting**: Thread-safe rate limiting with configurable delays
- ✅ **Retry Logic**: Exponential backoff for rate limit errors
- ✅ **Product Availability Filtering**: Filters out unavailable products
- ✅ **URL Generation**: Creates proper CJ product URLs with product name slugs

### Provider Type

- **Type**: Official API Integration (`ProviderType.API`)
- **Base URL**: `https://developers.cjdropshipping.com/api2.0/v1`
- **Search Endpoint**: `/product/listV2`
- **Documentation**: https://developers.cjdropshipping.com/en/api/api2/api/product.html

---

## Architecture

### High-Level Flow

```
User Input (Frontend)
        ↓
API Request (POST /api/v1/imports/launch)
        ↓
Service Layer (create_queries_for_batch)
        ↓
Query Record (constraints_json stored in DB)
        ↓
Celery Worker (process_query_task)
        ↓
Provider Registry (search_all_providers)
        ↓
CJ Provider (search_products)
        ↓
CJ API (/product/listV2)
        ↓
Response Parsing (_parse_search_results)
        ↓
Post-Processing Filters
        ↓
Relevance Scoring
        ↓
ProductSearchResult Objects
        ↓
Normalization & Scoring
        ↓
Database Storage (Result model)
```

### Component Responsibilities

1. **Frontend (`frontend/components/AdvancedFilters.tsx`)**
   - Collects user search preferences
   - Validates input parameters
   - Sends filters to backend API

2. **API Layer (`backend/app/api/v1/imports.py`)**
   - Receives import requests with filters
   - Validates and extracts `AdvancedFilters`
   - Passes filters to service layer

3. **Service Layer (`backend/app/services/imports.py`)**
   - Creates `Query` records with `constraints_json`
   - Merges user filters into constraints
   - Manages batch processing

4. **Celery Worker (`backend/app/celery_app/tasks.py`)**
   - Processes queries asynchronously
   - Calls `run_sourcing_workflow` for each query

5. **Provider Registry (`backend/app/providers/registry.py`)**
   - Manages multiple providers
   - Coordinates parallel searches
   - Aggregates results

6. **CJ Provider (`backend/app/providers/cj.py`)**
   - Builds API request parameters
   - Handles authentication and rate limiting
   - Parses and normalizes API responses
   - Applies post-processing filters

---

## API Integration

### Endpoint Details

**Base URL**: `https://developers.cjdropshipping.com/api2.0/v1`

**Endpoint**: `/product/listV2`

**Method**: `GET`

**Authentication**: Header-based (`CJ-Access-Token`)

**Rate Limit**: ~10 requests per second (implementation uses 5 req/s for safety)

### Why listV2?

The `/product/listV2` endpoint was chosen over `/product/list` because:

1. **Elasticsearch-Based**: Uses Elasticsearch for better search relevance
2. **Better Performance**: Faster search results
3. **Enhanced Filtering**: Better support for price and country filters
4. **Nested Response Structure**: More organized data structure

---

## Authentication

### API Key Configuration

The CJ provider requires an API key to be configured in the environment:

```bash
# .env file
CJ_API_KEY=your_api_key_here
```

### How to Get API Key

1. Visit CJ Dropshipping Developer Portal: https://developers.cjdropshipping.com/
2. Create an account or log in
3. Navigate to API Management
4. Generate an API key (`CJ-Access-Token`)
5. Copy the key to your `.env` file

### Authentication Header

All API requests include the following header:

```python
headers = {
    "CJ-Access-Token": self.api_key,
    "Content-Type": "application/json",
}
```

### Provider Initialization

```python
class CJProvider(BaseProvider):
    def __init__(self):
        self.api_key = getattr(settings, "CJ_API_KEY", None)
        if not self.api_key:
            logger.warning("CJ_API_KEY not configured - CJ provider will be disabled")
        self.enabled = bool(self.api_key)
```

If the API key is missing, the provider is disabled and returns empty results.

---

## Request Format

### Parameters

The `/product/listV2` endpoint accepts the following query parameters:

| Parameter | Type | Required | Description | Mapped From |
|-----------|------|----------|-------------|-------------|
| `keyWord` | string | Yes | Product search keywords | `constraints.product_name` |
| `page` | integer | No | Page number (default: 1) | Fixed to 1 |
| `size` | integer | No | Results per page (1-100, default: 50) | `constraints.max_results` |
| `startSellPrice` | float | No | Minimum price filter | `constraints.min_price` |
| `endSellPrice` | float | No | Maximum price filter | `constraints.max_price` |
| `countryCode` | string | No | Shipping origin country code | `constraints.ship_from` |

### Request Building Logic

```python
def _build_search_params(self, constraints: SearchConstraints) -> Dict[str, Any]:
    """Build API request parameters for listV2 endpoint."""
    # Determine page size from max_results (default 50, max 100)
    page_size = min(constraints.max_results or 50, 100)
    
    params = {
        "keyWord": constraints.product_name,
        "page": 1,
        "size": page_size,
    }
    
    # Price filters
    if constraints.min_price is not None:
        params["startSellPrice"] = constraints.min_price
    
    if constraints.max_price is not None:
        params["endSellPrice"] = constraints.max_price
    
    # Shipping origin filter
    if constraints.ship_from:
        params["countryCode"] = constraints.ship_from
    
    return params
```

### Example Request

```http
GET /api2.0/v1/product/listV2?keyWord=wireless%20charger&size=50&startSellPrice=5.0&endSellPrice=50.0&countryCode=CN HTTP/1.1
Host: developers.cjdropshipping.com
CJ-Access-Token: your_api_key_here
Content-Type: application/json
```

### Unsupported Parameters

The following constraints are **not supported** by the CJ API and are filtered in post-processing:

- ❌ `ship_to` (destination country) - Not available in API
- ❌ `max_shipping_cost` - Not available in API
- ❌ `min_moq` / `max_moq` - Filtered after response
- ❌ `max_lead_time_days` - Filtered after response

---

## Response Format

### Response Structure

The `/product/listV2` endpoint returns a nested JSON structure:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "content": [
      {
        "productList": [
          {
            "id": 1402526907295207424,
            "sku": "CJYD2576421",
            "nameEn": "WiFi Signal Amplifier Enhanced Wireless Extender",
            "sellPrice": 12.99,
            "directMinOrderNum": 1,
            "bigImage": "https://...",
            "warehouseInventoryNum": 100,
            "listedNum": 5,
            "categoryId": 123,
            "threeCategoryName": "Electronics",
            "productType": "physical",
            "isVideo": false,
            "isPersonalized": false,
            "customization": false,
            "addMarkStatus": true
          }
        ]
      }
    ]
  }
}
```

### Key Response Fields

#### Product Identification

| Field | Type | Description | Mapped To |
|-------|------|-------------|-----------|
| `id` | integer | Product ID | `product_id` |
| `sku` | string | Product SKU | `specifications.sku` |
| `nameEn` | string | English product name | `product_name` |

#### Pricing

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `sellPrice` | float/string | Selling price | Can be range: "39.40 -- 41.39" |

#### Availability

| Field | Type | Description | Notes |
|-------|------|-------------|-------|
| `warehouseInventoryNum` | integer | Warehouse inventory count | Used for availability filtering |
| `listedNum` | integer | Number of active listings | Used for availability filtering |

#### Images

| Field | Type | Description |
|-------|------|-------------|
| `bigImage` | string | Main product image URL |

#### Ordering

| Field | Type | Description |
|-------|------|-------------|
| `directMinOrderNum` | integer | Minimum order quantity (MOQ) |

#### Categories

| Field | Type | Description |
|-------|------|-------------|
| `categoryId` | integer | Category ID |
| `oneCategoryName` | string | Root category |
| `twoCategoryName` | string | Parent category |
| `threeCategoryName` | string | Current category |

#### Product Features

| Field | Type | Description |
|-------|------|-------------|
| `productType` | string | Product type (physical/virtual) |
| `isVideo` | boolean | Has product video |
| `isPersonalized` | boolean | Supports personalization |
| `customization` | boolean | Supports customization |
| `addMarkStatus` | boolean | Free shipping indicator |

### Response Parsing

```python
def _parse_search_results(
    self, response_data: Dict[str, Any], constraints: SearchConstraints
) -> List[ProductSearchResult]:
    # Extract nested structure
    content = response_data.get("data", {}).get("content", [])
    if not content or len(content) == 0:
        return []
    
    products = content[0].get("productList", [])
    
    # Filter and parse each product
    for product in products:
        # Extract fields and create ProductSearchResult
        # ...
```

---

## Implementation Details

### 1. Product Availability Filtering

**Issue**: The CJ API can return products that are no longer available.

**Solution**: Filter products based on availability indicators:

```python
# Filter: Skip products with 0 listings (not being actively sold)
listed_num = product.get("listedNum", 0)
if listed_num == 0:
    continue

# Filter: Skip products with no inventory
inventory = product.get("warehouseInventoryNum", 0)
if inventory <= 0:
    continue
```

**Rationale**:
- `listedNum`: Indicates how many times this product is listed by users. `0` means no active listings.
- `warehouseInventoryNum`: Physical inventory count. `0` means out of stock.

### 2. Price Parsing

The CJ API can return prices in multiple formats:

```python
# Handle price ranges (e.g., "39.40 -- 41.39")
price_raw = product.get("sellPrice", 0)
if isinstance(price_raw, str):
    if " -- " in price_raw:
        # Extract the minimum price from the range
        price_str = price_raw.split(" -- ")[0].strip().replace(",", "")
    else:
        price_str = price_raw.replace(",", "")
    price = float(price_str)
else:
    price = float(price_raw) if price_raw else 0.0
```

**Strategy**: Use the minimum price from price ranges to ensure affordability.

### 3. Product URL Generation

CJ product URLs follow a specific format:

```
https://cjdropshipping.com/product/{product-name-slug}-p-{product_id}.html
```

**Implementation**:

```python
# Create URL-friendly slug from product name
product_slug = product_name.lower()
product_slug = product_slug.replace(' ', '-')
# Remove special characters except hyphens
product_slug = ''.join(c for c in product_slug if c.isalnum() or c == '-')
# Remove consecutive hyphens
while '--' in product_slug:
    product_slug = product_slug.replace('--', '-')
# Trim hyphens from start/end
product_slug = product_slug.strip('-')
# Truncate to reasonable length (max 100 chars)
product_slug = product_slug[:100]

product_url = f"https://cjdropshipping.com/product/{product_slug}-p-{product_id}.html"
```

**Example**:
- Product Name: "WiFi Signal Amplifier Enhanced Wireless Extender"
- Product ID: `1402526907295207424`
- Generated URL: `https://cjdropshipping.com/product/wifi-signal-amplifier-enhanced-wireless-extender-p-1402526907295207424.html`

### 4. Post-Processing Filters

Filters not supported by the API are applied after receiving results:

```python
# MOQ filters
if constraints.min_moq is not None and result.moq and result.moq < constraints.min_moq:
    continue
if constraints.max_moq is not None and result.moq and result.moq > constraints.max_moq:
    continue

# Lead time filter
if constraints.max_lead_time_days is not None and result.lead_time_days:
    if result.lead_time_days > constraints.max_lead_time_days:
        continue

# Limit results
if constraints.max_results and len(filtered_results) >= constraints.max_results:
    break
```

---

## Code Structure

### File Organization

```
backend/app/
├── providers/
│   ├── base.py           # Base provider interface and data models
│   ├── cj.py            # CJ provider implementation
│   └── registry.py      # Provider registry and parallel search
├── services/
│   └── imports.py       # Query creation and constraint merging
└── api/v1/
    └── imports.py       # API endpoints for product imports
```

### Key Classes

#### `CJProvider` (`backend/app/providers/cj.py`)

Main provider class implementing the `BaseProvider` interface.

**Methods**:

- `__init__()`: Initialize provider with API credentials
- `get_provider_info()`: Return provider metadata
- `search_products()`: Main search method
- `_build_search_params()`: Build API request parameters
- `_make_api_request()`: Make authenticated API request
- `_make_api_request_with_retry()`: Retry logic wrapper
- `_parse_search_results()`: Parse API response
- `_extract_keywords()`: Extract keywords from search query
- `_calculate_relevance_score()`: Calculate relevance score
- `_extract_specifications()`: Extract product specifications

#### `SearchConstraints` (`backend/app/providers/base.py`)

Dataclass defining search constraints:

```python
@dataclass
class SearchConstraints:
    product_name: str
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    target_price: Optional[float] = None
    currency: Optional[str] = None
    min_moq: Optional[int] = None
    max_moq: Optional[int] = None
    max_lead_time_days: Optional[int] = None
    ship_from: Optional[str] = None
    ship_to: Optional[str] = None
    max_shipping_cost: Optional[float] = None
    max_results: Optional[int] = None
    notes: Optional[str] = None
```

#### `ProductSearchResult` (`backend/app/providers/base.py`)

Standardized product result structure:

```python
@dataclass
class ProductSearchResult:
    product_id: str
    product_name: str
    product_url: str
    price: float
    currency: str
    supplier_name: str
    platform: str
    moq: Optional[int] = None
    supplier_id: Optional[str] = None
    supplier_url: Optional[str] = None
    images: List[str] = None
    specifications: Dict[str, Any] = None
    shipping_options: List[Dict[str, Any]] = None
    lead_time_days: Optional[int] = None
    raw_data: Dict[str, Any] = None
```

---

## Advanced Filters

### Supported Filters

| Filter | API Support | Post-Processing | Notes |
|--------|-------------|-----------------|-------|
| `max_results` | ✅ | ✅ | Maximum 100 per request |
| `min_price` | ✅ | - | `startSellPrice` parameter |
| `max_price` | ✅ | - | `endSellPrice` parameter |
| `ship_from` | ✅ | - | `countryCode` parameter |
| `ship_to` | ❌ | ❌ | Not supported |
| `min_moq` | ❌ | ✅ | Filtered after response |
| `max_moq` | ❌ | ✅ | Filtered after response |
| `max_lead_time_days` | ❌ | ✅ | Filtered after response |
| `max_shipping_cost` | ❌ | ❌ | Not supported |
| `currency` | ❌ | ❌ | CJ API always uses USD |

### Filter Application Flow

```
User Input (Frontend)
        ↓
AdvancedFilters Component
        ↓
API Request (LaunchRequest with filters)
        ↓
Service Layer (create_queries_for_batch)
        ↓
Merged Constraints (constraints_json)
        ↓
Query Record (stored in DB)
        ↓
Celery Worker (process_query_task)
        ↓
SearchConstraints Object
        ↓
CJ Provider (_build_search_params)
        ↓
API Request (with API-supported filters)
        ↓
API Response
        ↓
Post-Processing Filters (MOQ, lead time, max_results)
        ↓
Filtered Results
```

### Filter Merging Logic

```python
def create_queries_for_batch(..., filters: Dict[str, Any] = None):
    filters = filters or {}
    
    for row in rows:
        constraints = {
            "category": row_data.get("category"),
            "target_price": row_data.get("price"),
            # ... other row-level constraints
        }
        
        # Merge filters (filters take precedence)
        if filters:
            constraints.update(filters)
        
        # Create Query with merged constraints
        query = Query(
            batch_id=batch_id,
            product_name=product_name,
            constraints_json=constraints,
            # ...
        )
```

---

## Error Handling

### Exception Hierarchy

```
ProviderError (base exception)
├── ProviderAuthError (401, invalid token)
├── ProviderRateLimitError (429, rate limit exceeded)
└── ProviderTimeoutError (request timeout)
```

### Error Handling Strategy

#### 1. Authentication Errors

```python
if "token" in error_msg.lower() or "auth" in error_msg.lower() or response.status_code == 401:
    raise ProviderAuthError(f"CJ API authentication failed: {error_msg}")
```

**Handling**: Provider is disabled, user must update API key.

#### 2. Rate Limit Errors

```python
if response.status_code == 429 or "rate limit" in error_msg.lower():
    raise ProviderRateLimitError("CJ API rate limit exceeded")
```

**Handling**: Retry with exponential backoff (2s, 4s, 8s).

#### 3. Timeout Errors

```python
except httpx.TimeoutException as e:
    raise ProviderTimeoutError(f"CJ API request timed out: {str(e)}")
```

**Handling**: Request fails, can be retried by user.

#### 4. API Error Codes

```python
code = data.get("code")
if code != "200" and code != 200:
    error_msg = data.get("message", "Unknown error")
    raise ProviderError(f"CJ API error: {error_msg} (code: {code})")
```

**Handling**: Logged and raised as generic `ProviderError`.

### Retry Logic

```python
def _make_api_request_with_retry(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """Make API request with retry logic for rate limit errors."""
    for attempt in range(self.max_retries + 1):
        try:
            return self._make_api_request(url, params)
        except ProviderRateLimitError as e:
            if attempt < self.max_retries:
                delay = self.retry_base_delay * (2 ** attempt)  # 2s, 4s, 8s
                time.sleep(delay)
            else:
                raise
```

**Configuration**:
- `max_retries`: 3
- `retry_base_delay`: 2.0 seconds
- Exponential backoff: 2s → 4s → 8s

---

## Rate Limiting

### Implementation Strategy

**Thread-Safe Global Lock**: Ensures only one API call happens at a time across all instances.

```python
# Global lock for serializing CJ API calls across all instances
_cj_api_lock = threading.Lock()
_last_cj_api_call_time = [0.0]  # Use list to allow modification in nested function

# Rate limiting: minimum delay between API calls (in seconds)
CJ_API_MIN_DELAY = 0.2  # 200ms = 5 requests per second
```

### Rate Limiting Logic

```python
def _make_api_request(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    headers = {
        "CJ-Access-Token": self.api_key,
        "Content-Type": "application/json",
    }
    
    # Rate limiting: serialize API calls and add minimum delay
    with _cj_api_lock:
        # Calculate time since last API call
        elapsed = time.time() - _last_cj_api_call_time[0]
        if elapsed < CJ_API_MIN_DELAY:
            sleep_time = CJ_API_MIN_DELAY - elapsed
            logger.debug(f"Rate limiting: sleeping {sleep_time:.2f}s before CJ API call")
            time.sleep(sleep_time)
        
        # Update last call time
        _last_cj_api_call_time[0] = time.time()
    
    # Make API request
    with httpx.Client(timeout=self.timeout) as client:
        response = client.get(url, params=params, headers=headers)
        # ...
```

### Configuration

- **Minimum Delay**: 0.2 seconds (200ms)
- **Maximum Rate**: 5 requests per second (conservative limit)
- **API Limit**: ~10 requests per second (CJ's limit)
- **Safety Margin**: 50% (using 5 req/s instead of 10 req/s)

### Benefits

1. **Thread Safety**: Global lock prevents concurrent requests
2. **Predictable Timing**: Ensures minimum delay between requests
3. **No Rate Limit Errors**: Stays well below API limits
4. **Multi-Instance Safe**: Works across multiple worker instances

---

## Relevance Scoring

### Algorithm Overview

The relevance scoring algorithm calculates how well a product matches the search query based on keyword matches and position weighting.

### Scoring Formula

**Base Score Calculation**:

```python
# 1. Extract keywords from search query (remove stop words)
keywords = extract_keywords("wireless charger fast")

# 2. For each keyword, check if it appears in product name
matched_keywords = 0
position_scores = []

for keyword in keywords:
    if keyword in product_name.lower():
        matched_keywords += 1
        position = product_name.find(keyword)
        position_score = 1.0 - (position / max_len)
        position_scores.append(position_score)

# 3. Calculate base score
base_score = matched_keywords / len(keywords)

# 4. Apply position weighting (70% coverage, 30% position)
if position_scores:
    avg_position_score = sum(position_scores) / len(position_scores)
    base_score = (base_score * 0.7) + (avg_position_score * 0.3)
```

**Bonuses**:

- **Exact Phrase Match**: `score = 1.0` (immediate return)
- **All Keywords Match**: `score = score * 1.2` (capped at 1.0)

**Penalties**:

- **Less than Half Keywords Match**: `score = score * 0.5`
- **Only 1 Keyword in 3+ Query**: `score = score * 0.3`

### Score Ranges

| Score Range | Meaning | Example |
|-------------|---------|---------|
| 1.0 | Exact phrase match | Query: "wireless charger" → Product: "Wireless Charger" |
| 0.9 - 0.99 | All keywords match, good positions | Query: "wireless charger fast" → Product: "Fast Wireless Charger Stand" |
| 0.7 - 0.89 | Most keywords match | Query: "wireless charger" → Product: "Qi Wireless Phone Charger Pad" |
| 0.4 - 0.69 | Some keywords match | Query: "wireless charger" → Product: "USB Charging Cable" |
| 0.0 - 0.39 | Few/no keywords match | Query: "wireless charger" → Product: "Phone Case" |

### Implementation

```python
def _calculate_relevance_score(self, product_name: str, search_keywords: List[str]) -> float:
    # Check for exact phrase match first (highest priority)
    original_query = " ".join(search_keywords)
    if original_query in product_name:
        return 1.0
    
    # Track keyword matches with position weighting
    matched_keywords = 0
    position_scores = []
    
    for keyword in search_keywords:
        if keyword in product_name:
            matched_keywords += 1
            position = product_name.find(keyword)
            max_len = max(len(product_name), 100)
            position_score = 1.0 - (position / max_len)
            position_scores.append(position_score)
    
    # Calculate base score
    base_score = matched_keywords / len(search_keywords)
    
    # Apply position weighting
    if position_scores:
        avg_position_score = sum(position_scores) / len(position_scores)
        base_score = (base_score * 0.7) + (avg_position_score * 0.3)
    
    # Apply bonuses and penalties
    if matched_keywords == len(search_keywords):
        base_score = min(1.0, base_score * 1.2)
    
    if matched_keywords < len(search_keywords) / 2:
        base_score = base_score * 0.5
    
    if len(search_keywords) >= 3 and matched_keywords == 1:
        base_score = base_score * 0.3
    
    return min(1.0, max(0.0, base_score))
```

### Stop Words Filtering

Common stop words are removed from search queries to focus on meaningful keywords:

```python
stop_words = {
    "a", "an", "and", "are", "as", "at", "be", "by", "for", "from",
    "has", "he", "in", "is", "it", "its", "of", "on", "that", "the",
    # ... more stop words
}
```

**Example**:
- Query: "a wireless charger for phone"
- Keywords Extracted: `["wireless", "charger", "phone"]`
- Stop Words Removed: `["a", "for"]`

---

## Integration Points

### 1. Provider Registry

The CJ provider is registered in `ProviderRegistry`:

```python
class ProviderRegistry:
    def _register_providers(self):
        try:
            cj_provider = CJProvider()
            if cj_provider.enabled:
                self.providers.append(cj_provider)
                logger.info("Registered CJ Dropshipping provider")
        except Exception as e:
            logger.warning(f"Failed to register CJ provider: {e}")
```

### 2. Query Creation

Queries are created with constraints in `create_queries_for_batch`:

```python
def create_queries_for_batch(..., filters: Dict[str, Any] = None):
    filters = filters or {}
    
    for row in rows:
        constraints = {
            "category": row_data.get("category"),
            "target_price": row_data.get("price"),
            "ship_from": filters.get("ship_from"),
            "ship_to": filters.get("ship_to"),
            "min_price": filters.get("min_price"),
            "max_price": filters.get("max_price"),
            "min_moq": filters.get("min_moq"),
            "max_moq": filters.get("max_moq"),
            "max_lead_time_days": filters.get("max_lead_time_days"),
            "max_results": filters.get("max_results"),
        }
        
        query = Query(
            batch_id=batch_id,
            product_name=product_name,
            constraints_json=constraints,
        )
```

### 3. Sourcing Workflow

The workflow orchestrates provider searches:

```python
def run_sourcing_workflow(query_id: UUID, product_name: str, constraints: Dict[str, Any]):
    # Build SearchConstraints from query
    search_constraints = SearchConstraints(
        product_name=product_name,
        category=constraints.get("category"),
        min_price=constraints.get("min_price"),
        max_price=constraints.get("max_price"),
        ship_from=constraints.get("ship_from"),
        ship_to=constraints.get("ship_to"),
        max_results=constraints.get("max_results"),
        # ... more constraints
    )
    
    # Search all providers
    registry = get_provider_registry()
    search_results = registry.search_all_providers(search_constraints)
    
    # Normalize and store results
    # ...
```

### 4. Result Storage

Results are stored in the `Result` model:

```python
result = Result(
    query_id=query_id,
    product_name=product_name,
    price_value=price,
    price_currency="USD",
    moq=moq,
    lead_time_days=lead_time_days,
    sku=sku,
    landed_cost_value=landed_cost_value,
    landed_cost_currency="USD",
    eta_days=eta_days,
    # ... more fields
)
```

---

## Examples

### Example 1: Basic Search

**Request**:
```python
constraints = SearchConstraints(
    product_name="wireless charger"
)

provider = CJProvider()
results = provider.search_products(constraints)
```

**API Call**:
```http
GET /api2.0/v1/product/listV2?keyWord=wireless%20charger&page=1&size=50
```

**Response**: List of up to 50 products matching "wireless charger"

### Example 2: Price Range Filter

**Request**:
```python
constraints = SearchConstraints(
    product_name="phone case",
    min_price=5.0,
    max_price=25.0
)
```

**API Call**:
```http
GET /api2.0/v1/product/listV2?keyWord=phone%20case&startSellPrice=5.0&endSellPrice=25.0&size=50
```

**Response**: Products priced between $5.00 and $25.00

### Example 3: Country Filter

**Request**:
```python
constraints = SearchConstraints(
    product_name="bluetooth speaker",
    ship_from="CN"
)
```

**API Call**:
```http
GET /api2.0/v1/product/listV2?keyWord=bluetooth%20speaker&countryCode=CN&size=50
```

**Response**: Products shipping from China

### Example 4: Combined Filters

**Request**:
```python
constraints = SearchConstraints(
    product_name="led light strip",
    min_price=10.0,
    max_price=50.0,
    ship_from="CN",
    min_moq=1,
    max_moq=10,
    max_lead_time_days=30,
    max_results=20
)
```

**Processing**:
1. API call with `keyWord`, `startSellPrice`, `endSellPrice`, `countryCode`, `size=20`
2. Post-processing filters: `min_moq`, `max_moq`, `max_lead_time_days`
3. Limit to 20 results

**Response**: Up to 20 products matching all criteria

### Example 5: Full Integration Flow

```python
# 1. Frontend sends request
POST /api/v1/imports/launch
{
    "import_id": "...",
    "selected_row_ids": ["0", "1"],
    "filters": {
        "min_price": 10.0,
        "max_price": 50.0,
        "ship_from": "CN",
        "max_results": 20
    }
}

# 2. Service creates queries
queries = create_queries_for_batch(..., filters={...})

# 3. Celery worker processes query
task = process_query_task.delay(query_id)

# 4. Provider searches
results = cj_provider.search_products(constraints)

# 5. Results stored in database
db.add(Result(...))
```

---

## Troubleshooting

### Common Issues

#### 1. "CJ_API_KEY not configured"

**Symptom**: Provider returns empty results, no API calls made.

**Solution**:
1. Check `.env` file for `CJ_API_KEY`
2. Verify API key is valid
3. Restart application after updating `.env`

#### 2. "CJ API authentication failed"

**Symptom**: `ProviderAuthError` raised.

**Solution**:
1. Verify API key is correct
2. Check if API key has expired
3. Regenerate API key from CJ Developer Portal
4. Update `.env` and restart

#### 3. "CJ API rate limit exceeded"

**Symptom**: `ProviderRateLimitError` after retries.

**Solution**:
1. Wait a few minutes before retrying
2. Reduce concurrent requests
3. Check if `CJ_API_MIN_DELAY` is too low (increase if needed)

#### 4. Products Not Available on Website

**Symptom**: API returns products, but URLs show "Product removed".

**Solution**:
- This is expected behavior - the API includes historical products
- Filtering by `listedNum > 0` and `warehouseInventoryNum > 0` minimizes this
- Always verify product availability by visiting the URL

#### 5. Incorrect Product URLs

**Symptom**: URLs return 404 errors.

**Solution**:
1. Verify URL generation logic is correct
2. Check product name slug generation
3. Ensure product ID is correct

#### 6. No Results Returned

**Possible Causes**:
1. **Too Strict Filters**: Relax price range or MOQ constraints
2. **Invalid Keywords**: Check search query spelling
3. **Availability Filtering**: Products filtered out due to availability
4. **API Error**: Check logs for API error messages

**Debugging**:
```python
# Enable debug logging
import logging
logging.getLogger("app.providers.cj").setLevel(logging.DEBUG)

# Check logs for:
# - API request parameters
# - API response structure
# - Filtered products and reasons
```

#### 7. Relevance Scores Too Low

**Symptom**: Products don't match search query well.

**Solution**:
1. Check keyword extraction logic
2. Verify stop words are being filtered correctly
3. Review relevance scoring algorithm weights
4. Consider adjusting bonus/penalty multipliers

### Debugging Tips

#### Enable Detailed Logging

```python
# In backend/app/providers/cj.py
logger.setLevel(logging.DEBUG)

# Check logs for:
# - "CJ API first product fields: [...]"
# - "CJ API sample product: pid=..., sellStatus=..."
# - "Skipping product ... - [reason]"
```

#### Verify API Response Structure

```python
# Add logging in _parse_search_results
if products and len(products) > 0:
    first_product = products[0]
    logger.info(f"First product keys: {list(first_product.keys())}")
    logger.info(f"First product: {first_product}")
```

#### Test API Directly

```bash
# Using curl
curl -X GET "https://developers.cjdropshipping.com/api2.0/v1/product/listV2?keyWord=charger&size=5" \
  -H "CJ-Access-Token: your_api_key_here"
```

#### Check Rate Limiting

```python
# Add timing logs
import time
start = time.time()
response = client.get(url, params=params, headers=headers)
elapsed = time.time() - start
logger.debug(f"API call took {elapsed:.2f}s")
```

---

## Summary

The CJ Dropshipping product search implementation provides:

✅ **Robust API Integration**: Official API v2.0 with `/product/listV2` endpoint  
✅ **Advanced Filtering**: Price range, MOQ, lead time, shipping origin  
✅ **Intelligent Ranking**: Keyword-based relevance scoring  
✅ **Rate Limiting**: Thread-safe rate limiting with configurable delays  
✅ **Error Handling**: Comprehensive error handling with retries  
✅ **Product Availability**: Filters out unavailable products  
✅ **URL Generation**: Creates proper CJ product URLs  

### Key Files

- `backend/app/providers/cj.py` - Main provider implementation
- `backend/app/providers/base.py` - Base classes and data models
- `backend/app/services/imports.py` - Query creation and constraint merging
- `backend/app/api/v1/imports.py` - API endpoints

### Configuration

- Environment Variable: `CJ_API_KEY` (required)
- Rate Limit: 5 requests/second (configurable via `CJ_API_MIN_DELAY`)
- Retry Logic: 3 retries with exponential backoff

### Future Enhancements

- [ ] Support for pagination (currently only page 1)
- [ ] Shipping cost estimation from CJ API
- [ ] Product details endpoint integration
- [ ] Stock availability checking endpoint
- [ ] Category-based filtering
- [ ] Multi-language product name support

---

**Last Updated**: 2025-01-05  
**API Version**: 2.0  
**Endpoint**: `/product/listV2`  
**Documentation**: https://developers.cjdropshipping.com/en/api/api2/api/product.html

