# Complete Development Guide: Ultimate Product Finder AI Agent Features

## Overview

This guide provides step-by-step instructions to reproduce all features implemented in the Ultimate Product Finder AI Agent application. Each feature is documented with:

- Implementation steps
- Code examples and file references
- Database schema changes
- API endpoints
- Frontend components
- Integration points
- Testing strategies
- Common pitfalls and solutions

## Table of Contents

1. [Project Setup & Infrastructure](#1-project-setup--infrastructure)
2. [Database Schema & Models](#2-database-schema--models)
3. [SKU Extraction Feature](#3-sku-extraction-feature)
4. [Landed Cost & ETA Calculation](#4-landed-cost--eta-calculation)
5. [Advanced Search Filters](#5-advanced-search-filters)
6. [Bulk Actions & Export](#6-bulk-actions--export)
7. [CJ Dropshipping API Integration](#7-cj-dropshipping-api-integration)
8. [Product URL Generation](#8-product-url-generation)
9. [Rate Limiting & Error Handling](#9-rate-limiting--error-handling)
10. [Results Display & UI Components](#10-results-display--ui-components)
11. [Bulk Delete with Cascading](#11-bulk-delete-with-cascading)
12. [Testing & Validation](#12-testing--validation)

---

## 1. Project Setup & Infrastructure

### 1.1 Tech Stack Requirements

**Backend:**
- Python 3.11+
- FastAPI
- SQLAlchemy
- Alembic (migrations)
- Celery + Redis
- PostgreSQL
- Pydantic

**Frontend:**
- Next.js 15+
- React 18+
- TypeScript
- Tailwind CSS

**Infrastructure:**
- Docker & Docker Compose
- Redis
- PostgreSQL
- MinIO (S3-compatible storage)

### 1.2 Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── providers/        # Provider integrations
│   ├── services/         # Business logic
│   ├── agents/           # Workflow orchestration
│   ├── db/               # Database models and migrations
│   └── core/             # Configuration
├── celery_app.py         # Celery configuration
└── requirements.txt

frontend/
├── app/                  # Next.js app directory
│   ├── import/          # Import page
│   ├── results/         # Results page
│   └── history/         # History page
└── components/           # React components
```

---

## 2. Database Schema & Models

### 2.1 Core Models

**Key Models:**
- `BatchRun`: Tracks batch processing jobs
- `Query`: Individual product search queries within a batch
- `Result`: Individual product search results
- `Supplier`: Supplier information
- `ImportedProduct`: CSV/Google Sheets import records
- `Report`: Analysis reports (optional)

### 2.2 Result Model Schema

**File:** `backend/app/db/models/results.py`

```python
class Result(Base):
    __tablename__ = "results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    query_id = Column(UUID(as_uuid=True), ForeignKey("queries.id", ondelete="CASCADE"), index=True)
    supplier_id = Column(UUID(as_uuid=True), ForeignKey("suppliers.id", ondelete="SET NULL"), index=True, nullable=True)
    
    # Product data
    price_value = Column(Numeric(18, 4), nullable=True)
    price_currency = Column(String(8), nullable=True)
    moq = Column(Integer, nullable=True)
    lead_time_days = Column(Integer, nullable=True)
    sku = Column(String(128), nullable=True, index=True)  # Added in migration 0002
    
    # Scoring
    reliability_score = Column(Numeric(5, 2), nullable=True)
    ranking_score = Column(Numeric(7, 3), index=True, nullable=True)
    
    # Landed cost (added in migration)
    landed_cost_value = Column(Numeric(18, 4), nullable=True)
    landed_cost_currency = Column(String(8), nullable=True)
    eta_days = Column(Integer, nullable=True)
    
    # JSON storage
    normalized_json = Column(JSONB, nullable=True)
    raw_json = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
```

### 2.3 Migration: Add SKU Field

**File:** `backend/app/db/migrations/versions/0002_add_sku_to_results.py`

**Steps:**
1. Create migration file
2. Add `sku` column to `results` table
3. Run migration: `alembic upgrade head`

```python
def upgrade():
    op.add_column('results', 
        sa.Column('sku', sa.String(length=128), nullable=True))
    op.create_index('ix_results_sku', 'results', ['sku'])

def downgrade():
    op.drop_index('ix_results_sku', 'results')
    op.drop_column('results', 'sku')
```

---

## 3. SKU Extraction Feature

### 3.1 Implementation Overview

Extract SKU from product search results using multiple fallback strategies:
1. Normalized data (`specifications_normalized.sku`)
2. Search result specifications (`specifications.sku`)
3. Raw data (`raw_data.productSku`, `raw_data.sku`, etc.)

### 3.2 Backend Implementation

**File:** `backend/app/agents/graph.py`

**Location:** `_store_results_in_db` function (lines 244-270)

```python
# Extract SKU - try multiple sources
sku = None

# 1. Try normalized data first
if normalized_data and normalized_data.get("specifications_normalized"):
    sku = normalized_data["specifications_normalized"].get("sku")

# 2. Try search_result specifications
if not sku and search_result.specifications:
    sku = search_result.specifications.get("sku")

# 3. Try raw_data (most reliable for CJ)
if not sku and search_result.raw_data:
    sku = (
        search_result.raw_data.get("productSku") or
        search_result.raw_data.get("sku") or
        search_result.raw_data.get("SKU") or
        search_result.raw_data.get("product_sku")
    )

# Log if SKU is missing
if not sku:
    logger.warning(f"No SKU found for product: {search_result.product_name}")
else:
    logger.debug(f"Extracted SKU: {sku} for product: {search_result.product_name}")
```

### 3.3 Provider-Specific SKU Extraction

**File:** `backend/app/providers/cj.py`

**Location:** `_parse_search_results` method (line 281)

```python
# CJ API listV2 uses "sku" field directly
product_sku = product.get("sku")
```

### 3.4 API Response Model

**File:** `backend/app/api/v1/batches.py`

**Location:** `ResultItem` model (line 85)

```python
class ResultItem(BaseModel):
    result_id: UUID
    query_id: UUID
    product_name: str
    sku: Optional[str] = None  # Added
    # ... other fields
```

### 3.5 Frontend Display

**File:** `frontend/components/ResultCard.tsx`

**Location:** Lines 98-110

```typescript
{result.sku && (
  <div>
    <span className="text-gray-600">SKU:</span>
    <span className="ml-2 font-medium text-gray-900">{result.sku}</span>
  </div>
)}
```

---

## 4. Landed Cost & ETA Calculation

### 4.1 Service Implementation

**File:** `backend/app/services/costing.py` (NEW FILE)

**Key Components:**

1. **LandedCostEstimate Dataclass:**
```python
@dataclass
class LandedCostEstimate:
    unit_price_usd: float
    shipping_cost_usd: float
    duties_usd: float
    total_landed_cost_usd: float
    currency: str = "USD"
    confidence: str = "medium"
    eta_days: Optional[int] = None
    eta_confidence: str = "medium"
```

2. **Duty Rate Tables:**
```python
DUTY_RATES = {
    ("CN", "US"): 7.5,
    ("CN", "EU"): 6.0,
    ("CN", "GB"): 5.0,
    ("CN", "AU"): 5.0,
    ("CN", "CA"): 6.5,
    ("US", "US"): 0.0,
    # Add more routes
}
```

3. **Shipping Time Estimates:**
```python
SHIPPING_TIME_ROUTES = {
    ("CN", "US"): (10, 25),  # (min_days, max_days)
    ("CN", "EU"): (12, 30),
    ("CN", "GB"): (12, 28),
    # Add more routes
}
```

### 4.2 Calculation Functions

**Main Function:** `calculate_landed_cost_for_result`

```python
def calculate_landed_cost_for_result(
    result_data: ProductSearchResult,
    normalized_data: Dict[str, Any],
    constraints: Optional[Dict[str, Any]] = None
) -> Optional[LandedCostEstimate]:
    """
    Calculate total landed cost for a product result.
    
    Steps:
    1. Extract unit price (convert to USD if needed)
    2. Extract/estimate shipping cost
    3. Calculate duties based on origin/destination
    4. Estimate ETA
    5. Return LandedCostEstimate
    """
    # Extract unit price
    unit_price_usd = normalized_data.get("price_usd") or result_data.price
    
    # Extract shipping cost
    shipping_cost_usd = extract_shipping_cost(result_data, normalized_data, constraints)
    
    # Get origin/destination (default to CN/US if not specified)
    origin_country = constraints.get("ship_from") or "CN"
    destination_country = constraints.get("ship_to") or "US"
    
    # Calculate duties
    duties_usd = _estimate_duties_and_taxes(
        unit_price_usd, origin_country, destination_country
    )
    
    # Estimate ETA
    eta_days, eta_confidence = estimate_shipping_time(
        origin_country, destination_country
    )
    
    # Calculate total
    total_landed_cost_usd = unit_price_usd + shipping_cost_usd + duties_usd
    
    return LandedCostEstimate(
        unit_price_usd=unit_price_usd,
        shipping_cost_usd=shipping_cost_usd,
        duties_usd=duties_usd,
        total_landed_cost_usd=total_landed_cost_usd,
        currency="USD",
        confidence="medium",
        eta_days=eta_days,
        eta_confidence=eta_confidence
    )
```

### 4.3 Integration into Workflow

**File:** `backend/app/agents/graph.py`

**Location:** `run_sourcing_workflow` function (lines 88-127)

```python
# Calculate landed costs for all results
logger.info(f"Calculating landed costs for {len(normalized_results_data)} results...")
for item in normalized_results_data:
    try:
        landed_cost_estimate = calculate_landed_cost_for_result(
            result_data=item["result"],
            normalized_data=item.get("normalized") or {},
            constraints=constraints,
        )
        if landed_cost_estimate:
            # Store in normalized data
            if item.get("normalized"):
                item["normalized"]["landed_cost"] = {
                    "unit_price_usd": landed_cost_estimate.unit_price_usd,
                    "shipping_cost_usd": landed_cost_estimate.shipping_cost_usd,
                    "duties_usd": landed_cost_estimate.duties_usd,
                    "total_landed_cost_usd": landed_cost_estimate.total_landed_cost_usd,
                    "currency": landed_cost_estimate.currency,
                    "confidence": landed_cost_estimate.confidence,
                    "eta_days": landed_cost_estimate.eta_days,
                    "eta_confidence": landed_cost_estimate.eta_confidence,
                }
    except Exception as e:
        logger.warning(f"Failed to calculate landed cost: {e}")
```

### 4.4 Store in Database

**File:** `backend/app/agents/graph.py`

**Location:** `_store_results_in_db` function (lines 287-302)

```python
# Extract landed cost and ETA from normalized data
landed_cost_value = None
landed_cost_currency = None
eta_days = None

if normalized_data:
    landed_cost_info = normalized_data.get("landed_cost")
    if landed_cost_info:
        landed_cost_value = landed_cost_info.get("total_landed_cost_usd")
        landed_cost_currency = landed_cost_info.get("currency", "USD")
        eta_days = landed_cost_info.get("eta_days")
    
    # Fallback to lead_time_days if eta_days not available
    if not eta_days and lead_time_days:
        eta_days = lead_time_days

# Create result record
result = Result(
    # ... other fields
    landed_cost_value=landed_cost_value,
    landed_cost_currency=landed_cost_currency or "USD",
    eta_days=eta_days,
    # ... other fields
)
```

### 4.5 Frontend Display

**File:** `frontend/components/ResultCard.tsx`

**Location:** Lines 135-155

```typescript
{result.landed_cost_value !== null && result.landed_cost_value !== undefined && (
  <div className="col-span-2 md:col-span-3 border-t pt-2 mt-2 bg-blue-50 rounded p-2">
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
      <div className="flex items-center gap-2">
        <span className="text-gray-700 font-semibold">Total Landed Cost:</span>
        <span className="font-bold text-xl text-blue-600">
          {formatPrice(result.landed_cost_value, result.landed_cost_currency || 'USD')}
        </span>
        {result.price_value && result.landed_cost_value > result.price_value && (
          <span className="text-xs text-gray-600">
            (includes shipping + duties)
          </span>
        )}
      </div>
      {result.eta_days && (
        <div className="flex items-center gap-2">
          <span className="text-gray-600 text-sm">Est. Delivery:</span>
          <span className="font-medium text-purple-600">{result.eta_days} days</span>
        </div>
      )}
    </div>
  </div>
)}
```

---

## 5. Advanced Search Filters

### 5.1 Frontend Component

**File:** `frontend/components/AdvancedFilters.tsx` (NEW FILE)

**Key Features:**
- Collapsible filter panel
- Active filter count badge
- Clear All button
- 10 filter types

**Implementation Steps:**

1. **Create Component Structure:**
```typescript
export interface AdvancedFilterOptions {
  max_results?: number
  min_price?: number
  max_price?: number
  min_moq?: number
  max_moq?: number
  max_lead_time_days?: number
  ship_from?: string
  ship_to?: string
  max_shipping_cost?: number
  currency?: string
}

interface AdvancedFiltersProps {
  filters: AdvancedFilterOptions
  onChange: (filters: AdvancedFilterOptions) => void
}
```

2. **Add Input Fields:**
- Max Results (1-200)
- Currency dropdown
- Price Range (min/max)
- MOQ Range (min/max)
- Max Lead Time
- Ship From (country dropdown)
- Ship To (country dropdown)
- Max Shipping Cost

3. **Add Clear All Functionality:**
```typescript
const clearFilters = () => {
  onChange({})
}
```

### 5.2 Backend API Model

**File:** `backend/app/api/v1/imports.py`

**Location:** `AdvancedFilters` Pydantic model

```python
class AdvancedFilters(BaseModel):
    max_results: Optional[int] = Field(None, ge=1, le=200)
    min_price: Optional[float] = Field(None, ge=0)
    max_price: Optional[float] = Field(None, ge=0)
    min_moq: Optional[int] = Field(None, ge=1)
    max_moq: Optional[int] = Field(None, ge=1)
    max_lead_time_days: Optional[int] = Field(None, ge=1)
    ship_from: Optional[str] = None  # Country code
    ship_to: Optional[str] = None   # Country code
    max_shipping_cost: Optional[float] = Field(None, ge=0)
    currency: Optional[str] = Field(default="USD", pattern="^[A-Z]{3}$")
```

### 5.3 Update Request Models

**File:** `backend/app/api/v1/imports.py`

```python
class LaunchRequest(BaseModel):
    import_id: UUID
    selected_row_ids: List[str]
    filters: Optional[AdvancedFilters] = None  # Added

class ManualLaunchRequest(BaseModel):
    products: List[ManualProduct]
    filters: Optional[AdvancedFilters] = None  # Added
```

### 5.4 Service Layer Integration

**File:** `backend/app/services/imports.py`

**Location:** `create_queries_for_batch` function (line 75)

```python
def create_queries_for_batch(
    db: Session, 
    batch_id: UUID, 
    import_id: UUID, 
    selected_row_ids: List[str], 
    filters: Dict[str, Any] = None  # Added parameter
) -> List[UUID]:
    """Create Query records with merged filters."""
    filters = filters or {}
    
    for row_idx_str in selected_row_ids:
        # ... extract row data ...
        
        # Build constraints - merge row data with filters (filters take precedence)
        constraints = {
            "category": row_data.get("category"),
            "target_price": row_data.get("price"),
            # ... other row data ...
        }
        
        # Merge filters (filters override row data)
        if filters.get("min_price"):
            constraints["target_price"] = filters["min_price"]
        if filters.get("max_price"):
            constraints["max_price"] = filters["max_price"]
        if filters.get("min_moq"):
            constraints["min_moq"] = filters["min_moq"]
        if filters.get("max_moq"):
            constraints["max_moq"] = filters["max_moq"]
        if filters.get("max_lead_time_days"):
            constraints["max_lead_time_days"] = filters["max_lead_time_days"]
        if filters.get("ship_from"):
            constraints["ship_from"] = filters["ship_from"]
        if filters.get("ship_to"):
            constraints["ship_to"] = filters["ship_to"]
        if filters.get("max_shipping_cost"):
            constraints["max_shipping_cost"] = filters["max_shipping_cost"]
        
        # Store constraints in Query.constraints_json
        query = Query(
            batch_id=batch_id,
            product_name=product_name,
            constraints_json=constraints,
            status="pending"
        )
        # ... save query ...
```

### 5.5 Provider Integration

**File:** `backend/app/providers/base.py`

**Location:** `SearchConstraints` dataclass (lines 58-72)

```python
@dataclass
class SearchConstraints:
    product_name: str
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    target_price: Optional[float] = None
    currency: Optional[str] = "USD"
    min_moq: Optional[int] = None
    max_moq: Optional[int] = None
    max_lead_time_days: Optional[int] = None
    ship_from: Optional[str] = None  # Country code
    ship_to: Optional[str] = None   # Country code
    max_shipping_cost: Optional[float] = None
    max_results: Optional[int] = None  # 1-200
    notes: Optional[str] = None
```

### 5.6 CJ Provider Filter Application

**File:** `backend/app/providers/cj.py`

**Location:** `_build_search_params` method (lines 105-145)

**API-Level Filters:**
```python
def _build_search_params(self, constraints: SearchConstraints, page: int = 1) -> Dict[str, Any]:
    params = {
        "keyWord": constraints.product_name,
        "page": page,
        "size": min(constraints.max_results or 50, 100),  # CJ API limit: 100
    }
    
    # Price range
    if constraints.min_price:
        params["startSellPrice"] = constraints.min_price
    if constraints.max_price:
        params["endSellPrice"] = constraints.max_price
    
    # Shipping origin
    if constraints.ship_from:
        params["countryCode"] = constraints.ship_from
    
    return params
```

**Post-Processing Filters:**
```python
def _apply_post_processing_filters(
    self, 
    results: List[ProductSearchResult], 
    constraints: SearchConstraints
) -> List[ProductSearchResult]:
    """Apply filters that cannot be done at API level."""
    filtered = results
    
    # MOQ filtering
    if constraints.min_moq:
        filtered = [r for r in filtered if r.moq is None or r.moq >= constraints.min_moq]
    if constraints.max_moq:
        filtered = [r for r in filtered if r.moq is None or r.moq <= constraints.max_moq]
    
    # Lead time filtering
    if constraints.max_lead_time_days:
        filtered = [r for r in filtered if r.lead_time_days is None or r.lead_time_days <= constraints.max_lead_time_days]
    
    # Result count limit
    if constraints.max_results:
        filtered = filtered[:constraints.max_results]
    
    return filtered
```

---

## 6. Bulk Actions & Export

### 6.1 Frontend State Management

**File:** `frontend/app/results/[batchId]/page.tsx`

**Location:** State hooks (lines 50-55)

```typescript
const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
const [showBulkActions, setShowBulkActions] = useState(false)
```

### 6.2 Selection Handlers

```typescript
const handleSelectResult = (resultId: string, selected: boolean) => {
  setSelectedResults(prev => {
    const newSet = new Set(prev)
    if (selected) {
      newSet.add(resultId)
    } else {
      newSet.delete(resultId)
    }
    return newSet
  })
}

const handleSelectAll = (results: ResultItem[]) => {
  if (selectedResults.size === results.length) {
    setSelectedResults(new Set())
  } else {
    setSelectedResults(new Set(results.map(r => r.result_id)))
  }
}
```

### 6.3 CSV Export Function

```typescript
function exportToCSV(results: ResultItem[], filename: string) {
  const headers = [
    'Product Name', 'SKU', 'Price', 'Currency', 'MOQ', 
    'Lead Time (days)', 'Overall Score (%)', 'Reliability Score (%)',
    'Supplier Name', 'Platform', 'Product URL', 'Stock', 'Created At'
  ]
  
  const rows = results.map(result => [
    `"${(result.product_name || '').replace(/"/g, '""')}"`,
    result.sku || '',
    result.price_value || '',
    result.price_currency || '',
    result.moq || '',
    result.lead_time_days || '',
    result.ranking_score ? (result.ranking_score * 100).toFixed(2) : '',
    result.reliability_score ? (result.reliability_score * 100).toFixed(2) : '',
    result.supplier?.supplier_name || '',
    result.supplier?.platform || '',
    result.raw_json?.product_url || '',
    result.raw_json?.specifications?.warehouse_inventory || '',
    new Date(result.created_at).toLocaleString()
  ])
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}
```

### 6.4 Export Handlers

```typescript
const handleExportSelected = () => {
  const selected = results.filter(r => selectedResults.has(r.result_id))
  if (selected.length === 0) return
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  exportToCSV(selected, `products_selected_${batchId}_${timestamp}.csv`)
}

const handleExportAll = () => {
  if (results.length === 0) return
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  exportToCSV(results, `products_all_${batchId}_${timestamp}.csv`)
}
```

### 6.5 ResultCard Component Updates

**File:** `frontend/components/ResultCard.tsx`

**Location:** Props interface (lines 29-34)

```typescript
interface ResultCardProps {
  result: ResultItem
  isSelected?: boolean
  onSelect?: (resultId: string, selected: boolean) => void
  showCheckbox?: boolean
}
```

**Checkbox Rendering (lines 60-69):**
```typescript
{showCheckbox && onSelect && (
  <div className="flex-shrink-0 flex items-start pt-2">
    <input
      type="checkbox"
      checked={isSelected}
      onChange={(e) => onSelect(result.result_id, e.target.checked)}
      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
    />
  </div>
)}
```

**Selected State Styling (line 55):**
```typescript
<div className={`border rounded-lg p-4 transition-all bg-white ${
  isSelected ? 'ring-2 ring-blue-500 shadow-md' : 'hover:shadow-md'
}`}>
```

---

## 7. CJ Dropshipping API Integration

### 7.1 Provider Setup

**File:** `backend/app/providers/cj.py`

**Key Configuration:**
```python
CJ_API_BASE_URL = "https://developers.cjdropshipping.com/api2.0/v1"
CJ_SEARCH_ENDPOINT = "/product/listV2"
CJ_API_MIN_DELAY = 0.2  # Rate limiting: 5 req/s
```

### 7.2 Authentication

```python
def __init__(self):
    api_key = os.getenv("CJ_API_KEY")
    if not api_key:
        raise ValueError("CJ_API_KEY environment variable not set")
    self.api_key = api_key
    self.headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
```

### 7.3 Rate Limiting

**File:** `backend/app/providers/cj.py`

**Location:** Global lock (lines 33-36)

```python
import threading
import time

CJ_API_MIN_DELAY = 0.2
_cj_api_lock = threading.Lock()
_last_cj_api_call_time = [0.0]  # Use list to allow modification

def _make_api_request(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    # Rate limiting: serialize API calls and add minimum delay
    with _cj_api_lock:
        elapsed = time.time() - _last_cj_api_call_time[0]
        if elapsed < CJ_API_MIN_DELAY:
            sleep_time = CJ_API_MIN_DELAY - elapsed
            time.sleep(sleep_time)
        _last_cj_api_call_time[0] = time.time()
    
    # Make API request
    response = httpx.get(url, params=params, headers=self.headers, timeout=30)
    response.raise_for_status()
    return response.json()
```

### 7.4 Search Implementation

**Main Search Method:**
```python
def search_products(self, constraints: SearchConstraints) -> List[ProductSearchResult]:
    """Search products using CJ API /product/listV2 endpoint."""
    all_results = []
    page = 1
    
    while True:
        params = self._build_search_params(constraints, page)
        response_data = self._make_api_request(
            f"{CJ_API_BASE_URL}{CJ_SEARCH_ENDPOINT}", 
            params
        )
        
        products = self._parse_search_results(response_data, constraints)
        all_results.extend(products)
        
        # Check if more pages
        if len(products) < params["size"] or len(all_results) >= (constraints.max_results or 50):
            break
        page += 1
    
    # Apply post-processing filters
    filtered_results = self._apply_post_processing_filters(all_results, constraints)
    
    # Calculate relevance scores
    scored_results = self._calculate_relevance_scores(filtered_results, constraints)
    
    return scored_results
```

### 7.5 Response Parsing

**File:** `backend/app/providers/cj.py`

**Location:** `_parse_search_results` method (lines 240-380)

```python
def _parse_search_results(
    self, response_data: Dict[str, Any], constraints: SearchConstraints
) -> List[ProductSearchResult]:
    """Parse CJ API response from /product/listV2 endpoint."""
    products = []
    
    # Extract nested product list
    if response_data.get("code") != 200:
        logger.error(f"CJ API error: {response_data.get('message')}")
        return []
    
    data = response_data.get("data", {})
    content = data.get("content", [])
    if not content or not isinstance(content, list):
        return []
    
    product_list = content[0].get("productList", [])
    
    for product in product_list:
        # Filter unavailable products
        if product.get("listedNum", 0) == 0:
            continue
        if product.get("warehouseInventoryNum", 0) <= 0:
            continue
        
        # Parse price (handle ranges like "39.40 -- 41.39")
        price_raw = product.get("sellPrice", 0)
        if isinstance(price_raw, str) and " -- " in price_raw:
            price = float(price_raw.split(" -- ")[0].strip())
        else:
            price = float(price_raw) if price_raw else 0.0
        
        # Generate product URL with slug
        product_id = str(product.get("id"))
        product_name = product.get("nameEn", "")
        product_url = self._generate_product_url(product_id, product_name)
        
        # Create ProductSearchResult
        result = ProductSearchResult(
            product_id=product_id,
            product_name=product_name,
            product_url=product_url,
            price=price,
            currency="USD",  # CJ API returns USD
            supplier_name="CJ Dropshipping",
            platform="cj",
            moq=product.get("directMinOrderNum"),
            images=[product.get("bigImage")] if product.get("bigImage") else [],
            specifications={
                "sku": product.get("sku"),
                "warehouse_inventory": product.get("warehouseInventoryNum"),
                "listed_num": product.get("listedNum"),
                "category": product.get("threeCategoryName"),
            },
            raw_data=product
        )
        products.append(result)
    
    return products
```

### 7.6 Product URL Generation

**File:** `backend/app/providers/cj.py`

**Location:** `_generate_product_url` method (lines 390-410)

```python
def _generate_product_url(self, product_id: str, product_name: str) -> str:
    """Generate CJ product URL with product name slug."""
    # Create URL-friendly slug from product name
    slug = product_name.lower()
    slug = slug.replace(" ", "-")
    slug = re.sub(r'[^a-z0-9\-]', '', slug)  # Remove special chars
    slug = slug[:100]  # Truncate to 100 chars
    
    # Format: https://cjdropshipping.com/product/{slug}-p-{product_id}.html
    return f"https://cjdropshipping.com/product/{slug}-p-{product_id}.html"
```

### 7.7 Relevance Scoring

**File:** `backend/app/providers/cj.py`

**Location:** `_calculate_relevance_score` method (lines 420-480)

```python
def _calculate_relevance_score(
    self, product: ProductSearchResult, constraints: SearchConstraints
) -> float:
    """Calculate relevance score for a product."""
    query_words = set(constraints.product_name.lower().split())
    product_words = set(product.product_name.lower().split())
    
    # Exact phrase match
    if constraints.product_name.lower() in product.product_name.lower():
        return 1.0
    
    # Keyword coverage
    matches = query_words.intersection(product_words)
    coverage = len(matches) / len(query_words) if query_words else 0
    
    # Position weighting (keywords at start get higher score)
    position_score = 0.5
    name_lower = product.product_name.lower()
    for word in query_words:
        if word in name_lower:
            pos = name_lower.find(word)
            if pos < len(name_lower) * 0.3:  # First 30% of name
                position_score += 0.3
    
    # Combined score
    score = (coverage * 0.7) + (position_score * 0.3)
    
    # Bonuses
    if len(matches) == len(query_words):
        score *= 1.2  # All keywords match
    
    # Penalties
    if coverage < 0.5:
        score *= 0.5  # Less than half keywords match
    
    return min(score, 1.0)  # Cap at 1.0
```

---

## 8. Product URL Generation

### 8.1 URL Format Requirements

**Format:** `https://cjdropshipping.com/product/{product-name-slug}-p-{product_id}.html`

**Example:**
- Product Name: "New Style Air Humidifier"
- Product ID: 1402526907295207424
- URL: `https://cjdropshipping.com/product/new-style-air-humidifier-p-1402526907295207424.html`

### 8.2 Implementation

**File:** `backend/app/providers/cj.py`

**Location:** `_generate_product_url` method

**Steps:**
1. Convert product name to lowercase
2. Replace spaces with hyphens
3. Remove special characters (keep only alphanumeric and hyphens)
4. Truncate to 100 characters
5. Append `-p-{product_id}.html`

**Code:**
```python
import re

def _generate_product_url(self, product_id: str, product_name: str) -> str:
    """Generate CJ product URL with product name slug."""
    # Create URL-friendly slug from product name
    slug = product_name.lower()
    slug = slug.replace(" ", "-")
    slug = re.sub(r'[^a-z0-9\-]', '', slug)  # Remove special chars
    slug = slug[:100]  # Truncate to 100 chars
    
    # Format: https://cjdropshipping.com/product/{slug}-p-{product_id}.html
    return f"https://cjdropshipping.com/product/{slug}-p-{product_id}.html"
```

---

## 9. Rate Limiting & Error Handling

### 9.1 Rate Limiting Strategy

**Implementation:** Thread-safe serialization with minimum delay

**File:** `backend/app/providers/cj.py`

**Configuration:**
```python
CJ_API_MIN_DELAY = 0.2  # 5 requests per second (conservative)
_cj_api_lock = threading.Lock()
_last_cj_api_call_time = [0.0]
```

**Application:**
```python
def _make_api_request(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    with _cj_api_lock:
        elapsed = time.time() - _last_cj_api_call_time[0]
        if elapsed < CJ_API_MIN_DELAY:
            sleep_time = CJ_API_MIN_DELAY - elapsed
            time.sleep(sleep_time)
        _last_cj_api_call_time[0] = time.time()
    
    # Make request
    response = httpx.get(url, params=params, headers=self.headers, timeout=30)
    response.raise_for_status()
    return response.json()
```

### 9.2 Retry Logic

**File:** `backend/app/providers/cj.py`

**Location:** `search_products` method with retry decorator

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
def _make_api_request(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
    # ... implementation ...
```

### 9.3 Error Handling

**API Errors:**
```python
try:
    response = httpx.get(url, params=params, headers=self.headers, timeout=30)
    response.raise_for_status()
    return response.json()
except httpx.HTTPStatusError as e:
    if e.response.status_code == 429:
        logger.warning("Rate limit exceeded, waiting...")
        time.sleep(5)
        raise  # Retry will handle this
    logger.error(f"CJ API error: {e.response.status_code} - {e.response.text}")
    raise
except httpx.RequestError as e:
    logger.error(f"CJ API request error: {e}")
    raise
```

---

## 10. Results Display & UI Components

### 10.1 Results Page Structure

**File:** `frontend/app/results/[batchId]/page.tsx`

**Key Features:**
- Batch status display
- Results list with pagination
- Bulk actions bar
- Export functionality
- Error handling for deleted batches

### 10.2 Bulk Actions Bar

**Location:** Lines 180-220

```typescript
{showBulkActions && (
  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-gray-600">
        {selectedResults.size} selected
      </span>
      
      <button
        onClick={() => handleSelectAll(results)}
        className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50"
      >
        {selectedResults.size === results.length ? 'Deselect All' : 'Select All'}
      </button>
      
      <button
        onClick={handleExportSelected}
        disabled={selectedResults.size === 0}
        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
      >
        📥 Export Selected
      </button>
      
      <button
        onClick={handleDeleteSelected}
        disabled={selectedResults.size === 0}
        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
      >
        🗑️ Delete Selected
      </button>
      
      <button
        onClick={handleExportAll}
        disabled={results.length === 0}
        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
      >
        📊 Export All
      </button>
    </div>
  </div>
)}
```

### 10.3 Error Handling for Deleted Batches

**Location:** Lines 60-90

```typescript
const { data: batchStatus, error: statusError } = useQuery({
  queryKey: ['batchStatus', batchId],
  queryFn: () => fetchBatchStatus(batchId!),
  enabled: !!batchId,
  retry: 1,  // Only retry once
  refetchInterval: (query) => {
    // Stop refetching if there's an error (e.g., 404 for deleted batch)
    if (query.state.error) return false
    return 5000  // Poll every 5 seconds if no error
  }
})

// Disable results fetching if batch status query errored
const { data: resultsData } = useQuery({
  queryKey: ['batchResults', batchId],
  queryFn: () => fetchBatchResults(batchId!),
  enabled: !!batchId && !statusError,  // Don't fetch if batch doesn't exist
  retry: 1
})

// Display error message
if (statusError) {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-red-600 mb-4">Batch Not Found</h2>
      <p className="text-gray-600 mb-6">
        This batch may have been deleted or does not exist.
      </p>
      <Link href="/history" className="text-blue-600 hover:underline">
        ← Back to History
      </Link>
    </div>
  )
}
```

---

## 11. Bulk Delete with Cascading

### 11.1 Bulk Delete Results

**File:** `backend/app/api/v1/batches.py`

**Endpoint:** `DELETE /api/v1/batches/{batch_id}/results`

**Location:** Lines 211-263

```python
@router.delete("/{batch_id}/results", response_model=BulkDeleteResponse)
def bulk_delete_results(
    batch_id: UUID,
    payload: BulkDeleteRequest,
    db: Session = Depends(get_db)
):
    """Bulk delete results by their IDs."""
    # Verify batch exists
    batch = db.query(BatchRun).filter(BatchRun.id == batch_id).first()
    if not batch:
        raise HTTPException(status_code=404, detail=f"Batch {batch_id} not found")
    
    if not payload.result_ids or len(payload.result_ids) == 0:
        raise HTTPException(status_code=400, detail="No result IDs provided")
    
    # Convert string UUIDs to UUID objects
    try:
        result_uuids = [UUID(rid) for rid in payload.result_ids]
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid UUID format: {str(e)}")
    
    # Delete results that belong to this batch
    deleted_count = (
        db.query(Result)
        .filter(
            Result.id.in_(result_uuids),
            Result.query_id.in_(
                db.query(Query.id).filter(Query.batch_id == batch_id)
            )
        )
        .delete(synchronize_session=False)
    )
    
    db.commit()
    
    return BulkDeleteResponse(
        deleted_count=deleted_count,
        message=f"Successfully deleted {deleted_count} result(s)"
    )
```

### 11.2 Bulk Delete Batches with Cascading

**File:** `backend/app/api/v1/batches.py`

**Endpoint:** `DELETE /api/v1/batches/bulk-delete`

**Location:** Lines 265-392

**Deletion Order:**
1. Reports (references batches)
2. Results (references queries and suppliers)
3. Queries (references batches)
4. Batches (references imports)
5. Orphaned suppliers (no results reference them)
6. Orphaned imports (no batches reference them)

**Implementation:**
```python
@router.delete("/bulk-delete", response_model=BatchBulkDeleteResponse)
def bulk_delete_batches(
    payload: BatchBulkDeleteRequest,
    db: Session = Depends(get_db)
):
    """Bulk delete batches and all associated data."""
    # Validate batch IDs
    batch_uuids = [UUID(bid) for bid in payload.batch_ids]
    batches = db.query(BatchRun).filter(BatchRun.id.in_(batch_uuids)).all()
    
    if len(batches) != len(batch_uuids):
        missing_ids = [bid for bid in payload.batch_ids if bid not in {str(b.id) for b in batches}]
        raise HTTPException(status_code=404, detail=f"Batches not found: {', '.join(missing_ids)}")
    
    # Get query IDs for these batches
    query_ids_subquery = db.query(Query.id).filter(Query.batch_id.in_(batch_uuids)).subquery()
    
    # Get supplier IDs and import IDs to check for orphaned records
    supplier_ids_to_check = (
        db.query(Result.supplier_id)
        .filter(Result.query_id.in_(query_ids_subquery), Result.supplier_id.isnot(None))
        .distinct().all()
    )
    supplier_ids_to_check = [sid[0] for sid in supplier_ids_to_check]
    
    import_ids_to_check = (
        db.query(BatchRun.import_id)
        .filter(BatchRun.id.in_(batch_uuids), BatchRun.import_id.isnot(None))
        .distinct().all()
    )
    import_ids_to_check = [iid[0] for iid in import_ids_to_check]
    
    # Count entities before deletion
    queries_count = db.query(func.count(Query.id)).filter(Query.batch_id.in_(batch_uuids)).scalar() or 0
    results_count = db.query(func.count(Result.id)).filter(Result.query_id.in_(query_ids_subquery)).scalar() or 0
    reports_count = db.query(func.count(Report.id)).filter(Report.batch_id.in_(batch_uuids)).scalar() or 0
    
    # Delete in correct order (respecting foreign keys)
    db.query(Report).filter(Report.batch_id.in_(batch_uuids)).delete(synchronize_session=False)
    db.query(Result).filter(Result.query_id.in_(query_ids_subquery)).delete(synchronize_session=False)
    db.query(Query).filter(Query.batch_id.in_(batch_uuids)).delete(synchronize_session=False)
    deleted_batches = db.query(BatchRun).filter(BatchRun.id.in_(batch_uuids)).delete(synchronize_session=False)
    
    # Clean up orphaned suppliers
    deleted_suppliers = 0
    if supplier_ids_to_check:
        orphaned_suppliers = (
            db.query(Supplier.id)
            .filter(
                Supplier.id.in_(supplier_ids_to_check),
                ~Supplier.id.in_(db.query(Result.supplier_id).filter(Result.supplier_id.isnot(None)))
            )
            .all()
        )
        orphaned_supplier_ids = [sid[0] for sid in orphaned_suppliers]
        if orphaned_supplier_ids:
            deleted_suppliers = db.query(Supplier).filter(Supplier.id.in_(orphaned_supplier_ids)).delete(synchronize_session=False)
    
    # Clean up orphaned imports
    deleted_imports = 0
    if import_ids_to_check:
        orphaned_imports = (
            db.query(ImportedProduct.id)
            .filter(
                ImportedProduct.id.in_(import_ids_to_check),
                ~ImportedProduct.id.in_(db.query(BatchRun.import_id).filter(BatchRun.import_id.isnot(None)))
            )
            .all()
        )
        orphaned_import_ids = [iid[0] for iid in orphaned_imports]
        if orphaned_import_ids:
            deleted_imports = db.query(ImportedProduct).filter(ImportedProduct.id.in_(orphaned_import_ids)).delete(synchronize_session=False)
    
    db.commit()
    
    return BatchBulkDeleteResponse(
        deleted_batches=deleted_batches,
        deleted_queries=queries_count,
        deleted_results=results_count,
        deleted_reports=reports_count,
        deleted_suppliers=deleted_suppliers,
        deleted_imports=deleted_imports,
        message=f"Successfully deleted {deleted_batches} batch(es) and all associated data"
    )
```

---

## 12. Testing & Validation

### 12.1 Testing Checklist

**SKU Extraction:**
- [ ] Test SKU extraction from normalized data
- [ ] Test SKU extraction from specifications
- [ ] Test SKU extraction from raw_data
- [ ] Verify SKU appears in API response
- [ ] Verify SKU displays in frontend

**Landed Cost:**
- [ ] Test landed cost calculation with all components
- [ ] Test default origin/destination (CN/US)
- [ ] Test custom origin/destination
- [ ] Verify landed cost stored in database
- [ ] Verify landed cost displays in frontend

**Advanced Filters:**
- [ ] Test all filter types individually
- [ ] Test filter combinations
- [ ] Test filter validation (min/max)
- [ ] Verify filters applied at API level
- [ ] Verify filters applied in post-processing

**Bulk Actions:**
- [ ] Test selection/deselection
- [ ] Test select all/deselect all
- [ ] Test CSV export (all and selected)
- [ ] Test bulk delete results
- [ ] Test bulk delete batches
- [ ] Verify cascading deletion

**CJ Integration:**
- [ ] Test API authentication
- [ ] Test rate limiting
- [ ] Test error handling
- [ ] Test product URL generation
- [ ] Test relevance scoring
- [ ] Test availability filtering

### 12.2 Common Pitfalls & Solutions

**1. Celery Worker Not Processing Tasks**
- **Solution:** Restart worker after code changes
- **Command:** `celery -A celery_app.celery_app worker --loglevel=INFO --pool=solo`

**2. Rate Limiting Issues**
- **Solution:** Check `CJ_API_MIN_DELAY` setting
- **Solution:** Verify thread lock is working

**3. Missing SKU in Results**
- **Solution:** Check raw_data structure from provider
- **Solution:** Add logging to trace SKU extraction path

**4. Landed Cost Not Calculated**
- **Solution:** Verify constraints include `ship_from`/`ship_to`
- **Solution:** Check default values (CN/US) are applied

**5. Frontend Not Updating**
- **Solution:** Clear browser cache
- **Solution:** Verify API responses include new fields
- **Solution:** Check React Query cache invalidation

---

## Conclusion

This guide provides comprehensive step-by-step instructions for reproducing all features in the Ultimate Product Finder AI Agent. Each section includes:

- Implementation steps
- Code examples
- File references
- Integration points
- Testing strategies

Follow each section in order, or jump to specific features as needed. All code examples are production-ready and can be directly integrated into a new application.

